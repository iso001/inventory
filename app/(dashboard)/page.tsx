import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle, PackagePlus, ClipboardList } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();

  // 在庫一覧（商品情報と結合）
  const { data: stockItems } = await supabase
    .from("stock")
    .select("quantity, product:products(name, sku, unit, min_stock, is_active)")
    .order("quantity");

  // アラート対象（在庫数が最低在庫数以下）
  const alertItems = stockItems?.filter(
    (item) =>
      item.product &&
      !Array.isArray(item.product) &&
      item.product.is_active &&
      item.quantity <= item.product.min_stock
  ) ?? [];

  // 今日の入庫件数
  const today = new Date().toISOString().split("T")[0];
  const { count: todayInbound } = await supabase
    .from("inbound_records")
    .select("*", { count: "exact", head: true })
    .eq("inbound_date", today);

  // 進行中のオーダー件数（draft + confirmed）
  const { count: activeOrders } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .in("status", ["draft", "confirmed"]);

  // 商品総数
  const { count: productCount } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold">ダッシュボード</h2>

      {/* サマリーカード */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">商品数</CardTitle>
            <Package size={16} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{productCount ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">在庫アラート</CardTitle>
            <AlertTriangle size={16} className={alertItems.length > 0 ? "text-destructive" : "text-muted-foreground"} />
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${alertItems.length > 0 ? "text-destructive" : ""}`}>
              {alertItems.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">本日の入庫</CardTitle>
            <PackagePlus size={16} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{todayInbound ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">進行中のオーダー</CardTitle>
            <ClipboardList size={16} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeOrders ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* 在庫アラート */}
      {alertItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle size={16} />
              在庫アラート — 最低在庫数を下回っています
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {alertItems.map((item) => {
                const product = Array.isArray(item.product) ? item.product[0] : item.product;
                if (!product) return null;
                return (
                  <div
                    key={product.sku}
                    className="flex items-center justify-between rounded-md border border-destructive/30 bg-destructive/5 px-4 py-2"
                  >
                    <div>
                      <span className="font-medium text-sm">{product.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{product.sku}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        最低: {product.min_stock} {product.unit}
                      </span>
                      <Badge variant="destructive">
                        現在: {item.quantity} {product.unit}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 在庫一覧 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">在庫状況</CardTitle>
        </CardHeader>
        <CardContent>
          {!stockItems || stockItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">商品が登録されていません</p>
          ) : (
            <div className="flex flex-col gap-1">
              {stockItems.map((item) => {
                const product = Array.isArray(item.product) ? item.product[0] : item.product;
                if (!product || !product.is_active) return null;
                const isAlert = item.quantity <= product.min_stock;
                return (
                  <div
                    key={product.sku}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <span className="text-sm font-medium">{product.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{product.sku}</span>
                    </div>
                    <Badge variant={isAlert ? "destructive" : "secondary"}>
                      {item.quantity} {product.unit}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
