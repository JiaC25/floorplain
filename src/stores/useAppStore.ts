import { create } from 'zustand'
import type {
  AppMode,
  Calibration,
  FurnitureTemplate,
  PlacedFurniture,
} from '../types'

interface AppState {
  // Project
  currentProjectId: string | null
  projectName: string

  // Floorplan
  floorplanImage: HTMLImageElement | null
  floorplanImageBlob: Blob | null

  // Calibration
  calibration: Calibration | null
  mode: AppMode
  calibrationPoints: Array<{ x: number; y: number }>
  measurementPoints: Array<{ x: number; y: number }>
  cropStart: { x: number; y: number } | null
  cropEnd: { x: number; y: number } | null

  // Furniture
  furnitureLibrary: FurnitureTemplate[]
  placedFurniture: PlacedFurniture[]
  selectedFurnitureId: string | null

  // Canvas viewport
  stageScale: number
  stagePosition: { x: number; y: number }

  // Actions - floorplan
  setFloorplanImage: (img: HTMLImageElement, blob: Blob) => void
  clearFloorplan: () => void

  // Actions - calibration
  setMode: (mode: AppMode) => void
  addCalibrationPoint: (point: { x: number; y: number }) => void
  resetCalibrationPoints: () => void
  addMeasurementPoint: (point: { x: number; y: number }) => void
  resetMeasurementPoints: () => void
  setCropStart: (point: { x: number; y: number } | null) => void
  setCropEnd: (point: { x: number; y: number } | null) => void
  resetCrop: () => void
  setCalibration: (cal: Calibration) => void
  clearCalibration: () => void

  // Actions - furniture library
  setFurnitureLibrary: (items: FurnitureTemplate[]) => void
  addFurnitureTemplate: (item: FurnitureTemplate) => void
  updateFurnitureTemplate: (item: FurnitureTemplate) => void
  removeFurnitureTemplate: (id: string) => void

  // Actions - placed furniture
  setPlacedFurniture: (items: PlacedFurniture[]) => void
  addPlacedFurniture: (item: PlacedFurniture) => void
  updatePlacedFurniture: (id: string, updates: Partial<PlacedFurniture>) => void
  removePlacedFurniture: (id: string) => void
  setSelectedFurnitureId: (id: string | null) => void

  // Actions - viewport
  setStageScale: (scale: number) => void
  setStagePosition: (pos: { x: number; y: number }) => void

  // Actions - project
  setCurrentProjectId: (id: string | null) => void
  setProjectName: (name: string) => void
  resetProject: () => void
}

const initialProjectState = {
  currentProjectId: null as string | null,
  projectName: 'Untitled Project',
  floorplanImage: null as HTMLImageElement | null,
  floorplanImageBlob: null as Blob | null,
  calibration: null as Calibration | null,
  mode: 'default' as AppMode,
  calibrationPoints: [] as Array<{ x: number; y: number }>,
  measurementPoints: [] as Array<{ x: number; y: number }>,
  cropStart: null as { x: number; y: number } | null,
  cropEnd: null as { x: number; y: number } | null,
  placedFurniture: [] as PlacedFurniture[],
  selectedFurnitureId: null as string | null,
  stageScale: 1,
  stagePosition: { x: 0, y: 0 },
}

export const useAppStore = create<AppState>((set) => ({
  ...initialProjectState,
  furnitureLibrary: [],

  // Floorplan
  setFloorplanImage: (img, blob) =>
    set({ floorplanImage: img, floorplanImageBlob: blob }),
  clearFloorplan: () =>
    set({
      floorplanImage: null,
      floorplanImageBlob: null,
      calibration: null,
      calibrationPoints: [],
      measurementPoints: [],
      cropStart: null,
      cropEnd: null,
      placedFurniture: [],
      selectedFurnitureId: null,
    }),

  // Calibration
  setMode: (mode) =>
    set({
      mode,
      calibrationPoints: [],
      measurementPoints: [],
      cropStart: null,
      cropEnd: null,
    }),
  addCalibrationPoint: (point) =>
    set((s) => ({ calibrationPoints: [...s.calibrationPoints, point] })),
  resetCalibrationPoints: () => set({ calibrationPoints: [] }),
  addMeasurementPoint: (point) =>
    set((s) => ({ measurementPoints: [...s.measurementPoints, point] })),
  resetMeasurementPoints: () => set({ measurementPoints: [] }),
  setCropStart: (point) => set({ cropStart: point }),
  setCropEnd: (point) => set({ cropEnd: point }),
  resetCrop: () => set({ cropStart: null, cropEnd: null }),
  setCalibration: (cal) =>
    set({
      calibration: cal,
      mode: 'default',
      calibrationPoints: [],
      measurementPoints: [],
      cropStart: null,
      cropEnd: null,
    }),
  clearCalibration: () =>
    set({
      calibration: null,
      calibrationPoints: [],
      measurementPoints: [],
      cropStart: null,
      cropEnd: null,
    }),

  // Furniture library
  setFurnitureLibrary: (items) => set({ furnitureLibrary: items }),
  addFurnitureTemplate: (item) =>
    set((s) => ({ furnitureLibrary: [...s.furnitureLibrary, item] })),
  updateFurnitureTemplate: (item) =>
    set((s) => ({
      furnitureLibrary: s.furnitureLibrary.map((t) =>
        t.id === item.id ? item : t,
      ),
    })),
  removeFurnitureTemplate: (id) =>
    set((s) => ({
      furnitureLibrary: s.furnitureLibrary.filter((t) => t.id !== id),
    })),

  // Placed furniture
  setPlacedFurniture: (items) => set({ placedFurniture: items }),
  addPlacedFurniture: (item) =>
    set((s) => ({ placedFurniture: [...s.placedFurniture, item] })),
  updatePlacedFurniture: (id, updates) =>
    set((s) => ({
      placedFurniture: s.placedFurniture.map((f) =>
        f.id === id ? { ...f, ...updates } : f,
      ),
    })),
  removePlacedFurniture: (id) =>
    set((s) => ({
      placedFurniture: s.placedFurniture.filter((f) => f.id !== id),
      selectedFurnitureId:
        s.selectedFurnitureId === id ? null : s.selectedFurnitureId,
    })),
  setSelectedFurnitureId: (id) => set({ selectedFurnitureId: id }),

  // Viewport
  setStageScale: (scale) => set({ stageScale: scale }),
  setStagePosition: (pos) => set({ stagePosition: pos }),

  // Project
  setCurrentProjectId: (id) => set({ currentProjectId: id }),
  setProjectName: (name) => set({ projectName: name }),
  resetProject: () => set({ ...initialProjectState }),
}))
