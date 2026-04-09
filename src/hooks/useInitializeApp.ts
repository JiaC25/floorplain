import { useEffect } from 'react'
import { useAppStore } from '../stores/useAppStore'
import { loadAllTemplates } from '../db/furnitureStorage'
import { loadAllProjects, loadImage } from '../db/projectStorage'

const LAST_PROJECT_KEY = 'floorplain:lastProjectId'

function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(blob)
    img.onload = () => {
      resolve(img)
      URL.revokeObjectURL(url)
    }
    img.onerror = reject
    img.src = url
  })
}

export function useInitializeApp() {
  const setFurnitureLibrary = useAppStore((s) => s.setFurnitureLibrary)
  const resetProject = useAppStore((s) => s.resetProject)
  const setCurrentProjectId = useAppStore((s) => s.setCurrentProjectId)
  const setProjectName = useAppStore((s) => s.setProjectName)
  const setPlacedFurniture = useAppStore((s) => s.setPlacedFurniture)
  const setCalibration = useAppStore((s) => s.setCalibration)
  const clearCalibration = useAppStore((s) => s.clearCalibration)
  const setFloorplanImage = useAppStore((s) => s.setFloorplanImage)
  const clearFloorplan = useAppStore((s) => s.clearFloorplan)
  const setMode = useAppStore((s) => s.setMode)

  useEffect(() => {
    async function initialize() {
      const templates = await loadAllTemplates()
      setFurnitureLibrary(templates)

      const projects = await loadAllProjects()
      if (projects.length === 0) return

      const sorted = [...projects].sort((a, b) => b.updatedAt - a.updatedAt)
      const lastProjectId = localStorage.getItem(LAST_PROJECT_KEY)
      const preferred =
        sorted.find((p) => p.id === lastProjectId) ?? sorted[0]

      resetProject()
      setCurrentProjectId(preferred.id)
      setProjectName(preferred.name)
      setPlacedFurniture(preferred.placedFurniture)

      if (preferred.calibration) {
        setCalibration(preferred.calibration)
      } else {
        clearCalibration()
      }

      const blob = await loadImage(preferred.id)
      if (blob) {
        const img = await blobToImage(blob)
        setFloorplanImage(img, blob)
      } else {
        clearFloorplan()
      }

      setMode('default')
      localStorage.setItem(LAST_PROJECT_KEY, preferred.id)
    }

    void initialize()
  }, [
    setFurnitureLibrary,
    resetProject,
    setCurrentProjectId,
    setProjectName,
    setPlacedFurniture,
    setCalibration,
    clearCalibration,
    setFloorplanImage,
    clearFloorplan,
    setMode,
  ])
}
