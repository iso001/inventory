"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
import { OrderStatusBadge } from "./order-status-badge";

type Order = {
  id: string;
  order_number: string;
  status: string;
  order_date: string;
  shipped_date: string | null;
  customer: { name: string } | null;
  item_count: number;
};

export function OrderTable({ orders }: { orders: Order[] }) {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">オーダー一覧</h2>
        <Link
          href="/orders/new"
          className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
        >
          <Plus size={14} />
          オーダーを作成
        </Link>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>オーダー番号</TableHead>
              <TableHead>納入先</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead>オーダー日</TableHead>
              <TableHead>出荷日</TableHead>
              <TableHead className="text-right">製品種類数</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  オーダーがありません
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow
                  key={order.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => window.location.href = `/orders/${order.id}`}
                >
                  <TableCell className="font-mono text-sm font-medium">
                    {order.order_number}
                  </TableCell>
                  <TableCell>{order.customer?.name ?? "-"}</TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell>{order.order_date}</TableCell>
                  <TableCell>{order.shipped_date ?? "-"}</TableCell>
                  <TableCell className="text-right">{order.item_count} 種</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
