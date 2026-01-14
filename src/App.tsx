import { useState, useEffect } from 'react'
import Header from './components/Header'
import OrderPanel from './components/OrderPanel'
import Sidebar from './components/Sidebar'
import Chart from './components/Chart'
import WorldMap from './components/WorldMap'
import AssetSelector from './components/AssetSelector'
import PremiumModal from './components/PremiumModal'
import PositionsPanel from './components/PositionsPanel' 
import { useMarketData } from './hooks/useMarketData' 
import { type Order, type ActiveAsset, type ChartStyle } from './types'
import { supabase } from './lib/supabase' 

export default function App() {
  const [orders, setOrders] = useState<Order[]>([])
  const [activeTool, setActiveTool] = useState<string | null>('crosshair');
  const [chartStyle, setChartStyle] = useState<ChartStyle>('candles');
  
  // ✅ NEW: Signals the footer to auto-open
  const [lastTradeTime, setLastTradeTime] = useState<number>(0);

  // Triggers
  const [clearTrigger, setClearTrigger] = useState<number>(0);
  const [removeSelectedTrigger, setRemoveSelectedTrigger] = useState<number>(0);
  
  // Layout State
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isHidden, setIsHidden] = useState<boolean>(false);
  const [isAssetSelectorOpen, setIsAssetSelectorOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  
  // Asset State
  const [activeAsset, setActiveAsset] = useState<ActiveAsset>({ 
    symbol: 'BTCUSDT', 
    displaySymbol: 'BTC/USD', 
    name: 'Bitcoin', 
    source: 'binance' 
  });
  
  const [timeframe, setTimeframe] = useState('1m');

  const { candles, currentPrice, lastCandleTime, isLoading } = useMarketData(
    activeAsset.symbol, 
    timeframe, 
    activeAsset.source
  );

  // --- SUPABASE LOGIC ---
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (data) {
      setOrders(data.map(o => ({
        id: o.id,
        symbol: o.symbol,
        type: o.type,
        entryPrice: o.entry_price,
        size: o.size,
        leverage: o.leverage,
        margin: o.margin,
        liquidationPrice: o.liquidation_price,
        takeProfit: o.take_profit,
        stopLoss: o.stop_loss,
        status: o.status
      })));
    }
  };

  const handleTrade = async (newOrder: Order) => {
    setOrders([newOrder, ...orders]);
    setLastTradeTime(Date.now()); // ✅ Trigger auto-open
    
    await supabase.from('orders').insert([{
      symbol: newOrder.symbol,
      type: newOrder.type,
      entry_price: newOrder.entryPrice,
      size: newOrder.size,
      leverage: newOrder.leverage,
      margin: newOrder.margin,
      liquidation_price: newOrder.liquidationPrice,
      take_profit: newOrder.takeProfit || null,
      stop_loss: newOrder.stopLoss || null,
      status: 'active'
    }]);
    
    fetchOrders(); 
  };

  const handleCloseOrder = async (orderId: number) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
    setLastTradeTime(Date.now()); // ✅ Trigger auto-open on close too (optional)
    await supabase.from('orders').delete().eq('id', orderId);
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-b from-[#191f2e] to-[#2e3851] text-white flex flex-col overflow-hidden fixed inset-0 font-sans selection:bg-[#F07000] selection:text-white">
      
      <WorldMap />
      
      <Header 
        activeAsset={activeAsset} 
        onOpenAssetSelector={() => setIsAssetSelectorOpen(true)} 
      />
      
      <AssetSelector 
        isOpen={isAssetSelectorOpen} 
        onClose={() => setIsAssetSelectorOpen(false)}
        onSelect={setActiveAsset} 
      />

      <PremiumModal 
        isOpen={isPremiumModalOpen} 
        onClose={() => setIsPremiumModalOpen(false)} 
      />
      
      {/* Add padding-bottom so the footer doesn't cover the chart controls */}
      <div className="flex-1 flex min-h-0 relative z-10 pb-[40px]">
        
        <Sidebar 
           activeTool={activeTool} 
           onToolSelect={setActiveTool} 
           chartStyle={chartStyle}
           onChartStyleChange={setChartStyle}
           onClear={() => setClearTrigger(Date.now())}
           onRemoveSelected={() => setRemoveSelectedTrigger(Date.now())}
           isLocked={isLocked}
           onToggleLock={() => setIsLocked(!isLocked)}
           isHidden={isHidden}
           onToggleHide={() => setIsHidden(!isHidden)}
        />
        
        <main className="flex-1 relative flex flex-col">
          <Chart 
             candles={candles}
             currentPrice={currentPrice}
             lastCandleTime={lastCandleTime}
             isLoading={isLoading}
             chartStyle={chartStyle}
             activeTimeframe={timeframe}
             onTimeframeChange={setTimeframe}
             activeOrders={orders} 
             onTrade={handleTrade}
             onCloseOrder={handleCloseOrder}
             activeTool={activeTool}
             onToolComplete={() => setActiveTool('crosshair')}
             clearTrigger={clearTrigger}
             removeSelectedTrigger={removeSelectedTrigger}
             isLocked={isLocked}
             isHidden={isHidden}
             symbol={activeAsset.symbol}
             displaySymbol={activeAsset.displaySymbol} 
             onTriggerPremium={() => setIsPremiumModalOpen(true)}
          />
        </main>

        <OrderPanel 
          currentPrice={currentPrice} 
          activeSymbol={activeAsset.symbol}
          onTrade={handleTrade} 
        />

      </div>

      {/* ✅ Footer Panel */}
      <PositionsPanel 
        orders={orders} 
        currentPrice={currentPrice}
        onCloseOrder={handleCloseOrder}
        lastOrderTime={lastTradeTime} // Pass the trigger
      />
    </div>
  )
}