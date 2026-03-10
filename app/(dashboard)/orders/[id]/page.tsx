import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrderDetail } from "../_components/order-detail";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: order } = await supabase
    .from("orders")
    .select(`
      id,
      order_number,
      status,
      order_date,
      shipped_date,
      notes,
      customer:customers(name, contact_name),
      order_items(
        id,
        quantity,
        product:products(name, sku, unit)
      )
    `)
    .eq("id", id)
    .single();

  if (!order) notFound();

  const formatted = {
    id: order.id,
    order_number: order.order_number,
    status: order.status,
    order_date: order.order_date,
    shipped_date: order.shipped_date,
    notes: order.notes,
    customer: Array.isArray(order.customer) ? order.customer[0] : order.customer,
    items: (order.order_items ?? []).map((item) => ({
      id: item.id,
      quantity: item.quantity,
      product: Array.isArray(item.product) ? item.product[0] : item.product,
    })),
  };

  return <OrderDetail order={formatted} />;
}
