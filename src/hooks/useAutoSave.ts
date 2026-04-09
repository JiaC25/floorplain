import { useEffect, useRef } from 'react'
import { useAppStore } from '../stores/useAppStore'
import { saveProject, saveImage } from '../db/projectStorage'
import type { ProjectRecord } from '../db/database'

const DEBOUNCE_MS = 1500

export function useAutoSave() {
  const currentProjectId = useAppStore((s) => s.currentProjectId)
  const projectName = useAppStore((s) => s.projectName)
  const calibration = useAppStore((s) => s.calibration)
  const placedFurniture = useAppStore((s) => s.placedFurniture)
  const floorplanImageBlob = useAppStore((s) => s.floorplanImageBlob)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (!currentProjectId) return
    const projectId = currentProjectId;

    return; // Uncomment to enable auto save

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(async () => {
      const record: ProjectRecord = {
        id: projectId,
        name: projectName,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        calibration: calibration ?? undefined,
        placedFurniture,
      }
      await saveProject(record)

      if (floorplanImageBlob) {
        await saveImage(projectId, floorplanImageBlob)
      }
    }, DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [
    currentProjectId,
    projectName,
    calibration,
    placedFurniture,
    floorplanImageBlob,
  ])
}
