"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
  return { supabase, currentUserId: user.id };
}

export async function updateUserRole(targetUserId: string, role: "admin" | "user") {
  const { currentUserId, supabase } = await requireAdmin();

  if (targetUserId === currentUserId) {
    return { error: "自分自身のロールは変更できません" };
  }

  const { error } = await supabase
    .from("user_profiles")
    .update({ role })
    .eq("id", targetUserId);

  if (error) return { error: error.message };
  revalidatePath("/admin/users");
  return { error: null };
}

export async function updateDisplayName(targetUserId: string, displayName: string) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("user_profiles")
    .update({ display_name: displayName || null })
    .eq("id", targetUserId);

  if (error) return { error: error.message };
  revalidatePath("/admin/users");
  return { error: null };
}

export async function createUser(formData: FormData) {
  await requireAdmin();
  const adminClient = createAdminClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const displayName = formData.get("display_name") as string;
  const role = formData.get("role") as "admin" | "user";

  // auth.users にユーザーを作成（メール確認不要で即ログイン可能）
  const { data, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !data.user) {
    return { error: authError?.message ?? "ユーザー作成に失敗しました" };
  }

  // display_name と role を設定（trigger で user_profiles が作成された後）
  const { error: profileError } = await adminClient
    .from("user_profiles")
    .update({ display_name: displayName || null, role })
    .eq("id", data.user.id);

  if (profileError) return { error: profileError.message };

  revalidatePath("/admin/users");
  return { error: null };
}
