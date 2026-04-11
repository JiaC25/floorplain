import Dexie, { type EntityTable } from 'dexie'
import type {
  FurnitureTemplate,
  PlacedFurniture,
  Calibration,
  ReferenceLine,
  FloorplanCropPixels,
} from '../types'

export interface ProjectRecord {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  calibration?: Calibration
  placedFurniture: PlacedFurniture[]
  referenceLines?: ReferenceLine[]
  floorplanCrop?: FloorplanCropPixels
}

export interface ImageRecord {
  projectId: string
  blob: Blob
}

const db = new Dexie('FloorplainDB') as Dexie & {
  furnitureTemplates: EntityTable<FurnitureTemplate, 'id'>
  projects: EntityTable<ProjectRecord, 'id'>
  images: EntityTable<ImageRecord, 'projectId'>
  floorplanOriginals: EntityTable<ImageRecord, 'projectId'>
}

db.version(1).stores({
  furnitureTemplates: 'id',
  projects: 'id',
  images: 'projectId',
})

db.version(2).stores({
  furnitureTemplates: 'id',
  projects: 'id',
  images: 'projectId',
  floorplanOriginals: 'projectId',
})

export { db }
