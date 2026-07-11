"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateReservationTime } from "@/lib/slots";

type ReservationInput = {
  title: string;
  memo: string;
  startAt: string;
  endAt: string;
  tagIds: string[];
  userId?: string;
};

async function syncReservationTags(
  supabase: Awaited<ReturnType<typeof createClient>>,
  reservationId: string,
  tagIds: string[]
) {
  await supabase
    .from("reservation_tags")
    .delete()
    .eq("reservation_id", reservationId);

  if (tagIds.length > 0) {
    const { error } = await supabase.from("reservation_tags").insert(
      tagIds.map((tagId) => ({
        reservation_id: reservationId,
        tag_id: tagId,
      }))
    );
    if (error) throw new Error(error.message);
  }
}

export async function createReservation(input: ReservationInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "ログインが必要です" };
  }

  const start = new Date(input.startAt);
  const end = new Date(input.endAt);
  const validationError = validateReservationTime(start, end);
  if (validationError) {
    return { error: validationError };
  }

  const userId = input.userId ?? user.id;

  if (userId !== user.id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return { error: "権限がありません" };
    }
  }

  const { data, error } = await supabase
    .from("reservations")
    .insert({
      title: input.title,
      memo: input.memo,
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      user_id: userId,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23P01") {
      return { error: "この時間帯は既に予約されています" };
    }
    return { error: error.message };
  }

  try {
    await syncReservationTags(supabase, data.id, input.tagIds);
  } catch (e) {
    await supabase.from("reservations").delete().eq("id", data.id);
    return { error: e instanceof Error ? e.message : "タグの保存に失敗しました" };
  }

  revalidatePath("/");
  return { data };
}

export async function updateReservation(
  id: string,
  input: ReservationInput
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "ログインが必要です" };
  }

  const start = new Date(input.startAt);
  const end = new Date(input.endAt);
  const validationError = validateReservationTime(start, end);
  if (validationError) {
    return { error: validationError };
  }

  const updateData: Record<string, string> = {
    title: input.title,
    memo: input.memo,
    start_at: start.toISOString(),
    end_at: end.toISOString(),
  };

  if (input.userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "admin") {
      updateData.user_id = input.userId;
    }
  }

  const { error } = await supabase
    .from("reservations")
    .update(updateData)
    .eq("id", id);

  if (error) {
    if (error.code === "23P01") {
      return { error: "この時間帯は既に予約されています" };
    }
    return { error: error.message };
  }

  try {
    await syncReservationTags(supabase, id, input.tagIds);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "タグの保存に失敗しました" };
  }

  revalidatePath("/");
  return { success: true };
}

export async function deleteReservation(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "ログインが必要です" };
  }

  const { error } = await supabase.from("reservations").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}

export async function fetchReservations(start: string, end: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reservations")
    .select(
      `
      *,
      profiles (id, name, department, role),
      reservation_tags (tags (id, name, color))
    `
    )
    .gte("start_at", start)
    .lte("start_at", end)
    .order("start_at", { ascending: true });

  if (error) {
    return { error: error.message, data: [] };
  }

  return { data: data ?? [] };
}
