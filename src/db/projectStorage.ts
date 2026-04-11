import { db, type ProjectRecord, type ImageRecord } from './database'

export async function loadAllProjects(): Promise<ProjectRecord[]> {
  return db.projects.toArray()
}

export async function loadProject(id: string): Promise<ProjectRecord | undefined> {
  return db.projects.get(id)
}

export async function saveProject(project: ProjectRecord): Promise<void> {
  await db.projects.put(project)
}

export async function deleteProject(id: string): Promise<void> {
  await db.transaction('rw', db.projects, db.images, db.floorplanOriginals, async () => {
    await db.projects.delete(id)
    await db.images.delete(id)
    await db.floorplanOriginals.delete(id)
  })
}

export async function loadImage(projectId: string): Promise<Blob | undefined> {
  const record = await db.images.get(projectId)
  return record?.blob
}

export async function saveImage(projectId: string, blob: Blob): Promise<void> {
  const record: ImageRecord = { projectId, blob }
  await db.images.put(record)
}

/** Full-resolution source image before crop (for re-cropping). */
export async function saveFloorplanOriginal(
  projectId: string,
  blob: Blob,
): Promise<void> {
  const record: ImageRecord = { projectId, blob }
  await db.floorplanOriginals.put(record)
}

export async function loadFloorplanOriginal(
  projectId: string,
): Promise<Blob | undefined> {
  const record = await db.floorplanOriginals.get(projectId)
  return record?.blob
}
