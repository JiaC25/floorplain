import { useEffect, useState, useRef } from 'react'
import { nanoid } from 'nanoid'
import { useAppStore } from '../../stores/useAppStore'
import {
  loadAllProjects,
  loadProject,
  loadImage,
  deleteProject,
} from '../../db/projectStorage'
import { importProject as importProjectFile } from '../../utils/export'
import { saveTemplate } from '../../db/furnitureStorage'
import { loadAllTemplates } from '../../db/furnitureStorage'
import { Button } from '../ui/Button'
import type { ProjectRecord } from '../../db/database'

const LAST_PROJECT_KEY = 'floorplain:lastProjectId'

interface Props {
  open: boolean
  onClose: () => void
}

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

export function ProjectListModal({ open, onClose }: Props) {
  const [projects, setProjects] = useState<ProjectRecord[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentProjectId = useAppStore((s) => s.currentProjectId)
  const setCurrentProjectId = useAppStore((s) => s.setCurrentProjectId)
  const setProjectName = useAppStore((s) => s.setProjectName)
  const setCalibration = useAppStore((s) => s.setCalibration)
  const clearCalibration = useAppStore((s) => s.clearCalibration)
  const setPlacedFurniture = useAppStore((s) => s.setPlacedFurniture)
  const setFloorplanImage = useAppStore((s) => s.setFloorplanImage)
  const clearFloorplan = useAppStore((s) => s.clearFloorplan)
  const resetProject = useAppStore((s) => s.resetProject)
  const setFurnitureLibrary = useAppStore((s) => s.setFurnitureLibrary)
  const setMode = useAppStore((s) => s.setMode)

  useEffect(() => {
    if (open) {
      loadAllProjects().then((p) =>
        setProjects(p.sort((a, b) => b.updatedAt - a.updatedAt)),
      )
    }
  }, [open])

  if (!open) return null

  const handleNewProject = () => {
    resetProject()
    const id = nanoid()
    setCurrentProjectId(id)
    localStorage.setItem(LAST_PROJECT_KEY, id)
    setProjectName('Untitled Project')
    setMode('default')
    onClose()
  }

  const handleLoadProject = async (id: string) => {
    const project = await loadProject(id)
    if (!project) return

    resetProject()
    setCurrentProjectId(project.id)
    localStorage.setItem(LAST_PROJECT_KEY, project.id)
    setProjectName(project.name)
    setPlacedFurniture(project.placedFurniture)

    if (project.calibration) {
      setCalibration(project.calibration)
    } else {
      clearCalibration()
    }

    const blob = await loadImage(id)
    if (blob) {
      const img = await blobToImage(blob)
      setFloorplanImage(img, blob)
    } else {
      clearFloorplan()
    }

    setMode('default')
    onClose()
  }

  const handleDeleteProject = async (id: string) => {
    await deleteProject(id)
    setProjects((prev) => prev.filter((p) => p.id !== id))
    if (currentProjectId === id) {
      resetProject()
      localStorage.removeItem(LAST_PROJECT_KEY)
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const data = await importProjectFile(file)
      const id = nanoid()

      resetProject()
      setCurrentProjectId(id)
      localStorage.setItem(LAST_PROJECT_KEY, id)
      setProjectName(data.name)
      setPlacedFurniture(data.placedFurniture)

      if (data.calibration) {
        setCalibration(data.calibration)
      }

      if (data.floorplanImageBlob) {
        const img = await blobToImage(data.floorplanImageBlob)
        setFloorplanImage(img, data.floorplanImageBlob)
      }

      if (data.furnitureLibrary.length > 0) {
        for (const template of data.furnitureLibrary) {
          await saveTemplate(template)
        }
        const allTemplates = await loadAllTemplates()
        setFurnitureLibrary(allTemplates)
      }

      setMode('default')
      onClose()
    } catch {
      alert('Failed to import project file.')
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-800">Projects</h2>
          <Button
            onClick={onClose}
            size="icon"
            variant="base"
            className="h-7 w-7 border-none text-zinc-400 hover:text-zinc-600"
          >
            ×
          </Button>
        </div>

        <div className="mb-4 flex gap-2">
          <Button onClick={handleNewProject} variant="primary">
            New Project
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          <Button onClick={() => fileInputRef.current?.click()} variant="base">
            Import .json
          </Button>
        </div>

        {projects.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-400">
            No saved projects yet.
          </p>
        ) : (
          <ul className="flex max-h-64 flex-col gap-2 overflow-y-auto">
            {projects.map((p) => (
              <li
                key={p.id}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
                  p.id === currentProjectId
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-zinc-200 hover:bg-zinc-50'
                }`}
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-800">
                    {p.name}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {new Date(p.updatedAt).toLocaleDateString()}{' '}
                    · {p.placedFurniture.length} items
                  </p>
                </div>
                <Button
                  onClick={() => handleLoadProject(p.id)}
                  size="sm"
                  variant="base"
                  className="text-blue-600 hover:bg-blue-50"
                >
                  Open
                </Button>
                <Button
                  onClick={() => handleDeleteProject(p.id)}
                  size="sm"
                  variant="base"
                  className="text-red-500 hover:bg-red-50"
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
