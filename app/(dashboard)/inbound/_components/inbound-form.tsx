"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { createInbound } from "../actions";
import type { Tables } from "@/types/database.types";

type Product = Tables<"products">;
type Supplier = Tables<"suppliers">;

export function InboundForm({
  products,
  suppliers,
}: {
  products: Product[];
  suppliers: Supplier[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [productId, setProductId] = useState<string>("");
  const [supplierId, setSupplierId] = useState<string>("");

  const today = new Date().toISOString().split("T")[0];

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("product_id", productId);
    formData.set("supplier_id", supplierId);

    startTransition(async () => {
      const result = await createInbound(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          戻る
        </Button>
        <h2 className="text-xl font-semibold">入庫登録</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">入庫情報を入力</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label>製品 *</Label>
              <Select value={productId} onValueChange={(v) => v && setProductId(v)}>
                <SelectTrigger className="w-full">
                  <span className={productId ? "" : "text-muted-foreground"}>
                    {productId
                      ? products.find((p) => p.id === productId)?.name
                      : "製品を選択"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                      <span className="ml-2 text-xs text-muted-foreground">{p.sku}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>仕入先 *</Label>
              <Select value={supplierId} onValueChange={(v) => v && setSupplierId(v)}>
                <SelectTrigger className="w-full">
                  <span className={supplierId ? "" : "text-muted-foreground"}>
                    {supplierId
                      ? suppliers.find((s) => s.id === supplierId)?.name
                      : "仕入先を選択"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="quantity">数量 *</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  required
                  placeholder="0"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="inbound_date">入庫日 *</Label>
                <Input
                  id="inbound_date"
                  name="inbound_date"
                  type="date"
                  defaultValue={today}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="notes">備考</Label>
              <Textarea id="notes" name="notes" rows={3} placeholder="任意のメモ" />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                キャンセル
              </Button>
              <Button type="submit" disabled={isPending || !productId || !supplierId}>
                {isPending ? "登録中..." : "入庫を登録"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
