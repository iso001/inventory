"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";

type InboundRecord = {
  id: string;
  quantity: number;
  inbound_date: string;
  notes: string | null;
  created_at: string;
  product: { name: string; sku: string; unit: string } | null;
  supplier: { name: string } | null;
};

export function InboundTable({ records }: { records: InboundRecord[] }) {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">入庫履歴</h2>
        <Link
          href="/inbound/new"
          className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
        >
          <Plus size={14} />
          入庫を登録
        </Link>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>入庫日</TableHead>
              <TableHead>製品名</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>仕入先</TableHead>
              <TableHead className="text-right">数量</TableHead>
              <TableHead>備考</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  入庫記録がありません
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="whitespace-nowrap">{record.inbound_date}</TableCell>
                  <TableCell className="font-medium">{record.product?.name ?? "-"}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {record.product?.sku ?? "-"}
                  </TableCell>
                  <TableCell>{record.supplier?.name ?? "-"}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">
                      +{record.quantity} {record.product?.unit ?? ""}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-40 truncate">
                    {record.notes ?? "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
