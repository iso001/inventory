"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { createOrder } from "../actions";
import type { Tables } from "@/types/database.types";

type Product = Tables<"products"> & { stock: { quantity: number } | null };
type Customer = Tables<"customers">;

type OrderItem = {
  productId: string;
  quantity: number;
};

export function OrderForm({
  products,
  customers,
}: {
  products: Product[];
  customers: Customer[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState<OrderItem[]>([{ productId: "", quantity: 1 }]);

  const today = new Date().toISOString().split("T")[0];

  // すでに選択済みの productId 一覧
  const selectedProductIds = items.map((i) => i.productId).filter(Boolean);

  function addItem() {
    setItems((prev) => [...prev, { productId: "", quantity: 1 }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof OrderItem, value: string | number) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  }

  const isValid =
    customerId &&
    items.length > 0 &&
    items.every((i) => i.productId && i.quantity > 0);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("customer_id", customerId);
    formData.set("items", JSON.stringify(items.map((i) => ({
      product_id: i.productId,
      quantity: i.quantity,
    }))));

    startTransition(async () => {
      const result = await createOrder(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          戻る
        </Button>
        <h2 className="text-xl font-semibold">オーダー作成</h2>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* オーダー基本情報 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">基本情報</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>納入先 *</Label>
              <Select value={customerId} onValueChange={(v) => v && setCustomerId(v)}>
                <SelectTrigger className="w-full">
                  <span className={customerId ? "" : "text-muted-foreground"}>
                    {customerId
                      ? customers.find((c) => c.id === customerId)?.name
                      : "納入先を選択"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="order_date">オーダー日 *</Label>
                <Input
                  id="order_date"
                  name="order_date"
                  type="date"
                  defaultValue={today}
                  required
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="notes">備考</Label>
              <Textarea id="notes" name="notes" rows={2} placeholder="任意のメモ" />
            </div>
          </CardContent>
        </Card>

        {/* オーダー明細 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">出荷製品</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1.5">
                <Plus size={14} />
                製品を追加
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {items.map((item, index) => {
              const selectedProduct = products.find((p) => p.id === item.productId);
              const stock = selectedProduct?.stock?.quantity ?? 0;
              const isOverStock = item.quantity > stock;

              return (
                <div key={index} className="flex gap-3 items-start">
                  {/* 製品選択 */}
                  <div className="flex-1 flex flex-col gap-1">
                    <Select
                      value={item.productId}
                      onValueChange={(v) => v && updateItem(index, "productId", v)}
                    >
                      <SelectTrigger className="w-full">
                        <span className={item.productId ? "" : "text-muted-foreground"}>
                          {item.productId
                            ? products.find((p) => p.id === item.productId)?.name
                            : "製品を選択"}
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => {
                          const alreadySelected =
                            selectedProductIds.includes(p.id) && p.id !== item.productId;
                          return (
                            <SelectItem
                              key={p.id}
                              value={p.id}
                              disabled={alreadySelected}
                            >
                              {p.name}
                              <span className="ml-2 text-xs text-muted-foreground">
                                在庫: {p.stock?.quantity ?? 0} {p.unit}
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {selectedProduct && (
                      <p className={`text-xs pl-1 ${isOverStock ? "text-destructive" : "text-muted-foreground"}`}>
                        現在庫: {stock} {selectedProduct.unit}
                        {isOverStock && " — 在庫不足になります"}
                      </p>
                    )}
                  </div>

                  {/* 数量 */}
                  <div className="w-24 flex flex-col gap-1">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                      className={isOverStock ? "border-destructive" : ""}
                    />
                  </div>

                  {/* 削除 */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                    className="shrink-0 mt-0.5"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              );
            })}

            {items.some((i) => {
              const p = products.find((p) => p.id === i.productId);
              return p && i.quantity > (p.stock?.quantity ?? 0);
            }) && (
              <Badge variant="destructive" className="w-fit">
                在庫不足の製品があります。出荷後に在庫がマイナスになります。
              </Badge>
            )}
          </CardContent>
        </Card>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            キャンセル
          </Button>
          <Button type="submit" disabled={isPending || !isValid}>
            {isPending ? "作成中..." : "オーダーを作成"}
          </Button>
        </div>
      </form>
    </div>
  );
}
