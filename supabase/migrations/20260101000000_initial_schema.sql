-- ============================================================
-- 在庫管理システム 初期スキーマ
-- ============================================================

-- ============================================================
-- 1. user_profiles (ユーザープロファイル・ロール管理)
-- ============================================================
CREATE TABLE user_profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role        text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  display_name text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 新規ユーザー登録時に自動でプロファイルを作成するトリガー
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 2. products (商品マスタ)
-- ============================================================
CREATE TABLE products (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  sku         text NOT NULL UNIQUE,
  category    text,
  unit        text NOT NULL DEFAULT '個',
  description text,
  min_stock   integer NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. stock (在庫)
-- ============================================================
CREATE TABLE stock (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL UNIQUE REFERENCES products ON DELETE CASCADE,
  quantity    integer NOT NULL DEFAULT 0,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 商品作成時に在庫レコードを自動作成するトリガー
CREATE OR REPLACE FUNCTION handle_new_product()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.stock (product_id, quantity)
  VALUES (NEW.id, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_product_created
  AFTER INSERT ON products
  FOR EACH ROW EXECUTE FUNCTION handle_new_product();

-- ============================================================
-- 4. suppliers (仕入先マスタ)
-- ============================================================
CREATE TABLE suppliers (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  contact_name text,
  email        text,
  phone        text,
  address      text,
  notes        text,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. customers (納入先マスタ)
-- ============================================================
CREATE TABLE customers (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  contact_name text,
  email        text,
  phone        text,
  address      text,
  notes        text,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 6. inbound_records (入庫記録)
-- ============================================================
CREATE TABLE inbound_records (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   uuid NOT NULL REFERENCES products ON DELETE RESTRICT,
  supplier_id  uuid NOT NULL REFERENCES suppliers ON DELETE RESTRICT,
  quantity     integer NOT NULL CHECK (quantity > 0),
  inbound_date date NOT NULL DEFAULT CURRENT_DATE,
  created_by   uuid NOT NULL REFERENCES auth.users ON DELETE RESTRICT,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- 入庫時に在庫を加算するトリガー
CREATE OR REPLACE FUNCTION update_stock_on_inbound()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE stock
  SET quantity   = quantity + NEW.quantity,
      updated_at = now()
  WHERE product_id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_inbound_created
  AFTER INSERT ON inbound_records
  FOR EACH ROW EXECUTE FUNCTION update_stock_on_inbound();

-- ============================================================
-- 7. orders (出荷オーダー)
-- ============================================================
CREATE TABLE orders (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  customer_id  uuid NOT NULL REFERENCES customers ON DELETE RESTRICT,
  status       text NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft', 'confirmed', 'shipped', 'cancelled')),
  order_date   date NOT NULL DEFAULT CURRENT_DATE,
  shipped_date date,
  created_by   uuid NOT NULL REFERENCES auth.users ON DELETE RESTRICT,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- オーダー番号の自動採番 (ORD-YYYYMMDD-XXXX 形式)
CREATE SEQUENCE order_number_seq;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'ORD-' ||
    TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' ||
    LPAD(nextval('order_number_seq')::text, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- ============================================================
-- 8. order_items (オーダー明細)
-- ============================================================
CREATE TABLE order_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   uuid NOT NULL REFERENCES orders ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products ON DELETE RESTRICT,
  quantity   integer NOT NULL CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id, product_id)
);

-- 出荷確定時(shipped)に在庫を減算するトリガー
CREATE OR REPLACE FUNCTION update_stock_on_shipped()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'shipped' AND OLD.status != 'shipped' THEN
    UPDATE stock s
    SET quantity   = s.quantity - oi.quantity,
        updated_at = now()
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND s.product_id = oi.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_order_shipped
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_stock_on_shipped();

-- ============================================================
-- 9. updated_at 自動更新トリガー (共通)
-- ============================================================
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER touch_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER touch_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER touch_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER touch_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER touch_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ============================================================
-- 10. Row Level Security (RLS)
-- ============================================================
ALTER TABLE user_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock          ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbound_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items    ENABLE ROW LEVEL SECURITY;

-- ロール取得用ヘルパー関数
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text AS $$
  SELECT role FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- user_profiles
CREATE POLICY "ユーザーは自身のプロファイルを参照できる"
  ON user_profiles FOR SELECT
  USING (id = auth.uid() OR get_user_role() = 'admin');

CREATE POLICY "管理者はプロファイルを更新できる"
  ON user_profiles FOR UPDATE
  USING (id = auth.uid() OR get_user_role() = 'admin');

-- products (認証済み全員が参照、adminのみ変更)
CREATE POLICY "認証済みユーザーは商品を参照できる"
  ON products FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "管理者は商品を作成できる"
  ON products FOR INSERT
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "管理者は商品を更新できる"
  ON products FOR UPDATE
  USING (get_user_role() = 'admin');

CREATE POLICY "管理者は商品を削除できる"
  ON products FOR DELETE
  USING (get_user_role() = 'admin');

-- stock (認証済み全員が参照、更新はトリガーのみ)
CREATE POLICY "認証済みユーザーは在庫を参照できる"
  ON stock FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- suppliers
CREATE POLICY "認証済みユーザーは仕入先を参照できる"
  ON suppliers FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "管理者は仕入先を作成できる"
  ON suppliers FOR INSERT
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "管理者は仕入先を更新できる"
  ON suppliers FOR UPDATE
  USING (get_user_role() = 'admin');

CREATE POLICY "管理者は仕入先を削除できる"
  ON suppliers FOR DELETE
  USING (get_user_role() = 'admin');

-- customers
CREATE POLICY "認証済みユーザーは納入先を参照できる"
  ON customers FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "管理者は納入先を作成できる"
  ON customers FOR INSERT
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "管理者は納入先を更新できる"
  ON customers FOR UPDATE
  USING (get_user_role() = 'admin');

CREATE POLICY "管理者は納入先を削除できる"
  ON customers FOR DELETE
  USING (get_user_role() = 'admin');

-- inbound_records
CREATE POLICY "認証済みユーザーは入庫記録を参照できる"
  ON inbound_records FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "認証済みユーザーは入庫を記録できる"
  ON inbound_records FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- orders
CREATE POLICY "認証済みユーザーはオーダーを参照できる"
  ON orders FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "認証済みユーザーはオーダーを作成できる"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "認証済みユーザーはshipped前のオーダーを更新できる"
  ON orders FOR UPDATE
  USING (auth.uid() IS NOT NULL AND status != 'shipped');

CREATE POLICY "管理者はオーダーを削除できる"
  ON orders FOR DELETE
  USING (get_user_role() = 'admin');

-- order_items
CREATE POLICY "認証済みユーザーはオーダー明細を参照できる"
  ON order_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "認証済みユーザーはオーダー明細を作成できる"
  ON order_items FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "認証済みユーザーはオーダー明細を更新できる"
  ON order_items FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "認証済みユーザーはオーダー明細を削除できる"
  ON order_items FOR DELETE
  USING (auth.uid() IS NOT NULL);
