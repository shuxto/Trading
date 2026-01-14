import { type Time } from 'lightweight-charts';

// ✅ Updated ChartStyle: Removed 'hlc-area', 'columns', 'histogram'
export type ChartStyle = 
  | 'candles' 
  | 'bars' 
  | 'line' 
  | 'area' 
  | 'stepline' 
  | 'baseline';

export interface CandleData {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

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
  pnl?: number; 
  takeProfit?: number; 
  stopLoss?: number;   
}

export interface Asset {
  symbol: string;
  displaySymbol: string;
  name: string;
  // ✅ ADDED 'index' here to fix the error
  type: 'crypto' | 'stock' | 'forex' | 'commodity' | 'index';
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