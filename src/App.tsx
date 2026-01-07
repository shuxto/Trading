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
    // GRADIENT: Dark (#151820) at Top -> Blue (#2c3141) at Bottom
    <div className="h-screen w-screen bg-gradient-to-b from-[#151820] to-[#2c3141] text-white flex flex-col overflow-hidden fixed inset-0 font-sans selection:bg-[#21ce99] selection:text-black">
      
      {/* Map sits quietly on top of the gradient */}
      <WorldMap />
      
      {/* --- MAIN INTERFACE --- */}
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