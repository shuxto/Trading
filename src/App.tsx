import { useState, useEffect } from 'react'
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

// ✅ DEFAULT ASSET FALLBACK (Now with type!)
const DEFAULT_ASSET: ActiveAsset & { type: string } = { 
  symbol: 'BTC/USD', 
  displaySymbol: 'BTC/USD', 
  name: 'Bitcoin', 
  source: 'twelve',
  type: 'crypto'
};

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
  const [accountBalance, setAccountBalance] = useState(0); 
  
  // ✅ PERSISTENT ASSET STATE
  // 1. Initialize from LocalStorage
  const [activeAsset, setActiveAsset] = useState<ActiveAsset>(() => {
    const saved = localStorage.getItem('lastActiveAsset');
    return saved ? JSON.parse(saved) : DEFAULT_ASSET;
  });

  // 2. Save to LocalStorage whenever activeAsset changes
  useEffect(() => {
    localStorage.setItem('lastActiveAsset', JSON.stringify(activeAsset));
  }, [activeAsset]);

  const [timeframe, setTimeframe] = useState('1m');

  // ✅ FIXED: No more syntax error here
  const { candles, currentPrice, lastCandleTime, isLoading } = useMarketData(activeAsset, timeframe);

  // --- 1. AUTH & INITIALIZATION ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkUser(session.user.id);
        checkUrlParams(session.user.id); 
      } else {
        setAuthLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkUser(session.user.id);
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
       // Fetch Account Details INCLUDING Balance
       const { data } = await supabase
          .from('trading_accounts')
          .select('*')
          .eq('id', accountId)
          .eq('user_id', userId)
          .single();
       
       if (data) {
          setActiveAccount(data);
          setAccountBalance(data.balance || 0); 
          setCurrentView('trading');
       }
    }
  };

  const checkUser = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
    if (data) {
      setRole(data.role as 'user' | 'admin');
    }
    setAuthLoading(false);
  };

  // --- 2. FETCH DATA ---
  useEffect(() => {
    if (session && activeAccount) {
        fetchData();
        refreshAccountBalance(); 
    }
  }, [session, activeAccount]);

  const refreshAccountBalance = async () => {
    if (!activeAccount) return;
    const { data } = await supabase
        .from('trading_accounts')
        .select('balance')
        .eq('id', activeAccount.id)
        .single();
    if (data) setAccountBalance(data.balance);
  };

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

    if (accountBalance < newOrder.margin) {
        alert("Insufficient Room Balance");
        return;
    }

    // 1. OPTIMISTIC UPDATE: Add to UI immediately so it feels instant
    const tempId = Date.now();
    const optimisticOrder: Order = {
      ...newOrder,
      id: tempId,
      status: 'pending' // Mark as pending for visual feedback
    };
    
    setOrders(prev => [optimisticOrder, ...prev]);
    setLastOrderTime(Date.now());

    try {
        const { data, error } = await supabase.functions.invoke('trade-engine', {
            body: {
                action: 'open',
                payload: {
                    symbol: newOrder.symbol,
                    type: newOrder.type,
                    size: newOrder.size,
                    leverage: newOrder.leverage,
                    account_id: activeAccount.id,
                    stop_loss: newOrder.stopLoss,
                    take_profit: newOrder.takeProfit
                }
            }
        });

        if (error) throw error;
        if (data.error) throw new Error(data.error);

        // 2. SUCCESS: Replace the temporary "fake" order with the real one from the database
        await refreshAccountBalance();
        const confirmedOrder: Order = {
            id: data.trade.id, 
            account_id: data.trade.account_id, 
            symbol: data.trade.symbol, 
            type: data.trade.type, 
            entryPrice: data.trade.entry_price, 
            size: data.trade.size, 
            leverage: data.trade.leverage, 
            margin: data.trade.margin, 
            status: 'active',
            takeProfit: data.trade.take_profit,
            stopLoss: data.trade.stop_loss, 
            liquidationPrice: data.trade.liquidation_price || 0 
        };

        setOrders(prev => prev.map(o => o.id === tempId ? confirmedOrder : o));

    } catch (err: any) {
        // 3. FAIL: Remove the optimistic order if the server rejected the trade
        setOrders(prev => prev.filter(o => o.id !== tempId));
        console.error("Trade failed:", err);
        alert(`Order Failed: ${err.message || 'Unknown error'}`);
    }
  };

  const handleCloseOrder = async (orderId: number) => {

    // OPTIMISTIC CLOSE: Show as pending immediately so the user knows it's closing
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'pending' } : o));

    try {
        const { data, error } = await supabase.functions.invoke('trade-engine', {
            body: {
                action: 'close',
                payload: { trade_id: orderId }
            }
        });

        if (error) throw error;
        if (data.error) throw new Error(data.error);

        // Success: Finalize the UI state
        await fetchData(); 
        await refreshAccountBalance(); 
        
    } catch (err: any) {
        // Revert to 'active' if the close failed on the server
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'active' } : o));
        console.error("Close failed:", err);
        alert(`Close Failed: ${err.message || 'Unknown error'}`);
    }
  };

  // --- 4. RENDER ---

  if (authLoading) return <div className="h-screen bg-[#0b0e11] flex items-center justify-center text-[#21ce99] font-bold">Loading...</div>;
  if (!session) return <LoginPage />;
  if (role === 'admin') return <AdminPanel onLogout={() => supabase.auth.signOut()} />;

  if (currentView === 'portal') {
    return <ClientDashboard userEmail={session.user.email} onLogout={() => supabase.auth.signOut()} />;
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-b from-[#191f2e] to-[#2e3851] text-white flex flex-col overflow-hidden fixed inset-0 font-sans selection:bg-[#F07000] selection:text-white">
      <AssetSelector isOpen={isAssetSelectorOpen} onClose={() => setIsAssetSelectorOpen(false)} onSelect={setActiveAsset} />
      <PremiumModal isOpen={isPremiumModalOpen} onClose={() => setIsPremiumModalOpen(false)} />
      <WorldMap />
      
      <Header 
        activeAsset={activeAsset} 
        balance={accountBalance} 
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
          balance={accountBalance} 
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