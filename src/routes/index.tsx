import React, { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { WaiterDashboard } from '@/components/WaiterDashboard';

export const Route = createFileRoute('/')({
  component: IndexPage,
});

function IndexPage() {
  const [activeRole, setActiveRole] = useState<'customer' | 'waiter'>('customer');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Bar Role Toggle */}
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow">
        <h1 className="text-xl font-bold tracking-wide">CHOWLY</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveRole('customer')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
              activeRole === 'customer' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 hover:bg-slate-700'
            }`}
          >
            Customer View
          </button>
          <button
            onClick={() => setActiveRole('waiter')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
              activeRole === 'waiter' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 hover:bg-slate-700'
            }`}
          >
            Waiter View
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6">
        {activeRole === 'waiter' ? (
          <WaiterDashboard />
        ) : (
          <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-sm border text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome to Chowly Customer Ordering</h2>
            <p className="text-slate-600 mb-6">Explore our menu items, place orders, and track prep times in real time.</p>
            <div className="inline-block bg-amber-100 text-amber-900 px-4 py-2 rounded-full text-sm font-medium">
              Switch to "Waiter View" above to manage kitchen staff assignments and mark orders as served.
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default IndexPage;