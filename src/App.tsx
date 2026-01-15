import { useState, useEffect, useRef } from 'react'
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
  const [history, setHistory] = useState<Order[]>([]) // ✅ ADDED: History State
  const [activeTool, setActiveTool] = useState<string | null>('crosshair');
  const [chartStyle, setChartStyle] = useState<ChartStyle>('candles');
  const [clearTrigger, setClearTrigger] = useState<number>(0);
  const [removeSelectedTrigger, setRemoveSelectedTrigger] = useState<number>(0);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isHidden, setIsHidden] = useState<boolean>(false);
  const [isAssetSelectorOpen, setIsAssetSelectorOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  
  // Track Last Order Time to trigger Panel Auto-Open
  const [lastOrderTime, setLastOrderTime] = useState<number>(0);

  const [userBalance, setUserBalance] = useState(0); 
  
  const [activeAsset, setActiveAsset] = useState<ActiveAsset>({ 
    symbol: 'BTCUSDT', displaySymbol: 'BTC/USD', name: 'Bitcoin', source: 'binance' 
  });
  const [timeframe, setTimeframe] = useState('1m');

  const { candles, currentPrice, lastCandleTime, isLoading } = useMarketData(
    activeAsset.symbol, timeframe, activeAsset.source
  );

  // --- 1. AUTH & URL INITIALIZATION ---
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

  // --- 2. FETCH ORDERS & HISTORY ---
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
        stopLoss: o.stop_loss,
        liquidationPrice: o.liquidation_price || 0 
      })));
    }

    // B. ✅ FETCH HISTORY (CLOSED TRADES)
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
        exitPrice: o.exit_price, // Needed for history
        size: o.size, 
        leverage: o.leverage, 
        margin: o.size / o.leverage, 
        status: o.status,
        pnl: o.pnl, // Needed for history
        closedAt: o.closed_at, // Needed for history
        liquidationPrice: 0 
      })));
    }
  };

  // =========================================================
  //  🔥 AUTO-CLOSE ENGINE (TP / SL / LIQUIDATION)
  // =========================================================
  
  const processingOrderIds = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!currentPrice || orders.length === 0) return;

    orders.forEach(order => {
        if (processingOrderIds.current.has(order.id)) return;

        let shouldClose = false;
        let reason = '';

        // 1. Check Take Profit (TP)
        if (order.takeProfit) {
            if (order.type === 'buy' && currentPrice >= order.takeProfit) {
                shouldClose = true; reason = 'Take Profit';
            } else if (order.type === 'sell' && currentPrice <= order.takeProfit) {
                shouldClose = true; reason = 'Take Profit';
            }
        }

        // 2. Check Stop Loss (SL)
        if (!shouldClose && order.stopLoss) {
            if (order.type === 'buy' && currentPrice <= order.stopLoss) {
                shouldClose = true; reason = 'Stop Loss';
            } else if (order.type === 'sell' && currentPrice >= order.stopLoss) {
                shouldClose = true; reason = 'Stop Loss';
            }
        }

        // 3. Check Liquidation (Force Close)
        if (!shouldClose && order.liquidationPrice > 0) {
             if (order.type === 'buy' && currentPrice <= order.liquidationPrice) {
                 shouldClose = true; reason = 'Liquidation';
             } else if (order.type === 'sell' && currentPrice >= order.liquidationPrice) {
                 shouldClose = true; reason = 'Liquidation';
             }
        }

        if (shouldClose) {
            console.log(`⚡ Auto-closing order #${order.id} due to ${reason}`);
            processingOrderIds.current.add(order.id);
            handleCloseOrder(order.id);
        }
    });
  }, [currentPrice, orders]);


  // =========================================================
  //  PRO TRADING LOGIC
  // =========================================================

  const handleTrade = async (newOrder: Order) => {
    if (!activeAccount || !session?.user) return;

    if (userBalance < newOrder.margin) {
        alert("Insufficient Balance! Please deposit funds.");
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
        alert("Trade failed. Rolling back.");
        setUserBalance(userBalance); 
        fetchData();
    }
  };

  const handleCloseOrder = async (orderId: number) => {
    if (!currentPrice || !session?.user) return;

    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const quantity = order.size / order.entryPrice;
    
    let pnl = 0;
    if (order.type === 'buy') {
        pnl = (currentPrice - order.entryPrice) * quantity;
    } else {
        pnl = (order.entryPrice - currentPrice) * quantity;
    }

    const margin = order.margin; 
    const settlementAmount = margin + pnl;
    const finalNewBalance = userBalance + settlementAmount;

    // 1. OPTIMISTIC UPDATE
    setOrders(prev => prev.filter(o => o.id !== orderId)); 
    setUserBalance(finalNewBalance); 
    setLastOrderTime(Date.now());

    // ✅ Add to History Optimistically
    const closedOrder = { ...order, status: 'closed', exitPrice: currentPrice, pnl, closedAt: new Date().toISOString() };
    setHistory(prev => [closedOrder as Order, ...prev]);

    if (processingOrderIds.current.has(orderId)) {
        setTimeout(() => processingOrderIds.current.delete(orderId), 1000);
    }

    try {
        const { error: tradeError } = await supabase
            .from('trades')
            .update({ 
                status: 'closed',
                exit_price: currentPrice,
                pnl: pnl,
                closed_at: new Date().toISOString()
            })
            .eq('id', orderId);

        if (tradeError) throw tradeError;

        const { error: balanceError } = await supabase
            .from('profiles')
            .update({ balance: finalNewBalance })
            .eq('id', session.user.id);

        if (balanceError) throw balanceError;

    } catch (err) {
        console.error("Close failed:", err);
        fetchData(); 
        checkRole(session.user.id); 
    }
  };

  // --- 3. RENDER LOGIC ---

  if (authLoading) return <div className="h-screen bg-[#0b0e11] flex items-center justify-center text-[#21ce99] font-bold">Loading...</div>;
  if (!session) return <LoginPage />;
  if (role === 'admin') return <AdminPanel onLogout={() => supabase.auth.signOut()} />;

  if (currentView === 'portal') {
    return (
      <ClientDashboard 
        userEmail={session.user.email}
        balance={userBalance} 
        onLogout={() => supabase.auth.signOut()}
      />
    );
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
        />
      </div>
      
      {/* ✅ PASSED HISTORY PROP */}
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