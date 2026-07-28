import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions/auth";
import { fetchUsers } from "@/app/actions/users";
import { AdminUsersClient } from "@/components/admin/AdminUsersClient";

export default async function AdminUsersPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "admin") {
    redirect("/");
  }

  const { data: users } = await fetchUsers();

  return <AdminUsersClient initialUsers={users ?? []} currentUser={currentUser} />;
}
