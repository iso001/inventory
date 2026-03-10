import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InboundForm } from "../_components/inbound-form";

export default async function NewInboundPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: products }, { data: suppliers }] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("suppliers")
      .select("*")
      .eq("is_active", true)
      .order("name"),
  ]);

  return (
    <InboundForm
      products={products ?? []}
      suppliers={suppliers ?? []}
    />
  );
}
