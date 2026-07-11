"use client";

import { useEffect } from "react";
import { fetchReservations } from "@/app/actions/reservations";
import { fetchTags } from "@/app/actions/tags";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "@/lib/dates";
import { useApp } from "./AppContext";
import type { ViewMode } from "@/lib/types";

function getDateRange(viewMode: ViewMode, currentDate: Date) {
  if (viewMode === "month") {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return { start, end };
  }

  if (viewMode === "week") {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return { start, end: new Date(end.getTime() + 2 * 24 * 60 * 60 * 1000) };
  }

  const start = startOfMonth(currentDate);
  const end = endOfMonth(currentDate);
  return { start, end };
}

export function DataRefresher() {
  const { viewMode, currentDate, refreshKey, setReservations, setTags } =
    useApp();

  useEffect(() => {
    const { start, end } = getDateRange(viewMode, currentDate);
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
  }, [viewMode, currentDate, refreshKey, setReservations, setTags]);

  return null;
}
