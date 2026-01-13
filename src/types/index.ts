export interface Order {
  id: number;
  type: 'buy' | 'sell';
  symbol: string;
  entryPrice: number;
  margin: number;
  leverage: number;
  size: number;
  liquidationPrice: number;
  status: 'active' | 'closed';
  pnl?: number; // Optional, calculated on the fly usually
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

export interface ActiveAsset {
  symbol: string;
  displaySymbol: string;
  name: string;
  source: 'binance' | 'twelve';
}