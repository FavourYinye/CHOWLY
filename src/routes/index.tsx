import React, { useState, useEffect } from 'react';

// Predefined Employee Role IDs
const CHEF_OPTIONS = ['CHF01', 'CHF02', 'CHF03', 'CHF04', 'CHF05'];
const BARTENDER_OPTIONS = ['BAR01', 'BAR02', 'BAR03', 'BAR04', 'BAR05'];

// Menu Catalog
const MENU_ITEMS = [
  { id: '1', name: 'Jollof Rice & Grilled Chicken', price: 14.99, category: 'Mains', prepTime: '15 mins', image: '🍗', color: 'bg-amber-100' },
  { id: '2', name: 'Amala & Ewedu', price: 16.50, category: 'Mains', prepTime: '15 mins', image: '🍲', color: 'bg-stone-200' },
  { id: '3', name: 'Suya Platter Extra Spice', price: 12.00, category: 'Appetizers', prepTime: '10 mins', image: '🍢', color: 'bg-red-100' },
  { id: '4', name: 'Chilled Zobo Drink', price: 4.50, category: 'Drinks', prepTime: '3 mins', image: '🍹', color: 'bg-purple-100' },
  { id: '5', name: 'Classic Nigerian Chapman', price: 5.50, category: 'Drinks', prepTime: '5 mins', image: '🍸', color: 'bg-rose-100' },
  { id: '6', name: 'Fresh Palm Wine', price: 6.00, category: 'Drinks', prepTime: '2 mins', image: '🍶', color: 'bg-emerald-100' },
  { id: '7', name: 'Ice-Cold Malt Drink', price: 3.50, category: 'Drinks', prepTime: '2 mins', image: '🥤', color: 'bg-yellow-100' },
  { id: '8', name: 'Bottled Natural Spring Water', price: 2.00, category: 'Drinks', prepTime: '1 min', image: '💧', color: 'bg-sky-100' },
];

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  category: string;
  assignedStaff: string; // Tracks employeeRoleId (CHFxx / BARxx)
}

export interface Order {
  id: string;
  customer: string;
  table: string;
  items: OrderItem[];
  total: string;
  status: string;
  prepTime: string;
  timestamp: string;
  isPaid: boolean;
}

