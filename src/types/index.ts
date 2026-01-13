// src/types/index.ts

export interface Order {
  id: number;
  type: 'buy' | 'sell';   // Buy = Long, Sell = Short
  symbol: string;         // e.g. BTCUSDT
  entryPrice: number;
  
  // Position Details
  margin: number;         // Your actual investment (e.g., $100)
  leverage: number;       // Risk multiplier (e.g., 20x)
  size: number;           // Total position value (Margin * Leverage)
  liquidationPrice: number; // The price where you lose everything
  
  pnl?: number;           // Unrealized Profit/Loss
  status: 'active' | 'closed';
}

export interface Asset {
  symbol: string;
  displaySymbol: string;
  name: string;
  type: 'crypto' | 'stock' | 'forex' | 'commodity';
  price: number;
  change: number;
  source: 'binance' | 'twelve';
  logo: string;
}

// Lightweight version for App state
export interface ActiveAsset {
  symbol: string;
  displaySymbol: string;
  name: string;
  source: 'binance' | 'twelve';
}