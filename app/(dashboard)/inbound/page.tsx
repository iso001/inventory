import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InboundTable } from "./_components/inbound-table";

export default async function InboundPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: records } = await supabase
    .from("inbound_records")
    .select(`
      id,
      quantity,
      inbound_date,
      notes,
      created_at,
      product:products(name, sku, unit),
      supplier:suppliers(name)
    `)
    .order("inbound_date", { ascending: false })
    .order("created_at", { ascending: false });

  return <InboundTable records={records ?? []} />;
}
