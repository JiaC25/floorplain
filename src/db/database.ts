import Dexie, { type EntityTable } from 'dexie'
import type { FurnitureTemplate, PlacedFurniture, Calibration } from '../types'

export interface ProjectRecord {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  calibration?: Calibration
  placedFurniture: PlacedFurniture[]
}

export interface ImageRecord {
  projectId: string
  blob: Blob
}

const db = new Dexie('FloorplainDB') as Dexie & {
  furnitureTemplates: EntityTable<FurnitureTemplate, 'id'>
  projects: EntityTable<ProjectRecord, 'id'>
  images: EntityTable<ImageRecord, 'projectId'>
}

db.version(1).stores({
  furnitureTemplates: 'id',
  projects: 'id',
  images: 'projectId',
})

export { db }
