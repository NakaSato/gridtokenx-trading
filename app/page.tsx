"use client";
import { useState, useEffect } from "react";
import CryptoNav from "@/components/CryptoNav";
import TradingViewChartContainer from "@/components/TradingViewChartContainer";
import ProtectedRoute from "@/components/ProtectedRoute";
import TradingPositionsFallback from "@/components/TradingPositionsFallback";
import TradingPositions from "@/components/TradingPositions";
import PriceQuote from "@/components/PriceQuote";
import GreekPopup from "@/components/GreekPopup";
import { usePythPrice } from "@/hooks/usePythPrice";
import { usePythMarketData } from "@/hooks/usePythMarketData";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import OptionCardContainer from "@/components/OptionCardContainer";
import { addWeeks, format } from "date-fns";
import { useOptionsPricing } from "@/hooks/useOptionsPricing";
import { useGreeks } from "@/hooks/useGreeks";

interface Transaction {
  id: string;
  type: "BUY ENERGY" | "SELL ENERGY" | "TRADE ENERGY" | "STAKE GRIDX";
  amount: string;
  price: string;
  pnl: number;
  timestamp: Date;
}

export default function Homepage() {
  const [active, setActive] = useState("chart");
  const [centerTab, setCenterTab] = useState<"chart" | "map">("chart");
  const [tokenIdx, setTokenIdx] = useState(0);
  const [selectedSymbol, setSelectedSymbol] =
    useState<string>("Crypto.SOL/USD");
  const [positionType, setPositionType] = useState<string>("long");
  const [contractType, setContractType] = useState<"Call" | "Put">("Call");
  const [currency, setCurrency] = useState(selectedSymbol);
  const [selectedLogo, setSelectedLogo] =
    useState<string>("/images/solana.png");
  const { priceData, loading: priceLoading } = usePythPrice(selectedSymbol);
  const { marketData, loading: marketLoading } =
    usePythMarketData(selectedSymbol);
  const [payAmount, setPayAmount] = useState("");
  const [strikePrice, setStrikePrice] = useState("");
  const [expiry, setExpiry] = useState<Date>(addWeeks(new Date(), 1));
  const [transaction, setTransaction] = useState("buy");
  const [transactionHistory, setTransactionHistory] = useState<Transaction[]>([
    {
      id: "1",
      type: "BUY ENERGY",
      amount: "500 kWh",
      price: "150 GRIDX",
      pnl: 450,
      timestamp: new Date(Date.now() - 1800000),
    },
    {
      id: "2",
      type: "SELL ENERGY",
      amount: "300 kWh",
      price: "95 GRIDX",
      pnl: -85,
      timestamp: new Date(Date.now() - 5400000),
    },
    {
      id: "3",
      type: "TRADE ENERGY",
      amount: "750 kWh",
      price: "220 GRIDX",
      pnl: 680,
      timestamp: new Date(Date.now() - 9000000),
    },
    {
      id: "4",
      type: "STAKE GRIDX",
      amount: "1000 GRIDX",
      price: "Staking Pool",
      pnl: 125,
      timestamp: new Date(Date.now() - 14400000),
    },
    {
      id: "5",
      type: "BUY ENERGY",
      amount: "400 kWh",
      price: "120 GRIDX",
      pnl: 320,
      timestamp: new Date(Date.now() - 18000000),
    },
  ]);

  const handleSymbolChange = (newSymbol: string) => {
    setSelectedSymbol(newSymbol);
  };

  const handleIconChange = (newIcon: string) => {
    setSelectedLogo(newIcon);
  };

  const handleIndexChange = (newIdx: number) => {
    setTokenIdx(newIdx);
  };

  const s = priceData.price ?? 0;
  const k = parseFloat(strikePrice);

  const premium = useOptionsPricing({
    type: contractType,
    currentPrice: s,
    strikePrice: k,
    expiryDate: expiry,
  });

  const greeks = useGreeks({
    type: contractType,
    currentPrice: s,
    strikePrice: k,
    expiryDate: expiry,
  });

  return (
    <>
      <CryptoNav
        onSymbolChange={handleSymbolChange}
        onIconChange={handleIconChange}
        onIdxChange={handleIndexChange}
        active={tokenIdx}
        selectedSymbol={selectedSymbol}
        priceData={priceData}
        marketData={marketData}
        priceLoading={priceLoading}
        marketLoading={marketLoading}
        type="options"
      />
      <div
        className={cn(
          active === "trade" ? "space-y-0" : "space-y-4",
          "flex flex-col w-full justify-evenly h-full pb-4"
        )}
      >
        <div className="w-full pt-4 justify-between grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* LEFT SIDEBAR - TRANSACTION HISTORY */}
          <div className="md:col-span-2 hidden md:flex flex-col space-y-4 h-full">
            <div className="border rounded-lg p-4 bg-secondary/50 h-full flex flex-col">
              <h3 className="text-sm font-semibold mb-3 text-primary">
                Energy Trading History
              </h3>
              <div className="space-y-3 overflow-y-auto flex-1">
                {transactionHistory.length === 0 ? (
                  <div className="text-xs text-secondary-foreground text-center py-4">
                    No transactions yet
                  </div>
                ) : (
                  transactionHistory.map((txn, index) => (
                    <div
                      key={txn.id}
                      className={cn(
                        "border-b border-secondary pb-2 last:border-b-0",
                        index === 0 && "animate-pulse"
                      )}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-medium">{txn.type}</span>
                        <span
                          className={cn(
                            "text-xs font-semibold",
                            txn.pnl > 0 ? "text-green-500" : "text-red-500"
                          )}
                        >
                          {txn.pnl > 0 ? "+" : ""}
                          {txn.pnl} GRIDX
                        </span>
                      </div>
                      <div className="text-xs text-secondary-foreground mb-1">
                        {txn.amount} • {txn.price}
                      </div>
                      <div className="text-xs text-secondary-foreground">
                        {format(txn.timestamp, "MMM d, h:mm a")}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* CENTER - CHART */}
          <div
            className={cn(
              active === "chart" ? "w-full" : "hidden",
              "md:col-span-7 md:flex flex-col space-y-4"
            )}
          >
            <TradingViewChartContainer
              symbol={selectedSymbol}
              logo={selectedLogo}
              premium={premium.premium.toString()}
              investment={payAmount}
              strikePrice={strikePrice}
              currentPrice={priceData.price!}
              positionType={positionType}
              contractType={contractType}
              expiry={expiry}
            />
            <div className="w-full">
              <ProtectedRoute fallback={<TradingPositionsFallback />}>
                <TradingPositions />
              </ProtectedRoute>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div
            className={cn(
              active === "trade" ? "w-full" : "hidden",
              "md:flex md:col-span-3 flex-col space-y-4"
            )}
          >
            <OptionCardContainer
              selectedSymbol={selectedSymbol}
              onSymbolChange={handleSymbolChange}
              onIdxChange={handleIndexChange}
              index={tokenIdx}
              onStrikePriceChange={setStrikePrice}
              onExpiryChange={setExpiry}
              onPayAmountChange={setPayAmount}
              onContractTypeChange={setContractType}
              onCurrencyChange={setCurrency}
              priceData={priceData}
              marketData={marketData}
              priceLoading={priceLoading}
              marketLoading={marketLoading}
              onTransactionChange={setTransaction}
            />
            <div
              className={`${
                transaction === "sell" ? "hidden" : "flex"
              } flex-col space-y-4 w-full`}
            >
              <PriceQuote
                active={tokenIdx}
                currency={currency}
                value={payAmount}
                priceData={priceData}
                premium={premium.premium}
                contractType={contractType}
              />
              <GreekPopup
                value={payAmount}
                delta={greeks.delta}
                gamma={greeks.gamma}
                theta={greeks.theta}
                vega={greeks.vega}
                rho={greeks.rho}
              />
              {active === "trade" && (
                <ProtectedRoute fallback={<TradingPositionsFallback />}>
                  <TradingPositions />
                </ProtectedRoute>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="w-full p-3 pb-10 bottom-0 sticky border-t bg-background z-10 lg:hidden">
        <div className="grid grid-cols-2 space-x-2">
          <Button
            className={cn(
              active === "chart"
                ? "border-primary text-primary"
                : "text-secondary-foreground",
              "border rounded-sm px-5 py-[6px] bg-inherit w-full"
            )}
            onClick={() => setActive("chart")}
          >
            Chart
          </Button>
          <Button
            className={cn(
              active === "trade"
                ? "border-primary text-primary"
                : "text-secondary-foreground",
              "border rounded-sm px-5 py-[6px] bg-inherit w-full"
            )}
            onClick={() => setActive("trade")}
          >
            Trade
          </Button>
        </div>
      </div>
    </>
  );
}
