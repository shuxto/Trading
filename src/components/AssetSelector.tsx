import { useState } from 'react';
import { Search, TrendingUp, TrendingDown, X, Bitcoin, DollarSign, BarChart3, Droplets, Globe } from 'lucide-react';

interface Asset {
  symbol: string;
  displaySymbol: string;
  name: string;
  type: 'crypto' | 'stock' | 'forex' | 'commodity';
  price: number;
  change: number;
  source: 'binance' | 'twelve';
  logo: string;
}

interface AssetSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (asset: Asset) => void;
}

const ASSETS: Asset[] = [
  // --- CRYPTO (CoinCap CDN) ---
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
  
  // --- STOCKS (Simple Icons CDN - Guaranteed to work) ---
  { 
    symbol: 'AAPL', 
    displaySymbol: 'AAPL', 
    name: 'Apple Inc.', 
    type: 'stock', 
    price: 185.50, 
    change: 0.8, 
    source: 'twelve',
    // Official Apple Logo (White)
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
    // Official Tesla Logo (Red)
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
    // Official Nvidia Logo (Green)
    logo: 'https://cdn.simpleicons.org/nvidia/76b900' 
  },

  // --- FOREX (Flag CDN) ---
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

  // --- COMMODITIES (CoinCap Assets - Best looking gold coin) ---
  { 
    symbol: 'XAU/USD', 
    displaySymbol: 'Gold', 
    name: 'Gold Spot / USD', 
    type: 'commodity', 
    price: 2045.50, 
    change: 1.1, 
    source: 'twelve',
    // Paxos Gold Icon (Looks exactly like a Gold Coin)
    logo: 'https://assets.coincap.io/assets/icons/paxg@2x.png' 
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'crypto', label: 'Crypto', icon: <Bitcoin size={14} /> },
  { id: 'stock', label: 'Stocks', icon: <BarChart3 size={14} /> },
  { id: 'forex', label: 'Forex', icon: <DollarSign size={14} /> },
  { id: 'commodity', label: 'Commodities', icon: <Droplets size={14} /> },
];

export default function AssetSelector({ isOpen, onClose, onSelect }: AssetSelectorProps) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredAssets = ASSETS.filter(asset => {
    const matchesCategory = activeCategory === 'all' || asset.type === activeCategory;
    const matchesSearch = asset.name.toLowerCase().includes(search.toLowerCase()) || 
                          asset.symbol.toLowerCase().includes(search.toLowerCase()) ||
                          asset.displaySymbol.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getFallbackIcon = (type: string) => {
    if (type === 'crypto') return <Bitcoin size={18} className="text-orange-500" />;
    if (type === 'stock') return <BarChart3 size={18} className="text-blue-500" />;
    if (type === 'forex') return <DollarSign size={18} className="text-green-500" />;
    return <Globe size={18} className="text-yellow-500" />;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0b0e11]/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      
      <div className="w-full max-w-2xl bg-[#151a21]/80 backdrop-blur-2xl border border-white/5 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="p-5 border-b border-white/5 flex items-center gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5e6673] group-focus-within:text-[#21ce99] transition-colors" size={20} />
            <input 
              autoFocus
              type="text" 
              placeholder="Search markets..."
              className="w-full bg-[#0b0e11]/50 border border-white/5 rounded-xl pl-12 pr-4 py-3 text-white placeholder-[#5e6673] focus:border-[#21ce99]/50 focus:bg-[#0b0e11] outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={onClose} 
            className="p-2.5 rounded-xl hover:bg-white/5 text-[#8b9bb4] hover:text-white transition-all active:scale-95"
          >
            <X size={22} />
          </button>
        </div>

        {/* TABS */}
        <div className="px-5 py-3 flex gap-2 overflow-x-auto border-b border-white/5 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border
                ${activeCategory === cat.id 
                  ? 'bg-[#21ce99] border-[#21ce99] text-[#0b0e11] shadow-[0_0_15px_rgba(33,206,153,0.3)]' 
                  : 'bg-white/5 border-transparent text-[#8b9bb4] hover:bg-white/10 hover:text-white'
                }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>

        {/* ASSET LIST */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
          {filteredAssets.map(asset => (
            <div 
              key={asset.symbol}
              onClick={() => { onSelect(asset); onClose(); }}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 cursor-pointer group transition-all border border-transparent hover:border-white/5 active:scale-[0.99]"
            >
              <div className="flex items-center gap-4">
                {/* LOGO AREA */}
                <div className="w-10 h-10 rounded-full bg-white/5 p-2 flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all overflow-hidden relative">
                  
                  {/* REAL IMAGE */}
                  <img 
                    src={asset.logo} 
                    alt={asset.name} 
                    className="w-full h-full object-contain rounded-full"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                    }} 
                  />
                  
                  {/* FALLBACK ICON (Hidden unless img fails) */}
                  <div className="fallback-icon hidden absolute inset-0 flex items-center justify-center">
                     {getFallbackIcon(asset.type)}
                  </div>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white group-hover:text-[#21ce99] transition-colors">{asset.displaySymbol}</span>
                  <span className="text-[11px] text-[#5e6673] font-medium">{asset.name}</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-mono font-bold text-white">${asset.price.toLocaleString()}</div>
                <div className={`text-[11px] font-bold flex items-center justify-end gap-1
                  ${asset.change >= 0 ? 'text-[#21ce99]' : 'text-[#f23645]'}`}
                >
                  {asset.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {Math.abs(asset.change)}%
                </div>
              </div>
            </div>
          ))}
          
          {filteredAssets.length === 0 && (
            <div className="text-center py-10 text-[#5e6673] text-sm">
              No assets found for "{search}"
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-3 border-t border-white/5 bg-[#0b0e11]/30 text-[10px] text-center text-[#5e6673]">
          Data provided by <span className="text-[#21ce99]">Binance</span> & <span className="text-[#21ce99]">Twelve Data</span>
        </div>

      </div>
    </div>
  );
}