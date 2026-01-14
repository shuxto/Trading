import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'

// COMPONENTS
import LoginPage from './components/LoginPage'
import AdminPanel from './components/AdminPanel'

// TRADING COMPONENTS
import Header from './components/Header'
import OrderPanel from './components/OrderPanel'
import Sidebar from './components/Sidebar'
import Chart from './components/Chart'
import WorldMap from './components/WorldMap'
import AssetSelector from './components/AssetSelector'
import PremiumModal from './components/PremiumModal'
import PositionsPanel from './components/PositionsPanel' 
import UserDashboard from './components/UserDashboard' 
import ClientProfilePage from './components/ClientProfilePage'
import { useMarketData } from './hooks/useMarketData' 
import { type Order, type ActiveAsset, type ChartStyle } from './types'

export default function App() {
  // --- AUTH STATE ---
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<'user' | 'admin' | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // --- TRADING STATE ---
  const [orders, setOrders] = useState<Order[]>([])
  const [activeTool, setActiveTool] = useState<string | null>('crosshair');
  const [chartStyle, setChartStyle] = useState<ChartStyle>('candles');
  const [lastTradeTime, setLastTradeTime] = useState<number>(0);
  const [clearTrigger, setClearTrigger] = useState<number>(0);
  const [removeSelectedTrigger, setRemoveSelectedTrigger] = useState<number>(0);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isHidden, setIsHidden] = useState<boolean>(false);
  const [isAssetSelectorOpen, setIsAssetSelectorOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'trading' | 'profile'>('trading');
  const [userBalance, setUserBalance] = useState(10000.00); 
  
  const [activeAsset, setActiveAsset] = useState<ActiveAsset>({ 
    symbol: 'BTCUSDT', displaySymbol: 'BTC/USD', name: 'Bitcoin', source: 'binance' 
  });
  const [timeframe, setTimeframe] = useState('1m');

  const { candles, currentPrice, lastCandleTime, isLoading } = useMarketData(
    activeAsset.symbol, timeframe, activeAsset.source
  );

  // --- 1. AUTH INITIALIZATION ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) checkRole(session.user.id);
      else setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) checkRole(session.user.id);
      else {
        setRole(null);
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkRole = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('role, balance').eq('id', userId).single();
    if (data) {
      setRole(data.role as 'user' | 'admin');
      setUserBalance(data.balance);
    }
    setAuthLoading(false);
  };

  // --- 2. FETCH ORDERS (Only if logged in) ---
  useEffect(() => {
    if (session) fetchOrders();
  }, [session]);

  const fetchOrders = async () => {
    const { data } = await supabase.from('trades').select('*').eq('status', 'open').order('created_at', { ascending: false });
    if (data) {
      setOrders(data.map(o => ({
        id: o.id, symbol: o.symbol, type: o.type, entryPrice: o.entry_price, size: o.size, leverage: o.leverage, margin: o.size / o.leverage, liquidationPrice: 0, status: o.status
      })));
    }
  };

  const handleTrade = async (newOrder: Order) => {
    setOrders([newOrder, ...orders]);
    setLastTradeTime(Date.now());
    await supabase.from('trades').insert([{
        user_id: session.user.id, symbol: newOrder.symbol, type: newOrder.type, entry_price: newOrder.entryPrice, size: newOrder.size, leverage: newOrder.leverage, status: 'open'
    }]);
    fetchOrders(); 
  };

  const handleCloseOrder = async (orderId: number) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
    setLastTradeTime(Date.now());
    await supabase.from('trades').delete().eq('id', orderId);
  };

  // --- 3. RENDER LOGIC ---

  if (authLoading) return <div className="h-screen bg-[#0b0e11] flex items-center justify-center text-[#21ce99] font-bold">Loading Platform...</div>;

  // A. IF NO SESSION -> LOGIN PAGE
  if (!session) {
    return <LoginPage />;
  }

  // B. IF ADMIN -> ADMIN PANEL
  if (role === 'admin') {
    return <AdminPanel onLogout={() => supabase.auth.signOut()} />;
  }

  // C. IF USER -> TRADING PLATFORM (Your existing app)
  return (
    <div className="h-screen w-screen bg-gradient-to-b from-[#191f2e] to-[#2e3851] text-white flex flex-col overflow-hidden fixed inset-0 font-sans selection:bg-[#F07000] selection:text-white">
      
      {/* Global Modals */}
      <AssetSelector isOpen={isAssetSelectorOpen} onClose={() => setIsAssetSelectorOpen(false)} onSelect={setActiveAsset} />
      <PremiumModal isOpen={isPremiumModalOpen} onClose={() => setIsPremiumModalOpen(false)} />
      <UserDashboard isOpen={isDashboardOpen} onClose={() => setIsDashboardOpen(false)} />

      {currentView === 'profile' ? (
        <ClientProfilePage onBack={() => setCurrentView('trading')} email={session.user.email} />
      ) : (
        <>
          <WorldMap />
          <Header 
            activeAsset={activeAsset} 
            balance={userBalance} 
            onOpenAssetSelector={() => setIsAssetSelectorOpen(true)} 
            onOpenDashboardPopup={() => setIsDashboardOpen(true)} 
            onOpenProfilePage={() => setCurrentView('profile')}
          />
          <div className="flex-1 flex min-h-0 relative z-10 pb-[40px]">
            <Sidebar 
               activeTool={activeTool} onToolSelect={setActiveTool} 
               chartStyle={chartStyle} onChartStyleChange={setChartStyle}
               onClear={() => setClearTrigger(Date.now())}
               onRemoveSelected={() => setRemoveSelectedTrigger(Date.now())}
               isLocked={isLocked} onToggleLock={() => setIsLocked(!isLocked)}
               isHidden={isHidden} onToggleHide={() => setIsHidden(!isHidden)}
            />
            <main className="flex-1 relative flex flex-col">
              <Chart 
                 candles={candles} currentPrice={currentPrice} lastCandleTime={lastCandleTime} isLoading={isLoading}
                 chartStyle={chartStyle} activeTimeframe={timeframe} onTimeframeChange={setTimeframe}
                 activeOrders={orders} onTrade={handleTrade} onCloseOrder={handleCloseOrder}
                 activeTool={activeTool} onToolComplete={() => setActiveTool('crosshair')}
                 clearTrigger={clearTrigger} removeSelectedTrigger={removeSelectedTrigger}
                 isLocked={isLocked} isHidden={isHidden}
                 symbol={activeAsset.symbol} displaySymbol={activeAsset.displaySymbol} 
                 onTriggerPremium={() => setIsPremiumModalOpen(true)}
              />
            </main>
            <OrderPanel currentPrice={currentPrice} activeSymbol={activeAsset.symbol} onTrade={handleTrade} />
          </div>
          <PositionsPanel orders={orders} currentPrice={currentPrice} onCloseOrder={handleCloseOrder} lastOrderTime={lastTradeTime} />
        </>
      )}
    </div>
  )
}