import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductTable } from "./_components/product-table";

export default async function ProductsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const { data: products } = await supabase
    .from("products")
    .select("*, stock(quantity)")
    .order("name");

  return (
    <ProductTable
      products={products ?? []}
      isAdmin={profile?.role === "admin"}
    />
  );
}
