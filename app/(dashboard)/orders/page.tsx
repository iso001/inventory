import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrderTable } from "./_components/order-table";

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: orders } = await supabase
    .from("orders")
    .select(`
      id,
      order_number,
      status,
      order_date,
      shipped_date,
      customer:customers(name),
      order_items(id)
    `)
    .order("created_at", { ascending: false });

  const formatted = (orders ?? []).map((o) => ({
    id: o.id,
    order_number: o.order_number,
    status: o.status,
    order_date: o.order_date,
    shipped_date: o.shipped_date,
    customer: Array.isArray(o.customer) ? o.customer[0] : o.customer,
    item_count: Array.isArray(o.order_items) ? o.order_items.length : 0,
  }));

  return <OrderTable orders={formatted} />;
}
