//! Order Book and Matching Engine
//!
//! Client-side order book for visualization and matching preview.
//! OPTIMIZED: Uses BTreeMap for O(log n) operations instead of Vec O(n)

use serde::{Deserialize, Serialize};
use std::cmp::Reverse;
use std::collections::BTreeMap;
use wasm_bindgen::prelude::*;

// ============================================================================
// Types
// ============================================================================

/// Fixed-point scale for price keys (6 decimal places).
const PRICE_SCALE: f64 = 1_000_000.0;

/// Quantities at or below this are treated as fully filled (dust threshold).
const FILL_EPSILON: f64 = 0.0001;

#[derive(Clone, Copy, Debug, PartialEq, Serialize, Deserialize)]
pub enum Side {
    Buy = 0,
    Sell = 1,
}

impl From<u8> for Side {
    fn from(v: u8) -> Self {
        if v == 0 {
            Side::Buy
        } else {
            Side::Sell
        }
    }
}

#[derive(Clone, Copy, Debug, Serialize, Deserialize)]
pub struct Order {
    pub id: u32,
    pub side: Side,
    pub price: f64,
    pub quantity: f64,
    pub timestamp: u64,
}

impl Order {
    pub fn new(id: u32, side: Side, price: f64, quantity: f64, timestamp: u64) -> Self {
        Self {
            id,
            side,
            price,
            quantity,
            timestamp,
        }
    }
}

/// Wire shape accepted by [`OrderBook::load_orders`]. Mirrors `add_order`'s
/// numeric `side` (0 = Buy, 1 = Sell) so the two entry points agree.
#[derive(Deserialize)]
struct OrderInput {
    id: u32,
    side: u8,
    price: f64,
    quantity: f64,
    timestamp: u64,
}

#[derive(Clone, Copy, Debug, Serialize, Deserialize)]
pub struct Match {
    pub buy_order_id: u32,
    pub sell_order_id: u32,
    pub price: f64,
    pub quantity: f64,
}

/// Fixed-point price key for stable BTreeMap ordering.
///
/// Asks key on `PriceKey` directly (ascending = best ask first); bids key on
/// `Reverse<PriceKey>` (descending = best/highest bid first). A single type
/// owns the price <-> fixed-point conversion so the scale and validation live
/// in one place.
#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
struct PriceKey(u64);

impl PriceKey {
    /// Build a key from a price, rejecting non-finite or negative prices so
    /// they cannot silently collapse onto key 0 and corrupt the book.
    fn from_f64(price: f64) -> Option<Self> {
        if !price.is_finite() || price < 0.0 {
            return None;
        }
        Some(Self((price * PRICE_SCALE).round() as u64))
    }

    fn to_f64(self) -> f64 {
        self.0 as f64 / PRICE_SCALE
    }
}

// ============================================================================
// Order Book - OPTIMIZED with BTreeMap
// ============================================================================

#[wasm_bindgen]
pub struct OrderBook {
    // Bids: Highest price first via Reverse ordering on the price key.
    // Key: Reverse price level, Value: Vec of orders at that price (time-ordered)
    bids: BTreeMap<Reverse<PriceKey>, Vec<Order>>,
    // Asks: Lowest price first (Natural ordering).
    // Key: Price level, Value: Vec of orders at that price (time-ordered)
    asks: BTreeMap<PriceKey, Vec<Order>>,
    // Index for O(1) order lookup by ID. Stores the raw (non-reversed) price key.
    order_index: std::collections::HashMap<u32, (Side, u64)>, // (side, price_key)
}

