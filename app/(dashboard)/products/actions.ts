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

export async function createProduct(formData: FormData) {
  const supabase = await requireAdmin();

  const { error } = await supabase.from("products").insert({
    name: formData.get("name") as string,
    sku: formData.get("sku") as string,
    category: (formData.get("category") as string) || null,
    unit: formData.get("unit") as string,
    description: (formData.get("description") as string) || null,
    min_stock: Number(formData.get("min_stock")) || 0,
  });

  if (error) return { error: error.message };
  revalidatePath("/products");
  return { error: null };
}

export async function updateProduct(id: string, formData: FormData) {
  const supabase = await requireAdmin();

  const { error } = await supabase
    .from("products")
    .update({
      name: formData.get("name") as string,
      sku: formData.get("sku") as string,
      category: (formData.get("category") as string) || null,
      unit: formData.get("unit") as string,
      description: (formData.get("description") as string) || null,
      min_stock: Number(formData.get("min_stock")) || 0,
      is_active: formData.get("is_active") === "true",
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/products");
  return { error: null };
}

export async function deleteProduct(id: string) {
  const supabase = await requireAdmin();

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/products");
  return { error: null };
}
