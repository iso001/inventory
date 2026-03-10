"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createOrder(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const itemsJson = formData.get("items") as string;
  const items: { product_id: string; quantity: number }[] = JSON.parse(itemsJson);

  if (!items || items.length === 0) {
    return { error: "製品を1つ以上追加してください" };
  }

  // オーダーを作成（order_number はトリガーで自動採番）
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_id: formData.get("customer_id") as string,
      order_date: formData.get("order_date") as string,
      notes: (formData.get("notes") as string) || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return { error: orderError?.message ?? "オーダーの作成に失敗しました" };
  }

  // オーダー明細を一括挿入
  const { error: itemsError } = await supabase.from("order_items").insert(
    items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
    }))
  );

  if (itemsError) {
    // 明細の挿入失敗時はオーダーも削除
    await supabase.from("orders").delete().eq("id", order.id);
    return { error: itemsError.message };
  }

  revalidatePath("/orders");
  revalidatePath("/");
  redirect(`/orders/${order.id}`);
}

export async function updateOrderStatus(orderId: string, status: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const updates: Record<string, string> = { status };
  if (status === "shipped") {
    updates.shipped_date = new Date().toISOString().split("T")[0];
  }

  const { error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", orderId);

  if (error) return { error: error.message };

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
  revalidatePath("/");
  return { error: null };
}
