import { type Time } from 'lightweight-charts';

// ==========================================
// 1. FRONTEND / CHART TYPES (Keep these!)
// ==========================================

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

// ==========================================
// 2. BACKEND / DATABASE TYPES (New!)
// ==========================================

export interface UserProfile {
  id: string;
  email: string;
  role: 'user' | 'admin';
  balance: number;
  is_banned: boolean;
  created_at: string;
}

// This 'Trade' is for the Database history (slightly different from active 'Order')
export interface Trade {
  id: number;
  user_id: string;
  symbol: string;
  type: 'buy' | 'sell';
  entry_price: number;
  size: number;
  leverage: number;
  pnl: number;
  status: 'open' | 'closed';
  created_at: string;
  closed_at?: string;
}

export interface Transaction {
  id: number;
  user_id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}