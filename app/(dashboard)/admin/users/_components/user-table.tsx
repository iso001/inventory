"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MoreHorizontal, Plus, Check, X } from "lucide-react";
import { InviteDialog } from "./invite-dialog";
import { updateUserRole, updateDisplayName } from "../actions";

type UserRow = {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  created_at: string;
};

export function UserTable({
  users,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: string;
}) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleRoleChange(userId: string, newRole: "admin" | "user") {
    startTransition(async () => {
      const result = await updateUserRole(userId, newRole);
      if (result.error) setError(result.error);
    });
  }

  function startEditName(user: UserRow) {
    setEditingId(user.id);
    setEditingName(user.display_name ?? "");
  }

  function handleNameSave(userId: string) {
    startTransition(async () => {
      const result = await updateDisplayName(userId, editingName);
      if (result.error) {
        setError(result.error);
      } else {
        setEditingId(null);
      }
    });
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">ユーザー管理</h2>
        <Button size="sm" onClick={() => setInviteOpen(true)} className="gap-1.5">
          <Plus size={14} />
          ユーザーを追加
        </Button>
      </div>

      {error && (
        <p className="mb-3 text-sm text-destructive">{error}</p>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>メールアドレス</TableHead>
              <TableHead>表示名</TableHead>
              <TableHead>ロール</TableHead>
              <TableHead>作成日</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  ユーザーがいません
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.email}
                    {user.id === currentUserId && (
                      <Badge variant="outline" className="ml-2 text-xs">自分</Badge>
                    )}
                  </TableCell>

                  {/* 表示名インライン編集 */}
                  <TableCell>
                    {editingId === user.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="h-7 text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleNameSave(user.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 shrink-0"
                          onClick={() => handleNameSave(user.id)}
                          disabled={isPending}
                        >
                          <Check size={12} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 shrink-0"
                          onClick={() => setEditingId(null)}
                        >
                          <X size={12} />
                        </Button>
                      </div>
                    ) : (
                      <button
                        className="text-sm text-left hover:underline cursor-text text-muted-foreground"
                        onClick={() => startEditName(user)}
                      >
                        {user.display_name ?? "クリックして設定"}
                      </button>
                    )}
                  </TableCell>

                  <TableCell>
                    <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                      {user.role === "admin" ? "管理者" : "一般"}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-sm text-muted-foreground">
                    {user.created_at.substring(0, 10)}
                  </TableCell>

                  <TableCell>
                    {user.id !== currentUserId && (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
                          disabled={isPending}
                        >
                          <MoreHorizontal size={14} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {user.role === "user" ? (
                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, "admin")}>
                              管理者に変更
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, "user")}>
                              一般ユーザーに変更
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <InviteDialog open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </>
  );
}
