import React, { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: IndexPage,
});

// Staff Role Options
const CHEF_OPTIONS = ['CHF01', 'CHF02', 'CHF03', 'CHF04', 'CHF05'];
const BARTENDER_OPTIONS = ['BAR01', 'BAR02', 'BAR03', 'BAR04', 'BAR05'];

// Menu Data
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

function IndexPage() {
  const [activeRole, setActiveRole] = useState<'customer' | 'waiter'>('customer');
  const [orders, setOrders] = useState<any[]>([]);
  const [cart, setCart] = useState<{ cartId: string; id: string; name: string; price: number; category: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Track multiple active customer order IDs for Table 4
  const [customerOrderIds, setCustomerOrderIds] = useState<string[]>([]);

  // Checkout & Payment State
  const [checkoutOrderId, setCheckoutOrderId] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [activeExitPass, setActiveExitPass] = useState<{
    orderIds: string[];
    timestamp: string;
    table: string;
    total: string;
  } | null>(null);

  // Live Timer for Animated Verification Element
  const [currentTime, setCurrentTime] = useState<string>('');
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Cart Management
  const addToCart = (item: typeof MENU_ITEMS[0]) => {
    const cartItem = { ...item, cartId: `${item.id}-${Date.now()}` };
    setCart((prev) => [...prev, cartItem]);
  };
  const removeFromCart = (cartId: string) => setCart((prev) => prev.filter((item) => item.cartId !== cartId));
  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0).toFixed(2);
  const estimatedWaitTime = cart.length > 3 ? '~30 Mins' : cart.length > 0 ? '~15 Mins' : '0 Mins';

  // --- ORDER LIFECYCLE HANDLERS --- //

  // 1. Customer Places Order -> Status: Submitted
  const handlePlaceOrder = () => {
    if (cart.length === 0) return;

    const newOrderId = `ORD-${Math.floor(100 + Math.random() * 900)}`;
    const newOrder = {
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
    };

    setOrders((prev) => [newOrder, ...prev]);
    setCustomerOrderIds((prev) => [...prev, newOrderId]);
    setCart([]);
  };

  // 2. Customer Cancels Order (Only permitted while status is 'Submitted')
  const handleCustomerCancel = (orderId: string) => {
    setOrders((prev) => prev.filter((ord) => ord.id !== orderId));
    setCustomerOrderIds((prev) => prev.filter((id) => id !== orderId));
  };

  // 3. Waiter Assigns Staff to a Specific Item in an Order
  const handleAssignItemStaff = (orderId: string, itemId: string, staffCode: string) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          const updatedItems = ord.items.map((item: any) =>
            item.id === itemId ? { ...item, assignedStaff: staffCode } : item
          );
          return { ...ord, items: updatedItems };
        }
        return ord;
      })
    );
  };

  // 4. Waiter Updates Overall Order Status
  const handleUpdateStatus = (orderId: string, newStatus: string) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status: newStatus } : ord))
    );
  };

  // 5. Payment Flow: Processing Checkout & Generating Exit Pass
  const handleProcessPayment = () => {
    if (!checkoutOrderId) return;
    setIsProcessingPayment(true);

    setTimeout(() => {
      const paidOrder = orders.find((o) => o.id === checkoutOrderId);
      
      // Update order status to Completed
      setOrders((prev) =>
        prev.map((ord) => (ord.id === checkoutOrderId ? { ...ord, status: 'Completed' } : ord))
      );

      // Generate Exit Pass
      setActiveExitPass({
        orderIds: [checkoutOrderId],
        timestamp: `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
        table: paidOrder?.table || 'Table 4',
        total: paidOrder?.total || '0.00',
      });

      setIsProcessingPayment(false);
      setCheckoutOrderId(null);
    }, 1500);
  };

  // Dismiss completed order card from customer view
  const handleDismissOrder = (orderId: string) => {
    setCustomerOrderIds((prev) => prev.filter((id) => id !== orderId));
  };

  const categories = ['All', 'Mains', 'Appetizers', 'Drinks'];
  const filteredItems = selectedCategory === 'All' ? MENU_ITEMS : MENU_ITEMS.filter((i) => i.category === selectedCategory);
  
  // Active customer orders filter
  const activeCustomerOrders = orders.filter((o) => customerOrderIds.includes(o.id));
  const orderBeingPaid = orders.find((o) => o.id === checkoutOrderId);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Navigation Header */}
      <header className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center font-black text-slate-950 text-xl">C</div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">CHOWLY</h1>
        </div>

        {/* View Switcher Toggle */}
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
          /* CUSTOMER INTERFACE */
          checkoutOrderId ? (
            /* PAYMENT / CHECKOUT TAB */
            <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 border shadow-lg space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900">Checkout & Payment</h2>
                  <p className="text-xs text-slate-500">Order Ref: {checkoutOrderId} • Table 4</p>
                </div>
                <button
                  onClick={() => setCheckoutOrderId(null)}
                  className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg transition"
                >
                  ← Back to Menu
                </button>
              </div>

              {/* Order Summary */}
              <div className="bg-slate-50 p-4 rounded-2xl border space-y-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Order Items</h3>
                <div className="space-y-1.5 text-sm">
                  {orderBeingPaid?.items.map((it: any, i: number) => (
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

              {/* Payment Method Selector */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Select Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <button className="border-2 border-amber-500 bg-amber-50/50 rounded-xl p-3 text-left font-bold text-xs text-amber-900 flex items-center gap-2">
                    💳 Credit / Debit Card
                  </button>
                  <button className="border rounded-xl p-3 text-left font-bold text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                    📲 Pay via USSD / Transfer
                  </button>
                  <button className="border rounded-xl p-3 text-left font-bold text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                    🍏 Apple / Google Pay
                  </button>
                  <button className="border rounded-xl p-3 text-left font-bold text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                    💵 Cash to Waiter
                  </button>
                </div>
              </div>

              {/* Pay Action Button */}
              <button
                onClick={handleProcessPayment}
                disabled={isProcessingPayment}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black text-base shadow-lg transition flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {isProcessingPayment ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin text-xl">🌀</span> Processing Payment...
                  </span>
                ) : (
                  `Pay $${orderBeingPaid?.total} & Get Exit Pass`
                )}
              </button>
            </div>
          ) : (
            /* CATALOG & ACTIVE ORDERS VIEW */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Food Catalog */}
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

              {/* Right: Cart & Active Orders Column */}
              <div className="space-y-6">
                {/* CART VIEW */}
                <div className="bg-white rounded-2xl p-6 border shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b pb-3">
                    <h2 className="text-xl font-bold text-slate-900">Cart</h2>
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

                {/* DIGITAL EXIT PASS MODAL / CARD */}
                {activeExitPass && (
                  <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl p-6 text-white shadow-2xl border-2 border-emerald-500/50 space-y-5 relative overflow-hidden">
                    {/* Pulsing Radar Background Effect */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl animate-pulse pointer-events-none" />

                    <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">CHOWLY OFFICIAL PASS</span>
                        <h3 className="text-xl font-black text-white">EXIT PASS CLEARED</h3>
                      </div>
                      <span className="bg-emerald-500/20 text-emerald-400 text-xs font-black px-2.5 py-1 rounded-full border border-emerald-500/40 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        PAID & CLEARED
                      </span>
                    </div>

                    {/* QR Code Simulation with Center Checkmark */}
                    <div className="bg-white p-4 rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-900 border-4 border-emerald-500">
                      <div className="relative w-36 h-36 bg-slate-950 rounded-xl p-2 flex items-center justify-center">
                        {/* QR Code Mock Pattern */}
                        <div className="w-full h-full border-2 border-dashed border-emerald-400/60 rounded flex items-center justify-center text-slate-700 text-[10px] text-center font-mono p-1">
                          [VERIFIED-QR-PASS]
                        </div>
                        <div className="absolute w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white text-2xl font-black shadow-lg">
                          ✓
                        </div>
                      </div>
                      <p className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">Scan at Door / Show Waiter</p>
                    </div>

                    {/* Pass Details */}
                    <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-300">
                        <span>Order IDs Covered:</span>
                        <span className="font-mono font-bold text-emerald-400">{activeExitPass.orderIds.join(', ')}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Table Number:</span>
                        <span className="font-bold text-white">{activeExitPass.table}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Total Paid:</span>
                        <span className="font-bold text-emerald-400">${activeExitPass.total}</span>
                      </div>
                      <div className="flex justify-between text-slate-300 border-t border-slate-700/60 pt-2">
                        <span>Timestamp:</span>
                        <span className="font-mono text-slate-400">{activeExitPass.timestamp}</span>
                      </div>
                    </div>

                    {/* Animated Verification Bar (Prevents Screenshots) */}
                    <div className="bg-emerald-950/60 border border-emerald-500/30 rounded-xl p-2.5 flex items-center justify-between text-[11px] text-emerald-300">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="font-bold">Live System Time:</span>
                      </div>
                      <span className="font-mono font-black text-white">{currentTime}</span>
                    </div>

                    <button
                      onClick={() => setActiveExitPass(null)}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-xl text-xs font-bold transition"
                    >
                      Hide Exit Pass
                    </button>
                  </div>
                )}

                {/* ACTIVE ORDERS LIST */}
                {activeCustomerOrders.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 px-1">
                      Active Orders ({activeCustomerOrders.length})
                    </h3>

                    {activeCustomerOrders.map((ord) => (
                      <div key={ord.id} className="bg-white rounded-2xl p-6 border shadow-sm space-y-4">
                        <div className="border-b pb-3 flex justify-between items-center">
                          <h2 className="text-lg font-bold text-slate-900">Order Tracker</h2>
                          <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-1 rounded text-slate-600">
                            {ord.id}
                          </span>
                        </div>

                        {/* Items Summary */}
                        <div className="bg-slate-50 p-3 rounded-xl border space-y-1.5">
                          <h3 className="text-[10px] font-bold text-slate-500 uppercase">Items Ordered</h3>
                          <ul className="text-xs space-y-1">
                            {ord.items.map((it: any, i: number) => (
                              <li key={i} className="flex justify-between text-slate-700">
                                <span>{it.name}</span>
                                <span className="font-semibold">${it.price.toFixed(2)}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="border-t pt-1.5 mt-1.5 flex justify-between font-bold text-xs text-slate-900">
                            <span>Total:</span>
                            <span>${ord.total}</span>
                          </div>
                        </div>

                        {/* Dynamic Status Card */}
                        <div className={`p-4 rounded-xl border text-center space-y-2 ${
                          ord.status === 'Completed' ? 'bg-emerald-50 border-emerald-300' :
                          ord.status === 'Served' || ord.status === 'Ready' ? 'bg-emerald-50 border-emerald-200' :
                          ord.status === 'Submitted' ? 'bg-amber-50 border-amber-200' :
                          'bg-blue-50 border-blue-200'
                        }`}>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</span>
                          <p className="text-xl font-black text-slate-900">{ord.status}</p>

                          <div className="pt-0.5">
                            <span className="text-xs font-bold text-amber-800 bg-amber-100/80 px-3 py-1 rounded-full inline-flex items-center gap-1 border border-amber-200">
                              ⏱️ Est. Wait: {ord.prepTime}
                            </span>
                          </div>
                          
                          <p className="text-xs text-slate-600 pt-1">
                            {ord.status === 'Submitted' && "Sent to kitchen. You can still cancel."}
                            {ord.status === 'Assigned' && "Order items assigned to kitchen/bar staff."}
                            {ord.status === 'Preparing' && "Food is cooking! Cancellation is now locked."}
                            {ord.status === 'Ready' && "Your order is ready! Proceed to pay bill."}
                            {ord.status === 'Served' && "Food served to Table 4! Pay bill to obtain Exit Pass."}
                            {ord.status === 'Completed' && "Order paid & cleared! Show Exit Pass at door."}
                          </p>
                        </div>

                        {/* CANCELLATION LOGIC */}
                        {ord.status === 'Submitted' ? (
                          <button
                            onClick={() => handleCustomerCancel(ord.id)}
                            className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-2 rounded-xl font-bold text-xs transition"
                          >
                            Cancel Order
                          </button>
                        ) : (
                          ord.status !== 'Ready' && ord.status !== 'Served' && ord.status !== 'Completed' && (
                            <p className="text-[11px] text-center text-slate-400 italic">
                              🔒 Order in progress. Speak to your waiter for changes.
                            </p>
                          )
                        )}

                        {/* Payment Action Trigger */}
                        {(ord.status === 'Ready' || ord.status === 'Served') && (
                          <button
                            onClick={() => setCheckoutOrderId(ord.id)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-extrabold text-xs transition shadow-md flex justify-center items-center gap-2 animate-bounce"
                          >
                            💳 Pay Bill (${ord.total}) & Exit
                          </button>
                        )}

                        {/* Completion Notice */}
                        {ord.status === 'Completed' && (
                          <div className="space-y-2">
                            <div className="bg-emerald-100 text-emerald-800 p-2.5 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-1.5">
                              <span>✅ Paid in Full</span>
                            </div>
                            <button 
                              onClick={() => handleDismissOrder(ord.id)} 
                              className="w-full bg-slate-100 text-slate-700 py-2 rounded-xl font-bold text-xs hover:bg-slate-200 transition"
                            >
                              Dismiss Tracker
                            </button>
                          </div>
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
                <p className="text-sm text-slate-500 mt-1">Assign items to staff and track table payment status.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {orders.length === 0 && <p className="text-slate-500">No active orders found.</p>}
              
              {orders.map((ord) => {
                const allItemsAssigned = ord.items.every((it: any) => it.assignedStaff !== 'Unassigned');
                const isAssignedOrBeyond = ['Assigned', 'Preparing', 'Ready', 'Served', 'Completed'].includes(ord.status);
                const isServedUnpaid = ord.status === 'Served';

                return (
                  <div key={ord.id} className="bg-white rounded-2xl p-6 border shadow-sm space-y-4 relative">
                    {/* PENDING PAYMENT ICON BADGE FOR SERVED ORDERS */}
                    {isServedUnpaid && (
                      <div className="bg-amber-500 text-slate-950 px-3 py-1 rounded-full text-xs font-black shadow-md flex items-center gap-1.5 animate-pulse w-fit">
                        <span>💳</span>
                        <span>PENDING PAYMENT</span>
                      </div>
                    )}

                    <div className="flex justify-between border-b pb-3">
                      <div>
                        <span className="text-xs font-bold text-slate-400">{ord.id}</span>
                        <h3 className="text-lg font-bold text-slate-900">{ord.customer}</h3>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-md h-fit ${
                        ord.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                        ord.status === 'Served' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                        ord.status === 'Ready' ? 'bg-teal-100 text-teal-800' :
                        ord.status === 'Preparing' ? 'bg-blue-100 text-blue-800' :
                        ord.status === 'Assigned' ? 'bg-purple-100 text-purple-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {ord.status}
                      </span>
                    </div>

                    {/* ITEM-BY-ITEM ASSIGNMENT TABLE */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Order Items & Staff Assignment</p>
                      <div className="bg-slate-50 rounded-xl p-3 border space-y-3">
                        {ord.items.map((it: any) => {
                          const isDrink = it.category === 'Drinks';
                          const staffOptions = isDrink ? BARTENDER_OPTIONS : CHEF_OPTIONS;

                          return (
                            <div key={it.id} className="flex items-center justify-between gap-2 border-b last:border-b-0 pb-2 last:pb-0">
                              <div className="flex-1">
                                <span className="text-xs font-semibold text-slate-800 block">{it.name}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">
                                  {it.category} ({isDrink ? 'Bartender' : 'Chef'})
                                </span>
                              </div>

                              <select
                                value={it.assignedStaff}
                                onChange={(e) => handleAssignItemStaff(ord.id, it.id, e.target.value)}
                                className="bg-white border text-xs rounded-lg p-1.5 font-bold text-slate-700 shadow-sm outline-none"
                              >
                                <option value="Unassigned">Assign Staff...</option>
                                {staffOptions.map((code) => (
                                  <option key={code} value={code}>{code}</option>
                                ))}
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* STATUS UPDATE SECTION */}
                    {ord.status !== 'Completed' && (
                      <div className="pt-3 border-t">
                        <label className="text-xs font-bold text-slate-600 block mb-1">Update Order Status:</label>
                        <select
                          value={ord.status}
                          onChange={(e) => handleUpdateStatus(ord.id, e.target.value)}
                          className="w-full bg-slate-50 border text-sm rounded-xl p-2.5 font-semibold text-slate-800"
                        >
                          <option value="Submitted">Submitted (Pending Assignment)</option>
                          
                          <option value="Assigned" disabled={!allItemsAssigned}>
                            Assigned {!allItemsAssigned ? '(Assign all items first)' : ''}
                          </option>

                          <option value="Preparing" disabled={!isAssignedOrBeyond}>
                            Preparing {!isAssignedOrBeyond ? '(Must set to Assigned first)' : ''}
                          </option>
                          
                          <option value="Ready" disabled={!isAssignedOrBeyond}>
                            Ready {!isAssignedOrBeyond ? '(Must set to Assigned first)' : ''}
                          </option>

                          <option value="Served" disabled={!isAssignedOrBeyond}>
                            Served (Awaits Customer Payment)
                          </option>

                          <option value="Completed" disabled={ord.status !== 'Completed'}>
                            Completed (Auto-updates upon Customer Payment)
                          </option>

                          <option value="Cancelled">Cancelled (Void)</option>
                        </select>
                      </div>
                    )}
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

export default IndexPage;
