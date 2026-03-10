"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger,
} from "@/components/ui/select";
import { createUser } from "../actions";

export function InviteDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [role, setRole] = useState<"admin" | "user">("user");
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData(formRef.current!);
    formData.set("role", role);

    startTransition(async () => {
      const result = await createUser(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setError(null);
        formRef.current?.reset();
        setRole("user");
        onClose();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ユーザーを追加</DialogTitle>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">メールアドレス *</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">初期パスワード *</Label>
            <Input id="password" name="password" type="password" minLength={6} required />
            <p className="text-xs text-muted-foreground">6文字以上</p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="display_name">表示名</Label>
            <Input id="display_name" name="display_name" placeholder="氏名など" />
          </div>
          <div className="flex flex-col gap-2">
            <Label>ロール</Label>
            <Select value={role} onValueChange={(v) => v && setRole(v as "admin" | "user")}>
              <SelectTrigger className="w-full">
                <span>{role === "admin" ? "管理者" : "一般ユーザー"}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">一般ユーザー</SelectItem>
                <SelectItem value="admin">管理者</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>キャンセル</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "作成中..." : "ユーザーを作成"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
