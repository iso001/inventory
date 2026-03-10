import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

// サービスロールクライアント: RLS をバイパスして全データにアクセスできる
// 必ずサーバーサイド（Server Actions / Route Handlers）でのみ使用すること
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
