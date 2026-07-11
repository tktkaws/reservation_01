"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

export async function fetchUsers() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("name");

  if (error) return { error: error.message, data: [] };
  return { data: data ?? [] };
}

export async function updateUser(
  id: string,
  input: { name: string; department: string; role: UserRole }
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      name: input.name,
      department: input.department,
      role: input.role,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/users");
  revalidatePath("/");
  return { success: true };
}

export async function deleteUser(id: string) {
  try {
    const supabase = createServiceClient();
    const { error } = await supabase.auth.admin.deleteUser(id);

    if (error) return { error: error.message };
    revalidatePath("/admin/users");
    revalidatePath("/");
    return { success: true };
  } catch {
    return {
      error:
        "ユーザー削除には SUPABASE_SERVICE_ROLE_KEY の設定が必要です",
    };
  }
}

export async function createUser(input: {
  email: string;
  password: string;
  name: string;
  department: string;
  role: UserRole;
}) {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        name: input.name,
        department: input.department,
      },
    });

    if (error) return { error: error.message };

    if (data.user && input.role === "admin") {
      await supabase
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", data.user.id);
    }

    revalidatePath("/admin/users");
    revalidatePath("/");
    return { success: true };
  } catch {
    return {
      error:
        "ユーザー作成には SUPABASE_SERVICE_ROLE_KEY の設定が必要です",
    };
  }
}
