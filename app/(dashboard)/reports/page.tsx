import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MonthlyChart } from "./_components/monthly-chart";
import { SupplierRanking } from "./_components/supplier-ranking";
import { CustomerRanking } from "./_components/customer-ranking";

// 過去6ヶ月の月ラベルを生成 ["2025-10", ..., "2026-03"] 形式
function getLast6Months(): { month: string; label: string }[] {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (5 - i));
    const month = d.toISOString().substring(0, 7);
    const label = `${d.getMonth() + 1}月`;
    return { month, label };
  });
}

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const months = getLast6Months();
  const since = months[0].month + "-01"; // 6ヶ月前の1日

  // 入庫記録を取得
  const { data: inboundRecords } = await supabase
    .from("inbound_records")
    .select("quantity, inbound_date, supplier:suppliers(name)")
    .gte("inbound_date", since);

  // 出荷済みオーダーの明細を取得
  const { data: shippedItems } = await supabase
    .from("order_items")
    .select("quantity, order:orders!inner(shipped_date, status, customer:customers(name))")
    .eq("order.status", "shipped")
    .gte("order.shipped_date", since);

  // ── 月別入出庫グラフデータの集計 ──
  const inboundByMonth: Record<string, number> = {};
  for (const r of inboundRecords ?? []) {
    const m = r.inbound_date.substring(0, 7);
    inboundByMonth[m] = (inboundByMonth[m] ?? 0) + r.quantity;
  }

  const outboundByMonth: Record<string, number> = {};
  for (const item of shippedItems ?? []) {
    const order = Array.isArray(item.order) ? item.order[0] : item.order;
    if (!order?.shipped_date) continue;
    const m = order.shipped_date.substring(0, 7);
    outboundByMonth[m] = (outboundByMonth[m] ?? 0) + item.quantity;
  }

  const monthlyData = months.map(({ month, label }) => ({
    month,
    label,
    inbound: inboundByMonth[month] ?? 0,
    outbound: outboundByMonth[month] ?? 0,
  }));

  // ── 仕入先別入庫量の集計 ──
  const supplierMap: Record<string, { total: number; recordCount: number }> = {};
  for (const r of inboundRecords ?? []) {
    const name = (Array.isArray(r.supplier) ? r.supplier[0] : r.supplier)?.name ?? "不明";
    if (!supplierMap[name]) supplierMap[name] = { total: 0, recordCount: 0 };
    supplierMap[name].total += r.quantity;
    supplierMap[name].recordCount += 1;
  }
  const supplierRanking = Object.entries(supplierMap)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.total - a.total);

  // ── 納入先別出荷量の集計 ──
  const customerMap: Record<string, { total: number; orderIds: Set<string> }> = {};
  for (const item of shippedItems ?? []) {
    const order = Array.isArray(item.order) ? item.order[0] : item.order;
    const name = (Array.isArray(order?.customer) ? order.customer[0] : order?.customer)?.name ?? "不明";
    if (!customerMap[name]) customerMap[name] = { total: 0, orderIds: new Set() };
    customerMap[name].total += item.quantity;
  }
  const customerRanking = Object.entries(customerMap)
    .map(([name, v]) => ({ name, total: v.total, orderCount: v.orderIds.size }))
    .sort((a, b) => b.total - a.total);

  // 納入先別のオーダー件数を別途集計（order_idの重複除去）
  const customerOrderCount: Record<string, Set<string>> = {};
  for (const item of shippedItems ?? []) {
    const order = Array.isArray(item.order) ? item.order[0] : item.order;
    if (!order) continue;
    const name = (Array.isArray(order.customer) ? order.customer[0] : order.customer)?.name ?? "不明";
    if (!customerOrderCount[name]) customerOrderCount[name] = new Set();
  }

  // orderCountをorderIdsのsizeで上書き（Set使用で重複排除）
  const customerRankingFinal = customerRanking.map((r) => ({
    ...r,
    orderCount: customerOrderCount[r.name]?.size ?? r.orderCount,
  }));

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold">レポート</h2>
      <p className="text-sm text-muted-foreground -mt-4">
        集計期間: {months[0].month} 〜 {months[5].month}
      </p>

      <MonthlyChart data={monthlyData} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SupplierRanking rows={supplierRanking} />
        <CustomerRanking rows={customerRankingFinal} />
      </div>
    </div>
  );
}
