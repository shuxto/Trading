import { useState } from 'react'
import Header from './components/Header'
import OrderPanel from './components/OrderPanel'
import Sidebar from './components/Sidebar'
import DrawingToolbar from './components/DrawingToolbar'
import Chart from './components/Chart'

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
    // BASE COLOR: Deep Navy (The IQ Option feel)
    <div className="h-screen w-screen bg-[#10141d] text-white flex flex-col overflow-hidden fixed inset-0 font-sans selection:bg-[#21ce99] selection:text-black">
      
      {/* --- PRO BACKGROUND TEXTURES (Visible now!) --- */}
      
      {/* 1. TACTICAL GRID (The Blueprint Look) */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.15]" 
        style={{ 
          backgroundImage: `
            linear-gradient(to right, #8b9bb4 1px, transparent 1px), 
            linear-gradient(to bottom, #8b9bb4 1px, transparent 1px)
          `, 
          backgroundSize: '60px 60px' 
        }}
      ></div>

      {/* 2. DOT MATRIX (The High-Tech Noise) */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.2]" 
        style={{ 
          backgroundImage: 'radial-gradient(#5e6673 1px, transparent 1px)', 
          backgroundSize: '15px 15px' 
        }}
      ></div>

      {/* 3. VIGNETTE (Focus on the Center) */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{ 
          background: 'radial-gradient(circle at 50% 50%, rgba(20, 30, 48, 0) 0%, rgba(11, 14, 17, 0.8) 100%)' 
        }}
      ></div>

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