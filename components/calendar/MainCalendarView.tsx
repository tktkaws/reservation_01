"use client";

import { useApp } from "@/components/app/AppContext";
import { ListView } from "@/components/calendar/ListView";
import { WeekView } from "@/components/calendar/WeekView";
import { MonthView } from "@/components/calendar/MonthView";

export function MainCalendarView() {
  const { viewMode } = useApp();

  switch (viewMode) {
    case "list":
      return <ListView />;
    case "week":
      return <WeekView />;
    case "month":
      return <MonthView />;
    default:
      return <WeekView />;
  }
}
