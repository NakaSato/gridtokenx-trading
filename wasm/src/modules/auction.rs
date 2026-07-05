use serde::{Deserialize, Serialize};
use std::cmp::Ordering;
use wasm_bindgen::prelude::*;

#[derive(Serialize, Deserialize, Clone, Copy, Debug)]
pub struct AuctionOrderWasm {
    pub id: u32,
    pub price: f64,
    pub amount: f64,
    pub is_bid: bool,
}

#[wasm_bindgen]
pub struct AuctionSimulator {
    orders: Vec<AuctionOrderWasm>,
}

#[wasm_bindgen]
impl AuctionSimulator {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self { orders: Vec::new() }
    }

    pub fn add_order(&mut self, id: u32, price: f64, amount: f64, is_bid: bool) {
        // Reject non-finite/negative inputs: a NaN bid price makes the
        // `bid_price < ask_price` crossing check unreachable and poisons the
        // clearing price with NaN. Mirrors OrderBook's PriceKey validation.
        if !price.is_finite() || price < 0.0 || !amount.is_finite() || amount <= 0.0 {
            return;
        }
        self.orders.push(AuctionOrderWasm {
            id,
            price,
            amount,
            is_bid,
        });
    }

    pub fn clear(&mut self) {
        self.orders.clear();
    }

    /// Calculate Uniform Clearing Price (MCP) - O(n log n).
    /// Returns [clearing_price, clearing_volume].
    ///
    /// Walks the cumulative demand (sorted by descending bid price) and
    /// cumulative supply (sorted by ascending ask price) curves together,
    /// tracking the maximum volume at which the marginal bid still clears the
    /// marginal ask. The crossing stops as soon as the marginal bid price
    /// drops below the marginal ask price.
    pub fn calculate_clearing_price(&self) -> Vec<f64> {
        let mut bids: Vec<&AuctionOrderWasm> = self.orders.iter().filter(|o| o.is_bid).collect();
        let mut asks: Vec<&AuctionOrderWasm> = self.orders.iter().filter(|o| !o.is_bid).collect();

        if bids.is_empty() || asks.is_empty() {
            return vec![0.0, 0.0];
        }

        // Sort Bids DESC by price
        bids.sort_by(|a, b| b.price.partial_cmp(&a.price).unwrap_or(Ordering::Equal));
        // Sort Asks ASC by price
        asks.sort_by(|a, b| a.price.partial_cmp(&b.price).unwrap_or(Ordering::Equal));

        // Build cumulative demand curve (descending from highest bid):
        // cum_demand[i] = (price_i, total amount willing to buy at >= price_i).
        let mut cum_demand: Vec<(f64, f64)> = Vec::with_capacity(bids.len());
        let mut cum_amount = 0.0;
        for bid in &bids {
            cum_amount += bid.amount;
            cum_demand.push((bid.price, cum_amount));
        }

        // Build cumulative supply curve (ascending from lowest ask):
        // cum_supply[j] = (price_j, total amount willing to sell at <= price_j).
        let mut cum_supply: Vec<(f64, f64)> = Vec::with_capacity(asks.len());
        let mut cum_amount = 0.0;
        for ask in &asks {
            cum_amount += ask.amount;
            cum_supply.push((ask.price, cum_amount));
        }

        // Find the maximum feasible crossing volume - O(n).
        let mut clearing_price = 0.0;
        let mut max_volume = 0.0;
        let mut i = 0;
        let mut j = 0;

        while i < cum_demand.len() && j < cum_supply.len() {
            let (bid_price, demand) = cum_demand[i];
            let (ask_price, supply) = cum_supply[j];

            // Marginal bid no longer covers the marginal ask -> no further trades.
            if bid_price < ask_price {
                break;
            }

            let volume = demand.min(supply);
            if volume > max_volume {
                max_volume = volume;
                clearing_price = (bid_price + ask_price) / 2.0;
            }

            // Advance the side with the smaller cumulative amount; that is the
            // binding constraint, and moving it is what can increase volume.
            match demand.partial_cmp(&supply) {
                Some(Ordering::Less) => i += 1,
                Some(Ordering::Greater) => j += 1,
                _ => {
                    i += 1;
                    j += 1;
                }
            }
        }

        vec![clearing_price, max_volume]
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_clearing_price_crossing() {
        let mut sim = AuctionSimulator::new();
        // Demand: 5 @ 10, 4 @ 8. Supply: 6 @ 6, 3 @ 9.
        sim.add_order(1, 10.0, 5.0, true);
        sim.add_order(2, 8.0, 4.0, true);
        sim.add_order(3, 6.0, 6.0, false);
        sim.add_order(4, 9.0, 3.0, false);

        let res = sim.calculate_clearing_price();
        // Max crossing volume is 6 (bid 8 >= ask 6); price in [6, 8].
        assert_eq!(res[1], 6.0);
        assert!(res[0] >= 6.0 && res[0] <= 8.0, "price {} out of band", res[0]);
    }

    #[test]
    fn test_non_finite_orders_rejected() {
        let mut sim = AuctionSimulator::new();
        sim.add_order(1, f64::NAN, 5.0, true);
        sim.add_order(2, f64::INFINITY, 5.0, true);
        sim.add_order(3, 6.0, f64::NAN, false);
        sim.add_order(4, 6.0, 0.0, false);
        sim.add_order(5, -1.0, 5.0, true);

        // All rejected -> no orders, no cross.
        let res = sim.calculate_clearing_price();
        assert_eq!(res, vec![0.0, 0.0]);

        // Valid orders still clear normally after invalid ones were dropped.
        sim.add_order(6, 10.0, 5.0, true);
        sim.add_order(7, 6.0, 5.0, false);
        let res = sim.calculate_clearing_price();
        assert_eq!(res[1], 5.0);
        assert!(res[0].is_finite());
    }

    #[test]
    fn test_no_cross_returns_zero_volume() {
        let mut sim = AuctionSimulator::new();
        // Highest bid (5) below lowest ask (10): no trade.
        sim.add_order(1, 5.0, 10.0, true);
        sim.add_order(2, 10.0, 10.0, false);

        let res = sim.calculate_clearing_price();
        assert_eq!(res[1], 0.0);
    }
}
