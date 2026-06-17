import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Guild } from "../../shared/types";

interface AppState {
  guild: Guild;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setGuild: (guild: Guild) => void;
}

const DEFAULT_GUILD: Guild = {
  id: 1,
  name: "暗影黎明",
  logo: "⚔️",
  description: "守护艾泽拉斯的最后防线，由一群热爱冒险的勇士组成。我们追求荣耀、忠诚与胜利！",
  createdAt: "2023-01-15T08:00:00Z",
  level: 12,
  memberCount: 128,
  presidentId: 1,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      guild: DEFAULT_GUILD,
      sidebarCollapsed: false,

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setGuild: (guild: Guild) => set({ guild }),
    }),
    {
      name: "guild-app-storage",
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
    }
  )
);

export { DEFAULT_GUILD };
