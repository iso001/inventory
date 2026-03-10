"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { createCustomer, updateCustomer } from "../actions";
import type { Tables } from "@/types/database.types";

type Customer = Tables<"customers">;

export function CustomerFormDialog({
  customer,
  open,
  onClose,
}: {
  customer?: Customer;
  open: boolean;
  onClose: () => void;
}) {
  const isEdit = !!customer;
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isActive, setIsActive] = useState(customer?.is_active ?? true);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData(formRef.current!);
    formData.set("is_active", isActive.toString());

    startTransition(async () => {
      const result = isEdit
        ? await updateCustomer(customer.id, formData)
        : await createCustomer(formData);

      if (result.error) {
        setError(result.error);
      } else {
        setError(null);
        onClose();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "納入先を編集" : "納入先を追加"}</DialogTitle>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">納入先名 *</Label>
            <Input id="name" name="name" defaultValue={customer?.name} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="contact_name">担当者名</Label>
              <Input id="contact_name" name="contact_name" defaultValue={customer?.contact_name ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">電話番号</Label>
              <Input id="phone" name="phone" defaultValue={customer?.phone ?? ""} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input id="email" name="email" type="email" defaultValue={customer?.email ?? ""} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="address">住所</Label>
            <Input id="address" name="address" defaultValue={customer?.address ?? ""} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">備考</Label>
            <Textarea id="notes" name="notes" defaultValue={customer?.notes ?? ""} rows={3} />
          </div>
          {isEdit && (
            <div className="flex items-center gap-3">
              <Switch id="is_active" checked={isActive} onCheckedChange={setIsActive} />
              <Label htmlFor="is_active">有効</Label>
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>キャンセル</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
