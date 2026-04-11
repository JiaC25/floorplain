import { useEffect } from 'react'
import { useAppStore } from '../stores/useAppStore'
import { loadAllTemplates } from '../db/furnitureStorage'
import { loadAllProjects, loadProject } from '../db/projectStorage'
import { hydrateFloorplanFromProject } from '../utils/hydrateFloorplan'

const LAST_PROJECT_KEY = 'floorplain:lastProjectId'

export function useInitializeApp() {
  const setFurnitureLibrary = useAppStore((s) => s.setFurnitureLibrary)
  const resetProject = useAppStore((s) => s.resetProject)
  const setCurrentProjectId = useAppStore((s) => s.setCurrentProjectId)
  const setProjectName = useAppStore((s) => s.setProjectName)
  const setPlacedFurniture = useAppStore((s) => s.setPlacedFurniture)
  const setReferenceLines = useAppStore((s) => s.setReferenceLines)
  const setCalibration = useAppStore((s) => s.setCalibration)
  const clearCalibration = useAppStore((s) => s.clearCalibration)
  const setFloorplanComplete = useAppStore((s) => s.setFloorplanComplete)
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
      setReferenceLines(preferred.referenceLines ?? [])

      if (preferred.calibration) {
        setCalibration(preferred.calibration)
      } else {
        clearCalibration()
      }

      const project = await loadProject(preferred.id)
      if (project) {
        await hydrateFloorplanFromProject(
          preferred.id,
          project,
          setFloorplanComplete,
          clearFloorplan,
        )
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
    setReferenceLines,
    setCalibration,
    clearCalibration,
    setFloorplanComplete,
    clearFloorplan,
    setMode,
  ])
}
