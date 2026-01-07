import { useState } from 'react'
import Header from './components/Header'
import OrderPanel from './components/OrderPanel'
import Sidebar from './components/Sidebar'
import DrawingToolbar from './components/DrawingToolbar' // <--- IMPORT IT
import Chart from './components/Chart'

export default function App() {
  const [orders, setOrders] = useState<any[]>([])

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
    <div className="h-screen w-screen bg-[#10141d] text-white flex flex-col overflow-hidden fixed inset-0 font-sans selection:bg-[#21ce99] selection:text-black">
      
      {/* BACKGROUND EFFECTS */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.06]" style={{ backgroundImage: `linear-gradient(to right, #8b9bb4 1px, transparent 1px), linear-gradient(to bottom, #8b9bb4 1px, transparent 1px)`, backgroundSize: '60px 60px' }}></div>
      <div className="absolute inset-0 pointer-events-none opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(#5e6673 1px, transparent 1px)', backgroundSize: '15px 15px' }}></div>
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(20, 30, 48, 0) 0%, rgba(11, 14, 17, 0.9) 100%)' }}></div>

      <Header />
      
      <div className="flex-1 flex min-h-0 relative z-10">
        
        {/* 1. MAIN NAVIGATION (Far Left) */}
        <Sidebar />

        {/* 2. DRAWING TOOLS (Next to it) - NEW! */}
        <DrawingToolbar />
        
        {/* 3. CHART AREA */}
        <main className="flex-1 relative flex flex-col pb-[80px] md:pb-0">
          <Chart activeOrders={orders} />
        </main>

        {/* 4. ORDER PANEL (Far Right) */}
        <OrderPanel onTrade={handleTrade} />

      </div>
    </div>
  )
}