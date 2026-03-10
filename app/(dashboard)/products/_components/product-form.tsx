"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createProduct, updateProduct } from "../actions";
import type { Tables } from "@/types/database.types";

type Product = Tables<"products">;

const UNITS = ["個", "箱", "袋", "本", "枚", "kg", "g", "L", "mL", "セット"];

export function ProductFormDialog({
  product,
  open,
  onClose,
}: {
  product?: Product;
  open: boolean;
  onClose: () => void;
}) {
  const isEdit = !!product;
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [unit, setUnit] = useState(product?.unit ?? "個");
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData(formRef.current!);
    formData.set("is_active", isActive.toString());
    formData.set("unit", unit);

    startTransition(async () => {
      const result = isEdit
        ? await updateProduct(product.id, formData)
        : await createProduct(formData);

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
          <DialogTitle>{isEdit ? "商品を編集" : "商品を追加"}</DialogTitle>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">商品名 *</Label>
            <Input id="name" name="name" defaultValue={product?.name} required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="sku">SKU（管理コード）*</Label>
            <Input id="sku" name="sku" defaultValue={product?.sku} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="category">カテゴリ</Label>
              <Input id="category" name="category" defaultValue={product?.category ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>単位 *</Label>
              <Select value={unit} onValueChange={(v) => v && setUnit(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="min_stock">最低在庫数（アラート閾値）</Label>
            <Input
              id="min_stock"
              name="min_stock"
              type="number"
              min="0"
              defaultValue={product?.min_stock ?? 0}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">説明</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={product?.description ?? ""}
              rows={3}
            />
          </div>
          {isEdit && (
            <div className="flex items-center gap-3">
              <Switch
                id="is_active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="is_active">有効</Label>
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
