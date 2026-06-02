import { create } from 'zustand'

export const useAppStore = create((set) => ({
  currentPage: 'dashboard', // 'dashboard' | 'editor' | 'manage-rooms'
  sidebarCollapsed: false,
  setPage: (page) => set({ currentPage: page }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
}))
