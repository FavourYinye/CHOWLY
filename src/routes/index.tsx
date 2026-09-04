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

// Initial Active Orders
const INITIAL_ORDERS = [
  {
    id: 'ORD-101',
    customer: 'Table 4 (Alex)',
    items: ['Jollof Rice & Grilled Chicken', 'Chilled Zobo Drink'],
    total: '$19.49',
    status: 'In Kitchen',
    prepTime: '15 mins',
    assignedStaff: 'Chef Musa',
  },
  {
    id: 'ORD-102',
    customer: 'Table 2 (Sarah)',
    items: ['Amala & Ewedu', 'Classic Nigerian Chapman'],
    total: '$22.00',
    status: 'Preparing',
    prepTime: '15 mins',
    assignedStaff: 'Unassigned',
  },
];

function IndexPage() {
  const [activeRole, setActiveRole] = useState<'customer' | 'waiter'>('customer');
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [cart, setCart] = useState<{ cartId: string; id: string; name: string; price: number }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Add Item to Cart
  const addToCart = (item: typeof MENU_ITEMS[0]) => {
    const cartItem = { ...item, cartId: `${item.id}-${Date.now()}` };
    setCart((prev) => [...prev, cartItem]);
  };

  // Remove Single Item from Cart
  const removeFromCart = (cartId: string) => {
    setCart((prev) => prev.filter((item) => item.cartId !== cartId));
  };

  // Clear Entire Cart
  const clearCart = () => {
    setCart([]);
  };

  // Handle Staff Assignment in Waiter View
  const handleAssignStaff = (orderId: string, staffName: string) => {
    setOrders((prev) =>
      prev.map((ord) =>
        ord.id === orderId ? { ...ord, assignedStaff: staffName } : ord
      )
    );
  };

  const categories = ['All', 'Mains', 'Appetizers', 'Drinks'];
  const filteredItems = selectedCategory === 'All' 
    ? MENU_ITEMS 
    : MENU_ITEMS.filter((i) => i.category === selectedCategory);

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0).toFixed(2);

  // Dynamic estimated wait time based on item count
  const estimatedWaitTime = cart.length > 3 ? '~30 Mins' : '~15 Mins';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Navigation Header */}
      <header className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center font-black text-slate-950 text-xl">
            C
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">CHOWLY</h1>
        </div>

        {/* View Switcher Toggle */}
        <div className="bg-slate-800 p-1 rounded-xl flex gap-1 border border-slate-700">
          <button
            onClick={() => setActiveRole('customer')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeRole === 'customer'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Customer View
          </button>
          <button
            onClick={() => setActiveRole('waiter')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeRole === 'waiter'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Waiter View
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {activeRole === 'customer' ? (
          /* CUSTOMER INTERFACE */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Menu Items Grid */}
            <div className="lg:col-span-2 space-y-6">
              {/* Category Filter Pills */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                      selectedCategory === cat
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-200 border'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Menu Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-5 border shadow-sm hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center text-3xl mb-4`}>
                        {item.image}
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                        {item.category}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 mt-2">{item.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">Est. prep time: {item.prepTime}</p>
                    </div>
                    <div className="flex justify-between items-center mt-6 pt-4 border-t">
                      <span className="text-xl font-black text-slate-900">${item.price.toFixed(2)}</span>
                      <button
                        onClick={() => addToCart(item)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2 rounded-xl text-sm font-bold transition shadow-sm"
                      >
                        + Add to Order
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Order Summary Sidebar */}
            <div className="bg-white rounded-2xl p-6 border shadow-sm h-fit space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h2 className="text-xl font-bold text-slate-900">Your Order</h2>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs font-bold text-red-500 hover:text-red-700 transition"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <p className="text-4xl mb-2">🛒</p>
                  <p className="text-sm">Your order drawer is empty.</p>
                  <p className="text-xs text-slate-400 mt-1">Click "+ Add to Order" on any item above.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((cartItem) => (
                    <div key={cartItem.cartId} className="flex justify-between items-center text-sm border-b pb-2">
                      <div>
                        <p className="font-medium text-slate-800">{cartItem.name}</p>
                        <p className="text-xs font-bold text-slate-500">${cartItem.price.toFixed(2)}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(cartItem.cartId)}
                        className="text-slate-400 hover:text-red-600 transition p-1 text-sm font-bold"
                        title="Remove Item"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  <div className="pt-4 border-t space-y-3">
                    <div className="flex justify-between items-center text-base font-bold text-slate-900">
                      <span>Total Price:</span>
                      <span className="text-amber-600">${cartTotal}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 text-xs">
                      <span>Estimated Wait Time:</span>
                      <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {estimatedWaitTime}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        alert(`Order Placed Successfully! Estimated time: ${estimatedWaitTime}`);
                        setCart([]);
                      }}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold text-sm transition shadow"
                    >
                      Place Order
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* WAITER DASHBOARD */
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border shadow-sm">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Waiter & Kitchen Management</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Assign staff members to active customer orders and track live preparation status.
                </p>
              </div>
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-full">
                {orders.length} Active Orders
              </span>
            </div>

            {/* Orders Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {orders.map((ord) => (
                <div key={ord.id} className="bg-white rounded-2xl p-6 border shadow-sm space-y-4">
                  <div className="flex justify-between items-start border-b pb-3">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{ord.id}</span>
                      <h3 className="text-lg font-bold text-slate-900">{ord.customer}</h3>
                    </div>
                    <span className="bg-amber-50 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-md border border-amber-200">
                      ⏱️ Prep: {ord.prepTime}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold uppercase text-slate-400 mb-2">Ordered Items</h4>
                    <ul className="space-y-1">
                      {ord.items.map((it, i) => (
                        <li key={i} className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          {it}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-3 border-t flex items-center justify-between gap-4">
                    <label className="text-xs font-bold text-slate-600 whitespace-nowrap">
                      Assign Staff:
                    </label>
                    <select
                      value={ord.assignedStaff}
                      onChange={(e) => handleAssignStaff(ord.id, e.target.value)}
                      className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block w-full p-2.5 font-medium"
                    >
                      <option value="Unassigned">Unassigned</option>
                      <option value="Chef Musa (Kitchen)">Chef Musa (Kitchen)</option>
                      <option value="Chef Amaka (Kitchen)">Chef Amaka (Kitchen)</option>
                      <option value="Bartender David (Bar)">Bartender David (Bar)</option>
                      <option value="Waiter Samuel (Floor)">Waiter Samuel (Floor)</option>
                    </select>
                  </div>
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