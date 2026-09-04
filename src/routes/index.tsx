import React, { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: IndexPage,
});

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
  const [cart, setCart] = useState<{ cartId: string; id: string; name: string; price: number }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Track multiple active customer order IDs for Table 4
  const [customerOrderIds, setCustomerOrderIds] = useState<string[]>([]);

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
      items: cart.map((item) => ({ name: item.name, price: item.price })),
      total: cartTotal,
      status: 'Submitted',
      prepTime: estimatedWaitTime,
      assignedStaff: 'Unassigned',
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

  // 3. Waiter Assigns Staff -> Automatically sets status to 'Assigned' if currently 'Submitted'
  const handleAssignStaff = (orderId: string, staffName: string) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          const newStatus = staffName !== 'Unassigned' && ord.status === 'Submitted' ? 'Assigned' : ord.status;
          return { ...ord, assignedStaff: staffName, status: newStatus };
        }
        return ord;
      })
    );
  };

  // 4. Waiter updates status (Preparing, Ready, Cancelled)
  const handleUpdateStatus = (orderId: string, newStatus: string) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status: newStatus } : ord))
    );
  };

  // 5. Customer settles payment when order is Ready
  const handleMakePayment = (orderId: string) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status: 'Completed' } : ord))
    );
  };

  // Dismiss completed order card from customer view
  const handleDismissOrder = (orderId: string) => {
    setCustomerOrderIds((prev) => prev.filter((id) => id !== orderId));
  };

  const categories = ['All', 'Mains', 'Appetizers', 'Drinks'];
  const filteredItems = selectedCategory === 'All' ? MENU_ITEMS : MENU_ITEMS.filter((i) => i.category === selectedCategory);
  
  // Active customer orders filter
  const activeCustomerOrders = orders.filter((o) => customerOrderIds.includes(o.id));

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
                  <h2 className="text-xl font-bold text-slate-900">New Order Cart</h2>
                  {cart.length > 0 && <button onClick={clearCart} className="text-xs font-bold text-red-500">Clear All</button>}
                </div>
                {cart.length === 0 ? (
                  <div className="text-center py-6 text-slate-400">
                    <p className="text-3xl mb-1">🛒</p>
                    <p className="text-xs">Select items above to start a new order.</p>
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
                    
                    {/* ESTIMATED WAIT TIME ON CART */}
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
                        Place Additional Order
                      </button>
                    </div>
                  </div>
                )}
              </div>

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
                        ord.status === 'Ready' 
                          ? 'bg-emerald-50 border-emerald-200' 
                          : ord.status === 'Submitted'
                          ? 'bg-amber-50 border-amber-200'
                          : 'bg-blue-50 border-blue-200'
                      }`}>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</span>
                        <p className="text-xl font-black text-slate-900">{ord.status}</p>

                        {/* ESTIMATED WAIT TIME ON TRACKING CARD */}
                        <div className="pt-0.5">
                          <span className="text-xs font-bold text-amber-800 bg-amber-100/80 px-3 py-1 rounded-full inline-flex items-center gap-1 border border-amber-200">
                            ⏱️ Est. Wait: {ord.prepTime}
                          </span>
                        </div>
                        
                        <p className="text-xs text-slate-600 pt-1">
                          {ord.status === 'Submitted' && "Sent to kitchen. You can still cancel."}
                          {ord.status === 'Assigned' && `Assigned to ${ord.assignedStaff}.`}
                          {ord.status === 'Preparing' && "Food is cooking! Cancellation is now locked."}
                          {ord.status === 'Ready' && "Your order is served! Please proceed to pay."}
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
                        ord.status !== 'Ready' && ord.status !== 'Completed' && (
                          <p className="text-[11px] text-center text-slate-400 italic">
                            🔒 Order in progress. Speak to your waiter for changes.
                          </p>
                        )
                      )}

                      {/* Payment Action */}
                      {ord.status === 'Ready' && (
                        <button
                          onClick={() => handleMakePayment(ord.id)}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold text-xs transition shadow-md animate-bounce"
                        >
                          Pay Bill (${ord.total})
                        </button>
                      )}

                      {/* Completion Notice */}
                      {ord.status === 'Completed' && (
                        <div className="space-y-2">
                          <div className="bg-emerald-100 text-emerald-800 p-2.5 rounded-xl text-center text-xs font-bold">
                            Paid! Thank you for dining with us.
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
        ) : (
          /* WAITER DASHBOARD */
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Waiter Dashboard</h2>
                <p className="text-sm text-slate-500 mt-1">Manage kitchen dispatch and table updates.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {orders.length === 0 && <p className="text-slate-500">No active orders found.</p>}
              
              {orders.map((ord) => (
                <div key={ord.id} className="bg-white rounded-2xl p-6 border shadow-sm space-y-4">
                  <div className="flex justify-between border-b pb-3">
                    <div>
                      <span className="text-xs font-bold text-slate-400">{ord.id}</span>
                      <h3 className="text-lg font-bold text-slate-900">{ord.customer}</h3>
                    </div>
                    <span className="bg-slate-100 text-slate-800 text-xs font-bold px-2 py-1 rounded">
                      {ord.status}
                    </span>
                  </div>

                  <ul className="text-sm font-medium text-slate-700 space-y-1">
                    {ord.items.map((it: any, i: number) => (
                      <li key={i}>• {it.name}</li>
                    ))}
                  </ul>

                  {ord.status !== 'Completed' && (
                    <div className="pt-4 border-t grid grid-cols-2 gap-4">
                      {/* Staff Dropdown */}
                      <div>
                        <label className="text-xs font-bold text-slate-600 block mb-1">Assigned Staff:</label>
                        <select
                          value={ord.assignedStaff}
                          onChange={(e) => handleAssignStaff(ord.id, e.target.value)}
                          className="w-full bg-slate-50 border text-sm rounded-lg p-2 font-medium"
                        >
                          <option value="Unassigned">Unassigned</option>
                          <option value="Chef Musa">Chef Musa</option>
                          <option value="Chef Amaka">Chef Amaka</option>
                          <option value="Bartender David">Bartender David</option>
                        </select>
                      </div>

                      {/* Status Dropdown */}
                      <div>
                        <label className="text-xs font-bold text-slate-600 block mb-1">Update Status:</label>
                        <select
                          value={ord.status}
                          onChange={(e) => handleUpdateStatus(ord.id, e.target.value)}
                          className="w-full bg-slate-50 border text-sm rounded-lg p-2 font-medium"
                        >
                          <option value="Submitted">Submitted</option>
                          <option value="Assigned">Assigned</option>
                          <option value="Preparing">Preparing</option>
                          <option value="Ready">Ready</option>
                          <option value="Cancelled">Cancelled (Void)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default IndexPage;