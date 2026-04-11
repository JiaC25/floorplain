import { nanoid } from 'nanoid'
import { create } from 'zustand'
import {
  type AppMode,
  type Calibration,
  type FloorplanCropPixels,
  type FurnitureTemplate,
  type LayerVisibility,
  type PlacedFurniture,
  type ReferenceLine,
} from '../types'
import {
  readStoredLayerVisibility,
  writeStoredLayerVisibility,
} from '../utils/layerVisibilityStorage'

interface AppState {
  // Project
  currentProjectId: string | null
  projectName: string

  // Floorplan
  floorplanImage: HTMLImageElement | null
  floorplanImageBlob: Blob | null
  floorplanOriginalBlob: Blob | null
  floorplanCropPixels: FloorplanCropPixels | null

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
  referenceLines: ReferenceLine[]
  referenceLinePoints: Array<{ x: number; y: number }>
  selectedReferenceLineId: string | null

  // Canvas viewport
  stageScale: number
  stagePosition: { x: number; y: number }
  layerVisibility: LayerVisibility

  // Actions - floorplan
  setFloorplanImage: (img: HTMLImageElement, blob: Blob) => void
  setFloorplanComplete: (payload: {
    floorplanImage: HTMLImageElement
    floorplanImageBlob: Blob
    floorplanOriginalBlob: Blob
    floorplanCropPixels: FloorplanCropPixels
  }) => void
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
  setReferenceLines: (lines: ReferenceLine[]) => void
  setReferenceLineDraftPoints: (points: Array<{ x: number; y: number }>) => void
  addReferenceLineSegment: (
    point1: { x: number; y: number },
    point2: { x: number; y: number },
  ) => void
  clearReferenceLines: () => void
  setSelectedReferenceLineId: (id: string | null) => void
  removeReferenceLine: (id: string) => void

  // Actions - viewport
  setStageScale: (scale: number) => void
  setStagePosition: (pos: { x: number; y: number }) => void
  setLayerVisibility: (updates: Partial<LayerVisibility>) => void

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
  floorplanOriginalBlob: null as Blob | null,
  floorplanCropPixels: null as FloorplanCropPixels | null,
  calibration: null as Calibration | null,
  mode: 'default' as AppMode,
  calibrationPoints: [] as Array<{ x: number; y: number }>,
  measurementPoints: [] as Array<{ x: number; y: number }>,
  cropStart: null as { x: number; y: number } | null,
  cropEnd: null as { x: number; y: number } | null,
  placedFurniture: [] as PlacedFurniture[],
  selectedFurnitureId: null as string | null,
  referenceLines: [] as ReferenceLine[],
  referenceLinePoints: [] as Array<{ x: number; y: number }>,
  selectedReferenceLineId: null as string | null,
  stageScale: 1,
  stagePosition: { x: 0, y: 0 },
  layerVisibility: readStoredLayerVisibility(),
}

export const useAppStore = create<AppState>((set) => ({
  ...initialProjectState,
  furnitureLibrary: [],

  // Floorplan
  setFloorplanImage: (img, blob) =>
    set({
      floorplanImage: img,
      floorplanImageBlob: blob,
      floorplanOriginalBlob: null,
      floorplanCropPixels: null,
    }),
  setFloorplanComplete: (payload) => set(payload),
  clearFloorplan: () =>
    set({
      floorplanImage: null,
      floorplanImageBlob: null,
      floorplanOriginalBlob: null,
      floorplanCropPixels: null,
      calibration: null,
      calibrationPoints: [],
      measurementPoints: [],
      referenceLinePoints: [],
      cropStart: null,
      cropEnd: null,
      placedFurniture: [],
      selectedFurnitureId: null,
      referenceLines: [],
      selectedReferenceLineId: null,
    }),

  // Calibration
  setMode: (mode) =>
    set({
      mode,
      calibrationPoints: [],
      measurementPoints: [],
      referenceLinePoints: [],
      selectedReferenceLineId: null,
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
      referenceLinePoints: [],
      cropStart: null,
      cropEnd: null,
    }),
  clearCalibration: () =>
    set({
      calibration: null,
      calibrationPoints: [],
      measurementPoints: [],
      referenceLinePoints: [],
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

  setReferenceLines: (lines) => set({ referenceLines: lines }),
  setReferenceLineDraftPoints: (points) => set({ referenceLinePoints: points }),
  addReferenceLineSegment: (point1, point2) =>
    set((s) => ({
      referenceLinePoints: [],
      referenceLines: [
        ...s.referenceLines,
        { id: nanoid(), point1, point2 },
      ],
    })),
  clearReferenceLines: () =>
    set({
      referenceLines: [],
      referenceLinePoints: [],
      selectedReferenceLineId: null,
    }),
  setSelectedReferenceLineId: (id) => set({ selectedReferenceLineId: id }),
  removeReferenceLine: (id) =>
    set((s) => ({
      referenceLines: s.referenceLines.filter((l) => l.id !== id),
      selectedReferenceLineId:
        s.selectedReferenceLineId === id ? null : s.selectedReferenceLineId,
    })),

  // Viewport
  setStageScale: (scale) => set({ stageScale: scale }),
  setStagePosition: (pos) => set({ stagePosition: pos }),
  setLayerVisibility: (updates) =>
    set((s) => {
      const layerVisibility = { ...s.layerVisibility, ...updates }
      writeStoredLayerVisibility(layerVisibility)
      return { layerVisibility }
    }),

  // Project
  setCurrentProjectId: (id) => set({ currentProjectId: id }),
  setProjectName: (name) => set({ projectName: name }),
  resetProject: () =>
    set((s) => ({
      ...initialProjectState,
      layerVisibility: s.layerVisibility,
    })),
}))
