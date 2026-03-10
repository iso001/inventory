# 在庫管理システム 開発記録

初学者がNext.js + Supabaseのプロジェクト構築の流れを学べるよう、実際に行った手順と判断の理由を記録しています。

---

## 目次

1. [プロジェクトの出発点](#1-プロジェクトの出発点)
2. [仕様の整理](#2-仕様の整理)
3. [技術スタックの選定](#3-技術スタックの選定)
4. [Phase 1: 基盤構築](#4-phase-1-基盤構築)
5. [Phase 2: マスタ管理](#5-phase-2-マスタ管理)
6. [学んだパターンと概念](#6-学んだパターンと概念)

---

## 1. プロジェクトの出発点

`create-next-app` で作成済みのNext.jsプロジェクトがあった状態からスタート。

```
初期状態のpackage.json:
- next: 16.1.6
- react: 19.2.3
- tailwindcss: ^4（v4系）
- typescript
```

**ポイント**: Tailwind CSS v4はv3と設定方法が大きく変わっている。`tailwind.config.ts` が不要になり、CSSファイルに `@import "tailwindcss"` と書くだけになった。

---

## 2. 仕様の整理

コードを書く前に、以下のドキュメントを作成した。

| ファイル | 内容 |
|---|---|
| `docs/SPEC.md` | システム概要・機能一覧・画面一覧・ビジネスルール |
| `docs/DB_SCHEMA.md` | テーブル定義・RLS方針・トリガー設計 |
| `docs/DEVELOPMENT.md` | ローカル環境のセットアップ手順 |

**なぜ先にドキュメントを作るのか**: 実装中に「このデータはどこに持つか」「誰が操作できるか」といった判断が必要になる。事前に整理しておくと迷いが減り、コードの一貫性が保てる。

---

## 3. 技術スタックの選定

```
フロントエンド: Next.js 15+ (App Router)
UIコンポーネント: shadcn/ui
データベース/認証: Supabase
デプロイ: Vercel
ローカル開発: Supabase CLI + Docker
```

### Supabaseとは

```
┌─────────────────────────────────────────┐
│              Supabase                   │
│                                         │
│  ┌──────────┐  ┌──────────┐  ┌───────┐ │
│  │PostgreSQL│  │  Auth    │  │Storage│ │
│  │  (DB)   │  │(認証機能) │  │(ファイル)│ │
│  └──────────┘  └──────────┘  └───────┘ │
└─────────────────────────────────────────┘
         ↑                    ↑
   開発時はローカル        本番はクラウド
   (Docker上で動く)      (supabase.com)
```

- PostgreSQLをホスティングしてくれるサービス
- 認証機能（メール/パスワード、OAuth等）が最初から組み込まれている
- `supabase-js` というJavaScriptライブラリでNext.jsから操作する
- **Supabase CLI**を使うと、ローカルのDockerに本番と同じ環境を再現できる

### shadcn/uiとは

- Button、Card、Dialog などのUIコンポーネント集
- インストールするとコンポーネントのソースコードが `components/ui/` にコピーされる
- ライブラリとして依存するのではなく、**コードを所有する**スタイル（自由にカスタマイズできる）
- Tailwind CSSベースで動作する

---

## 4. Phase 1: 基盤構築

### 4-1. パッケージのインストール

```bash
# Supabaseのクライアントライブラリ
npm install @supabase/supabase-js @supabase/ssr

# shadcn/uiの初期化（-d でデフォルト設定）
npx shadcn@latest init -d

# Supabase CLIをプロジェクトにインストール（グローバルではなくローカル）
npm install --save-dev supabase
```

**`@supabase/ssr` とは**: サーバーサイドレンダリング対応のSupabaseヘルパー。Next.jsのApp Routerで認証を正しく扱うために必要。

**shadcn/uiの初期化で何が起きるか**:
- `components.json` (設定ファイル) が作成される
- `components/ui/button.tsx` (初期コンポーネント) が生成される
- `lib/utils.ts` (ユーティリティ関数) が作成される
- `app/globals.css` にCSSカスタム変数が追加される

### 4-2. Supabase CLIの初期化

```bash
# supabase/ ディレクトリとconfig.tomlが作成される
npx supabase init

# Dockerを使ってローカルのSupabaseを起動
npm run supabase:start   # package.jsonに追加したショートカット
```

起動後に表示される情報：

| 項目 | 説明 |
|---|---|
| Project URL | アプリからSupabaseに接続するURL |
| Publishable (旧: anon key) | フロントエンドから使う公開キー |
| Secret (旧: service_role key) | サーバーサイドのみで使う秘密キー |
| Studio URL | ローカルの管理画面 (http://127.0.0.1:54323) |

**Supabase Studioとは**: テーブルのデータ確認・編集、SQLの実行、ユーザー管理などができるGUI管理画面。開発中のデバッグに非常に便利。

### 4-3. 環境変数の設定

`.env.local` ファイル（Gitにはコミットしない）に接続情報を記載：

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=（Publishableの値）
SUPABASE_SERVICE_ROLE_KEY=（Secretの値）
```

**`NEXT_PUBLIC_` プレフィックスの意味**: この接頭辞をつけた環境変数はブラウザ（クライアントサイド）にも公開される。つけないものはサーバーサイドのみで使える。`SERVICE_ROLE_KEY` は強力な権限を持つため、絶対にクライアントに公開してはいけない。

### 4-4. データベースのマイグレーション

マイグレーションとは「DBの構造変更をSQLファイルで管理する仕組み」。

```
supabase/
└── migrations/
    └── 20260101000000_initial_schema.sql  ← このファイルにSQLを書く
```

ファイル名の先頭はタイムスタンプ。複数のマイグレーションがある場合、この順番で適用される。

```bash
# DBを初期状態にリセットして全マイグレーションを再適用
npm run supabase:reset
```

**`supabase/seed.sql`**: `supabase:reset` 実行時に自動で投入される開発用の初期データ。本番には影響しない。

#### 作成したテーブル一覧

```
user_profiles   ← ユーザーのロール（admin/user）を管理
products        ← 商品マスタ
stock           ← 在庫数（productsと1対1）
suppliers       ← 仕入先マスタ
customers       ← 納入先マスタ
inbound_records ← 入庫記録
orders          ← 出荷オーダー
order_items     ← オーダー明細（ordersと1対多）
```

#### データベーストリガーで自動化したこと

手動で在庫数を管理するとバグの原因になるため、DBのトリガー（特定の操作時に自動実行されるSQL）で制御した：

| トリガー | タイミング | 処理 |
|---|---|---|
| `on_auth_user_created` | ユーザー登録時 | `user_profiles` レコードを自動作成 |
| `on_product_created` | 商品作成時 | `stock` レコードを自動作成（初期在庫0） |
| `on_inbound_created` | 入庫記録作成時 | `stock.quantity` に入庫数を加算 |
| `on_order_shipped` | オーダーがshippedに変更時 | `stock.quantity` から出荷数を減算 |

#### Row Level Security (RLS) とは

Supabaseは「RLS（行レベルセキュリティ）」というPostgreSQLの機能でアクセス制御する。

```sql
-- 例: 認証済みユーザーのみ商品を参照できるポリシー
CREATE POLICY "認証済みユーザーは商品を参照できる"
  ON products FOR SELECT
  USING (auth.uid() IS NOT NULL);
```

RLSを有効にすると、ポリシーで明示的に許可されない限りデータにアクセスできない。これにより、たとえAPIキーが漏れても「自分のデータしか見られない」「管理者しか削除できない」といった制御が担保される。

### 4-5. TypeScript型の自動生成

```bash
npm run supabase:types
# → types/database.types.ts が生成される
```

このコマンドでDBのスキーマからTypeScriptの型が自動生成される。

```typescript
// 使用例
import type { Tables } from "@/types/database.types";

type Product = Tables<"products">;
// Product型には name, sku, category... などのフィールドが含まれる
```

**スキーマを変更したら必ず再生成すること。**

### 4-6. Supabaseクライアントの作成

Next.jsのApp Routerでは、**サーバーサイド**と**クライアントサイド**で使うSupabaseクライアントを分けて作る。

```
lib/supabase/
├── client.ts  ← "use client" コンポーネントで使う
└── server.ts  ← Server Components や Server Actions で使う
```

なぜ分けるのか：
- サーバー側はCookieにアクセスしてセッションを検証できる
- クライアント側はブラウザのCookieを自動管理する

### 4-7. 認証プロキシ（Next.js 16の変更点）

Next.js 15以前では `middleware.ts` というファイルで「すべてのリクエストを処理前にインターセプト」していた。Next.js 16で `proxy.ts` にリネームされ、エクスポートする関数名も `proxy` または `default` になった。

```typescript
// proxy.ts
export default async function proxy(request: NextRequest) {
  // セッションを確認
  const { data: { user } } = await supabase.auth.getUser()

  // 未ログインなら /login にリダイレクト
  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    redirect('/login')
  }
}
```

### 4-8. ディレクトリ構成：Route Groups

Next.jsの「Route Groups」という機能を使い、ログインページとダッシュボード系ページで別々のレイアウトを適用した。

```
app/
├── (auth)/          ← () で囲むとURLに影響しない「グループ」
│   ├── layout.tsx   → ログインページ専用レイアウト（中央揃え）
│   └── login/
│       ├── page.tsx    → /login
│       └── actions.ts  → ログイン・ログアウト処理
└── (dashboard)/
    ├── layout.tsx   → サイドバー + ヘッダーを含むレイアウト
    └── page.tsx     → / (ダッシュボード)
```

`(auth)` と `(dashboard)` はURLには現れない。`app/(dashboard)/page.tsx` のURLは `/` になる。

---

## 5. Phase 2: マスタ管理

商品・仕入先・納入先の3つのマスタ管理ページを実装した。

### 5-1. shadcn/uiコンポーネントの追加

```bash
npx shadcn@latest add card label input badge separator
npx shadcn@latest add dialog table select textarea switch alert-dialog dropdown-menu
```

必要になったタイミングで都度追加する。

### 5-2. Server Actions（サーバーアクション）

フォームのデータを受け取ってDBを更新する処理は「Server Actions」として実装した。

```typescript
// actions.ts
"use server";  ← このディレクティブでServer Actionになる

export async function createProduct(formData: FormData) {
  // サーバー上で実行されるコード
  const supabase = await createClient();
  await supabase.from("products").insert({ ... });
  revalidatePath("/products");  // ページのキャッシュを更新
}
```

**Server Actionsの利点**:
- フォーム送信処理をサーバー上で実行できる
- APIエンドポイント（`/api/...`）を別途作る必要がない
- フォームが送信されるとサーバー上で直接実行される

**セキュリティの注意点**: Server Action内でも必ず認証・認可チェックを行う。クライアントから直接呼び出せるため、「管理者のみ実行可能」な処理は必ずサーバー側でロールを確認する。

```typescript
async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("user_profiles").select("role").eq("id", user.id).single();

  if (profile?.role !== "admin") throw new Error("Forbidden");
  return supabase;
}
```

### 5-3. Server Components と Client Components の分離

Next.jsのApp Routerでは、デフォルトでコンポーネントはサーバー上でレンダリングされる（Server Component）。

```
page.tsx (Server Component)
  ↓ DBからデータを取得してpropsとして渡す
product-table.tsx (Client Component: "use client")
  ↓ ボタンクリックなどのインタラクションを担当
product-form.tsx (Client Component: "use client")
  ↓ モーダルフォームの状態管理・送信
```

**なぜ分けるのか**:
- Server Componentはサーバーでのみ実行されるため、DBに直接アクセスできる
- Client Componentはブラウザで実行されるため、`useState` や `onClick` が使える
- `"use client"` を書かない限りServer Component

### 5-4. ファイル構成パターン：`_components/`

各ページのサブコンポーネントは `_components/` ディレクトリに配置した：

```
products/
├── page.tsx                      ← Server Component（データ取得）
├── actions.ts                    ← Server Actions（DB操作）
└── _components/
    ├── product-table.tsx         ← Client Component（テーブル表示・操作）
    └── product-form.tsx          ← Client Component（フォームダイアログ）
```

`_` プレフィックスをつけたディレクトリはNext.jsのルーティングから除外される（URLにならない）。

### 5-5. @base-ui/react の注意点

このプロジェクトのshadcn/uiは内部で `@base-ui/react` を使っている（Radix UIの後継）。
Radix UIとAPIが一部異なるため、注意が必要な点：

| 機能 | Radix UI（旧） | @base-ui/react（新） |
|---|---|---|
| 子要素を別コンポーネントにする | `asChild` prop | `render` prop または `className` 直渡し |
| Selectの値変更ハンドラ | `(value: string) => void` | `(value: string \| null, ...) => void` |

```typescript
// 旧（Radix UI）: asChild でButtonに見た目を委譲
<DropdownMenuTrigger asChild>
  <Button variant="ghost">...</Button>
</DropdownMenuTrigger>

// 新（@base-ui/react）: classNameを直接指定
<DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost" }))}>
  ...
</DropdownMenuTrigger>
```

---

## 6. 学んだパターンと概念

### 認証フロー

```
1. ブラウザが / にアクセス
   ↓
2. proxy.ts が全リクエストをインターセプト
   ↓
3. Supabase Auth でセッション確認
   ↓ 未ログイン             ↓ ログイン済み
4. /login にリダイレクト   5. そのままページを表示
   ↓
6. ログインフォームを送信
   ↓
7. Server Action (login) が実行
   ↓
8. supabase.auth.signInWithPassword() でセッション確立
   ↓
9. / にリダイレクト → ダッシュボード表示
```

### データの流れ（Server Component → Client Component）

```typescript
// page.tsx (Server Component)
export default async function ProductsPage() {
  const supabase = await createClient();            // 1. サーバーでクライアント作成
  const { data: products } = await supabase         // 2. DBから取得
    .from("products").select("*, stock(quantity)");

  return <ProductTable products={products} />;      // 3. Client Componentに渡す
}

// _components/product-table.tsx (Client Component)
"use client";
export function ProductTable({ products }) {
  const [editTarget, setEditTarget] = useState(null); // 4. Client側でUI状態管理
  // ...
}
```

### revalidatePath とは

Server ActionでDBを更新した後、`revalidatePath("/products")` を呼ぶ。
これはNext.jsのキャッシュを無効化して、次にそのページが表示されるときに最新データを取得させる指示。これを忘れると、DB更新後も古いデータが表示され続ける。

### よく使うSupabaseクエリパターン

```typescript
// 単純な一覧取得
const { data } = await supabase.from("products").select("*").order("name");

// 関連テーブルと結合（JOINの代わり）
const { data } = await supabase
  .from("products")
  .select("*, stock(quantity)");  // products に関連する stock も取得

// 条件付き取得
const { data } = await supabase
  .from("products")
  .select("*")
  .eq("is_active", true)       // WHERE is_active = true
  .order("name");

// 1件取得
const { data } = await supabase
  .from("user_profiles")
  .select("role")
  .eq("id", user.id)
  .single();                   // 1件のみ取得（配列ではなくオブジェクトが返る）

// INSERT
const { error } = await supabase
  .from("products")
  .insert({ name: "...", sku: "..." });

// UPDATE
const { error } = await supabase
  .from("products")
  .update({ name: "..." })
  .eq("id", id);

// DELETE
const { error } = await supabase
  .from("products")
  .delete()
  .eq("id", id);
```

---

## 7. Phase 3: 入庫管理

入庫記録の登録と履歴一覧を実装した。

### ページ構成

```
inbound/
├── page.tsx               ← 入庫履歴一覧（Server Component）
├── actions.ts             ← createInbound（Server Action）
├── new/
│   └── page.tsx           ← 入庫登録フォームページ
└── _components/
    ├── inbound-table.tsx  ← 履歴テーブル
    └── inbound-form.tsx   ← 登録フォーム
```

入庫登録後、DBトリガー（`on_inbound_created`）が自動で在庫数を加算する。

---

## 8. Phase 4: 出庫管理（オーダー）

### 複数製品を動的に追加するフォーム

オーダー明細（複数の製品・数量）をReact stateで配列管理し、送信時にJSONでServer Actionに渡す。

```typescript
// items を JSON 文字列として渡す
formData.set("items", JSON.stringify(items.map(i => ({
  product_id: i.productId,
  quantity: i.quantity,
}))))

// Server Action 側でパース
const items = JSON.parse(formData.get("items") as string)
```

### RLS の WITH CHECK に関する注意点（バグ修正）

PostgreSQL RLS の `UPDATE` ポリシーで `WITH CHECK` を省略すると `USING` 条件が両方に適用される。

```sql
-- 誤り: shipped への更新を自己ブロックしてしまう
USING (status != 'shipped')
-- → WITH CHECK も「新しい行の status != 'shipped'」になる
-- → status='shipped' へのUPDATEが常に失敗

-- 正しい: USING と WITH CHECK を別々に定義
USING (auth.uid() IS NOT NULL AND status != 'shipped')  -- 更新前の条件
WITH CHECK (auth.uid() IS NOT NULL)                      -- 更新後の条件
```

### サービスロールクライアント（admin client）

`auth.users` テーブルはSupabase内部のテーブルで、通常のクライアントからはアクセスできない。`SUPABASE_SERVICE_ROLE_KEY` を使うサービスロールクライアントはRLSをバイパスして全データにアクセスできる。

```typescript
// lib/supabase/admin.ts
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,  // 秘密鍵：絶対にクライアントに渡さない
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// 使用例（Server Action内のみ）
const adminClient = createAdminClient()
const { data } = await adminClient.auth.admin.listUsers()
const { data } = await adminClient.auth.admin.createUser({ email, password, email_confirm: true })
```

### @base-ui/react の SelectValue 表示問題

`@base-ui/react` の `Select.Value` は選択した `value` 属性（UUID等）をそのまま表示する。Radix UI のように `ItemText` の内容を自動で表示しない。

解決策: React state から直接、選択されたアイテムの名前を表示する。

```tsx
// SelectValue を使わず state から名前を表示
<SelectTrigger>
  <span className={selected ? "" : "text-muted-foreground"}>
    {selected ? items.find(i => i.id === selected)?.name : "選択してください"}
  </span>
</SelectTrigger>
```

---

## 9. Phase 5: レポート

### recharts でのグラフ実装

`recharts` は Client Component として動作するため、データ取得（Server Component）と描画（Client Component）を分離する。

```
page.tsx (Server Component)
  → DB からデータ取得
  → JavaScript で集計（月別グループ化、ランキング）
  → Client Component に整形済みデータを渡す

monthly-chart.tsx (Client Component, "use client")
  → recharts の BarChart でグラフ描画
```

### サーバーサイドでの集計パターン

```typescript
// 月ごとにグループ化して合計する
const byMonth: Record<string, number> = {}
for (const record of records) {
  const month = record.date.substring(0, 7)  // "YYYY-MM"
  byMonth[month] = (byMonth[month] ?? 0) + record.quantity
}
```

---

## 現在の進捗

| Phase | 内容 | 状態 |
|---|---|---|
| Phase 1 | 基盤構築（認証・レイアウト・DB） | 完了 |
| Phase 2 | マスタ管理（商品・仕入先・納入先） | 完了 |
| Phase 3 | 入庫管理 | 完了 |
| Phase 4 | 出庫管理（オーダー） | 完了 |
| Phase 5 | レポート | 完了 |
| Phase 6 | ユーザー管理 | 完了 |

---

## 開発コマンドチートシート

```bash
# 開発サーバー起動
npm run dev

# Supabase（Docker）起動
npm run supabase:start

# Supabase停止
npm run supabase:stop

# DBリセット（マイグレーション再適用 + seed投入）
npm run supabase:reset

# TypeScript型を再生成（スキーマ変更後に必ず実行）
npm run supabase:types

# 型チェック
npx tsc --noEmit

# shadcn/uiコンポーネントを追加
npx shadcn@latest add <component-name>
```
