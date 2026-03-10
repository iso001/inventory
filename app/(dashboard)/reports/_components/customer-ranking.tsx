"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CustomerRow = {
  name: string;
  total: number;
  orderCount: number;
};

export function CustomerRanking({ rows }: { rows: CustomerRow[] }) {
  const max = rows[0]?.total ?? 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">納入先別 出荷量（出荷済みのみ）</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">データがありません</p>
        ) : (
          <div className="flex flex-col gap-3">
            {rows.map((row, i) => (
              <div key={row.name} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="text-muted-foreground w-4 text-right">{i + 1}</span>
                    <span className="font-medium">{row.name}</span>
                  </span>
                  <span className="text-muted-foreground">
                    {row.total.toLocaleString()} ({row.orderCount}件)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-green-500"
                    style={{ width: `${(row.total / max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
