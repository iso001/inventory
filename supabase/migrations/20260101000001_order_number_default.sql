-- order_number はトリガーで自動採番するため DEFAULT '' を設定
-- これにより TypeScript の Insert 型で optional になる
ALTER TABLE orders ALTER COLUMN order_number SET DEFAULT '';
