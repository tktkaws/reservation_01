"use client";

import { useEffect } from "react";
import { fetchReservations } from "@/app/actions/reservations";
import { fetchTags } from "@/app/actions/tags";
import { startOfMonth, endOfMonth } from "@/lib/dates";
import { useApp } from "./AppContext";

export function DataRefresher() {
  const { currentDate, refreshKey, setReservations, setTags } = useApp();

  useEffect(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    let cancelled = false;

    Promise.all([
      fetchReservations(start.toISOString(), end.toISOString()),
      fetchTags(),
    ]).then(([reservationsResult, tagsResult]) => {
      if (cancelled) return;
      if (reservationsResult.data) setReservations(reservationsResult.data);
      if (tagsResult.data) setTags(tagsResult.data);
    });

    return () => {
      cancelled = true;
    };
  }, [currentDate, refreshKey, setReservations, setTags]);

  return null;
}
