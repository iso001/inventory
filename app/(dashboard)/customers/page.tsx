import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CustomerTable } from "./_components/customer-table";

export default async function CustomersPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const { data: customers } = await supabase
    .from("customers")
    .select("*")
    .order("name");

  return (
    <CustomerTable
      customers={customers ?? []}
      isAdmin={profile?.role === "admin"}
    />
  );
}
