"use client";

import { logout } from "@/app/(auth)/login/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut } from "lucide-react";

export function Header({
  email,
  isAdmin,
}: {
  email: string;
  isAdmin: boolean;
}) {
  return (
    <header className="h-12 border-b px-4 flex items-center justify-end gap-3 bg-background">
      <span className="text-sm text-muted-foreground">{email}</span>
      {isAdmin && <Badge variant="secondary">管理者</Badge>}
      <form action={logout}>
        <Button type="submit" variant="ghost" size="sm" className="gap-1.5">
          <LogOut size={14} />
          ログアウト
        </Button>
      </form>
    </header>
  );
}