export default function IndexPage() {
  const [activeRole, setActiveRole] = useState<'customer' | 'waiter'>('customer');
  const [cart, setCart] = useState<{ cartId: string; id: string; name: string; price: number; category: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // LocalStorage Persistence
  const [orders, setOrders] = useState<Order[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chowly_orders');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [customerOrderIds, setCustomerOrderIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chowly_customer_order_ids');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('chowly_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('chowly_customer_order_ids', JSON.stringify(customerOrderIds));
  }, [customerOrderIds]);

  // Checkout & Exit Pass States
  const [checkoutOrderId, setCheckoutOrderId] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('card');
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

  const [activeExitPass, setActiveExitPass] = useState<{
    orderIds: string[];
    timestamp: string;
    table: string;
    total: string;
  } | null>(null);
  const [isExitPassMinimized, setIsExitPassMinimized] = useState<boolean>(false);

  const [currentTime, setCurrentTime] = useState<string>('');
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Cart Management Actions
  const addToCart = (item: typeof MENU_ITEMS[0]) => {
    const cartItem = { ...item, cartId: `${item.id}-${Date.now()}` };
    setCart((prev) => [...prev, cartItem]);
  };
  const removeFromCart = (cartId: string) => setCart((prev) => prev.filter((item) => item.cartId !== cartId));
  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0).toFixed(2);
  const estimatedWaitTime = cart.length > 3 ? '~30 Mins' : cart.length > 0 ? '~15 Mins' : '0 Mins';

  // Handlers
  const handlePlaceOrder = () => {
    if (cart.length === 0) return;

    const newOrderId = `ORD-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date();
    const formattedTimestamp = `${now.toLocaleDateString()} at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newOrder: Order = {
      id: newOrderId,
      customer: 'Table 4 (You)',
      table: 'Table 4',
      items: cart.map((item) => ({
        id: item.cartId,
        name: item.name,
        price: item.price,
        category: item.category,
        assignedStaff: 'Unassigned',
      })),
      total: cartTotal,
      status: 'Submitted',
      prepTime: estimatedWaitTime,
      timestamp: formattedTimestamp,
      isPaid: false,
    };

    setOrders((prev) => [newOrder, ...prev]);
    setCustomerOrderIds((prev) => [...prev, newOrderId]);
    setCart([]);
  };

  const handleCustomerCancel = (orderId: string) => {
    setOrders((prev) => prev.filter((ord) => ord.id !== orderId));
    setCustomerOrderIds((prev) => prev.filter((id) => id !== orderId));
  };

  const handleAssignItemStaff = (orderId: string, itemId: string, staffCode: string) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          const updatedItems = ord.items.map((item) =>
            item.id === itemId ? { ...item, assignedStaff: staffCode } : item
          );
          return { ...ord, items: updatedItems };
        }
        return ord;
      })
    );
  };

  // Waiter workflow controls: Restricted to Preparing, Ready, Served only
  const handleUpdateStatus = (orderId: string, newStatus: 'Preparing' | 'Ready' | 'Served') => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        
        // Automatic state transition: If marked Served and already paid, auto-complete
        const updatedStatus = newStatus === 'Served' && ord.isPaid ? 'Completed' : newStatus;

        return { ...ord, status: updatedStatus };
      })
    );
  };

  // Payment triggers completion automatically if order is already served
  const handleProcessPayment = () => {
    if (!checkoutOrderId) return;
    setIsProcessingPayment(true);

    setTimeout(() => {
      const paidOrder = orders.find((o) => o.id === checkoutOrderId);
      if (!paidOrder) return;

      // Automatic completion rule: If already served, pay transitions status to 'Completed'
      const nextStatus = paidOrder.status === 'Served' ? 'Completed' : paidOrder.status;

      setOrders((prev) =>
        prev.map((ord) =>
          ord.id === checkoutOrderId ? { ...ord, isPaid: true, status: nextStatus } : ord
        )
      );

      setActiveExitPass({
        orderIds: [checkoutOrderId],
        timestamp: `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
        table: paidOrder.table || 'Table 4',
        total: paidOrder.total,
      });
      setIsExitPassMinimized(false);
      setIsProcessingPayment(false);
      setCheckoutOrderId(null);
    }, 1500);
  };

  const handleDismissOrder = (orderId: string) => {
    setCustomerOrderIds((prev) => prev.filter((id) => id !== orderId));
  };

  const categories = ['All', 'Mains', 'Appetizers', 'Drinks'];
  const filteredItems = selectedCategory === 'All' ? MENU_ITEMS : MENU_ITEMS.filter((i) => i.category === selectedCategory);
  const activeCustomerOrders = orders.filter((o) => customerOrderIds.includes(o.id));
  const orderBeingPaid = orders.find((o) => o.id === checkoutOrderId);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans pb-16">
      {/* Header */}
      <header className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shadow-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center font-black text-slate-950 text-xl">C</div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">CHOWLY</h1>
        </div>

        <div className="bg-slate-800 p-1 rounded-xl flex gap-1 border border-slate-700">
          <button
            onClick={() => setActiveRole('customer')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeRole === 'customer' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            Customer View
          </button>
          <button
            onClick={() => setActiveRole('waiter')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeRole === 'waiter' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            Waiter Dashboard
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {activeRole === 'customer' ? (
          checkoutOrderId ? (
            /* CHECKOUT & PAYMENT */
            <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 border shadow-lg space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900">Checkout & Payment</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ref: <span className="font-mono font-bold">{checkoutOrderId}</span> • Table 4
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">📅 Date/Time: {orderBeingPaid?.timestamp}</p>
                </div>
                <button
                  onClick={() => setCheckoutOrderId(null)}
                  className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg transition"
                >
                  ← Back to Menu
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border space-y-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Order Items</h3>
                <div className="space-y-1.5 text-sm">
                  {orderBeingPaid?.items.map((it, i) => (
                    <div key={i} className="flex justify-between text-slate-700">
                      <span>{it.name}</span>
                      <span className="font-semibold">${it.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-3 flex justify-between text-lg font-black text-slate-900">
                  <span>Amount Due:</span>
                  <span className="text-emerald-600">${orderBeingPaid?.total}</span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Select Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'card', label: '💳 Credit / Debit Card' },
                    { id: 'ussd', label: '📲 USSD / Bank Transfer' },
                    { id: 'wallet', label: '🍏 Apple / Google Pay' },
                    { id: 'cash', label: '💵 Cash to Waiter' },
                  ].map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedPaymentMethod(method.id)}
                      className={`border-2 rounded-xl p-3 text-left font-bold text-xs transition flex items-center gap-2 ${
                        selectedPaymentMethod === method.id
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleProcessPayment}
                disabled={isProcessingPayment}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black text-base shadow-lg transition flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {isProcessingPayment ? '🌀 Processing Payment...' : `Pay $${orderBeingPaid?.total} & Get Exit Pass`}
              </button>
            </div>
          ) : (
            /* CATALOG & TRACKER */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                        selectedCategory === cat ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-200 border'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredItems.map((item) => (
                    <div key={item.id} className="bg-white rounded-2xl p-5 border shadow-sm flex flex-col justify-between">
                      <div>
                        <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center text-3xl mb-4`}>{item.image}</div>
                        <h3 className="text-lg font-bold text-slate-900 mt-2">{item.name}</h3>
                        <p className="text-xs text-slate-500 mt-1">Est. prep time: {item.prepTime}</p>
                      </div>
                      <div className="flex justify-between items-center mt-6 pt-4 border-t">
                        <span className="text-xl font-black text-slate-900">${item.price.toFixed(2)}</span>
                        <button
                          onClick={() => addToCart(item)}
                          className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2 rounded-xl text-sm font-bold transition shadow-sm"
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cart & Active Orders Sidebar */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 border shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b pb-3">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Cart</h2>
                      <p className="text-[10px] text-slate-400 font-medium">Table 4 • Session Active</p>
                    </div>
                    {cart.length > 0 && <button onClick={clearCart} className="text-xs font-bold text-red-500">Clear All</button>}
                  </div>
                  {cart.length === 0 ? (
                    <div className="text-center py-6 text-slate-400">
                      <p className="text-3xl mb-1">🛒</p>
                      <p className="text-xs">Select items above to start an order.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cart.map((cartItem) => (
                        <div key={cartItem.cartId} className="flex justify-between items-center text-sm border-b pb-2">
                          <div>
                            <p className="font-medium text-slate-800">{cartItem.name}</p>
                            <p className="text-xs font-bold text-slate-500">${cartItem.price.toFixed(2)}</p>
                          </div>
                          <button onClick={() => removeFromCart(cartItem.cartId)} className="text-slate-400 font-bold">✕</button>
                        </div>
                      ))}

                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex justify-between items-center text-xs">
                        <span className="font-medium text-amber-900">⏱️ Est. Wait Time:</span>
                        <span className="font-bold text-amber-900 bg-amber-100 px-2 py-1 rounded-md">{estimatedWaitTime}</span>
                      </div>

                      <div className="pt-2 space-y-3">
                        <div className="flex justify-between font-bold text-slate-900 text-lg">
                          <span>Total:</span>
                          <span className="text-amber-600">${cartTotal}</span>
                        </div>
                        <button onClick={handlePlaceOrder} className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold text-sm transition">
                          Place Order
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Digital Exit Pass */}
                {activeExitPass && !isExitPassMinimized && (
                  <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl p-6 text-white shadow-2xl border-2 border-emerald-500/50 space-y-5">
                    <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">CHOWLY OFFICIAL PASS</span>
                        <h3 className="text-xl font-black text-white">EXIT PASS CLEARED</h3>
                      </div>
                      <span className="bg-emerald-500/20 text-emerald-400 text-xs font-black px-2.5 py-1 rounded-full border border-emerald-500/40">
                        PAID & CLEARED
                      </span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-900 border-4 border-emerald-500">
                      <div className="relative w-36 h-36 bg-slate-950 rounded-xl p-2 flex items-center justify-center">
                        <div className="w-full h-full border-2 border-dashed border-emerald-400/60 rounded flex items-center justify-center text-slate-700 text-[10px] text-center font-mono">
                          [VERIFIED-QR-PASS]
                        </div>
                        <div className="absolute w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white text-2xl font-black shadow-lg">✓</div>
                      </div>
                      <p className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">Scan at Door / Show Waiter</p>
                    </div>

                    <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-300">
                        <span>Order IDs:</span>
                        <span className="font-mono font-bold text-emerald-400">{activeExitPass.orderIds.join(', ')}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Table:</span>
                        <span className="font-bold text-white">{activeExitPass.table}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Total Paid:</span>
                        <span className="font-bold text-emerald-400">${activeExitPass.total}</span>
                      </div>
                    </div>

                    <div className="bg-emerald-950/60 border border-emerald-500/30 rounded-xl p-2.5 flex items-center justify-between text-[11px] text-emerald-300">
                      <span className="font-bold">Live System Time:</span>
                      <span className="font-mono font-black text-white">{currentTime}</span>
                    </div>

                    <button
                      onClick={() => setIsExitPassMinimized(true)}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-xs font-bold transition"
                    >
                      Minimize Exit Pass
                    </button>
                  </div>
                )}

                {activeExitPass && isExitPassMinimized && (
                  <div className="bg-emerald-900 border-2 border-emerald-400 text-white rounded-2xl p-4 shadow-xl flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-black uppercase text-emerald-300">Exit Pass Active</h4>
                      <p className="text-xs font-bold text-white">{activeExitPass.orderIds.join(', ')} • Table 4</p>
                    </div>
                    <button
                      onClick={() => setIsExitPassMinimized(false)}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-2 rounded-xl text-xs font-black transition"
                    >
                      Show Pass
                    </button>
                  </div>
                )}

                {/* Customer Active Trackers */}
                {activeCustomerOrders.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 px-1">
                      Active Orders ({activeCustomerOrders.length})
                    </h3>

                    {activeCustomerOrders.map((ord) => (
                      <div key={ord.id} className="bg-white rounded-2xl p-6 border shadow-sm space-y-4">
                        <div className="border-b pb-3 flex justify-between items-start">
                          <div>
                            <h2 className="text-lg font-bold text-slate-900">Order Tracker</h2>
                            <p className="text-[11px] text-slate-400 font-medium">📅 {ord.timestamp}</p>
                          </div>
                          <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-1 rounded text-slate-600">{ord.id}</span>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-xl border space-y-1.5 text-xs">
                          {ord.items.map((it, i) => (
                            <div key={i} className="flex justify-between text-slate-700">
                              <span>{it.name}</span>
                              <span className="font-semibold">${it.price.toFixed(2)}</span>
                            </div>
                          ))}
                          <div className="border-t pt-1.5 mt-1.5 flex justify-between font-bold text-slate-900">
                            <span>Total:</span>
                            <span>${ord.total}</span>
                          </div>
                        </div>

                        <div className={`p-4 rounded-xl border text-center space-y-2 ${
                          ord.status === 'Completed' ? 'bg-emerald-50 border-emerald-300' :
                          ord.isPaid ? 'bg-emerald-50 border-emerald-200' :
                          ord.status === 'Submitted' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'
                        }`}>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</span>
                          <p className="text-xl font-black text-slate-900">
                            {ord.status === 'Served' && !ord.isPaid ? 'Served (Pending Payment)' : ord.status}
                          </p>
                          <span className="text-xs font-bold text-amber-800 bg-amber-100/80 px-3 py-1 rounded-full inline-block border border-amber-200">
                            ⏱️ Est. Wait: {ord.prepTime}
                          </span>
                        </div>

                        {!ord.isPaid && ord.status !== 'Completed' && (
                          <button
                            onClick={() => setCheckoutOrderId(ord.id)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-extrabold text-xs transition shadow-md"
                          >
                            💳 Pay Bill Now (${ord.total})
                          </button>
                        )}

                        {ord.status === 'Submitted' && !ord.isPaid && (
                          <button
                            onClick={() => handleCustomerCancel(ord.id)}
                            className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-2 rounded-xl font-bold text-xs transition"
                          >
                            Cancel Order
                          </button>
                        )}

                        {ord.status === 'Completed' && (
                          <button
                            onClick={() => handleDismissOrder(ord.id)}
                            className="w-full bg-slate-100 text-slate-700 py-2 rounded-xl font-bold text-xs hover:bg-slate-200 transition"
                          >
                            Dismiss Tracker
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        ) : (
          /* WAITER DASHBOARD */
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Waiter Dashboard</h2>
                <p className="text-sm text-slate-500 mt-1">Assign staff employee roles and manage order progress.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {orders.length === 0 && <p className="text-slate-500">No active orders found.</p>}

              {orders.map((ord) => {
                const allItemsAssigned = ord.items.every((it) => it.assignedStaff !== 'Unassigned');
                const isServedUnpaid = ord.status === 'Served' && !ord.isPaid;
                const isCompleted = ord.status === 'Completed';

                return (
                  <div key={ord.id} className="bg-white rounded-2xl p-6 border shadow-sm space-y-4 relative">
                    {isServedUnpaid && (
                      <div className="bg-amber-500 text-slate-950 px-3 py-1 rounded-full text-xs font-black shadow-md flex items-center gap-1.5 animate-pulse w-fit">
                        <span>💳 PENDING PAYMENT</span>
                      </div>
                    )}

                    <div className="flex justify-between border-b pb-3">
                      <div>
                        <span className="text-xs font-bold text-slate-400">{ord.id}</span>
                        <h3 className="text-lg font-bold text-slate-900">{ord.customer}</h3>
                        <p className="text-[11px] text-slate-400 font-medium">📅 Ordered: {ord.timestamp}</p>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-md h-fit ${
                        isCompleted ? 'bg-emerald-100 text-emerald-800' :
                        ord.isPaid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isCompleted ? 'Completed' : ord.isPaid ? 'Paid' : 'Unpaid'}
                      </span>
                    </div>

                    {/* Staff Assignment per Item */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Staff Role IDs</h4>
                      <div className="space-y-2">
                        {ord.items.map((item) => {
                          const options = item.category === 'Drinks' ? BARTENDER_OPTIONS : CHEF_OPTIONS;

                          return (
                            <div key={item.id} className="flex justify-between items-center text-xs bg-slate-50 p-2.5 rounded-xl border">
                              <span className="font-semibold text-slate-800">{item.name}</span>
                              <select
                                value={item.assignedStaff}
                                onChange={(e) => handleAssignItemStaff(ord.id, item.id, e.target.value)}
                                disabled={isCompleted}
                                className="bg-white border rounded-lg px-2 py-1 font-mono font-bold text-slate-700 focus:ring-2 focus:ring-amber-500"
                              >
                                <option value="Unassigned">Assign Role</option>
                                {options.map((role) => (
                                  <option key={role} value={role}>{role}</option>
                                ))}
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Order Workflow Controls */}
                    <div className="border-t pt-4 space-y-3">
                      <div className="flex justify-between items-center text-sm font-bold">
                        <span className="text-slate-600">Current Status:</span>
                        <span className="text-slate-900">{ord.status}</span>
                      </div>

                      {/* Manual 'Completed' action removed. Waiters can only cycle through Preparing, Ready, and Served. */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleUpdateStatus(ord.id, 'Preparing')}
                          disabled={!allItemsAssigned || isCompleted}
                          className="bg-slate-800 hover:bg-slate-900 text-white py-2 rounded-xl text-xs font-bold disabled:opacity-40 transition"
                        >
                          Mark Preparing
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(ord.id, 'Ready')}
                          disabled={ord.status !== 'Preparing' || isCompleted}
                          className="bg-slate-800 hover:bg-slate-900 text-white py-2 rounded-xl text-xs font-bold disabled:opacity-40 transition"
                        >
                          Mark Ready
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(ord.id, 'Served')}
                          disabled={ord.status !== 'Ready' || isCompleted}
                          className="col-span-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-bold disabled:opacity-40 transition"
                        >
                          Mark Served
                        </button>
                      </div>

                      {isCompleted && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-center text-xs font-bold text-emerald-800">
                          ✓ Order Paid & Completed
                        </div>
                      )}

                      {!allItemsAssigned && !isCompleted && (
                        <p className="text-[11px] text-amber-600 font-medium text-center">
                          ⚠️ Assign employee roles to all items to begin preparation.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}