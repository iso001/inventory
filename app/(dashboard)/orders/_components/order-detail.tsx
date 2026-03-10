"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { OrderStatusBadge } from "./order-status-badge";
import { updateOrderStatus } from "../actions";

type OrderItem = {
  id: string;
  quantity: number;
  product: { name: string; sku: string; unit: string } | null;
};

type Order = {
  id: string;
  order_number: string;
  status: string;
  order_date: string;
  shipped_date: string | null;
  notes: string | null;
  customer: { name: string; contact_name: string | null } | null;
  items: OrderItem[];
};

// ステータス遷移の定義
const NEXT_STATUS: Record<string, { label: string; next: string } | null> = {
  draft: { label: "確認済みにする", next: "confirmed" },
  confirmed: { label: "出荷済みにする", next: "shipped" },
  shipped: null,
  cancelled: null,
};

export function OrderDetail({ order }: { order: Order }) {
  const [isPending, startTransition] = useTransition();

  const nextAction = NEXT_STATUS[order.status];
  const canCancel = order.status === "draft" || order.status === "confirmed";

  function handleStatusUpdate(status: string) {
    startTransition(async () => {
      await updateOrderStatus(order.id, status);
    });
  }

  return (
    <div className="max-w-2xl flex flex-col gap-5">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Link href="/orders" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          戻る
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold font-mono">{order.order_number}</h2>
            <OrderStatusBadge status={order.status} />
          </div>
        </div>

        {/* ステータス変更ボタン */}
        <div className="flex gap-2">
          {nextAction && (
            <Button
              size="sm"
              onClick={() => handleStatusUpdate(nextAction.next)}
              disabled={isPending}
            >
              {isPending ? "更新中..." : nextAction.label}
            </Button>
          )}
          {canCancel && (
            <AlertDialog>
              <AlertDialogTrigger
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                disabled={isPending}
              >
                キャンセル
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>オーダーをキャンセルしますか？</AlertDialogTitle>
                  <AlertDialogDescription>
                    {order.order_number} をキャンセルします。この操作は取り消せません。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>戻る</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleStatusUpdate("cancelled")}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    キャンセルする
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* 基本情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">基本情報</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">納入先</p>
            <p className="font-medium">{order.customer?.name ?? "-"}</p>
            {order.customer?.contact_name && (
              <p className="text-muted-foreground">{order.customer.contact_name}</p>
            )}
          </div>
          <div>
            <p className="text-muted-foreground mb-1">ステータス</p>
            <OrderStatusBadge status={order.status} />
          </div>
          <div>
            <p className="text-muted-foreground mb-1">オーダー日</p>
            <p>{order.order_date}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">出荷日</p>
            <p>{order.shipped_date ?? "-"}</p>
          </div>
          {order.notes && (
            <div className="col-span-2">
              <p className="text-muted-foreground mb-1">備考</p>
              <p>{order.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 出荷製品 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">出荷製品</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>製品名</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">数量</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.product?.name ?? "-"}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {item.product?.sku ?? "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline">
                      {item.quantity} {item.product?.unit ?? ""}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
