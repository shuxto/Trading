// src/App.tsx
import { useState } from 'react'
import Header from './components/Header'
import OrderPanel from './components/OrderPanel'
import Sidebar from './components/Sidebar'
import Chart from './components/Chart'
import WorldMap from './components/WorldMap'
import AssetSelector from './components/AssetSelector'
import PremiumModal from './components/PremiumModal'
import { useMarketData } from './hooks/useMarketData' // ✅ Data Hook is now here
import { type Order, type ActiveAsset } from './types'

export default function App() {
  const [orders, setOrders] = useState<Order[]>([])
  const [activeTool, setActiveTool] = useState<string | null>('crosshair');
  
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
  
  // Timeframe State (Lifted so we can pass it to useMarketData)
  const [timeframe, setTimeframe] = useState('1m');

  // ✅ FETCH DATA HERE (Single Source of Truth)
  const { candles, currentPrice, lastCandleTime, isLoading } = useMarketData(
    activeAsset.symbol, 
    timeframe, 
    activeAsset.source
  );

  const handleTrade = (newOrder: Order) => {
    // We just prepend the new order to the list
    setOrders([newOrder, ...orders])
    console.log("Order Executed:", newOrder);
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
           onClear={() => setClearTrigger(Date.now())}
           onRemoveSelected={() => setRemoveSelectedTrigger(Date.now())}
           isLocked={isLocked}
           onToggleLock={() => setIsLocked(!isLocked)}
           isHidden={isHidden}
           onToggleHide={() => setIsHidden(!isHidden)}
        />
        
        <main className="flex-1 relative flex flex-col pb-[80px] md:pb-0">
          <Chart 
             // Data Props (Passed Down)
             candles={candles}
             currentPrice={currentPrice}
             lastCandleTime={lastCandleTime}
             isLoading={isLoading}
             
             // Timeframe Props
             activeTimeframe={timeframe}
             onTimeframeChange={setTimeframe}

             // Tool Props
             activeOrders={orders} 
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

        {/* ✅ PASS REAL PRICE TO PANEL */}
        <OrderPanel 
          currentPrice={currentPrice} 
          activeSymbol={activeAsset.symbol}
          onTrade={handleTrade} 
        />

      </div>
    </div>
  )
}