#[wasm_bindgen]
impl OrderBook {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            bids: BTreeMap::new(),
            asks: BTreeMap::new(),
            order_index: std::collections::HashMap::with_capacity(1000),
        }
    }

    /// Clear all orders
    pub fn clear(&mut self) {
        self.bids.clear();
        self.asks.clear();
        self.order_index.clear();
    }

    /// Add an order to the book - O(log n) insertion
    pub fn add_order(&mut self, id: u32, side: u8, price: f64, quantity: f64, timestamp: u64) {
        self.insert_order(Order::new(id, Side::from(side), price, quantity, timestamp));
    }

    /// Bulk load orders - optimized to avoid per-insert overhead.
    ///
    /// Accepts the same numeric `side` (0 = Buy, 1 = Sell) shape as
    /// [`add_order`], not the `Side` enum's serde variant names, so both entry
    /// points share one wire contract.
    pub fn load_orders(&mut self, orders: JsValue) -> Result<(), JsValue> {
        let inputs: Vec<OrderInput> = serde_wasm_bindgen::from_value(orders)?;
        self.clear();
        for o in inputs {
            self.insert_order(Order::new(
                o.id,
                Side::from(o.side),
                o.price,
                o.quantity,
                o.timestamp,
            ));
        }
        Ok(())
    }

    /// Shared insert path for both `add_order` and `load_orders`.
    /// Orders with an invalid price are dropped rather than corrupting the book.
    fn insert_order(&mut self, order: Order) {
        let Some(key) = PriceKey::from_f64(order.price) else {
            return;
        };
        // Replace-on-duplicate-id: without this, the index entry is
        // overwritten while the older copy keeps resting in the book as an
        // uncancellable ghost that still matches and counts.
        if self.order_index.contains_key(&order.id) {
            self.cancel_order(order.id);
        }
        match order.side {
            Side::Buy => {
                self.bids.entry(Reverse(key)).or_default().push(order);
                self.order_index.insert(order.id, (Side::Buy, key.0));
            }
            Side::Sell => {
                self.asks.entry(key).or_default().push(order);
                self.order_index.insert(order.id, (Side::Sell, key.0));
            }
        }
    }

    /// Cancel order - O(1) lookup with HashMap index
    pub fn cancel_order(&mut self, order_id: u32) -> bool {
        // O(1) lookup using index
        let Some((side, price_key)) = self.order_index.remove(&order_id) else {
            return false;
        };

        match side {
            Side::Buy => {
                let key = Reverse(PriceKey(price_key));
                if let Some(orders) = self.bids.get_mut(&key) {
                    if let Some(pos) = orders.iter().position(|o| o.id == order_id) {
                        orders.remove(pos);
                        // Clean up empty price levels
                        if orders.is_empty() {
                            self.bids.remove(&key);
                        }
                        return true;
                    }
                }
            }
            Side::Sell => {
                let key = PriceKey(price_key);
                if let Some(orders) = self.asks.get_mut(&key) {
                    if let Some(pos) = orders.iter().position(|o| o.id == order_id) {
                        orders.remove(pos);
                        // Clean up empty price levels
                        if orders.is_empty() {
                            self.asks.remove(&key);
                        }
                        return true;
                    }
                }
            }
        }

        false
    }

    /// Get best bid price - O(1) with BTreeMap (highest bid first)
    pub fn best_bid_price(&self) -> f64 {
        self.bids
            .first_key_value()
            .map(|(k, v)| if !v.is_empty() { k.0.to_f64() } else { -1.0 })
            .unwrap_or(-1.0)
    }

    /// Get best ask price - O(1) with BTreeMap (lowest ask first)
    pub fn best_ask_price(&self) -> f64 {
        self.asks
            .first_key_value()
            .map(|(k, v)| if !v.is_empty() { k.to_f64() } else { -1.0 })
            .unwrap_or(-1.0)
    }

    pub fn spread(&self) -> f64 {
        match (self.best_bid_price(), self.best_ask_price()) {
            (bid, ask) if bid >= 0.0 && ask >= 0.0 => ask - bid,
            _ => -1.0,
        }
    }

    pub fn mid_price(&self) -> f64 {
        match (self.best_bid_price(), self.best_ask_price()) {
            (bid, ask) if bid >= 0.0 && ask >= 0.0 => (bid + ask) / 2.0,
            _ => -1.0,
        }
    }

    /// Match orders - optimized with BTreeMap
    pub fn match_orders(&mut self) -> Result<JsValue, JsValue> {
        let mut matches = Vec::new();

        loop {
            // Peek the best bid and ask, capturing their map keys so we never
            // re-derive a (lossy) key from the order price.
            let best_bid_opt = self
                .bids
                .first_key_value()
                .and_then(|(k, orders)| orders.first().map(|o| (*k, *o)));
            let best_ask_opt = self
                .asks
                .first_key_value()
                .and_then(|(k, orders)| orders.first().map(|o| (*k, *o)));

            let ((bid_key, best_bid), (ask_key, best_ask)) =
                match (best_bid_opt, best_ask_opt) {
                    (Some(bid), Some(ask)) => (bid, ask),
                    _ => break, // No more orders to match
                };

            if best_bid.price < best_ask.price {
                break; // No more matches possible
            }

            let exec_price = if best_bid.timestamp <= best_ask.timestamp {
                best_bid.price
            } else {
                best_ask.price
            };

            let exec_qty = best_bid.quantity.min(best_ask.quantity);

            matches.push(Match {
                buy_order_id: best_bid.id,
                sell_order_id: best_ask.id,
                price: exec_price,
                quantity: exec_qty,
            });

            let bid_remaining = best_bid.quantity - exec_qty;
            let ask_remaining = best_ask.quantity - exec_qty;

            // Update or remove bid
            if bid_remaining <= FILL_EPSILON {
                if let Some(orders) = self.bids.get_mut(&bid_key) {
                    if !orders.is_empty() {
                        orders.remove(0);
                    }
                    self.order_index.remove(&best_bid.id);
                    if orders.is_empty() {
                        self.bids.remove(&bid_key);
                    }
                }
            } else if let Some(orders) = self.bids.get_mut(&bid_key) {
                if let Some(first) = orders.first_mut() {
                    first.quantity = bid_remaining;
                }
            }

            // Update or remove ask
            if ask_remaining <= FILL_EPSILON {
                if let Some(orders) = self.asks.get_mut(&ask_key) {
                    if !orders.is_empty() {
                        orders.remove(0);
                    }
                    self.order_index.remove(&best_ask.id);
                    if orders.is_empty() {
                        self.asks.remove(&ask_key);
                    }
                }
            } else if let Some(orders) = self.asks.get_mut(&ask_key) {
                if let Some(first) = orders.first_mut() {
                    first.quantity = ask_remaining;
                }
            }
        }

        Ok(serde_wasm_bindgen::to_value(&matches)?)
    }

    /// Get depth data for visualization - optimized iteration.
    /// Returns: { bids: [[price, cum_qty], ...], asks: [[price, cum_qty], ...] }
    ///
    /// Each BTreeMap entry is already one distinct price level (a Vec of the
    /// orders resting at that price), so we walk at most `levels` entries and
    /// sum the quantities at each — O(levels) with no manual grouping.
    pub fn get_depth(&self, levels: usize) -> Result<JsValue, JsValue> {
        let bid_depth = cumulative_depth(self.bids.iter().map(|(k, o)| (k.0.to_f64(), o)), levels);
        let ask_depth = cumulative_depth(self.asks.iter().map(|(k, o)| (k.to_f64(), o)), levels);

        let result = DepthResult {
            bids: bid_depth,
            asks: ask_depth,
        };

        Ok(serde_wasm_bindgen::to_value(&result)?)
    }

    pub fn bid_count(&self) -> usize {
        self.bids.values().map(|v| v.len()).sum()
    }

    pub fn ask_count(&self) -> usize {
        self.asks.values().map(|v| v.len()).sum()
    }
}

