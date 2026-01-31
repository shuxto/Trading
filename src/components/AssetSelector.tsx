import { useState, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown, X, Bitcoin, DollarSign, BarChart3, Droplets, Globe, Loader2 } from 'lucide-react';
import { ASSETS } from '../constants/assets'; 
import { supabase } from '../lib/supabase';
import type { Asset } from '../types';

// ✅ CACHE SETTINGS: 1 Minute (60,000ms)
const CACHE_KEY = 'asset_prices_cache';
const CACHE_DURATION = 60 * 1000; 

interface AssetSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (asset: Asset) => void;
}

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'crypto', label: 'Crypto', icon: <Bitcoin size={14} /> },
  { id: 'stock', label: 'Stocks', icon: <BarChart3 size={14} /> },
  { id: 'forex', label: 'Forex', icon: <DollarSign size={14} /> },
  { id: 'commodity', label: 'Commodities', icon: <Droplets size={14} /> },
  { id: 'index', label: 'Indices', icon: <Globe size={14} /> },
];

const AssetRow = ({ asset, onSelect }: { asset: Asset; onSelect: (a: Asset) => void }) => {
  const [imgError, setImgError] = useState(false);

  const getFallbackIcon = (type: string) => {
    if (type === 'crypto') return <Bitcoin size={18} className="text-orange-500" />;
    if (type === 'stock') return <BarChart3 size={18} className="text-blue-500" />;
    if (type === 'forex') return <DollarSign size={18} className="text-green-500" />;
    return <Globe size={18} className="text-yellow-500" />;
  };

  return (
    <div 
      onClick={() => onSelect(asset)}
      className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 cursor-pointer group transition-all border border-transparent hover:border-white/5 active:scale-[0.99]"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-white/5 p-2 flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all overflow-hidden relative">
          {!imgError ? (
            <img 
              src={asset.logo} 
              alt={asset.name} 
              className="w-full h-full object-contain rounded-full"
              onError={() => setImgError(true)} 
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
                {getFallbackIcon(asset.type)}
            </div>
          )}
        </div>
        
        <div className="flex flex-col">
          <span className="text-sm font-bold text-white group-hover:text-[#21ce99] transition-colors">{asset.displaySymbol}</span>
          <span className="text-[11px] text-[#5e6673] font-medium">{asset.name}</span>
        </div>
      </div>

      <div className="text-right">
        {asset.price > 0 ? (
            <>
                <div className="text-sm font-mono font-bold text-white">${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</div>
                {asset.change !== 0 && (
                    <div className={`text-[11px] font-bold flex items-center justify-end gap-1 ${asset.change >= 0 ? 'text-[#21ce99]' : 'text-[#f23645]'}`}>
                    {asset.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {Math.abs(asset.change).toFixed(2)}%
                    </div>
                )}
            </>
        ) : (
            <div className="flex items-center gap-1 text-[#5e6673]">
                <Loader2 size={12} className="animate-spin" />
                <span className="text-[10px]">Loading...</span>
            </div>
        )}
      </div>
    </div>
  );
};

export default function AssetSelector({ isOpen, onClose, onSelect }: AssetSelectorProps) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [liveAssets, setLiveAssets] = useState<Asset[]>(ASSETS); 

  // ⚡ FAST LOAD: Cache-First Strategy
  useEffect(() => {
    if (!isOpen) return;

    const fetchMarketData = async () => {
      let shouldFetch = true;

      // 1. INSTANT LOAD (Show cache immediately)
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        try {
          const { timestamp, data } = JSON.parse(cachedData);
          setLiveAssets(data); // <--- Show old prices instantly

          const age = Date.now() - timestamp;
          // If cache is fresh (< 1 min), we don't even need to fetch
          if (age < CACHE_DURATION) {
            console.log(`[AssetSelector] Cache is fresh (${Math.round(age/1000)}s). Skipping network.`);
            shouldFetch = false;
          }
        } catch (e) {
          localStorage.removeItem(CACHE_KEY);
        }
      }

      // If cache is fresh, stop here.
      if (!shouldFetch) return;

      // 2. SILENT BACKGROUND FETCH
      try {
        const symbols = ASSETS.map(a => a.symbol).join(',');
        
        const { data, error } = await supabase.functions.invoke('market-proxy', {
            body: {
                endpoint: 'quote', 
                params: { symbol: symbols, dp: 4 }
            }
        });

        if (error) throw error;

        // 3. UPDATE UI WHEN READY
        if (data && !data.code) {
          const updatedAssets = ASSETS.map(asset => {
            const update = data[asset.symbol] || (data.symbol === asset.symbol ? data : null);
            if (update) {
              return { 
                  ...asset, 
                  price: parseFloat(update.close) || 0,
                  change: parseFloat(update.percent_change) || 0
              };
            }
            return asset;
          });

          setLiveAssets(updatedAssets);
          
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            timestamp: Date.now(),
            data: updatedAssets
          }));
        }
      } catch (e) {
        console.error("Market Data Fetch Error:", e);
      }
    };

    fetchMarketData();

    // 4. Real-time updates (Optional)
    const channel = supabase.channel('market_prices');
    channel.on('broadcast', { event: 'price_update' }, (payload) => {
        const update = payload.payload;
        setLiveAssets(prev => prev.map(asset => {
            if (asset.symbol === update.symbol) {
                return { ...asset, price: parseFloat(update.price) };
            }
            return asset;
        }));
    }).subscribe();

    return () => {
        supabase.removeChannel(channel);
    };

  }, [isOpen]);

  if (!isOpen) return null;

  const filteredAssets = liveAssets.filter(asset => {
    const matchesCategory = activeCategory === 'all' || asset.type === activeCategory;
    const matchesSearch = asset.name.toLowerCase().includes(search.toLowerCase()) || 
                          asset.symbol.toLowerCase().includes(search.toLowerCase()) ||
                          asset.displaySymbol.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
             <AssetRow 
               key={asset.symbol} 
               asset={asset} 
               onSelect={(a) => { onSelect(a); onClose(); }} 
             />
          ))}
          
          {filteredAssets.length === 0 && (
            <div className="text-center py-10 text-[#5e6673] text-sm">
              No assets found for "{search}"
            </div>
          )}
        </div>

        <div className="p-3 border-t border-white/5 bg-[#0b0e11]/30 text-[10px] text-center text-[#5e6673]">
          Data provided by <span className="text-[#21ce99]">Twelve Data Pro</span> (Cached 1m)
        </div>

      </div>
    </div>
  );
}