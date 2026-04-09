import { create } from 'zustand'
import type { PlacedFurniture } from '../types'

interface HistoryState {
  past: PlacedFurniture[][]
  future: PlacedFurniture[][]
  push: (snapshot: PlacedFurniture[]) => void
  undo: (current: PlacedFurniture[]) => PlacedFurniture[] | null
  redo: (current: PlacedFurniture[]) => PlacedFurniture[] | null
  canUndo: () => boolean
  canRedo: () => boolean
  clear: () => void
}

const MAX_HISTORY = 40

export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  future: [],

  push: (snapshot) =>
    set((s) => ({
      past: [...s.past.slice(-(MAX_HISTORY - 1)), snapshot],
      future: [],
    })),

  undo: (current) => {
    const { past } = get()
    if (past.length === 0) return null
    const prev = past[past.length - 1]
    set((s) => ({
      past: s.past.slice(0, -1),
      future: [current, ...s.future],
    }))
    return prev
  },

  redo: (current) => {
    const { future } = get()
    if (future.length === 0) return null
    const next = future[0]
    set((s) => ({
      past: [...s.past, current],
      future: s.future.slice(1),
    }))
    return next
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,
  clear: () => set({ past: [], future: [] }),
}))
