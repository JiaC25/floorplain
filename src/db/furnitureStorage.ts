import { db } from './database'
import type { FurnitureTemplate } from '../types'

export async function loadAllTemplates(): Promise<FurnitureTemplate[]> {
  return db.furnitureTemplates.toArray()
}

export async function saveTemplate(template: FurnitureTemplate): Promise<void> {
  await db.furnitureTemplates.put(template)
}

export async function deleteTemplate(id: string): Promise<void> {
  await db.furnitureTemplates.delete(id)
}
