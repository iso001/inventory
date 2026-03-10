"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createInbound(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const quantity = Number(formData.get("quantity"));
  if (!quantity || quantity <= 0) {
    return { error: "数量は1以上を入力してください" };
  }

  const { error } = await supabase.from("inbound_records").insert({
    product_id: formData.get("product_id") as string,
    supplier_id: formData.get("supplier_id") as string,
    quantity,
    inbound_date: formData.get("inbound_date") as string,
    notes: (formData.get("notes") as string) || null,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/inbound");
  revalidatePath("/");
  redirect("/inbound");
}
