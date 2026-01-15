import { useState, useEffect } from 'react' // ✅ Removed useRef here
import { supabase } from './lib/supabase'

// COMPONENTS
import LoginPage from './components/LoginPage'
import AdminPanel from './components/AdminPanel'
import ClientDashboard from './components/dashboard/ClientDashboard'

// TRADING COMPONENTS
import Header from './components/Header'
import OrderPanel from './components/OrderPanel'
import Sidebar from './components/Sidebar'
import Chart from './components/Chart'
import WorldMap from './components/WorldMap'
import AssetSelector from './components/AssetSelector'
import PremiumModal from './components/PremiumModal'
import PositionsPanel from './components/PositionsPanel' 
import { useMarketData } from './hooks/useMarketData' 
import { type Order, type ActiveAsset, type ChartStyle, type TradingAccount } from './types'

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<'user' | 'admin' | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // VIEW STATE
  const [currentView, setCurrentView] = useState<'portal' | 'trading'>('portal');
  const [activeAccount, setActiveAccount] = useState<TradingAccount | null>(null);

  // TRADING STATE
  const [orders, setOrders] = useState<Order[]>([])
  const [history, setHistory] = useState<Order[]>([])
  const [activeTool, setActiveTool] = useState<string | null>('crosshair');
  const [chartStyle, setChartStyle] = useState<ChartStyle>('candles');
  const [clearTrigger, setClearTrigger] = useState<number>(0);
  const [removeSelectedTrigger, setRemoveSelectedTrigger] = useState<number>(0);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isHidden, setIsHidden] = useState<boolean>(false);
  const [isAssetSelectorOpen, setIsAssetSelectorOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  
  const [lastOrderTime, setLastOrderTime] = useState<number>(0);
  const [userBalance, setUserBalance] = useState(0); 
  
  const [activeAsset, setActiveAsset] = useState<ActiveAsset>({ 
    symbol: 'BTCUSDT', displaySymbol: 'BTC/USD', name: 'Bitcoin', source: 'binance' 
  });
  const [timeframe, setTimeframe] = useState('1m');

  const { candles, currentPrice, lastCandleTime, isLoading } = useMarketData(
    activeAsset.symbol, timeframe, activeAsset.source
  );

  // --- 1. AUTH & INITIALIZATION ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkRole(session.user.id);
        checkUrlParams(session.user.id); 
      } else {
        setAuthLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkRole(session.user.id);
      } else {
        setRole(null);
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUrlParams = async (userId: string) => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const accountId = params.get('account_id');

    if (mode === 'trading' && accountId) {
       const { data } = await supabase
          .from('trading_accounts')
          .select('*')
          .eq('id', accountId)
          .eq('user_id', userId)
          .single();
       
       if (data) {
          setActiveAccount(data);
          setCurrentView('trading');
       }
    }
  };

  const checkRole = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('role, balance').eq('id', userId).single();
    if (data) {
      setRole(data.role as 'user' | 'admin');
      setUserBalance(data.balance);
    }
    setAuthLoading(false);
  };

  // --- 2. FETCH DATA ---
  useEffect(() => {
    if (session && activeAccount) {
        fetchData();
    }
  }, [session, activeAccount]);

  const fetchData = async () => {
    if (!activeAccount) return;

    // A. FETCH ACTIVE ORDERS
    const { data: activeData } = await supabase
        .from('trades')
        .select('*')
        .eq('status', 'open')
        .eq('account_id', activeAccount.id) 
        .order('created_at', { ascending: false });

    if (activeData) {
      setOrders(activeData.map(o => ({
        id: o.id, 
        account_id: o.account_id, 
        symbol: o.symbol, 
        type: o.type, 
        entryPrice: o.entry_price, 
        size: o.size, 
        leverage: o.leverage, 
        margin: o.size / o.leverage, 
        status: o.status,
        takeProfit: o.take_profit,
        stop_loss: o.stop_loss,
        liquidationPrice: o.liquidation_price || 0 
      })));
    }

    // B. FETCH HISTORY
    const { data: historyData } = await supabase
        .from('trades')
        .select('*')
        .eq('status', 'closed')
        .eq('account_id', activeAccount.id) 
        .order('closed_at', { ascending: false })
        .limit(50); 

    if (historyData) {
      setHistory(historyData.map(o => ({
        id: o.id, 
        account_id: o.account_id, 
        symbol: o.symbol, 
        type: o.type, 
        entryPrice: o.entry_price, 
        exitPrice: o.exit_price,
        size: o.size, 
        leverage: o.leverage, 
        margin: o.size / o.leverage, 
        status: o.status,
        pnl: o.pnl,
        closedAt: o.closed_at,
        liquidationPrice: 0 
      })));
    }
  };

  // --- 3. TRADING ACTIONS ---

  const handleTrade = async (newOrder: Order) => {
    if (!activeAccount || !session?.user) return;

    if (userBalance < newOrder.margin) {
        alert("Insufficient Balance!");
        return;
    }

    const newBalance = userBalance - newOrder.margin;
    setUserBalance(newBalance); 
    setOrders([newOrder, ...orders]); 
    setLastOrderTime(Date.now()); 

    try {
        const { error: balanceError } = await supabase
            .from('profiles')
            .update({ balance: newBalance })
            .eq('id', session.user.id);

        if (balanceError) throw balanceError;

        const { error: tradeError } = await supabase
            .from('trades')
            .insert([{
                user_id: session.user.id, 
                account_id: activeAccount.id, 
                symbol: newOrder.symbol, 
                type: newOrder.type, 
                entry_price: newOrder.entryPrice, 
                size: newOrder.size, 
                leverage: newOrder.leverage, 
                status: 'open',
                margin: newOrder.margin,
                take_profit: newOrder.takeProfit,
                stop_loss: newOrder.stopLoss,
                liquidation_price: newOrder.liquidationPrice 
            }]);

        if (tradeError) throw tradeError;
        fetchData(); 

    } catch (err) {
        console.error("Trade failed:", err);
        fetchData();
    }
  };

  const handleCloseOrder = async (orderId: number) => {
    if (!currentPrice || !session?.user) return;

    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    // --- OPTIMISTIC UI UPDATE ---
    const quantity = order.size / order.entryPrice;
    const estPnl = order.type === 'buy' ? (currentPrice - order.entryPrice) * quantity : (order.entryPrice - currentPrice) * quantity;
    const estReturn = order.margin + estPnl;

    setOrders(prev => prev.filter(o => o.id !== orderId)); 
    setUserBalance(prev => prev + estReturn); 
    setLastOrderTime(Date.now());

    try {
        // CALLING THE SECURE RPC FUNCTION
        const { error } = await supabase.rpc('close_trade_position', { 
           p_trade_id: orderId, 
           p_exit_price: currentPrice 
        });

        if (error) throw error;
        fetchData(); 
        checkRole(session.user.id); 

    } catch (err) {
        console.error("Close failed:", err);
        fetchData(); 
        checkRole(session.user.id); 
    }
  };

  // --- 4. RENDER ---

  if (authLoading) return <div className="h-screen bg-[#0b0e11] flex items-center justify-center text-[#21ce99] font-bold">Loading...</div>;
  if (!session) return <LoginPage />;
  if (role === 'admin') return <AdminPanel onLogout={() => supabase.auth.signOut()} />;

  if (currentView === 'portal') {
    return <ClientDashboard userEmail={session.user.email} balance={userBalance} onLogout={() => supabase.auth.signOut()} />;
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-b from-[#191f2e] to-[#2e3851] text-white flex flex-col overflow-hidden fixed inset-0 font-sans selection:bg-[#F07000] selection:text-white">
      <AssetSelector isOpen={isAssetSelectorOpen} onClose={() => setIsAssetSelectorOpen(false)} onSelect={setActiveAsset} />
      <PremiumModal isOpen={isPremiumModalOpen} onClose={() => setIsPremiumModalOpen(false)} />
      <WorldMap />
      
      <Header 
        activeAsset={activeAsset} 
        balance={userBalance} 
        activeAccountName={activeAccount?.name}
        onOpenAssetSelector={() => setIsAssetSelectorOpen(true)} 
        onOpenDashboardPopup={() => {
            window.history.pushState({}, '', window.location.origin);
            setCurrentView('portal');
            setActiveAccount(null);
        }} 
        onOpenProfilePage={() => {
            window.history.pushState({}, '', window.location.origin);
            setCurrentView('portal');
            setActiveAccount(null);
        }}
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
             activeAccountId={activeAccount?.id || 0}
          />
        </main>
<OrderPanel 
  currentPrice={currentPrice} 
  activeSymbol={activeAsset.symbol} 
  onTrade={handleTrade} 
  activeAccountId={activeAccount?.id || 0} 
  balance={userBalance} // ✅ Add this line to pass the real balance
/>
      </div>
      
      <PositionsPanel 
        orders={orders} 
        history={history} 
        currentPrice={currentPrice} 
        onCloseOrder={handleCloseOrder} 
        lastOrderTime={lastOrderTime} 
      />
    </div>
  )
}