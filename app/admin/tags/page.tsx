import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions/auth";
import { fetchTags } from "@/app/actions/tags";
import { AdminTagsClient } from "@/components/admin/AdminTagsClient";

export default async function AdminTagsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "admin") {
    redirect("/");
  }

  const { data: tags } = await fetchTags();

  return (
    <AdminTagsClient initialTags={tags ?? []} currentUser={currentUser} />
  );
}
