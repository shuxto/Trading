import type { Asset } from '../types';

export const ASSETS: Asset[] = [
  // ==========================================
  // 🚀 CRYPTO (Source: BINANCE)
  // ==========================================
  { 
    symbol: 'BTCUSDT', displaySymbol: 'BTC/USD', name: 'Bitcoin', 
    type: 'crypto', price: 0, change: 0, source: 'binance', 
    logo: 'https://assets.coincap.io/assets/icons/btc@2x.png' 
  },
  { 
    symbol: 'ETHUSDT', displaySymbol: 'ETH/USD', name: 'Ethereum', 
    type: 'crypto', price: 0, change: 0, source: 'binance', 
    logo: 'https://assets.coincap.io/assets/icons/eth@2x.png' 
  },
  { 
    symbol: 'SOLUSDT', displaySymbol: 'SOL/USD', name: 'Solana', 
    type: 'crypto', price: 0, change: 0, source: 'binance', 
    logo: 'https://assets.coincap.io/assets/icons/sol@2x.png' 
  },
  { 
    symbol: 'BNBUSDT', displaySymbol: 'BNB/USD', name: 'Binance Coin', 
    type: 'crypto', price: 0, change: 0, source: 'binance', 
    logo: 'https://assets.coincap.io/assets/icons/bnb@2x.png' 
  },
  { 
    symbol: 'XRPUSDT', displaySymbol: 'XRP/USD', name: 'Ripple', 
    type: 'crypto', price: 0, change: 0, source: 'binance', 
    logo: 'https://assets.coincap.io/assets/icons/xrp@2x.png' 
  },
  { 
    symbol: 'ADAUSDT', displaySymbol: 'ADA/USD', name: 'Cardano', 
    type: 'crypto', price: 0, change: 0, source: 'binance', 
    logo: 'https://assets.coincap.io/assets/icons/ada@2x.png' 
  },
  { 
    symbol: 'DOGEUSDT', displaySymbol: 'DOGE/USD', name: 'Dogecoin', 
    type: 'crypto', price: 0, change: 0, source: 'binance', 
    logo: 'https://assets.coincap.io/assets/icons/doge@2x.png' 
  },
  { 
    symbol: 'AVAXUSDT', displaySymbol: 'AVAX/USD', name: 'Avalanche', 
    type: 'crypto', price: 0, change: 0, source: 'binance', 
    logo: 'https://assets.coincap.io/assets/icons/avax@2x.png' 
  },
  { 
    symbol: 'DOTUSDT', displaySymbol: 'DOT/USD', name: 'Polkadot', 
    type: 'crypto', price: 0, change: 0, source: 'binance', 
    logo: 'https://assets.coincap.io/assets/icons/dot@2x.png' 
  },
  { 
    symbol: 'LINKUSDT', displaySymbol: 'LINK/USD', name: 'Chainlink', 
    type: 'crypto', price: 0, change: 0, source: 'binance', 
    logo: 'https://assets.coincap.io/assets/icons/link@2x.png' 
  },
  { 
    symbol: 'MATICUSDT', displaySymbol: 'MATIC/USD', name: 'Polygon', 
    type: 'crypto', price: 0, change: 0, source: 'binance', 
    logo: 'https://assets.coincap.io/assets/icons/matic@2x.png' 
  },
  { 
    symbol: 'LTCUSDT', displaySymbol: 'LTC/USD', name: 'Litecoin', 
    type: 'crypto', price: 0, change: 0, source: 'binance', 
    logo: 'https://assets.coincap.io/assets/icons/ltc@2x.png' 
  },
  { 
    symbol: 'UNIUSDT', displaySymbol: 'UNI/USD', name: 'Uniswap', 
    type: 'crypto', price: 0, change: 0, source: 'binance', 
    logo: 'https://assets.coincap.io/assets/icons/uni@2x.png' 
  },
  { 
    symbol: 'TRXUSDT', displaySymbol: 'TRX/USD', name: 'TRON', 
    type: 'crypto', price: 0, change: 0, source: 'binance', 
    logo: 'https://assets.coincap.io/assets/icons/trx@2x.png' 
  },
  { 
    symbol: 'SHIBUSDT', displaySymbol: 'SHIB/USD', name: 'Shiba Inu', 
    type: 'crypto', price: 0, change: 0, source: 'binance', 
    logo: 'https://assets.coincap.io/assets/icons/shib@2x.png' 
  },

  // ==========================================
  // 🏢 STOCKS (Source: TWELVE DATA)
  // ==========================================
  { 
    symbol: 'AAPL', displaySymbol: 'AAPL', name: 'Apple Inc.', 
    type: 'stock', price: 0, change: 0, source: 'twelve', 
    logo: 'https://cdn.simpleicons.org/apple/white' 
  },
  { 
    symbol: 'MSFT', displaySymbol: 'MSFT', name: 'Microsoft', 
    type: 'stock', price: 0, change: 0, source: 'twelve', 
    logo: 'https://cdn.simpleicons.org/microsoft/00a4ef' 
  },
  { 
    symbol: 'GOOGL', displaySymbol: 'GOOGL', name: 'Alphabet (Google)', 
    type: 'stock', price: 0, change: 0, source: 'twelve', 
    logo: 'https://cdn.simpleicons.org/google/4285f4' 
  },
  { 
    symbol: 'AMZN', displaySymbol: 'AMZN', name: 'Amazon', 
    type: 'stock', price: 0, change: 0, source: 'twelve', 
    logo: 'https://cdn.simpleicons.org/amazon/ff9900' 
  },
  { 
    symbol: 'NVDA', displaySymbol: 'NVDA', name: 'NVIDIA', 
    type: 'stock', price: 0, change: 0, source: 'twelve', 
    logo: 'https://cdn.simpleicons.org/nvidia/76b900' 
  },
  { 
    symbol: 'TSLA', displaySymbol: 'TSLA', name: 'Tesla', 
    type: 'stock', price: 0, change: 0, source: 'twelve', 
    logo: 'https://cdn.simpleicons.org/tesla/e82127' 
  },
  { 
    symbol: 'META', displaySymbol: 'META', name: 'Meta (Facebook)', 
    type: 'stock', price: 0, change: 0, source: 'twelve', 
    logo: 'https://cdn.simpleicons.org/meta/0668e1' 
  },
  { 
    symbol: 'NFLX', displaySymbol: 'NFLX', name: 'Netflix', 
    type: 'stock', price: 0, change: 0, source: 'twelve', 
    logo: 'https://cdn.simpleicons.org/netflix/e50914' 
  },
  { 
    symbol: 'AMD', displaySymbol: 'AMD', name: 'AMD', 
    type: 'stock', price: 0, change: 0, source: 'twelve', 
    logo: 'https://cdn.simpleicons.org/amd/white' 
  },
  { 
    symbol: 'INTC', displaySymbol: 'INTC', name: 'Intel', 
    type: 'stock', price: 0, change: 0, source: 'twelve', 
    logo: 'https://cdn.simpleicons.org/intel/0071c5' 
  },
  { 
    symbol: 'CRM', displaySymbol: 'CRM', name: 'Salesforce', 
    type: 'stock', price: 0, change: 0, source: 'twelve', 
    logo: 'https://cdn.simpleicons.org/salesforce/00a1e0' 
  },
  { 
    symbol: 'ADBE', displaySymbol: 'ADBE', name: 'Adobe', 
    type: 'stock', price: 0, change: 0, source: 'twelve', 
    logo: 'https://cdn.simpleicons.org/adobe/ff0000' 
  },
  { 
    symbol: 'PYPL', displaySymbol: 'PYPL', name: 'PayPal', 
    type: 'stock', price: 0, change: 0, source: 'twelve', 
    logo: 'https://cdn.simpleicons.org/paypal/003087' 
  },
  { 
    symbol: 'UBER', displaySymbol: 'UBER', name: 'Uber Technologies', 
    type: 'stock', price: 0, change: 0, source: 'twelve', 
    logo: 'https://cdn.simpleicons.org/uber/white' 
  },
  { 
    symbol: 'COIN', displaySymbol: 'COIN', name: 'Coinbase', 
    type: 'stock', price: 0, change: 0, source: 'twelve', 
    logo: 'https://cdn.simpleicons.org/coinbase/0052ff' 
  },
  { 
    symbol: 'PLTR', displaySymbol: 'PLTR', name: 'Palantir', 
    type: 'stock', price: 0, change: 0, source: 'twelve', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/1/13/Palantir_Technologies_logo.svg' 
  },

  // ==========================================
  // 💱 FOREX - MAJORS (Source: TWELVE DATA)
  // ==========================================
  { 
    symbol: 'EUR/USD', displaySymbol: 'EUR/USD', name: 'Euro / US Dollar', 
    type: 'forex', price: 0, change: 0, source: 'twelve', 
    logo: 'https://flagcdn.com/w80/eu.png' 
  },
  { 
    symbol: 'GBP/USD', displaySymbol: 'GBP/USD', name: 'British Pound / USD', 
    type: 'forex', price: 0, change: 0, source: 'twelve', 
    logo: 'https://flagcdn.com/w80/gb.png' 
  },
  { 
    symbol: 'USD/JPY', displaySymbol: 'USD/JPY', name: 'US Dollar / Yen', 
    type: 'forex', price: 0, change: 0, source: 'twelve', 
    logo: 'https://flagcdn.com/w80/jp.png' 
  },
  { 
    symbol: 'USD/CHF', displaySymbol: 'USD/CHF', name: 'USD / Swiss Franc', 
    type: 'forex', price: 0, change: 0, source: 'twelve', 
    logo: 'https://flagcdn.com/w80/ch.png' 
  },
  { 
    symbol: 'AUD/USD', displaySymbol: 'AUD/USD', name: 'Australian Dollar', 
    type: 'forex', price: 0, change: 0, source: 'twelve', 
    logo: 'https://flagcdn.com/w80/au.png' 
  },
  { 
    symbol: 'USD/CAD', displaySymbol: 'USD/CAD', name: 'Canadian Dollar', 
    type: 'forex', price: 0, change: 0, source: 'twelve', 
    logo: 'https://flagcdn.com/w80/ca.png' 
  },
  { 
    symbol: 'NZD/USD', displaySymbol: 'NZD/USD', name: 'New Zealand Dollar', 
    type: 'forex', price: 0, change: 0, source: 'twelve', 
    logo: 'https://flagcdn.com/w80/nz.png' 
  },

  // ==========================================
  // 💱 FOREX - CROSSES & MINORS (Source: TWELVE DATA)
  // ==========================================
  { 
    symbol: 'EUR/GBP', displaySymbol: 'EUR/GBP', name: 'Euro / Pound', 
    type: 'forex', price: 0, change: 0, source: 'twelve', 
    logo: 'https://flagcdn.com/w80/eu.png' 
  },
  { 
    symbol: 'EUR/JPY', displaySymbol: 'EUR/JPY', name: 'Euro / Yen', 
    type: 'forex', price: 0, change: 0, source: 'twelve', 
    logo: 'https://flagcdn.com/w80/eu.png' 
  },
  { 
    symbol: 'EUR/CHF', displaySymbol: 'EUR/CHF', name: 'Euro / Franc', 
    type: 'forex', price: 0, change: 0, source: 'twelve', 
    logo: 'https://flagcdn.com/w80/eu.png' 
  },
  { 
    symbol: 'GBP/JPY', displaySymbol: 'GBP/JPY', name: 'Pound / Yen', 
    type: 'forex', price: 0, change: 0, source: 'twelve', 
    logo: 'https://flagcdn.com/w80/gb.png' 
  },
  { 
    symbol: 'GBP/AUD', displaySymbol: 'GBP/AUD', name: 'Pound / Aussie', 
    type: 'forex', price: 0, change: 0, source: 'twelve', 
    logo: 'https://flagcdn.com/w80/gb.png' 
  },
  { 
    symbol: 'GBP/CAD', displaySymbol: 'GBP/CAD', name: 'Pound / CAD', 
    type: 'forex', price: 0, change: 0, source: 'twelve', 
    logo: 'https://flagcdn.com/w80/gb.png' 
  },
  { 
    symbol: 'AUD/JPY', displaySymbol: 'AUD/JPY', name: 'Aussie / Yen', 
    type: 'forex', price: 0, change: 0, source: 'twelve', 
    logo: 'https://flagcdn.com/w80/au.png' 
  },
  { 
    symbol: 'AUD/CAD', displaySymbol: 'AUD/CAD', name: 'Aussie / CAD', 
    type: 'forex', price: 0, change: 0, source: 'twelve', 
    logo: 'https://flagcdn.com/w80/au.png' 
  },
  { 
    symbol: 'AUD/NZD', displaySymbol: 'AUD/NZD', name: 'Aussie / Kiwi', 
    type: 'forex', price: 0, change: 0, source: 'twelve', 
    logo: 'https://flagcdn.com/w80/au.png' 
  },
  { 
    symbol: 'CAD/JPY', displaySymbol: 'CAD/JPY', name: 'CAD / Yen', 
    type: 'forex', price: 0, change: 0, source: 'twelve', 
    logo: 'https://flagcdn.com/w80/ca.png' 
  },
  { 
    symbol: 'CHF/JPY', displaySymbol: 'CHF/JPY', name: 'Franc / Yen', 
    type: 'forex', price: 0, change: 0, source: 'twelve', 
    logo: 'https://flagcdn.com/w80/ch.png' 
  },
  { 
    symbol: 'NZD/JPY', displaySymbol: 'NZD/JPY', name: 'Kiwi / Yen', 
    type: 'forex', price: 0, change: 0, source: 'twelve', 
    logo: 'https://flagcdn.com/w80/nz.png' 
  },
  
  // ==========================================
  // 💱 FOREX - EXOTICS (Source: TWELVE DATA)
  // ==========================================
  { 
    symbol: 'USD/SGD', displaySymbol: 'USD/SGD', name: 'USD / Singapore Dollar', 
    type: 'forex', price: 0, change: 0, source: 'twelve', 
    logo: 'https://flagcdn.com/w80/sg.png' 
  },
  { 
    symbol: 'USD/HKD', displaySymbol: 'USD/HKD', name: 'USD / HK Dollar', 
    type: 'forex', price: 0, change: 0, source: 'twelve', 
    logo: 'https://flagcdn.com/w80/hk.png' 
  },
  { 
    symbol: 'USD/ZAR', displaySymbol: 'USD/ZAR', name: 'USD / South African Rand', 
    type: 'forex', price: 0, change: 0, source: 'twelve', 
    logo: 'https://flagcdn.com/w80/za.png' 
  },
  { 
    symbol: 'USD/MXN', displaySymbol: 'USD/MXN', name: 'USD / Mexican Peso', 
    type: 'forex', price: 0, change: 0, source: 'twelve', 
    logo: 'https://flagcdn.com/w80/mx.png' 
  },
  { 
    symbol: 'USD/TRY', displaySymbol: 'USD/TRY', name: 'USD / Turkish Lira', 
    type: 'forex', price: 0, change: 0, source: 'twelve', 
    logo: 'https://flagcdn.com/w80/tr.png' 
  },
  { 
    symbol: 'USD/SEK', displaySymbol: 'USD/SEK', name: 'USD / Swedish Krona', 
    type: 'forex', price: 0, change: 0, source: 'twelve', 
    logo: 'https://flagcdn.com/w80/se.png' 
  },
  { 
    symbol: 'USD/NOK', displaySymbol: 'USD/NOK', name: 'USD / Norwegian Krone', 
    type: 'forex', price: 0, change: 0, source: 'twelve', 
    logo: 'https://flagcdn.com/w80/no.png' 
  },

  // ==========================================
  // 📈 INDICES (Source: TWELVE DATA)
  // ==========================================
  { 
    symbol: 'SPX', displaySymbol: 'S&P 500', name: 'S&P 500 Index', 
    type: 'index', price: 0, change: 0, source: 'twelve', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/S%26P_Standard_and_Poor%27s_logo.svg/1200px-S%26P_Standard_and_Poor%27s_logo.svg.png' 
  },
  { 
    symbol: 'IXIC', displaySymbol: 'NASDAQ', name: 'Nasdaq Composite', 
    type: 'index', price: 0, change: 0, source: 'twelve', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Nasdaq_Logo.svg/1200px-Nasdaq_Logo.svg.png' 
  },
  { 
    symbol: 'DJI', displaySymbol: 'DOW 30', name: 'Dow Jones Industrial', 
    type: 'index', price: 0, change: 0, source: 'twelve', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Dow_Jones_Industrial_Average_Logo.png' 
  },
  { 
    symbol: 'GDAXI', displaySymbol: 'DAX 40', name: 'DAX Performance-Index', 
    type: 'index', price: 0, change: 0, source: 'twelve', 
    logo: 'https://flagcdn.com/w80/de.png' 
  },
  { 
    symbol: 'FTSE', displaySymbol: 'FTSE 100', name: 'FTSE 100 Index', 
    type: 'index', price: 0, change: 0, source: 'twelve', 
    logo: 'https://flagcdn.com/w80/gb.png' 
  },

  // ==========================================
  // ⛏️ COMMODITIES (Source: TWELVE DATA)
  // ==========================================
  { 
    symbol: 'XAU/USD', displaySymbol: 'GOLD', name: 'Gold Spot / USD', 
    type: 'commodity', price: 0, change: 0, source: 'twelve', 
    logo: 'https://assets.coincap.io/assets/icons/paxg@2x.png' 
  },
  { 
    symbol: 'XAG/USD', displaySymbol: 'SILVER', name: 'Silver Spot / USD', 
    type: 'commodity', price: 0, change: 0, source: 'twelve', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Silver_coin_icon.png' 
  },
  { 
    symbol: 'XPT/USD', displaySymbol: 'PLATINUM', name: 'Platinum Spot / USD', 
    type: 'commodity', price: 0, change: 0, source: 'twelve', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Platinum_crystals.jpg/600px-Platinum_crystals.jpg' 
  },
  { 
    symbol: 'XPD/USD', displaySymbol: 'PALLADIUM', name: 'Palladium Spot / USD', 
    type: 'commodity', price: 0, change: 0, source: 'twelve', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Palladium_crystal.jpg' 
  },
  { 
    symbol: 'WTI', displaySymbol: 'WTI OIL', name: 'WTI Crude Oil', 
    type: 'commodity', price: 0, change: 0, source: 'twelve', 
    logo: 'https://cdn-icons-png.flaticon.com/512/2103/2103649.png' 
  },
  { 
    symbol: 'BRENT', displaySymbol: 'BRENT', name: 'Brent Crude Oil', 
    type: 'commodity', price: 0, change: 0, source: 'twelve', 
    logo: 'https://cdn-icons-png.flaticon.com/512/2933/2933861.png' 
  },
  { 
    symbol: 'NG', displaySymbol: 'NAT GAS', name: 'Natural Gas', 
    type: 'commodity', price: 0, change: 0, source: 'twelve', 
    logo: 'https://cdn-icons-png.flaticon.com/512/4614/4614486.png' 
  },
  { 
    symbol: 'HG', displaySymbol: 'COPPER', name: 'Copper', 
    type: 'commodity', price: 0, change: 0, source: 'twelve', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/NatCopper.jpg/800px-NatCopper.jpg' 
  },
];