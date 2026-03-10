import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrderForm } from "../_components/order-form";

export default async function NewOrderPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: products }, { data: customers }] = await Promise.all([
    supabase
      .from("products")
      .select("*, stock(quantity)")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("customers")
      .select("*")
      .eq("is_active", true)
      .order("name"),
  ]);

  return (
    <OrderForm
      products={products ?? []}
      customers={customers ?? []}
    />
  );
}
