import { useState } from 'react'
import Header from './components/Header'
import OrderPanel from './components/OrderPanel'
import Sidebar from './components/Sidebar'
import Chart from './components/Chart'
import WorldMap from './components/WorldMap'
import AssetSelector from './components/AssetSelector'
import PremiumModal from './components/PremiumModal' // ✅ ADDED IMPORT

interface ActiveAssetState {
  symbol: string;
  displaySymbol: string;
  name: string;
  source: 'binance' | 'twelve';
}

export default function App() {
  const [orders, setOrders] = useState<any[]>([])
  const [activeTool, setActiveTool] = useState<string | null>('crosshair');
  
  const [clearTrigger, setClearTrigger] = useState<number>(0);
  const [removeSelectedTrigger, setRemoveSelectedTrigger] = useState<number>(0);
  
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isHidden, setIsHidden] = useState<boolean>(false);

  const [isAssetSelectorOpen, setIsAssetSelectorOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false); // ✅ ADDED STATE
  
  const [activeAsset, setActiveAsset] = useState<ActiveAssetState>({ 
    symbol: 'BTCUSDT', 
    displaySymbol: 'BTC/USD', 
    name: 'Bitcoin', 
    source: 'binance' 
  });

  const handleTrade = (type: 'buy' | 'sell', amount: number) => {
    const newOrder = {
      id: Date.now(),
      type,
      entryPrice: 0, 
      amount,
      status: 'active'
    }
    setOrders([newOrder, ...orders])
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

      {/* ✅ ADDED MODAL */}
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
             activeOrders={orders} 
             activeTool={activeTool}
             onToolComplete={() => setActiveTool('crosshair')}
             clearTrigger={clearTrigger}
             removeSelectedTrigger={removeSelectedTrigger}
             isLocked={isLocked}
             isHidden={isHidden}
             symbol={activeAsset.symbol}
             displaySymbol={activeAsset.displaySymbol} 
             source={activeAsset.source}
             
             // ✅ PASS TRIGGER FUNCTION
             onTriggerPremium={() => setIsPremiumModalOpen(true)}
          />
        </main>

        <OrderPanel onTrade={handleTrade} />

      </div>
    </div>
  )
}