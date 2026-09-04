import React, { useState } from 'react';
import { WaiterDashboard } from '@/components/WaiterDashboard';

export default function Index() {
  const [activeRole, setActiveRole] = useState<'customer' | 'waiter'>('customer');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">CHOWLY</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveRole('customer')}
            className={`px-3 py-1 rounded text-sm ${
              activeRole === 'customer' ? 'bg-amber-500 text-black font-semibold' : 'bg-slate-700'
            }`}
          >
            Customer View
          </button>
          <button
            onClick={() => setActiveRole('waiter')}
            className={`px-3 py-1 rounded text-sm ${
              activeRole === 'waiter' ? 'bg-amber-500 text-black font-semibold' : 'bg-slate-700'
            }`}
          >
            Waiter View
          </button>
        </div>
      </header>

      <main className="p-6">
        {activeRole === 'waiter' ? (
          <WaiterDashboard />
        ) : (
          <div className="text-center py-10 text-gray-600">Customer Order View</div>
        )}
      </main>
    </div>
  );
}