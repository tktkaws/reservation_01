# 会議室予約システム

Next.js + Supabase + Tailwind CSS で構築した会議室（1室）の予約管理システムです。

## 機能

- 予約の一覧表示（リスト / 週間 / 月間ビュー）
- 未ログインでも予約一覧を閲覧可能
- ログインユーザーは自分の予約を作成・編集・削除
- 15分単位、月〜金 9:00〜18:00 の予約（複数スロット連続可）
- タグによる分類・フィルター
- 管理者によるユーザー管理・全予約管理

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Supabase プロジェクトの作成

1. [Supabase](https://supabase.com) でプロジェクトを作成
2. SQL Editor で `supabase/migrations/001_initial_schema.sql` を実行
3. Authentication > Providers で Email を有効化

### 3. 環境変数

`.env.local.example` を `.env.local` にコピーして値を設定:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

`SUPABASE_SERVICE_ROLE_KEY` は管理者によるユーザーの作成・削除に必要です（サーバーサイドのみで使用）。

### 4. 初回管理者の設定

ユーザー登録後、Supabase SQL Editor で以下を実行:

```sql
UPDATE profiles SET role = 'admin' WHERE id = 'your-user-uuid';
```

### 5. 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 でアクセスできます。

## 技術スタック

- Next.js 16 (App Router)
- Supabase (Auth, PostgreSQL, RLS)
- Tailwind CSS 4
- date-fns / date-fns-tz

## ディレクトリ構成

```
app/              # ページ・Server Actions
components/       # UIコンポーネント
lib/              # ユーティリティ・Supabase クライアント
supabase/         # DBマイグレーション
```
