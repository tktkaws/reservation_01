/** シードデータのテスト用アカウント（本番では使わない） */
export const SAMPLE_USER_PASSWORD = "password123";

export const SAMPLE_USERS = [
  {
    name: "山田 太郎",
    email: "admin@example.com",
    department: "制作部",
    role: "admin",
  },
  {
    name: "佐藤 花子",
    email: "sato@example.com",
    department: "営業部",
    role: "user",
  },
  {
    name: "田中 美咲",
    email: "tanaka@example.com",
    department: "総務",
    role: "user",
  },
  {
    name: "高橋 健太",
    email: "takahashi@example.com",
    department: "制作部",
    role: "user",
  },
] as const;
