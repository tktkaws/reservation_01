-- サンプルユーザーのログイン修正（500 Internal Server Error 対応）
-- Supabase SQL Editor で実行してください
--
-- 原因:
--   SQL投入時に auth.identities.id を user_id と同じUUIDにしていたため
--   GoTrue がログイン処理で 500 エラーを返すことがある
--
-- パスワード: password123（全サンプルユーザー共通）

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. 壊れた identities を削除して再作成
DELETE FROM auth.identities
WHERE user_id IN (
  'a0000001-0001-4000-8000-000000000001',
  'a0000001-0002-4000-8000-000000000002',
  'a0000001-0003-4000-8000-000000000003',
  'a0000001-0004-4000-8000-000000000004',
  'a0000001-0005-4000-8000-000000000005'
);

INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  u.id,
  u.email,
  jsonb_build_object(
    'sub', u.id::TEXT,
    'email', u.email,
    'email_verified', false,
    'phone_verified', false
  ),
  'email',
  NOW(),
  NOW(),
  NOW()
FROM auth.users u
WHERE u.email IN (
  'admin@example.com',
  'sato@example.com',
  'suzuki@example.com',
  'tanaka@example.com',
  'takahashi@example.com'
);

-- 2. auth.users の必須フィールドを補完
UPDATE auth.users
SET
  encrypted_password = crypt('password123', gen_salt('bf')),
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  confirmation_token = COALESCE(confirmation_token, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  recovery_token = COALESCE(recovery_token, ''),
  is_sso_user = false,
  is_anonymous = false,
  raw_app_meta_data = COALESCE(
    raw_app_meta_data,
    '{"provider":"email","providers":["email"]}'::JSONB
  )
WHERE email IN (
  'admin@example.com',
  'sato@example.com',
  'suzuki@example.com',
  'tanaka@example.com',
  'takahashi@example.com'
);

-- 3. profiles が無ければ作成（トリガー失敗時の保険）
INSERT INTO profiles (id, name, department, role)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'name', ''),
  COALESCE(u.raw_user_meta_data->>'department', ''),
  CASE WHEN u.email = 'admin@example.com' THEN 'admin' ELSE 'user' END
FROM auth.users u
WHERE u.email IN (
  'admin@example.com',
  'sato@example.com',
  'suzuki@example.com',
  'tanaka@example.com',
  'takahashi@example.com'
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  department = EXCLUDED.department,
  role = EXCLUDED.role;

-- 4. 確認
SELECT u.email, u.email_confirmed_at IS NOT NULL AS confirmed, i.provider_id
FROM auth.users u
LEFT JOIN auth.identities i ON i.user_id = u.id AND i.provider = 'email'
WHERE u.email LIKE '%@example.com'
ORDER BY u.email;
