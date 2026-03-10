# デプロイ手順

Supabase クラウドと Vercel を使った本番環境へのデプロイ手順です。

---

## 概要

```
GitHub リポジトリ
      ↓ push
   Vercel（自動デプロイ）
      ↓ 接続
Supabase クラウド（DB・認証）
```

---

## Step 1: Supabase クラウドプロジェクトを作成

1. [supabase.com](https://supabase.com) にログイン
2. 「New project」でプロジェクトを作成
   - リージョン: `Northeast Asia (Tokyo)` 推奨
3. 作成後、以下の値を控える

| 取得場所 | 項目 | 用途 |
|---|---|---|
| Settings → Data API | Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| Settings → Data API | `anon` キー（Publishable） | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Settings → Data API | `service_role` キー（Secret） | `SUPABASE_SERVICE_ROLE_KEY` |
| Settings → General | Reference ID | `supabase link` コマンドで使用 |

---

## Step 2: DBマイグレーションをクラウドに適用

ローカルの `supabase/migrations/` をクラウドのDBに適用する。

```bash
# Supabase CLI でログイン（ブラウザが開く）
npx supabase login

# クラウドプロジェクトにリンク
npx supabase link --project-ref <Reference ID>

# ローカルのマイグレーションをクラウドに適用
npx supabase db push
```

**注意**: `seed.sql` は `db push` では適用されない（ローカル開発専用）。本番の初期ユーザーは Step 5 で手動作成する。

---

## Step 3: GitHub にプッシュ

```bash
git remote add origin <GitHub リポジトリURL>
git push -u origin main
```

---

## Step 4: Vercel にデプロイ

1. [vercel.com](https://vercel.com) にログインして「New Project」
2. GitHub リポジトリをインポート
3. **Environment Variables** に以下を設定：

| 変数名 | 値 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Step 1 で控えた Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Step 1 で控えた anon キー |
| `SUPABASE_SERVICE_ROLE_KEY` | Step 1 で控えた service_role キー |

4. 「Deploy」を実行

以降は `main` ブランチへの push で自動デプロイされる。

---

## Step 5: 初期ユーザーの作成

Supabase クラウドの管理画面から管理者ユーザーを作成する。

1. Supabase クラウドの管理画面を開く
2. **Authentication → Users** → 「Add user」
3. メールアドレスとパスワードを入力して作成
4. 作成されたユーザーの `user_profiles.role` を `admin` に変更する
   - **Table Editor → user_profiles** でレコードを編集

---

## 環境変数一覧

| 変数名 | ローカル (`.env.local`) | 本番 (Vercel) |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `http://localhost:54321` | Supabase クラウドの URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ローカルの anon key | クラウドの anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ローカルの service_role key | クラウドの service_role key |

---

## スキーマ変更時の反映手順

開発後にスキーマを変更した場合、本番へ反映するには：

```bash
# 新しいマイグレーションファイルを作成・編集
npx supabase migration new <変更内容の名前>
# supabase/migrations/xxx_<変更内容の名前>.sql を編集

# ローカルで動作確認
npm run supabase:reset

# クラウドに適用
npx supabase db push
```
