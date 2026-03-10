"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Forbidden");
  return supabase;
}

export async function createCustomer(formData: FormData) {
  const supabase = await requireAdmin();

  const { error } = await supabase.from("customers").insert({
    name: formData.get("name") as string,
    contact_name: (formData.get("contact_name") as string) || null,
    email: (formData.get("email") as string) || null,
    phone: (formData.get("phone") as string) || null,
    address: (formData.get("address") as string) || null,
    notes: (formData.get("notes") as string) || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/customers");
  return { error: null };
}

export async function updateCustomer(id: string, formData: FormData) {
  const supabase = await requireAdmin();

  const { error } = await supabase
    .from("customers")
    .update({
      name: formData.get("name") as string,
      contact_name: (formData.get("contact_name") as string) || null,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      address: (formData.get("address") as string) || null,
      notes: (formData.get("notes") as string) || null,
      is_active: formData.get("is_active") === "true",
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/customers");
  return { error: null };
}

export async function deleteCustomer(id: string) {
  const supabase = await requireAdmin();

  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/customers");
  return { error: null };
}
