"use client";

import { useApp } from "@/components/app/AppContext";
import { ListView } from "@/components/calendar/ListView";
import { MonthView } from "@/components/calendar/MonthView";

export function MainCalendarView() {
  const { viewMode } = useApp();

  switch (viewMode) {
    case "list":
      return <ListView />;
    case "month":
    default:
      return <MonthView />;
  }
}
