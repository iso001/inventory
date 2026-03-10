import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UserTable } from "./_components/user-table";

export default async function UsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // admin 以外はアクセス不可
  const { data: myProfile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (myProfile?.role !== "admin") redirect("/");

  // user_profiles を全件取得（ロール・表示名）
  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("id, role, display_name, created_at")
    .order("created_at");

  // auth.users からメールアドレスを取得（サービスロールが必要）
  const adminClient = createAdminClient();
  const { data: { users: authUsers } } = await adminClient.auth.admin.listUsers();

  // 2つのデータをマージ
  const users = (profiles ?? []).map((profile) => {
    const authUser = authUsers.find((u) => u.id === profile.id);
    return {
      id: profile.id,
      email: authUser?.email ?? "(不明)",
      display_name: profile.display_name,
      role: profile.role,
      created_at: profile.created_at,
    };
  });

  return <UserTable users={users} currentUserId={user.id} />;
}
