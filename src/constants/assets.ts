import type { Asset } from '../types';

export const ASSETS: Asset[] = [
  // ==========================================
  // 🚀 CRYPTO (Source: TWELVE DATA)
  // Format MUST be "BTC/USD" (with slash) for TwelveData
  // ==========================================
  { symbol: 'BTC/USD', displaySymbol: 'BTC/USD', name: 'Bitcoin', type: 'crypto', price: 0, change: 0, source: 'twelve', logo: 'https://assets.coincap.io/assets/icons/btc@2x.png' },
  { symbol: 'ETH/USD', displaySymbol: 'ETH/USD', name: 'Ethereum', type: 'crypto', price: 0, change: 0, source: 'twelve', logo: 'https://assets.coincap.io/assets/icons/eth@2x.png' },
  { symbol: 'SOL/USD', displaySymbol: 'SOL/USD', name: 'Solana', type: 'crypto', price: 0, change: 0, source: 'twelve', logo: 'https://assets.coincap.io/assets/icons/sol@2x.png' },
  { symbol: 'BNB/USD', displaySymbol: 'BNB/USD', name: 'Binance Coin', type: 'crypto', price: 0, change: 0, source: 'twelve', logo: 'https://assets.coincap.io/assets/icons/bnb@2x.png' },
  { symbol: 'XRP/USD', displaySymbol: 'XRP/USD', name: 'Ripple', type: 'crypto', price: 0, change: 0, source: 'twelve', logo: 'https://assets.coincap.io/assets/icons/xrp@2x.png' },
  { symbol: 'ADA/USD', displaySymbol: 'ADA/USD', name: 'Cardano', type: 'crypto', price: 0, change: 0, source: 'twelve', logo: 'https://assets.coincap.io/assets/icons/ada@2x.png' },
  { symbol: 'DOGE/USD', displaySymbol: 'DOGE/USD', name: 'Dogecoin', type: 'crypto', price: 0, change: 0, source: 'twelve', logo: 'https://assets.coincap.io/assets/icons/doge@2x.png' },
  { symbol: 'AVAX/USD', displaySymbol: 'AVAX/USD', name: 'Avalanche', type: 'crypto', price: 0, change: 0, source: 'twelve', logo: 'https://assets.coincap.io/assets/icons/avax@2x.png' },
  { symbol: 'DOT/USD', displaySymbol: 'DOT/USD', name: 'Polkadot', type: 'crypto', price: 0, change: 0, source: 'twelve', logo: 'https://assets.coincap.io/assets/icons/dot@2x.png' },
  { symbol: 'LINK/USD', displaySymbol: 'LINK/USD', name: 'Chainlink', type: 'crypto', price: 0, change: 0, source: 'twelve', logo: 'https://assets.coincap.io/assets/icons/link@2x.png' },
  { symbol: 'MATIC/USD', displaySymbol: 'MATIC/USD', name: 'Polygon', type: 'crypto', price: 0, change: 0, source: 'twelve', logo: 'https://assets.coincap.io/assets/icons/matic@2x.png' },
  { symbol: 'LTC/USD', displaySymbol: 'LTC/USD', name: 'Litecoin', type: 'crypto', price: 0, change: 0, source: 'twelve', logo: 'https://assets.coincap.io/assets/icons/ltc@2x.png' },
  { symbol: 'UNI/USD', displaySymbol: 'UNI/USD', name: 'Uniswap', type: 'crypto', price: 0, change: 0, source: 'twelve', logo: 'https://assets.coincap.io/assets/icons/uni@2x.png' },
  { symbol: 'TRX/USD', displaySymbol: 'TRX/USD', name: 'TRON', type: 'crypto', price: 0, change: 0, source: 'twelve', logo: 'https://assets.coincap.io/assets/icons/trx@2x.png' },
  { symbol: 'SHIB/USD', displaySymbol: 'SHIB/USD', name: 'Shiba Inu', type: 'crypto', price: 0, change: 0, source: 'twelve', logo: 'https://assets.coincap.io/assets/icons/shib@2x.png' },
  { symbol: 'ETC/USD', displaySymbol: 'ETC/USD', name: 'Ethereum Classic', type: 'crypto', price: 0, change: 0, source: 'twelve', logo: 'https://assets.coincap.io/assets/icons/etc@2x.png' },
  { symbol: 'NEAR/USD', displaySymbol: 'NEAR/USD', name: 'Near Protocol', type: 'crypto', price: 0, change: 0, source: 'twelve', logo: 'https://assets.coincap.io/assets/icons/near@2x.png' },
  { symbol: 'ATOM/USD', displaySymbol: 'ATOM/USD', name: 'Cosmos', type: 'crypto', price: 0, change: 0, source: 'twelve', logo: 'https://assets.coincap.io/assets/icons/atom@2x.png' },
  { symbol: 'XLM/USD', displaySymbol: 'XLM/USD', name: 'Stellar', type: 'crypto', price: 0, change: 0, source: 'twelve', logo: 'https://assets.coincap.io/assets/icons/xlm@2x.png' },
  { symbol: 'BCH/USD', displaySymbol: 'BCH/USD', name: 'Bitcoin Cash', type: 'crypto', price: 0, change: 0, source: 'twelve', logo: 'https://assets.coincap.io/assets/icons/bch@2x.png' },
  { symbol: 'ALGO/USD', displaySymbol: 'ALGO/USD', name: 'Algorand', type: 'crypto', price: 0, change: 0, source: 'twelve', logo: 'https://assets.coincap.io/assets/icons/algo@2x.png' },
  { symbol: 'FIL/USD', displaySymbol: 'FIL/USD', name: 'Filecoin', type: 'crypto', price: 0, change: 0, source: 'twelve', logo: 'https://assets.coincap.io/assets/icons/fil@2x.png' },
  { symbol: 'VET/USD', displaySymbol: 'VET/USD', name: 'VeChain', type: 'crypto', price: 0, change: 0, source: 'twelve', logo: 'https://assets.coincap.io/assets/icons/vet@2x.png' },
  { symbol: 'ICP/USD', displaySymbol: 'ICP/USD', name: 'Internet Computer', type: 'crypto', price: 0, change: 0, source: 'twelve', logo: 'https://assets.coincap.io/assets/icons/icp@2x.png' },
  { symbol: 'GRT/USD', displaySymbol: 'GRT/USD', name: 'The Graph', type: 'crypto', price: 0, change: 0, source: 'twelve', logo: 'https://assets.coincap.io/assets/icons/grt@2x.png' },
  { symbol: 'AAVE/USD', displaySymbol: 'AAVE/USD', name: 'Aave', type: 'crypto', price: 0, change: 0, source: 'twelve', logo: 'https://assets.coincap.io/assets/icons/aave@2x.png' },
  { symbol: 'SAND/USD', displaySymbol: 'SAND/USD', name: 'The Sandbox', type: 'crypto', price: 0, change: 0, source: 'twelve', logo: 'https://assets.coincap.io/assets/icons/sand@2x.png' },
  { symbol: 'MANA/USD', displaySymbol: 'MANA/USD', name: 'Decentraland', type: 'crypto', price: 0, change: 0, source: 'twelve', logo: 'https://assets.coincap.io/assets/icons/mana@2x.png' },
  { symbol: 'AXS/USD', displaySymbol: 'AXS/USD', name: 'Axie Infinity', type: 'crypto', price: 0, change: 0, source: 'twelve', logo: 'https://assets.coincap.io/assets/icons/axs@2x.png' },
  { symbol: 'EOS/USD', displaySymbol: 'EOS/USD', name: 'EOS', type: 'crypto', price: 0, change: 0, source: 'twelve', logo: 'https://assets.coincap.io/assets/icons/eos@2x.png' },
  { symbol: 'THETA/USD', displaySymbol: 'THETA/USD', name: 'Theta Network', type: 'crypto', price: 0, change: 0, source: 'twelve', logo: 'https://assets.coincap.io/assets/icons/theta@2x.png' },
  { symbol: 'RUNE/USD', displaySymbol: 'RUNE/USD', name: 'THORChain', type: 'crypto', price: 0, change: 0, source: 'twelve', logo: 'https://assets.coincap.io/assets/icons/rune@2x.png' },
  { symbol: 'KSM/USD', displaySymbol: 'KSM/USD', name: 'Kusama', type: 'crypto', price: 0, change: 0, source: 'twelve', logo: 'https://assets.coincap.io/assets/icons/ksm@2x.png' },
  { symbol: 'EGLD/USD', displaySymbol: 'EGLD/USD', name: 'Elrond', type: 'crypto', price: 0, change: 0, source: 'twelve', logo: 'https://assets.coincap.io/assets/icons/egld@2x.png' },
  { symbol: 'XTZ/USD', displaySymbol: 'XTZ/USD', name: 'Tezos', type: 'crypto', price: 0, change: 0, source: 'twelve', logo: 'https://assets.coincap.io/assets/icons/xtz@2x.png' },

  // ==========================================
  // 🏢 STOCKS (Source: TWELVE DATA)
  // ==========================================
  { symbol: 'AAPL', displaySymbol: 'AAPL', name: 'Apple Inc.', type: 'stock', price: 0, change: 0, source: 'twelve', logo: 'https://cdn.simpleicons.org/apple/white' },
  { symbol: 'MSFT', displaySymbol: 'MSFT', name: 'Microsoft', type: 'stock', price: 0, change: 0, source: 'twelve', logo: 'https://cdn.simpleicons.org/microsoft/00a4ef' },
  { symbol: 'GOOGL', displaySymbol: 'GOOGL', name: 'Alphabet (Google)', type: 'stock', price: 0, change: 0, source: 'twelve', logo: 'https://cdn.simpleicons.org/google/4285f4' },
  { symbol: 'AMZN', displaySymbol: 'AMZN', name: 'Amazon', type: 'stock', price: 0, change: 0, source: 'twelve', logo: 'https://cdn.simpleicons.org/amazon/ff9900' },
  { symbol: 'NVDA', displaySymbol: 'NVDA', name: 'NVIDIA', type: 'stock', price: 0, change: 0, source: 'twelve', logo: 'https://cdn.simpleicons.org/nvidia/76b900' },
  { symbol: 'TSLA', displaySymbol: 'TSLA', name: 'Tesla', type: 'stock', price: 0, change: 0, source: 'twelve', logo: 'https://cdn.simpleicons.org/tesla/e82127' },
  { symbol: 'META', displaySymbol: 'META', name: 'Meta (Facebook)', type: 'stock', price: 0, change: 0, source: 'twelve', logo: 'https://cdn.simpleicons.org/meta/0668e1' },
  { symbol: 'NFLX', displaySymbol: 'NFLX', name: 'Netflix', type: 'stock', price: 0, change: 0, source: 'twelve', logo: 'https://cdn.simpleicons.org/netflix/e50914' },
  { symbol: 'AMD', displaySymbol: 'AMD', name: 'AMD', type: 'stock', price: 0, change: 0, source: 'twelve', logo: 'https://cdn.simpleicons.org/amd/white' },
  { symbol: 'INTC', displaySymbol: 'INTC', name: 'Intel', type: 'stock', price: 0, change: 0, source: 'twelve', logo: 'https://cdn.simpleicons.org/intel/0071c5' },
  { symbol: 'CRM', displaySymbol: 'CRM', name: 'Salesforce', type: 'stock', price: 0, change: 0, source: 'twelve', logo: 'https://cdn.simpleicons.org/salesforce/00a1e0' },
  { symbol: 'ADBE', displaySymbol: 'ADBE', name: 'Adobe', type: 'stock', price: 0, change: 0, source: 'twelve', logo: 'https://cdn.simpleicons.org/adobe/ff0000' },
  { symbol: 'PYPL', displaySymbol: 'PYPL', name: 'PayPal', type: 'stock', price: 0, change: 0, source: 'twelve', logo: 'https://cdn.simpleicons.org/paypal/003087' },
  { symbol: 'UBER', displaySymbol: 'UBER', name: 'Uber Technologies', type: 'stock', price: 0, change: 0, source: 'twelve', logo: 'https://cdn.simpleicons.org/uber/white' },
  { symbol: 'ABNB', displaySymbol: 'ABNB', name: 'Airbnb', type: 'stock', price: 0, change: 0, source: 'twelve', logo: 'https://cdn.simpleicons.org/airbnb/ff5a5f' },
  { symbol: 'COIN', displaySymbol: 'COIN', name: 'Coinbase', type: 'stock', price: 0, change: 0, source: 'twelve', logo: 'https://cdn.simpleicons.org/coinbase/0052ff' },
  { symbol: 'PLTR', displaySymbol: 'PLTR', name: 'Palantir', type: 'stock', price: 0, change: 0, source: 'twelve', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/13/Palantir_Technologies_logo.svg' },
  { symbol: 'JPM', displaySymbol: 'JPM', name: 'JPMorgan Chase', type: 'stock', price: 0, change: 0, source: 'twelve', logo: 'https://cdn.simpleicons.org/chase/117aca' },
  { symbol: 'V', displaySymbol: 'V', name: 'Visa', type: 'stock', price: 0, change: 0, source: 'twelve', logo: 'https://cdn.simpleicons.org/visa/142787' },
  { symbol: 'MA', displaySymbol: 'MA', name: 'Mastercard', type: 'stock', price: 0, change: 0, source: 'twelve', logo: 'https://cdn.simpleicons.org/mastercard/eb001b' },
  { symbol: 'WMT', displaySymbol: 'WMT', name: 'Walmart', type: 'stock', price: 0, change: 0, source: 'twelve', logo: 'https://cdn.simpleicons.org/walmart/0071ce' },
  { symbol: 'KO', displaySymbol: 'KO', name: 'Coca-Cola', type: 'stock', price: 0, change: 0, source: 'twelve', logo: 'https://cdn.simpleicons.org/cocacola/f40009' },
  { symbol: 'PEP', displaySymbol: 'PEP', name: 'PepsiCo', type: 'stock', price: 0, change: 0, source: 'twelve', logo: 'https://cdn.simpleicons.org/pepsi/2151cc' },
  { symbol: 'MCD', displaySymbol: 'MCD', name: 'McDonald\'s', type: 'stock', price: 0, change: 0, source: 'twelve', logo: 'https://cdn.simpleicons.org/mcdonalds/ffc72c' },
  { symbol: 'NKE', displaySymbol: 'NKE', name: 'Nike', type: 'stock', price: 0, change: 0, source: 'twelve', logo: 'https://cdn.simpleicons.org/nike/white' },
  { symbol: 'TSM', displaySymbol: 'TSM', name: 'Taiwan Semiconductor', type: 'stock', price: 0, change: 0, source: 'twelve', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/29/TSMC_logo.svg' },
  { symbol: 'ASML', displaySymbol: 'ASML', name: 'ASML Holding', type: 'stock', price: 0, change: 0, source: 'twelve', logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/ASML_logo.svg' },
  { symbol: 'BABA', displaySymbol: 'BABA', name: 'Alibaba Group', type: 'stock', price: 0, change: 0, source: 'twelve', logo: 'https://cdn.simpleicons.org/alibaba/ff6a00' },
  { symbol: 'SONY', displaySymbol: 'SONY', name: 'Sony Group', type: 'stock', price: 0, change: 0, source: 'twelve', logo: 'https://cdn.simpleicons.org/sony/white' },
  { symbol: 'TM', displaySymbol: 'TM', name: 'Toyota Motor', type: 'stock', price: 0, change: 0, source: 'twelve', logo: 'https://cdn.simpleicons.org/toyota/eb0a1e' },

  // ==========================================
  // 💱 FOREX (Source: TWELVE DATA)
  // ==========================================
  { symbol: 'EUR/USD', displaySymbol: 'EUR/USD', name: 'Euro / US Dollar', type: 'forex', price: 0, change: 0, source: 'twelve', logo: 'https://flagcdn.com/w80/eu.png' },
  { symbol: 'GBP/USD', displaySymbol: 'GBP/USD', name: 'British Pound', type: 'forex', price: 0, change: 0, source: 'twelve', logo: 'https://flagcdn.com/w80/gb.png' },
  { symbol: 'USD/JPY', displaySymbol: 'USD/JPY', name: 'US Dollar / Yen', type: 'forex', price: 0, change: 0, source: 'twelve', logo: 'https://flagcdn.com/w80/jp.png' },
  { symbol: 'USD/CHF', displaySymbol: 'USD/CHF', name: 'USD / Swiss Franc', type: 'forex', price: 0, change: 0, source: 'twelve', logo: 'https://flagcdn.com/w80/ch.png' },
  { symbol: 'AUD/USD', displaySymbol: 'AUD/USD', name: 'Australian Dollar', type: 'forex', price: 0, change: 0, source: 'twelve', logo: 'https://flagcdn.com/w80/au.png' },
  { symbol: 'USD/CAD', displaySymbol: 'USD/CAD', name: 'Canadian Dollar', type: 'forex', price: 0, change: 0, source: 'twelve', logo: 'https://flagcdn.com/w80/ca.png' },
  { symbol: 'NZD/USD', displaySymbol: 'NZD/USD', name: 'New Zealand Dollar', type: 'forex', price: 0, change: 0, source: 'twelve', logo: 'https://flagcdn.com/w80/nz.png' },
  { symbol: 'EUR/GBP', displaySymbol: 'EUR/GBP', name: 'Euro / Pound', type: 'forex', price: 0, change: 0, source: 'twelve', logo: 'https://flagcdn.com/w80/eu.png' },
  { symbol: 'EUR/JPY', displaySymbol: 'EUR/JPY', name: 'Euro / Yen', type: 'forex', price: 0, change: 0, source: 'twelve', logo: 'https://flagcdn.com/w80/eu.png' },
  { symbol: 'EUR/CHF', displaySymbol: 'EUR/CHF', name: 'Euro / Franc', type: 'forex', price: 0, change: 0, source: 'twelve', logo: 'https://flagcdn.com/w80/eu.png' },
  { symbol: 'GBP/JPY', displaySymbol: 'GBP/JPY', name: 'Pound / Yen', type: 'forex', price: 0, change: 0, source: 'twelve', logo: 'https://flagcdn.com/w80/gb.png' },
  { symbol: 'GBP/AUD', displaySymbol: 'GBP/AUD', name: 'Pound / Aussie', type: 'forex', price: 0, change: 0, source: 'twelve', logo: 'https://flagcdn.com/w80/gb.png' },
  { symbol: 'GBP/CAD', displaySymbol: 'GBP/CAD', name: 'Pound / CAD', type: 'forex', price: 0, change: 0, source: 'twelve', logo: 'https://flagcdn.com/w80/gb.png' },
  { symbol: 'AUD/JPY', displaySymbol: 'AUD/JPY', name: 'Aussie / Yen', type: 'forex', price: 0, change: 0, source: 'twelve', logo: 'https://flagcdn.com/w80/au.png' },
  { symbol: 'AUD/CAD', displaySymbol: 'AUD/CAD', name: 'Aussie / CAD', type: 'forex', price: 0, change: 0, source: 'twelve', logo: 'https://flagcdn.com/w80/au.png' },
  { symbol: 'CAD/JPY', displaySymbol: 'CAD/JPY', name: 'CAD / Yen', type: 'forex', price: 0, change: 0, source: 'twelve', logo: 'https://flagcdn.com/w80/ca.png' },
  { symbol: 'CHF/JPY', displaySymbol: 'CHF/JPY', name: 'Franc / Yen', type: 'forex', price: 0, change: 0, source: 'twelve', logo: 'https://flagcdn.com/w80/ch.png' },
  { symbol: 'USD/SGD', displaySymbol: 'USD/SGD', name: 'USD / SGD', type: 'forex', price: 0, change: 0, source: 'twelve', logo: 'https://flagcdn.com/w80/sg.png' },
  { symbol: 'USD/HKD', displaySymbol: 'USD/HKD', name: 'USD / HKD', type: 'forex', price: 0, change: 0, source: 'twelve', logo: 'https://flagcdn.com/w80/hk.png' },
  { symbol: 'USD/ZAR', displaySymbol: 'USD/ZAR', name: 'USD / Rand', type: 'forex', price: 0, change: 0, source: 'twelve', logo: 'https://flagcdn.com/w80/za.png' },
  { symbol: 'USD/MXN', displaySymbol: 'USD/MXN', name: 'USD / Peso', type: 'forex', price: 0, change: 0, source: 'twelve', logo: 'https://flagcdn.com/w80/mx.png' },
  { symbol: 'USD/TRY', displaySymbol: 'USD/TRY', name: 'USD / Lira', type: 'forex', price: 0, change: 0, source: 'twelve', logo: 'https://flagcdn.com/w80/tr.png' },

// ==========================================
  // 🧠 SMART INDICES (ETF PROXIES - INCLUDED IN PLAN)
  // We use ETFs (SPY, QQQ) because they track the index 1:1 
  // but are classified as "Stocks" by TwelveData (Cheaper/Free).
  // ==========================================
  { 
    symbol: 'SPY', 
    displaySymbol: 'S&P 500', 
    name: 'SPDR S&P 500 ETF', 
    type: 'index', 
    price: 0, 
    change: 0, 
    source: 'twelve', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/S%26P_Standard_and_Poor%27s_logo.svg/1200px-S%26P_Standard_and_Poor%27s_logo.svg.png' 
  },
  { 
    symbol: 'QQQ', 
    displaySymbol: 'NASDAQ 100', 
    name: 'Invesco QQQ Trust', 
    type: 'index', 
    price: 0, 
    change: 0, 
    source: 'twelve', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Nasdaq_Logo.svg/1200px-Nasdaq_Logo.svg.png' 
  },
  { 
    symbol: 'DIA', 
    displaySymbol: 'DOW 30', 
    name: 'SPDR Dow Jones ETF', 
    type: 'index', 
    price: 0, 
    change: 0, 
    source: 'twelve', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Dow_Jones_Industrial_Average_Logo.png' 
  },
  { 
    symbol: 'DAX', 
    displaySymbol: 'DAX 40', 
    name: 'Global X DAX Germany ETF', 
    type: 'index', 
    price: 0, 
    change: 0, 
    source: 'twelve', 
    logo: 'https://flagcdn.com/w80/de.png' 
  },
  { 
    symbol: 'EWU', 
    displaySymbol: 'FTSE 100', 
    name: 'iShares UK ETF (FTSE Proxy)', 
    type: 'index', 
    price: 0, 
    change: 0, 
    source: 'twelve', 
    logo: 'https://flagcdn.com/w80/gb.png' 
  },

  // ==========================================
  // ⛏️ COMMODITIES (Source: TWELVE DATA)
  // ==========================================
  { symbol: 'XAU/USD', displaySymbol: 'GOLD', name: 'Gold Spot / USD', type: 'commodity', price: 0, change: 0, source: 'twelve', logo: 'https://assets.coincap.io/assets/icons/paxg@2x.png' },
  { symbol: 'XAG/USD', displaySymbol: 'SILVER', name: 'Silver Spot / USD', type: 'commodity', price: 0, change: 0, source: 'twelve', logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Silver_coin_icon.png' },
  { symbol: 'XPT/USD', displaySymbol: 'PLATINUM', name: 'Platinum Spot', type: 'commodity', price: 0, change: 0, source: 'twelve', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Platinum_crystals.jpg/600px-Platinum_crystals.jpg' },
  { symbol: 'XPD/USD', displaySymbol: 'PALLADIUM', name: 'Palladium Spot', type: 'commodity', price: 0, change: 0, source: 'twelve', logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Palladium_crystal.jpg' },
  { symbol: 'XCU/USD', displaySymbol: 'COPPER', name: 'Copper Spot', type: 'commodity', price: 0, change: 0, source: 'twelve', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/NatCopper.jpg/800px-NatCopper.jpg' },
  { symbol: 'WTI', displaySymbol: 'WTI OIL', name: 'WTI Crude Oil', type: 'commodity', price: 0, change: 0, source: 'twelve', logo: 'https://cdn-icons-png.flaticon.com/512/2103/2103649.png' },
  { symbol: 'BRENT', displaySymbol: 'BRENT', name: 'Brent Crude Oil', type: 'commodity', price: 0, change: 0, source: 'twelve', logo: 'https://cdn-icons-png.flaticon.com/512/2933/2933861.png' },
  { symbol: 'NG', displaySymbol: 'NAT GAS', name: 'Natural Gas', type: 'commodity', price: 0, change: 0, source: 'twelve', logo: 'https://cdn-icons-png.flaticon.com/512/4614/4614486.png' },
  // Agriculture (Using ETF symbols as safe proxies for easy charting without futures expiry)
  { symbol: 'CORN', displaySymbol: 'CORN', name: 'Corn Fund', type: 'commodity', price: 0, change: 0, source: 'twelve', logo: 'https://cdn-icons-png.flaticon.com/512/1147/1147805.png' },
  { symbol: 'WEAT', displaySymbol: 'WHEAT', name: 'Wheat Fund', type: 'commodity', price: 0, change: 0, source: 'twelve', logo: 'https://cdn-icons-png.flaticon.com/512/575/575451.png' },
  { symbol: 'SOYB', displaySymbol: 'SOYBEAN', name: 'Soybean Fund', type: 'commodity', price: 0, change: 0, source: 'twelve', logo: 'https://cdn-icons-png.flaticon.com/512/7392/7392500.png' },
  { symbol: 'CANE', displaySymbol: 'SUGAR', name: 'Sugar Fund', type: 'commodity', price: 0, change: 0, source: 'twelve', logo: 'https://cdn-icons-png.flaticon.com/512/1581/1581898.png' },
];