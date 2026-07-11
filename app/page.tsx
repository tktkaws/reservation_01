import { getCurrentUser } from "@/app/actions/auth";
import { fetchReservations } from "@/app/actions/reservations";
import { fetchTags } from "@/app/actions/tags";
import { ReservationApp } from "@/components/app/ReservationApp";
import { startOfMonth, endOfMonth } from "@/lib/dates";

export default async function HomePage() {
  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);

  const [currentUser, reservationsResult, tagsResult] = await Promise.all([
    getCurrentUser(),
    fetchReservations(start.toISOString(), end.toISOString()),
    fetchTags(),
  ]);

  return (
    <ReservationApp
      initialReservations={reservationsResult.data ?? []}
      initialTags={tagsResult.data ?? []}
      currentUser={currentUser}
    />
  );
}
