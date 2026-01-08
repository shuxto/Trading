import { useState } from 'react'
import Header from './components/Header'
import OrderPanel from './components/OrderPanel'
import Sidebar from './components/Sidebar'
import Chart from './components/Chart'
import WorldMap from './components/WorldMap'

export default function App() {
  const [orders, setOrders] = useState<any[]>([])
  const [activeTool, setActiveTool] = useState<string | null>('crosshair');
  
  // 1. SIGNAL: Delete ALL
  const [clearTrigger, setClearTrigger] = useState<number>(0);
  // 2. SIGNAL: Delete ONLY SELECTED (New)
  const [removeSelectedTrigger, setRemoveSelectedTrigger] = useState<number>(0);

  const handleTrade = (type: 'buy' | 'sell', amount: number) => {
    const newOrder = {
      id: Date.now(),
      type,
      entryPrice: 0, 
      amount,
      status: 'active'
    }
    setOrders([newOrder, ...orders])
    console.log("TRADE EXECUTED:", newOrder)
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-b from-[#191f2e] to-[#2e3851] text-white flex flex-col overflow-hidden fixed inset-0 font-sans selection:bg-[#F07000] selection:text-white">
      
      <WorldMap />
      <Header />
      
      <div className="flex-1 flex min-h-0 relative z-10">
        
        <Sidebar 
           activeTool={activeTool} 
           onToolSelect={setActiveTool} 
           onClear={() => setClearTrigger(Date.now())}
           // NEW: Pass the "Remove Selected" signal
           onRemoveSelected={() => setRemoveSelectedTrigger(Date.now())} 
        />
        
        <main className="flex-1 relative flex flex-col pb-[80px] md:pb-0">
          <Chart 
             activeOrders={orders} 
             activeTool={activeTool}
             onToolComplete={() => setActiveTool('crosshair')}
             clearTrigger={clearTrigger}
             // NEW: Pass it down to the chart
             removeSelectedTrigger={removeSelectedTrigger}
          />
        </main>

        <OrderPanel onTrade={handleTrade} />

      </div>
    </div>
  )
}