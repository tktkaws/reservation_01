"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function fetchTags() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .order("name");

  if (error) return { error: error.message, data: [] };
  return { data: data ?? [] };
}

export async function createTag(name: string, color: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tags")
    .insert({ name, color })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath("/");
  return { data };
}

export async function updateTag(id: string, name: string, color: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tags")
    .update({ name, color })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/");
  return { success: true };
}

export async function deleteTag(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tags").delete().eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/");
  return { success: true };
}
