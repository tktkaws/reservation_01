"use client";

import { useState } from "react";
import { AppProvider } from "@/components/app/AppContext";
import { DataRefresher } from "@/components/app/DataRefresher";
import { Sidebar } from "@/components/layout/Sidebar";
import { HeaderToolbar } from "@/components/layout/HeaderToolbar";
import { MainCalendarView } from "@/components/calendar/MainCalendarView";
import { DetailPanel } from "@/components/reservation/DetailPanel";
import { useApp } from "@/components/app/AppContext";
import type { Profile, Reservation, Tag } from "@/lib/types";

function AppShell() {
  const { panel } = useApp();
  const [showSidebar, setShowSidebar] = useState(false);
  const showDetail = panel.mode !== "empty";

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-100">
      <div
        className={`${
          showSidebar ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 z-40 transition-transform lg:relative lg:translate-x-0`}
      >
        <Sidebar />
      </div>

      {showSidebar && (
        <button
          type="button"
          aria-label="サイドバーを閉じる"
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      <main className="flex min-w-0 flex-1 flex-col">
        <HeaderToolbar onMenuClick={() => setShowSidebar(true)} />
        <MainCalendarView />
      </main>

      <div
        className={`${
          showDetail ? "translate-x-0" : "translate-x-full"
        } fixed inset-y-0 right-0 z-40 transition-transform lg:relative lg:translate-x-0`}
      >
        <DetailPanel />
      </div>
    </div>
  );
}

export function ReservationApp({
  initialReservations,
  initialTags,
  currentUser,
}: {
  initialReservations: Reservation[];
  initialTags: Tag[];
  currentUser: Profile | null;
}) {
  return (
    <AppProvider
      initialReservations={initialReservations}
      initialTags={initialTags}
      currentUser={currentUser}
    >
      <DataRefresher />
      <AppShell />
    </AppProvider>
  );
}
