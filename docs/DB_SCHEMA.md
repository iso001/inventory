# データベーススキーマ

## ER図 (概要)

```
users (Supabase Auth)
  └─ user_profiles (ロール管理)

products (商品マスタ)
  ├─ inbound_records (入庫記録)
  ├─ order_items (オーダー明細)
  └─ stock (在庫)

suppliers (仕入先マスタ)
  └─ inbound_records

customers (納入先マスタ)
  └─ orders

orders (出荷オーダー)
  └─ order_items
```

---

## テーブル定義

### user_profiles
Supabase Auth の `auth.users` に紐づくプロファイル。

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid (PK, FK → auth.users) | ユーザーID |
| role | text | 'admin' or 'user' |
| display_name | text | 表示名 |
| created_at | timestamptz | 作成日時 |
| updated_at | timestamptz | 更新日時 |

---

### products (商品マスタ)

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid (PK) | 商品ID |
| name | text NOT NULL | 商品名 |
| sku | text UNIQUE NOT NULL | 管理コード (SKU) |
| category | text | カテゴリ |
| unit | text NOT NULL | 単位 (個/箱/kg など) |
| description | text | 説明 |
| min_stock | integer DEFAULT 0 | 最低在庫数 (アラート閾値) |
| is_active | boolean DEFAULT true | 有効フラグ |
| created_at | timestamptz | 作成日時 |
| updated_at | timestamptz | 更新日時 |

---

### stock (在庫)
商品ごとの現在の在庫数。productsと1対1。

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid (PK) | ID |
| product_id | uuid (FK → products) UNIQUE | 商品ID |
| quantity | integer DEFAULT 0 | 現在の在庫数 |
| updated_at | timestamptz | 最終更新日時 |

---

### suppliers (仕入先マスタ)

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid (PK) | 仕入先ID |
| name | text NOT NULL | 仕入先名 |
| contact_name | text | 担当者名 |
| email | text | メールアドレス |
| phone | text | 電話番号 |
| address | text | 住所 |
| notes | text | 備考 |
| is_active | boolean DEFAULT true | 有効フラグ |
| created_at | timestamptz | 作成日時 |
| updated_at | timestamptz | 更新日時 |

---

### customers (納入先マスタ)

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid (PK) | 納入先ID |
| name | text NOT NULL | 納入先名 |
| contact_name | text | 担当者名 |
| email | text | メールアドレス |
| phone | text | 電話番号 |
| address | text | 住所 |
| notes | text | 備考 |
| is_active | boolean DEFAULT true | 有効フラグ |
| created_at | timestamptz | 作成日時 |
| updated_at | timestamptz | 更新日時 |

---

### inbound_records (入庫記録)

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid (PK) | 入庫記録ID |
| product_id | uuid (FK → products) | 商品ID |
| supplier_id | uuid (FK → suppliers) | 仕入先ID |
| quantity | integer NOT NULL | 入庫数量 |
| inbound_date | date NOT NULL | 入庫日 |
| created_by | uuid (FK → auth.users) | 登録ユーザー |
| notes | text | 備考 |
| created_at | timestamptz | 作成日時 |

**トリガー**: INSERT 後に `stock.quantity` を加算する。

---

### orders (出荷オーダー)

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid (PK) | オーダーID |
| order_number | text UNIQUE NOT NULL | オーダー番号 (自動採番) |
| customer_id | uuid (FK → customers) | 納入先ID |
| status | text DEFAULT 'draft' | ステータス (draft / confirmed / shipped / cancelled) |
| order_date | date NOT NULL | オーダー日 |
| shipped_date | date | 出荷日 |
| created_by | uuid (FK → auth.users) | 作成ユーザー |
| notes | text | 備考 |
| created_at | timestamptz | 作成日時 |
| updated_at | timestamptz | 更新日時 |

**ステータス遷移**:
```
draft → confirmed → shipped
  └──────────────→ cancelled (shipped 前のみ)
```

---

### order_items (オーダー明細)

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid (PK) | 明細ID |
| order_id | uuid (FK → orders) | オーダーID |
| product_id | uuid (FK → products) | 商品ID |
| quantity | integer NOT NULL | 出荷数量 |
| created_at | timestamptz | 作成日時 |

**トリガー**: `orders.status` が `shipped` に更新されたとき、対応する全 order_items の数量を `stock.quantity` から減算する。

---

## Row Level Security (RLS) 方針

| テーブル | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| user_profiles | 本人 or admin | - (トリガー自動) | 本人 or admin | admin |
| products | 認証済み全員 | admin | admin | admin |
| stock | 認証済み全員 | - (トリガー自動) | - (トリガー自動) | - |
| suppliers | 認証済み全員 | admin | admin | admin |
| customers | 認証済み全員 | admin | admin | admin |
| inbound_records | 認証済み全員 | admin, user | - | - |
| orders | 認証済み全員 | admin, user | admin, user (shipped前) | admin |
| order_items | 認証済み全員 | admin, user | admin, user (shipped前) | admin, user (shipped前) |

---

## 在庫更新のトリガー設計

```sql
-- 入庫時: stock を増加
CREATE OR REPLACE FUNCTION update_stock_on_inbound()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO stock (product_id, quantity)
  VALUES (NEW.product_id, NEW.quantity)
  ON CONFLICT (product_id)
  DO UPDATE SET
    quantity = stock.quantity + NEW.quantity,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 出荷確定時: stock を減少
CREATE OR REPLACE FUNCTION update_stock_on_shipped()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'shipped' AND OLD.status != 'shipped' THEN
    UPDATE stock s
    SET quantity = s.quantity - oi.quantity,
        updated_at = now()
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND s.product_id = oi.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```
