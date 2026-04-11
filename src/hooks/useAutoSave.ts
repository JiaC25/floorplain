import { useEffect, useRef } from 'react'
import { useAppStore } from '../stores/useAppStore'
import { saveProject, saveImage, saveFloorplanOriginal } from '../db/projectStorage'
import type { ProjectRecord } from '../db/database'

const DEBOUNCE_MS = 1500

export function useAutoSave() {
  const currentProjectId = useAppStore((s) => s.currentProjectId)
  const projectName = useAppStore((s) => s.projectName)
  const calibration = useAppStore((s) => s.calibration)
  const placedFurniture = useAppStore((s) => s.placedFurniture)
  const referenceLines = useAppStore((s) => s.referenceLines)
  const floorplanImageBlob = useAppStore((s) => s.floorplanImageBlob)
  const floorplanOriginalBlob = useAppStore((s) => s.floorplanOriginalBlob)
  const floorplanCropPixels = useAppStore((s) => s.floorplanCropPixels)
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
        referenceLines:
          referenceLines.length > 0 ? referenceLines : undefined,
        floorplanCrop: floorplanCropPixels ?? undefined,
      }
      await saveProject(record)

      if (floorplanImageBlob) {
        await saveImage(projectId, floorplanImageBlob)
      }
      if (floorplanOriginalBlob) {
        await saveFloorplanOriginal(projectId, floorplanOriginalBlob)
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
    referenceLines,
    floorplanImageBlob,
    floorplanOriginalBlob,
    floorplanCropPixels,
  ])
}
