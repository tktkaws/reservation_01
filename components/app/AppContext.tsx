"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  DetailPanelState,
  Profile,
  Reservation,
  Tag,
  ViewMode,
} from "@/lib/types";

type AppContextValue = {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  goToToday: () => void;
  panel: DetailPanelState;
  setPanel: (panel: DetailPanelState) => void;
  openCreatePanel: (startAt?: Date, endAt?: Date) => void;
  openViewPanel: (reservation: Reservation) => void;
  openEditPanel: (reservation: Reservation) => void;
  closePanel: () => void;
  selectedTagIds: string[];
  toggleTagFilter: (tagId: string) => void;
  clearTagFilters: () => void;
  reservations: Reservation[];
  setReservations: (reservations: Reservation[]) => void;
  tags: Tag[];
  setTags: (tags: Tag[]) => void;
  currentUser: Profile | null;
  refreshKey: number;
  triggerRefresh: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({
  children,
  initialReservations,
  initialTags,
  currentUser,
}: {
  children: ReactNode;
  initialReservations: Reservation[];
  initialTags: Tag[];
  currentUser: Profile | null;
}) {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [panel, setPanel] = useState<DetailPanelState>({ mode: "empty" });
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [reservations, setReservations] = useState(initialReservations);
  const [tags, setTags] = useState(initialTags);
  const [refreshKey, setRefreshKey] = useState(0);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const openCreatePanel = useCallback((startAt?: Date, endAt?: Date) => {
    setPanel({ mode: "create", startAt, endAt });
  }, []);

  const openViewPanel = useCallback((reservation: Reservation) => {
    setPanel({ mode: "view", reservation });
  }, []);

  const openEditPanel = useCallback((reservation: Reservation) => {
    setPanel({ mode: "edit", reservation });
  }, []);

  const closePanel = useCallback(() => {
    setPanel({ mode: "empty" });
  }, []);

  const toggleTagFilter = useCallback((tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  }, []);

  const clearTagFilters = useCallback(() => {
    setSelectedTagIds([]);
  }, []);

  const triggerRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const filteredReservations = useMemo(() => {
    if (selectedTagIds.length === 0) return reservations;

    return reservations.filter((r) => {
      const reservationTagIds =
        r.reservation_tags?.map((rt) => rt.tags.id) ?? [];
      return selectedTagIds.every((id) => reservationTagIds.includes(id));
    });
  }, [reservations, selectedTagIds]);

  const value = useMemo(
    () => ({
      viewMode,
      setViewMode,
      currentDate,
      setCurrentDate,
      goToToday,
      panel,
      setPanel,
      openCreatePanel,
      openViewPanel,
      openEditPanel,
      closePanel,
      selectedTagIds,
      toggleTagFilter,
      clearTagFilters,
      reservations: filteredReservations,
      setReservations,
      tags,
      setTags,
      currentUser,
      refreshKey,
      triggerRefresh,
    }),
    [
      viewMode,
      currentDate,
      goToToday,
      panel,
      openCreatePanel,
      openViewPanel,
      openEditPanel,
      closePanel,
      selectedTagIds,
      toggleTagFilter,
      clearTagFilters,
      filteredReservations,
      tags,
      currentUser,
      refreshKey,
      triggerRefresh,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
