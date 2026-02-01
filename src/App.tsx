import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { io } from "socket.io-client"; // 👈 NEW IMPORT

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

// ⚠️ GLOBAL SOCKET URL
const RAILWAY_URL = "https://trading-production-169d.up.railway.app"; 

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
  const [tier, setTier] = useState<string>('Basic');
  const [authLoading, setAuthLoading] = useState(true);

  // VIEW STATE
  const [currentView, setCurrentView] = useState<'portal' | 'trading'>('portal');
  const [activeAccount, setActiveAccount] = useState<TradingAccount | null>(null);
  const [userAccounts, setUserAccounts] = useState<TradingAccount[]>([]);

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
  const [activeAsset, setActiveAsset] = useState<ActiveAsset>(() => {
    const saved = localStorage.getItem('lastActiveAsset');
    return saved ? JSON.parse(saved) : DEFAULT_ASSET;
  });

  useEffect(() => {
    localStorage.setItem('lastActiveAsset', JSON.stringify(activeAsset));
  }, [activeAsset]);

  const [timeframe, setTimeframe] = useState('1m');

  // Chart Data Hook (Still needed for the Chart itself)
  const { candles, currentPrice, lastCandleTime, isLoading } = useMarketData(activeAsset, timeframe);

  // ------------------------------------------------------------
  // ✅ FIX START: GLOBAL MARKET PRICES (THE BRAIN)
  // ------------------------------------------------------------
  
  // 1. Store prices for ALL symbols here
  const [marketPrices, setMarketPrices] = useState<Record<string, number>>({});

  // 2. Listen to Railway for ALL price updates
  useEffect(() => {
    const socket = io(RAILWAY_URL);

    socket.on('price_update', (update: any) => {
        if (update && update.symbol && update.price) {
            setMarketPrices(prev => ({
                ...prev,
                [update.symbol]: parseFloat(update.price)
            }));
        }
    });

    return () => {
        socket.disconnect();
    };
  }, []); // Run once on mount

  // ------------------------------------------------------------
  // ✅ FIX END
  // ------------------------------------------------------------

  // --- 1. AUTH & INITIALIZATION ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkUser(session.user.id);
        checkUrlParams(session.user.id);
        fetchUserAccounts(session.user.id); 
      } else {
        setAuthLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkUser(session.user.id);
        fetchUserAccounts(session.user.id); 
      } else {
        setRole(null);
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserAccounts = async (userId: string) => {
    const { data } = await supabase
      .from('trading_accounts')
      .select('*')
      .eq('user_id', userId);
    if (data) setUserAccounts(data);
  };

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
          setAccountBalance(data.balance || 0); 
          setCurrentView('trading');
       }
    }
  };

  const checkUser = async (userId: string) => {
    // 🟢 UPDATED: Fetch 'tier' along with 'role'
    const { data } = await supabase.from('profiles').select('role, tier').eq('id', userId).single();
    if (data) {
      setRole(data.role as 'user' | 'admin');
      setTier(data.tier || 'Basic'); // 🟢 Save the tier
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
        stopLoss: o.stop_loss,
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

    // 1. OPTIMISTIC UPDATE
    const tempId = Date.now();
    const optimisticOrder: Order = {
      ...newOrder,
      id: tempId,
      status: 'pending' 
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

        // 2. SUCCESS
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
        setOrders(prev => prev.filter(o => o.id !== tempId));
        console.error("Trade failed:", err);
        alert(`Order Failed: ${err.message || 'Unknown error'}`);
    }
  };

  const handleCloseOrder = async (orderId: number) => {
    // OPTIMISTIC CLOSE
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

        await fetchData(); 
        await refreshAccountBalance(); 
        
    } catch (err: any) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'active' } : o));
        console.error("Close failed:", err);
        alert(`Close Failed: ${err.message || 'Unknown error'}`);
    }
  };

  // --- 4. REALTIME TRADES SYNC (FIXED: NO DOUBLE BUYS) PIG  ---
  useEffect(() => {
    if (!activeAccount) return;

    // Listen for ANY change in the 'trades' table for this account
    const channel = supabase
      .channel('realtime-trades')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'trades',
          filter: `account_id=eq.${activeAccount.id}`, // Only for the current account
        },
        (payload) => {
          // 1. HANDLE NEW TRADE (INSERT)
          if (payload.eventType === 'INSERT') {
            const newTrade = payload.new as any;
            
            setOrders((prev) => {
              // A. Strict Duplicate Check: If we already have this exact ID, stop.
              if (prev.some((o) => o.id === newTrade.id)) return prev;

              // B. "Ghost" Check (The Fix for Double Buys):
              // Look for a 'pending' trade that looks exactly like this new real one
              const pendingMatchIndex = prev.findIndex(o => 
                  o.status === 'pending' &&
                  o.symbol === newTrade.symbol &&
                  o.type === newTrade.type &&
                  // Check if size is roughly the same (handles floating point tiny diffs)
                  Math.abs(o.size - newTrade.size) < 0.01 
              );

              // Convert DB format to App format
              const formattedOrder: Order = {
                id: newTrade.id,
                account_id: newTrade.account_id,
                symbol: newTrade.symbol,
                type: newTrade.type,
                entryPrice: newTrade.entry_price,
                size: newTrade.size,
                leverage: newTrade.leverage,
                margin: newTrade.size / newTrade.leverage,
                status: newTrade.status,
                takeProfit: newTrade.take_profit,
                stopLoss: newTrade.stop_loss,
                liquidationPrice: newTrade.liquidation_price || 0,
              };

              // SCENARIO 1: We found a matching "Pending" trade. REPLACE IT.
              if (pendingMatchIndex !== -1) {
                  const newOrders = [...prev];
                  newOrders[pendingMatchIndex] = formattedOrder;
                  return newOrders;
              }

              // SCENARIO 2: No match found. It's a new trade. ADD IT.
              if (newTrade.status === 'open') {
                return [formattedOrder, ...prev];
              }
              return prev;
            });
          }

          // 2. HANDLE UPDATES (Close, SL/TP Change)
          if (payload.eventType === 'UPDATE') {
            const updatedTrade = payload.new as any;

            if (updatedTrade.status === 'closed') {
               // Move from Orders to History
               setOrders((prev) => prev.filter((o) => o.id !== updatedTrade.id));
               
               // Add to History (Top of list)
               const historyItem: Order = {
                 id: updatedTrade.id,
                 account_id: updatedTrade.account_id,
                 symbol: updatedTrade.symbol,
                 type: updatedTrade.type,
                 entryPrice: updatedTrade.entry_price,
                 exitPrice: updatedTrade.exit_price,
                 size: updatedTrade.size,
                 leverage: updatedTrade.leverage,
                 margin: updatedTrade.size / updatedTrade.leverage,
                 status: 'closed',
                 pnl: updatedTrade.pnl,
                 closedAt: updatedTrade.closed_at,
                 liquidationPrice: 0
               };
               setHistory((prev) => [historyItem, ...prev]);
               refreshAccountBalance(); // Update balance immediately
            } else {
               // Just an update (like editing SL/TP)
               setOrders((prev) => 
                 prev.map((o) => o.id === updatedTrade.id 
                   ? { 
                       ...o, 
                       takeProfit: updatedTrade.take_profit, 
                       stopLoss: updatedTrade.stop_loss,
                       liquidationPrice: updatedTrade.liquidation_price 
                     } 
                   : o
                 )
               );
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeAccount]);

  // ✅ 4. AUTO-CLOSE ENGINE (FIXED & SAFER)
  // Now uses 'marketPrices' instead of 'currentPrice'
  /*const closingRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (orders.length === 0) return;

    orders.forEach(order => {
        if (order.status !== 'active') return;
        if (closingRef.current.has(order.id)) return; 

        // 🟢 THE FIX: Lookup the price for THIS SPECIFIC ORDER'S SYMBOL
        const livePrice = marketPrices[order.symbol]; 
        
        // If we don't have a price for this coin yet, skip it safely
        if (!livePrice) return; 

        let shouldClose = false;
        let reason = '';

        if (order.leverage > 1) { 
            if (order.type === 'buy' && livePrice <= order.liquidationPrice) { shouldClose = true; reason = 'LIQUIDATION'; }
            if (order.type === 'sell' && livePrice >= order.liquidationPrice) { shouldClose = true; reason = 'LIQUIDATION'; }
        }

        if (order.takeProfit) {
            if (order.type === 'buy' && livePrice >= order.takeProfit) { shouldClose = true; reason = 'TAKE PROFIT'; }
            if (order.type === 'sell' && livePrice <= order.takeProfit) { shouldClose = true; reason = 'TAKE PROFIT'; }
        }

        if (order.stopLoss) {
            if (order.type === 'buy' && livePrice <= order.stopLoss) { shouldClose = true; reason = 'STOP LOSS'; }
            if (order.type === 'sell' && livePrice >= order.stopLoss) { shouldClose = true; reason = 'STOP LOSS'; }
        }

      if (shouldClose) {
        console.log(`Closing trade #${order.id} (${order.symbol}) Reason: ${reason} Price: ${livePrice}`); 

        closingRef.current.add(order.id); 
        handleCloseOrder(order.id).finally(() => {
            closingRef.current.delete(order.id);
        });
      }
    });
  }, [marketPrices, orders]); // 👈 Depends on marketPrices now*/


  // --- 5. RENDER ---

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
        userAccounts={userAccounts} 
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
             activeTimeframe={timeframe} onTimeframeChange={setTimeframe}
             chartStyle={chartStyle}
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
          userTier={tier} // 🟢 Pass the tier here!
        />
      </div>
      
      <PositionsPanel 
        orders={orders} 
        history={history} 
        currentPrice={currentPrice} 
        marketPrices={marketPrices} // 👈 PASSING THE GLOBAL PRICES HERE
        onCloseOrder={handleCloseOrder} 
        lastOrderTime={lastOrderTime} 
      />
    </div>
  )
}