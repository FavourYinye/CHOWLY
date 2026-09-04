import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const WaiterDashboard = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [staff, setStaff] = useState<{ chefs: any[]; bartenders: any[] }>({ chefs: [], bartenders: [] });
  const [selectedStaff, setSelectedStaff] = useState<{ [orderId: string]: { chefId: string; bartenderId: string } }>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchOrdersAndStaff();
  }, []);

  const fetchOrdersAndStaff = async () => {
    setLoading(true);

    // 1. Fetch active orders with order items and menu details
    const { data: orderData, error: orderErr } = await supabase
      .from('orders')
      .select('*, order_item(*, menu_item(*))')
      .order('order_datetime', { ascending: false });

    if (orderErr) console.error('Error fetching orders:', orderErr);
    else setOrders(orderData || []);

    // 2. Fetch employees and filter by role
    const { data: employeeData, error: empErr } = await supabase
      .from('employee')
      .select('*, employee_role(role_name)');

    if (empErr) console.error('Error fetching staff:', empErr);
    if (employeeData) {
      const chefs = employeeData.filter((e: any) => e.employee_role?.role_name === 'Chef');
      const bartenders = employeeData.filter((e: any) => e.employee_role?.role_name === 'Bartender');
      setStaff({ chefs, bartenders });
    }

    setLoading(false);
  };

  const handleAssignAndServe = async (orderId: string) => {
    const assignment = selectedStaff[orderId];
    if (!assignment?.chefId || !assignment?.bartenderId) {
      alert('Please select both a Chef and a Bartender before marking the order as served.');
      return;
    }

    // Insert assignments into order_employee_assignment table
    const { error: assignErr } = await supabase.from('order_employee_assignment').insert([
      { order_id: orderId, employee_id: assignment.chefId },
      { order_id: orderId, employee_id: assignment.bartenderId },
    ]);

    if (assignErr) {
      alert('Failed to record staff assignment: ' + assignErr.message);
      return;
    }

    // Update order status to 'Served'
    const { error: updateErr } = await supabase
      .from('orders')
      .update({ order_status: 'Served' })
      .eq('order_id', orderId);

    if (updateErr) {
      alert('Failed to update status: ' + updateErr.message);
      return;
    }

    alert('Order assigned and marked as Served successfully!');
    fetchOrdersAndStaff();
  };

  if (loading) return <div className="p-6 text-center text-gray-500">Loading Waiter Dashboard...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Waiter Dashboard - Active Orders</h2>

      {orders.length === 0 ? (
        <div className="p-4 border rounded bg-gray-50 text-gray-500">
          No active customer orders at the moment.
        </div>
      ) : (
        orders.map((order) => (
          <div key={order.order_id} className="border p-5 rounded-lg mb-4 shadow-sm bg-white">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-lg">Order #{order.order_id.substring(0, 8)}</span>
              <span className="px-3 py-1 text-sm bg-amber-100 text-amber-800 rounded-full font-medium">
                {order.order_status}
              </span>
            </div>

            <p className="text-sm text-gray-600 mb-2">
              Est. Prep Time: <strong>{order.estimated_waiting_time || 15} mins</strong>
            </p>

            {/* Display Item List */}
            {order.order_item && order.order_item.length > 0 && (
              <div className="my-2 bg-gray-50 p-3 rounded">
                <p className="text-xs font-semibold text-gray-500 mb-1">Items Ordered:</p>
                <ul className="text-sm space-y-1">
                  {order.order_item.map((item: any) => (
                    <li key={item.order_item_id}>
                      {item.quantity}x {item.menu_item?.item_name || 'Menu Item'}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Chef and Bartender Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Assign Chef:</label>
                <select
                  className="w-full border p-2 rounded text-sm bg-white"
                  value={selectedStaff[order.order_id]?.chefId || ''}
                  onChange={(e) =>
                    setSelectedStaff({
                      ...selectedStaff,
                      [order.order_id]: { ...selectedStaff[order.order_id], chefId: e.target.value },
                    })
                  }
                >
                  <option value="">-- Select Chef --</option>
                  {staff.chefs.map((c) => (
                    <option key={c.employee_id} value={c.employee_id}>
                      {c.employee_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Assign Bartender:</label>
                <select
                  className="w-full border p-2 rounded text-sm bg-white"
                  value={selectedStaff[order.order_id]?.bartenderId || ''}
                  onChange={(e) =>
                    setSelectedStaff({
                      ...selectedStaff,
                      [order.order_id]: { ...selectedStaff[order.order_id], bartenderId: e.target.value },
                    })
                  }
                >
                  <option value="">-- Select Bartender --</option>
                  {staff.bartenders.map((b) => (
                    <option key={b.employee_id} value={b.employee_id}>
                      {b.employee_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={() => handleAssignAndServe(order.order_id)}
              disabled={order.order_status === 'Served'}
              className={`w-full py-2 rounded text-sm font-semibold transition ${
                order.order_status === 'Served'
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {order.order_status === 'Served' ? 'Order Served' : 'Assign Staff & Mark as Served'}
            </button>
          </div>
        ))
      )}
    </div>
  );
};
export default WaiterDashboard;