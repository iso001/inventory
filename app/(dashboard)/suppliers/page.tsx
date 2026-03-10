import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SupplierTable } from "./_components/supplier-table";

export default async function SuppliersPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("*")
    .order("name");

  return (
    <SupplierTable
      suppliers={suppliers ?? []}
      isAdmin={profile?.role === "admin"}
    />
  );
}
