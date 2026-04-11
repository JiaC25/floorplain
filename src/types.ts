export interface FurnitureTemplate {
  id: string
  name: string
  widthCm: number
  depthCm: number
  color: string
  notes?: string
}

export interface Calibration {
  point1: { x: number; y: number }
  point2: { x: number; y: number }
  realWorldDistanceCm: number
  pixelsPerCm: number
}

export interface PlacedFurniture {
  id: string
  templateId: string
  name: string
  widthCm: number
  depthCm: number
  color: string
  x: number
  y: number
  rotation: number
}

export interface ReferenceLine {
  id: string
  point1: { x: number; y: number }
  point2: { x: number; y: number }
}

/** Natural-pixel crop of the floorplan source image (see `floorplanImage.ts`). */
export type FloorplanCropPixels = {
  x: number
  y: number
  width: number
  height: number
}

export interface Project {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  calibration?: Calibration
  placedFurniture: PlacedFurniture[]
  referenceLines?: ReferenceLine[]
  /** Crop on the stored original floorplan image; omit for legacy projects. */
  floorplanCrop?: FloorplanCropPixels
}

export type AppMode =
  | 'default'
  | 'calibrating'
  | 'measuring'
  | 'referenceLine'
  | 'cropping'

/** Canvas overlay visibility (floorplan always visible). */
export interface LayerVisibility {
  furniture: boolean
  /** Width × depth labels on placed furniture blocks (name is always shown). */
  furnitureDimensions: boolean
  calibrationLine: boolean
  referenceLines: boolean
}

export const defaultLayerVisibility: LayerVisibility = {
  furniture: true,
  furnitureDimensions: false,
  calibrationLine: true,
  referenceLines: true,
}
