import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"];
export type OrderStatus = Database["public"]["Enums"]["order_status"];
export type OrderWithItems =
  Database["public"]["Tables"]["orders"]["Row"] & {
    order_items: Database["public"]["Tables"]["order_items"]["Row"][];
  };

export const menuQueryOptions = {
  queryKey: ["menu_items"],
  queryFn: async (): Promise<MenuItem[]> => {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .eq("is_available", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
};

export const ordersQueryOptions = {
  queryKey: ["orders"],
  queryFn: async (): Promise<OrderWithItems[]> => {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw error;
    return (data ?? []) as OrderWithItems[];
  },
};

export type CartLine = { item: MenuItem; quantity: number };

export async function placeOrder(input: {
  tableLabel: string;
  lines: CartLine[];
}) {
  const total = input.lines.reduce(
    (sum, line) => sum + Number(line.item.price) * line.quantity,
    0
  );

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({ table_label: input.tableLabel, total })
    .select()
    .single();
  if (orderError) throw orderError;

  const { error: itemsError } = await supabase.from("order_items").insert(
    input.lines.map((line) => ({
      order_id: order.id,
      menu_item_id: line.item.id,
      name: line.item.name,
      quantity: line.quantity,
      unit_price: line.item.price,
    }))
  );
  if (itemsError) throw itemsError;

  return order;
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}

export const nextStatus: Record<OrderStatus, OrderStatus | null> = {
  new: "preparing",
  preparing: "ready",
  ready: "served",
  served: null,
  cancelled: null,
};

export function formatPrice(value: number | string) {
  return `$${Number(value).toFixed(2)}`;
}

/* ---------- Staff, complaints, ratings & payments ---------- */

export type Employee = Database["public"]["Tables"]["employees"]["Row"];
export type Assignment =
  Database["public"]["Tables"]["order_employee_assignments"]["Row"] & {
    employees: Pick<Employee, "id" | "full_name" | "role"> | null;
  };
export type Complaint = Database["public"]["Tables"]["complaints"]["Row"];
export type ComplaintStatus = Database["public"]["Enums"]["complaint_status"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];
export type PaymentStatus = Database["public"]["Enums"]["payment_status"];
export type PaymentMethod = "card" | "cash" | "mobile";

export const employeesQueryOptions = {
  queryKey: ["employees"],
  queryFn: async (): Promise<Employee[]> => {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("is_active", true)
      .order("full_name");
    if (error) throw error;
    return data ?? [];
  },
};

export const assignmentsQueryOptions = {
  queryKey: ["order_employee_assignments"],
  queryFn: async (): Promise<Assignment[]> => {
    const { data, error } = await supabase
      .from("order_employee_assignments")
      .select("*, employees(id, full_name, role)")
      .order("assigned_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Assignment[];
  },
};

export const complaintsQueryOptions = {
  queryKey: ["complaints"],
  queryFn: async (): Promise<Complaint[]> => {
    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw error;
    return data ?? [];
  },
};

export const paymentsQueryOptions = {
  queryKey: ["payments"],
  queryFn: async (): Promise<Payment[]> => {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(60);
    if (error) throw error;
    return data ?? [];
  },
};

export async function assignEmployee(input: {
  orderId: string;
  employeeId: string;
  role?: string;
}) {
  const { error } = await supabase.from("order_employee_assignments").insert({
    order_id: input.orderId,
    employee_id: input.employeeId,
    role: input.role ?? "waiter",
  });
  if (error) throw error;
}

export async function submitComplaint(input: {
  orderId?: string | null;
  tableLabel?: string | null;
  category: string;
  message: string;
}) {
  const { error } = await supabase.from("complaints").insert({
    order_id: input.orderId ?? null,
    table_label: input.tableLabel ?? null,
    category: input.category,
    message: input.message,
  });
  if (error) throw error;
}

export async function updateComplaintStatus(
  id: string,
  status: ComplaintStatus,
  resolutionNote?: string
) {
  const { error } = await supabase
    .from("complaints")
    .update({ status, resolution_note: resolutionNote ?? null })
    .eq("id", id);
  if (error) throw error;
}

export async function submitRating(input: {
  orderId?: string | null;
  menuItemId?: string | null;
  score: number;
  comment?: string | null;
}) {
  const { error } = await supabase.from("ratings").insert({
    order_id: input.orderId ?? null,
    menu_item_id: input.menuItemId ?? null,
    score: input.score,
    comment: input.comment?.trim() ? input.comment.trim() : null,
  });
  if (error) throw error;
}

export async function recordPayment(input: {
  orderId: string;
  amount: number;
  method: PaymentMethod;
  status?: PaymentStatus;
}) {
  const { data, error } = await supabase
    .from("payments")
    .insert({
      order_id: input.orderId,
      amount: input.amount,
      method: input.method,
      status: input.status ?? "pending",
      reference: `CHW-${Date.now().toString(36).toUpperCase()}`,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePaymentStatus(id: string, status: PaymentStatus) {
  const { error } = await supabase
    .from("payments")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}
