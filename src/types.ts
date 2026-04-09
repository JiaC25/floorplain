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

export interface Project {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  calibration?: Calibration
  placedFurniture: PlacedFurniture[]
}

export type AppMode = 'default' | 'calibrating' | 'measuring' | 'cropping'
