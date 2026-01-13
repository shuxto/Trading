import type { Asset } from '../types';

export const ASSETS: Asset[] = [
  // --- CRYPTO ---
  { 
    symbol: 'BTCUSDT', 
    displaySymbol: 'BTC/USD', 
    name: 'Bitcoin', 
    type: 'crypto', 
    price: 43250.00, 
    change: 2.5, 
    source: 'binance',
    logo: 'https://assets.coincap.io/assets/icons/btc@2x.png' 
  },
  { 
    symbol: 'ETHUSDT', 
    displaySymbol: 'ETH/USD', 
    name: 'Ethereum', 
    type: 'crypto', 
    price: 2250.00, 
    change: -1.2, 
    source: 'binance',
    logo: 'https://assets.coincap.io/assets/icons/eth@2x.png' 
  },
  { 
    symbol: 'SOLUSDT', 
    displaySymbol: 'SOL/USD', 
    name: 'Solana', 
    type: 'crypto', 
    price: 98.50, 
    change: 5.4, 
    source: 'binance',
    logo: 'https://assets.coincap.io/assets/icons/sol@2x.png' 
  },
  { 
    symbol: 'XRPUSDT', 
    displaySymbol: 'XRP/USD', 
    name: 'Ripple', 
    type: 'crypto', 
    price: 0.55, 
    change: 0.8, 
    source: 'binance',
    logo: 'https://assets.coincap.io/assets/icons/xrp@2x.png' 
  },
  
  // --- STOCKS ---
  { 
    symbol: 'AAPL', 
    displaySymbol: 'AAPL', 
    name: 'Apple Inc.', 
    type: 'stock', 
    price: 185.50, 
    change: 0.8, 
    source: 'twelve',
    logo: 'https://cdn.simpleicons.org/apple/white' 
  },
  { 
    symbol: 'TSLA', 
    displaySymbol: 'TSLA', 
    name: 'Tesla, Inc.', 
    type: 'stock', 
    price: 240.10, 
    change: -2.1, 
    source: 'twelve',
    logo: 'https://cdn.simpleicons.org/tesla/e82127' 
  },
  { 
    symbol: 'NVDA', 
    displaySymbol: 'NVDA', 
    name: 'NVIDIA Corp', 
    type: 'stock', 
    price: 550.00, 
    change: 3.2, 
    source: 'twelve',
    logo: 'https://cdn.simpleicons.org/nvidia/76b900' 
  },

  // --- FOREX ---
  { 
    symbol: 'EUR/USD', 
    displaySymbol: 'EUR/USD', 
    name: 'Euro / US Dollar', 
    type: 'forex', 
    price: 1.0950, 
    change: 0.1, 
    source: 'twelve',
    logo: 'https://flagcdn.com/w80/eu.png' 
  },
  { 
    symbol: 'GBP/USD', 
    displaySymbol: 'GBP/USD', 
    name: 'British Pound', 
    type: 'forex', 
    price: 1.2700, 
    change: -0.05, 
    source: 'twelve',
    logo: 'https://flagcdn.com/w80/gb.png' 
  },
  { 
    symbol: 'USD/JPY', 
    displaySymbol: 'USD/JPY', 
    name: 'US Dollar / Yen', 
    type: 'forex', 
    price: 145.20, 
    change: 0.3, 
    source: 'twelve',
    logo: 'https://flagcdn.com/w80/jp.png' 
  },

  // --- COMMODITIES ---
  { 
    symbol: 'XAU/USD', 
    displaySymbol: 'Gold', 
    name: 'Gold Spot / USD', 
    type: 'commodity', 
    price: 2045.50, 
    change: 1.1, 
    source: 'twelve',
    logo: 'https://assets.coincap.io/assets/icons/paxg@2x.png' 
  },
];