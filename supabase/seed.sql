-- ============================================================
-- 開発用シードデータ
-- npm run supabase:reset 実行時に自動で投入されます
-- ============================================================

-- 商品マスタ
INSERT INTO products (name, sku, category, unit, description, min_stock) VALUES
  ('製品A-100', 'SKU-A100', '電子部品', '個', 'サンプル製品A', 10),
  ('製品B-200', 'SKU-B200', '電子部品', '個', 'サンプル製品B', 5),
  ('製品C-300', 'SKU-C300', '機械部品', '箱', 'サンプル製品C', 3),
  ('製品D-400', 'SKU-D400', '機械部品', '個', 'サンプル製品D', 20);

-- 仕入先マスタ
INSERT INTO suppliers (name, contact_name, email, phone) VALUES
  ('株式会社サプライヤーA', '山田 太郎', 'yamada@supplier-a.example', '03-0000-0001'),
  ('サプライヤーB商事', '鈴木 花子', 'suzuki@supplier-b.example', '06-0000-0002'),
  ('グローバル仕入先C', '田中 一郎', 'tanaka@supplier-c.example', '052-000-0003');

-- 納入先マスタ
INSERT INTO customers (name, contact_name, email, phone) VALUES
  ('顧客会社X', '佐藤 次郎', 'sato@customer-x.example', '03-1111-0001'),
  ('顧客会社Y', '高橋 三郎', 'takahashi@customer-y.example', '045-111-0002'),
  ('顧客会社Z', '渡辺 四郎', 'watanabe@customer-z.example', '011-111-0003');
