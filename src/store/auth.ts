import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Member, RoleType } from "../../shared/types";
import { api } from "@/lib/api";

interface QuickLoginMember {
  id: number;
  nickname: string;
  avatar: string;
  gameClass: string;
  gameLevel: number;
  roleId: RoleType;
  password: string;
}

interface AuthState {
  user: Member | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (nickname: string, password: string) => Promise<boolean>;
  loginAs: (memberId: number) => Promise<boolean>;
  logout: () => void;
  updateUser: (data: Partial<Member>) => void;
  getAvailableMembers: () => Promise<QuickLoginMember[]>;
}

const QUICK_LOGIN_MEMBERS: QuickLoginMember[] = [
  { id: 1, nickname: "龙腾九天", avatar: "🤴", gameClass: "战士", gameLevel: 80, roleId: "president", password: "123456" },
  { id: 2, nickname: "月影剑客", avatar: "🥷", gameClass: "盗贼", gameLevel: 78, roleId: "vice_president", password: "123456" },
  { id: 3, nickname: "圣光使者", avatar: "👸", gameClass: "圣骑士", gameLevel: 77, roleId: "leader", password: "123456" },
  { id: 4, nickname: "烈焰法师", avatar: "🧙", gameClass: "法师", gameLevel: 75, roleId: "member", password: "123456" },
  { id: 5, nickname: "自然守护", avatar: "🧝", gameClass: "德鲁伊", gameLevel: 73, roleId: "member", password: "123456" },
  { id: 7, nickname: "神谕祭司", avatar: "🧞", gameClass: "牧师", gameLevel: 72, roleId: "member", password: "123456" },
  { id: 10, nickname: "元素萨满", avatar: "🧛", gameClass: "萨满", gameLevel: 70, roleId: "member", password: "123456" },
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, _get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (nickname: string, password: string) => {
        try {
          const res = await api.auth.login(nickname, password);
          localStorage.setItem("guild-auth-token", res.token);
          set({
            user: res.member,
            token: res.token,
            isAuthenticated: true,
          });
          return true;
        } catch (e) {
          console.error("Login failed:", e);
          return false;
        }
      },

      loginAs: async (memberId: number) => {
        try {
          const res = await api.auth.login(memberId);
          localStorage.setItem("guild-auth-token", res.token);
          set({
            user: res.member,
            token: res.token,
            isAuthenticated: true,
          });
          return true;
        } catch (e) {
          console.error("Quick login failed:", e);
          return false;
        }
      },

      logout: () => {
        localStorage.removeItem("guild-auth-token");
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateUser: (data: Partial<Member>) => {
        set((state) => {
          if (!state.user) return state;
          return { user: { ...state.user, ...data } };
        });
      },

      getAvailableMembers: async () => {
        return QUICK_LOGIN_MEMBERS;
      },
    }),
    {
      name: "guild-auth-storage",
    }
  )
);

export { QUICK_LOGIN_MEMBERS };
