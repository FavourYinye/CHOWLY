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

    // 1. Fetch active orders
    const { data: orderData, error: orderErr } = await (supabase
      .from('orders') as any)
      .select('*, order_items(*, menu_items(*))')
      .order('order_datetime', { ascending: false });

    if (orderErr) console.error('Error fetching orders:', orderErr);
    else setOrders(orderData || []);

    // 2. Fetch staff using generated table 'employees'
    const { data: employeeData, error: empErr } = await (supabase
      .from('employees') as any)
      .select('*, employee_roles(role_name)');

    if (empErr) console.error('Error fetching staff:', empErr);
    if (employeeData) {
      const chefs = employeeData.filter((e: any) => e.employee_roles?.role_name === 'Chef' || e.role === 'Chef');
      const bartenders = employeeData.filter((e: any) => e.employee_roles?.role_name === 'Bartender' || e.role === 'Bartender');
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

    // Insert staff assignments into order_employee_assignments
    const { error: assignErr } = await (supabase.from('order_employee_assignments') as any).insert([
      { order_id: orderId, employee_id: assignment.chefId },
      { order_id: orderId, employee_id: assignment.bartenderId },
    ]);

    if (assignErr) {
      alert('Failed to record staff assignment: ' + assignErr.message);
      return;
    }

    // Update order status to 'Served'
    const { error: updateErr } = await (supabase
      .from('orders') as any)
      .update({ order_status: 'Served' })
      .or(`id.eq.${orderId},order_id.eq.${orderId}`);

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
        orders.map((order) => {
          const currentOrderId = order.order_id || order.id || '';
          return (
            <div key={currentOrderId} className="border p-5 rounded-lg mb-4 shadow-sm bg-white">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-lg">Order #{currentOrderId.substring(0, 8)}</span>
                <span className="px-3 py-1 text-sm bg-amber-100 text-amber-800 rounded-full font-medium">
                  {order.order_status || order.status || 'Submitted'}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-2">
                Est. Prep Time: <strong>{order.estimated_waiting_time || 15} mins</strong>
              </p>

              {/* Chef and Bartender Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Assign Chef:</label>
                  <select
                    className="w-full border p-2 rounded text-sm bg-white"
                    value={selectedStaff[currentOrderId]?.chefId || ''}
                    onChange={(e) =>
                      setSelectedStaff({
                        ...selectedStaff,
                        [currentOrderId]: { ...selectedStaff[currentOrderId], chefId: e.target.value },
                      })
                    }
                  >
                    <option value="">-- Select Chef --</option>
                    {staff.chefs.map((c) => (
                      <option key={c.employee_id || c.id} value={c.employee_id || c.id}>
                        {c.employee_name || c.name || 'Chef'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Assign Bartender:</label>
                  <select
                    className="w-full border p-2 rounded text-sm bg-white"
                    value={selectedStaff[currentOrderId]?.bartenderId || ''}
                    onChange={(e) =>
                      setSelectedStaff({
                        ...selectedStaff,
                        [currentOrderId]: { ...selectedStaff[currentOrderId], bartenderId: e.target.value },
                      })
                    }
                  >
                    <option value="">-- Select Bartender --</option>
                    {staff.bartenders.map((b) => (
                      <option key={b.employee_id || b.id} value={b.employee_id || b.id}>
                        {b.employee_name || b.name || 'Bartender'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={() => handleAssignAndServe(currentOrderId)}
                disabled={order.order_status === 'Served' || order.status === 'Served'}
                className={`w-full py-2 rounded text-sm font-semibold transition ${
                  order.order_status === 'Served' || order.status === 'Served'
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {order.order_status === 'Served' || order.status === 'Served' ? 'Order Served' : 'Assign Staff & Mark as Served'}
              </button>
            </div>
          );
        })
      )}
    </div>
  );
};

export default WaiterDashboard;