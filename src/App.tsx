import { useState } from 'react'
import Header from './components/Header'
import OrderPanel from './components/OrderPanel'
import Sidebar from './components/Sidebar'
import DrawingToolbar from './components/DrawingToolbar'
import Chart from './components/Chart'
import WorldMap from './components/WorldMap'

export default function App() {
  const [orders, setOrders] = useState<any[]>([])
  const [activeTool, setActiveTool] = useState<string | null>('crosshair');

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
    // IQ OPTION "AUTHENTIC" GRADIENT
    // Top: #191f2e (Deep Midnight) -> Bottom: #2e3851 (Slate Blue)
    <div className="h-screen w-screen bg-gradient-to-b from-[#191f2e] to-[#2e3851] text-white flex flex-col overflow-hidden fixed inset-0 font-sans selection:bg-[#F07000] selection:text-white">
      
      {/* 1. MAP LAYER */}
      <WorldMap />

      {/* 3. MAIN INTERFACE */}
      <Header />
      
      <div className="flex-1 flex min-h-0 relative z-10">
        
        <Sidebar />

        <DrawingToolbar 
          activeTool={activeTool} 
          onToolChange={setActiveTool} 
        />
        
        <main className="flex-1 relative flex flex-col pb-[80px] md:pb-0">
          <Chart 
             activeOrders={orders} 
             activeTool={activeTool}
             onToolComplete={() => setActiveTool('crosshair')}
          />
        </main>

        <OrderPanel onTrade={handleTrade} />

      </div>
    </div>
  )
}