/// Build a cumulative depth ladder from price-ordered levels.
fn cumulative_depth<'a, I>(levels_iter: I, levels: usize) -> Vec<(f64, f64)>
where
    I: Iterator<Item = (f64, &'a Vec<Order>)>,
{
    let mut depth = Vec::with_capacity(levels);
    let mut cumulative = 0.0;
    for (price, orders) in levels_iter.take(levels) {
        cumulative += orders.iter().map(|o| o.quantity).sum::<f64>();
        depth.push((price, cumulative));
    }
    depth
}

#[derive(Serialize)]
struct DepthResult {
    bids: Vec<(f64, f64)>,
    asks: Vec<(f64, f64)>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_order_insertion() {
        let mut book = OrderBook::new();

        book.add_order(1, 0, 100.0, 10.0, 1);
        book.add_order(2, 0, 101.0, 5.0, 2);
        book.add_order(3, 1, 102.0, 8.0, 3);

        assert_eq!(book.best_bid_price(), 101.0);
        assert_eq!(book.best_ask_price(), 102.0);
    }

    #[test]
    fn test_cancel_order() {
        let mut book = OrderBook::new();

        book.add_order(1, 0, 100.0, 10.0, 1);
        book.add_order(2, 0, 101.0, 5.0, 2);

        assert!(book.cancel_order(1));
        assert!(!book.cancel_order(999));
        assert_eq!(book.bid_count(), 1);
    }

    #[test]
    fn test_duplicate_id_replaces_order() {
        let mut book = OrderBook::new();
        book.add_order(1, 0, 100.0, 10.0, 1);
        book.add_order(1, 0, 101.0, 5.0, 2);

        // The stale copy is replaced, not left resting as a ghost.
        assert_eq!(book.bid_count(), 1);
        assert_eq!(book.best_bid_price(), 101.0);

        assert!(book.cancel_order(1));
        assert_eq!(book.bid_count(), 0);
        assert!(!book.cancel_order(1));
    }

    #[test]
    fn test_invalid_price_rejected() {
        let mut book = OrderBook::new();
        book.add_order(1, 0, -5.0, 10.0, 1);
        book.add_order(2, 0, f64::NAN, 10.0, 2);
        assert_eq!(book.bid_count(), 0);
        assert_eq!(book.best_bid_price(), -1.0);
    }
}
