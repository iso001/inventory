# 開発環境セットアップガイド

## 前提条件

- Node.js 18以上
- Docker Desktop (起動済み)
- Supabase CLI

---

## 1. Supabase CLI のインストール

```bash
# macOS (Homebrew)
brew install supabase/tap/supabase

# Windows (Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# npm (どのOSでも)
npm install -g supabase
```

インストール確認:
```bash
supabase --version
```

---

## 2. ローカル Supabase の起動

```bash
# プロジェクトルートで実行
cd /path/to/inventory

# Supabase をローカル初期化 (初回のみ)
supabase init

# Docker でローカル Supabase を起動
supabase start
```

起動後に以下のURLが表示される:

| サービス | URL |
|---|---|
| API (supabase-js で使用) | http://localhost:54321 |
| Studio (管理画面) | http://localhost:54323 |
| DB (psql など直接接続用) | postgresql://localhost:54322 |
| Inbucket (テストメール受信) | http://localhost:54324 |

---

## 3. 環境変数の設定

`.env.local` をプロジェクトルートに作成:

```bash
# supabase start の出力から取得する値を記入
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<表示された anon key>
SUPABASE_SERVICE_ROLE_KEY=<表示された service_role key>
```

**本番用 (Vercel)** は Supabase クラウドプロジェクトの値を Vercel 環境変数に設定する。

---

## 4. マイグレーションの管理

```bash
# 新しいマイグレーションファイルを作成
supabase migration new <migration_name>
# 例: supabase migration new create_products_table

# ローカルDBにマイグレーションを適用
supabase db reset   # 全リセット＋再適用 (開発中はこれが便利)
supabase db push    # 差分のみ適用
```

マイグレーションファイルは `supabase/migrations/` に保存される。
このファイルをGitで管理することで、チーム全員が同じDB構造を使える。

---

## 5. 型の自動生成

Supabase はDBスキーマから TypeScript 型を自動生成できる。

```bash
# ローカルDBから型を生成
supabase gen types typescript --local > src/types/database.types.ts
```

スキーマ変更のたびに実行して型を最新に保つ。

---

## 6. Supabase Studio (ローカル管理画面)

`http://localhost:54323` でアクセスできる GUI 管理画面。
- テーブルの確認・データ編集
- SQL エディタでクエリ実行
- Auth のユーザー管理
- ログの確認

開発中のデバッグに非常に便利。

---

## 7. ローカル開発の日常フロー

```bash
# 開発開始時
supabase start         # Supabase 起動 (Docker が必要)
npm run dev            # Next.js 開発サーバー起動

# スキーマを変更したとき
supabase migration new add_some_column
# supabase/migrations/xxx_add_some_column.sql を編集
supabase db reset      # 変更を反映

# 型を更新
supabase gen types typescript --local > src/types/database.types.ts

# 開発終了時
supabase stop          # Supabase 停止 (データは保持される)
```

---

## 8. 本番 (Vercel + Supabase クラウド) へのデプロイ

```bash
# Supabase クラウドにログイン
supabase login

# クラウドプロジェクトにリンク
supabase link --project-ref <project-id>

# ローカルのマイグレーションをクラウドに適用
supabase db push
```

Vercel は GitHub と連携して自動デプロイ。
`main` ブランチへの push で自動的にデプロイされる。

---

## 9. ディレクトリ構成 (予定)

```
inventory/
├── docs/                    # ドキュメント
├── supabase/
│   ├── migrations/          # DBマイグレーションSQL
│   ├── seed.sql             # 開発用初期データ
│   └── config.toml          # Supabase ローカル設定
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── (auth)/          # 認証不要ページ (login)
│   │   ├── (dashboard)/     # 認証必要ページ
│   │   └── api/             # API Routes
│   ├── components/          # UIコンポーネント
│   │   ├── ui/              # shadcn/ui コンポーネント
│   │   └── features/        # 機能別コンポーネント
│   ├── lib/
│   │   ├── supabase/        # Supabaseクライアント設定
│   │   └── utils.ts
│   └── types/
│       └── database.types.ts  # 自動生成された型
├── .env.local               # ローカル環境変数 (Gitに含めない)
└── .env.example             # 環境変数のテンプレート
```
