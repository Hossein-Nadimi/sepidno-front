"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  activeBusinessId: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setTokens: (access: string, refresh?: string) => void;
  setActiveBusinessId: (id: string | null) => void;
  login: (user: User, access: string, refresh: string) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      activeBusinessId: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setTokens: (access, refresh) =>
        set((state) => ({
          accessToken: access,
          refreshToken: refresh ?? state.refreshToken,
        })),
      setActiveBusinessId: (id) => set({ activeBusinessId: id }),
      login: (user, access, refresh) =>
        set({ user, accessToken: access, refreshToken: refresh, isAuthenticated: true }),
      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          activeBusinessId: null,
          isAuthenticated: false,
        }),
      hasPermission: (permission) => {
        const user = get().user;
        if (!user) return false;
        if (user.role === "super_admin") return true;
        return user.permissions.includes(permission);
      },
    }),
    {
      name: "sepidno-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        activeBusinessId: state.activeBusinessId,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
