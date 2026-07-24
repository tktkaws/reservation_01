export type UserRole = "user" | "admin";

export type Profile = {
  id: string;
  name: string;
  department: string;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
};

export type Tag = {
  id: string;
  name: string;
  color: string;
};

export type Reservation = {
  id: string;
  start_at: string;
  end_at: string;
  user_id: string;
  title: string;
  memo: string;
  created_at?: string;
  updated_at?: string;
  profiles?: Profile | null;
  reservation_tags?: { tags: Tag }[];
};

export type ViewMode = "list" | "month";

export type PanelMode = "empty" | "view" | "create" | "edit";

export type DetailPanelState =
  | { mode: "empty" }
  | { mode: "view"; reservation: Reservation }
  | { mode: "create"; startAt?: Date; endAt?: Date }
  | { mode: "edit"; reservation: Reservation };

export type UserPanelState =
  | { mode: "empty" }
  | { mode: "view"; user: Profile }
  | { mode: "create" }
  | { mode: "edit"; user: Profile };
