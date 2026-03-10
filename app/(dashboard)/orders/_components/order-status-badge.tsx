import { Badge } from "@/components/ui/badge";

const STATUS_LABELS: Record<string, string> = {
  draft: "下書き",
  confirmed: "確認済み",
  shipped: "出荷済み",
  cancelled: "キャンセル",
};

const STATUS_VARIANTS: Record<string, "secondary" | "default" | "outline" | "destructive"> = {
  draft: "secondary",
  confirmed: "default",
  shipped: "outline",
  cancelled: "destructive",
};

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={STATUS_VARIANTS[status] ?? "secondary"}>
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
