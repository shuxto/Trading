import { useState } from 'react'
import Header from './components/Header'
import OrderPanel from './components/OrderPanel'
import Sidebar from './components/Sidebar'
import Chart from './components/Chart'
import WorldMap from './components/WorldMap'
import AssetSelector from './components/AssetSelector'
import PremiumModal from './components/PremiumModal'
import { useMarketData } from './hooks/useMarketData' 
import { type Order, type ActiveAsset, type ChartStyle } from './types'

export default function App() {
  const [orders, setOrders] = useState<Order[]>([])
  const [activeTool, setActiveTool] = useState<string | null>('crosshair');
  
  // ✅ NEW: Chart Style State (Default: candles)
  const [chartStyle, setChartStyle] = useState<ChartStyle>('candles');
  
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
  
  // Timeframe State
  const [timeframe, setTimeframe] = useState('1m');

  // Fetch Data
  const { candles, currentPrice, lastCandleTime, isLoading } = useMarketData(
    activeAsset.symbol, 
    timeframe, 
    activeAsset.source
  );

  // --- TRADING HANDLERS ---
  
  const handleTrade = (newOrder: Order) => {
    setOrders([newOrder, ...orders])
    console.log("Order Executed:", newOrder);
  }

  const handleCloseOrder = (orderId: number) => {
    setOrders(prevOrders => prevOrders.filter(o => o.id !== orderId));
  }

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
      
      <div className="flex-1 flex min-h-0 relative z-10">
        
        <Sidebar 
           activeTool={activeTool} 
           onToolSelect={setActiveTool} 
           // ✅ Pass Style Props
           chartStyle={chartStyle}
           onChartStyleChange={setChartStyle}
           
           onClear={() => setClearTrigger(Date.now())}
           onRemoveSelected={() => setRemoveSelectedTrigger(Date.now())}
           isLocked={isLocked}
           onToggleLock={() => setIsLocked(!isLocked)}
           isHidden={isHidden}
           onToggleHide={() => setIsHidden(!isHidden)}
        />
        
        <main className="flex-1 relative flex flex-col pb-[80px] md:pb-0">
          <Chart 
             // Data Props
             candles={candles}
             currentPrice={currentPrice}
             lastCandleTime={lastCandleTime}
             isLoading={isLoading}
             
             // ✅ Pass Chart Style
             chartStyle={chartStyle}

             // Timeframe Props
             activeTimeframe={timeframe}
             onTimeframeChange={setTimeframe}

             // Trading Props
             activeOrders={orders} 
             onTrade={handleTrade}
             onCloseOrder={handleCloseOrder}

             // Tool Props
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
    </div>
  )
}