import { useState } from 'react'
import Header from './components/Header'
import OrderPanel from './components/OrderPanel'
import Sidebar from './components/Sidebar'
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
    // MAIN CONTAINER: Fixed screen size, no scrolling on body
    <div className="h-screen w-screen bg-[#0b0e11] text-white flex flex-col overflow-hidden fixed inset-0">
      
      {/* Top Header */}
      <Header />
      
      {/* Content Layout */}
      <div className="flex-1 flex min-h-0 relative">
        
        {/* Left Sidebar (Desktop only) */}
        <Sidebar />
        
        {/* Chart Area */}
        {/* pb-[80px] on mobile creates space for the bottom buttons */}
        <main className="flex-1 relative bg-[#0b0e11] flex flex-col pb-[80px] md:pb-0">
          <div className="absolute inset-0 opacity-10 pointer-events-none" 
               style={{backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px'}}>
          </div>
          
          <Chart activeOrders={orders} />
        </main>

        {/* Right Panel (Desktop) / Bottom Bar (Mobile) */}
        <OrderPanel onTrade={handleTrade} />

      </div>
    </div>
  )
}