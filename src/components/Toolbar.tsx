import { useEffect, useRef, useState } from 'react'
import { nanoid } from 'nanoid'
import { Download, Eraser, FolderOpen, Ruler, Save, X } from 'lucide-react'
import ReactCrop, {
  type Crop,
  type PixelCrop,
} from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { useAppStore } from '../stores/useAppStore'
import { saveProject, saveImage } from '../db/projectStorage'
import { exportProject } from '../utils/export'
import { ProjectListModal } from './Modals/ProjectListModal'
import { Button } from './ui/Button'
import type { ProjectRecord } from '../db/database'

const LAST_PROJECT_KEY = 'floorplain:lastProjectId'

export function Toolbar() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadPreviewImgRef = useRef<HTMLImageElement | null>(null)
  const saveFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showProjects, setShowProjects] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [showClearFurnitureConfirm, setShowClearFurnitureConfirm] = useState(false)
  const [pendingUpload, setPendingUpload] = useState<{
    file: File
    previewUrl: string
  } | null>(null)
  const [uploadCrop, setUploadCrop] = useState<Crop>({
    unit: '%',
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  })
  const [uploadPixelCrop, setUploadPixelCrop] = useState<PixelCrop | null>(null)

  const floorplanImage = useAppStore((s) => s.floorplanImage)
  const floorplanImageBlob = useAppStore((s) => s.floorplanImageBlob)
  const mode = useAppStore((s) => s.mode)
  const calibration = useAppStore((s) => s.calibration)
  const setFloorplanImage = useAppStore((s) => s.setFloorplanImage)
  const setMode = useAppStore((s) => s.setMode)
  const clearCalibration = useAppStore((s) => s.clearCalibration)
  const setPlacedFurniture = useAppStore((s) => s.setPlacedFurniture)
  const setSelectedFurnitureId = useAppStore((s) => s.setSelectedFurnitureId)
  const resetCrop = useAppStore((s) => s.resetCrop)
  const stageScale = useAppStore((s) => s.stageScale)
  const setStageScale = useAppStore((s) => s.setStageScale)
  const setStagePosition = useAppStore((s) => s.setStagePosition)
  const projectName = useAppStore((s) => s.projectName)
  const setProjectName = useAppStore((s) => s.setProjectName)
  const currentProjectId = useAppStore((s) => s.currentProjectId)
  const setCurrentProjectId = useAppStore((s) => s.setCurrentProjectId)
  const placedFurniture = useAppStore((s) => s.placedFurniture)
  const furnitureLibrary = useAppStore((s) => s.furnitureLibrary)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const previewUrl = URL.createObjectURL(file)
    setPendingUpload({ file, previewUrl })

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  useEffect(() => {
    return () => {
      if (saveFeedbackTimerRef.current) {
        clearTimeout(saveFeedbackTimerRef.current)
      }
      if (pendingUpload) {
        URL.revokeObjectURL(pendingUpload.previewUrl)
      }
    }
  }, [pendingUpload])

  const commitUpload = async () => {
    if (!pendingUpload) return
    const { file, previewUrl } = pendingUpload

    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = reject
      img.src = previewUrl
    })

    const pixelCrop = uploadPixelCrop
    const isValidCrop =
      pixelCrop &&
      pixelCrop.width > 1 &&
      pixelCrop.height > 1 &&
      uploadPreviewImgRef.current

    if (!isValidCrop) {
      setFloorplanImage(img, file)
    } else {
      const sourceImg = uploadPreviewImgRef.current
      if (!sourceImg) return
      const scaleX = sourceImg.naturalWidth / sourceImg.width
      const scaleY = sourceImg.naturalHeight / sourceImg.height
      const sx = Math.round(pixelCrop.x * scaleX)
      const sy = Math.round(pixelCrop.y * scaleY)
      const sw = Math.round(pixelCrop.width * scaleX)
      const sh = Math.round(pixelCrop.height * scaleY)

      const canvas = document.createElement('canvas')
      canvas.width = sw
      canvas.height = sh
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.drawImage(
        sourceImg,
        sx,
        sy,
        sw,
        sh,
        0,
        0,
        canvas.width,
        canvas.height,
      )

      const croppedBlob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png'),
      )
      if (!croppedBlob) return

      const croppedImg = new Image()
      const croppedUrl = URL.createObjectURL(croppedBlob)
      await new Promise<void>((resolve, reject) => {
        croppedImg.onload = () => resolve()
        croppedImg.onerror = reject
        croppedImg.src = croppedUrl
      })
      URL.revokeObjectURL(croppedUrl)
      setFloorplanImage(croppedImg, croppedBlob)
    }

    setMode('default')
    resetCrop()
    clearCalibration()
    setPlacedFurniture([])
    setSelectedFurnitureId(null)
    URL.revokeObjectURL(previewUrl)
    setPendingUpload(null)
  }

  const cancelUpload = () => {
    if (!pendingUpload) return
    URL.revokeObjectURL(pendingUpload.previewUrl)
    setPendingUpload(null)
  }

  const handleUploadPreviewLoad = (
    e: React.SyntheticEvent<HTMLImageElement>,
  ) => {
    const { width, height } = e.currentTarget
    uploadPreviewImgRef.current = e.currentTarget
    setUploadCrop({
      unit: '%',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    })
    setUploadPixelCrop({
      x: 0,
      y: 0,
      width,
      height,
      unit: 'px',
    })
  }

  const handleCalibrateToggle = () => {
    if (mode === 'calibrating') {
      setMode('default')
    } else {
      setMode('calibrating')
    }
  }

  const handleMeasureToggle = () => {
    if (mode === 'measuring') {
      setMode('default')
    } else {
      setMode('measuring')
    }
  }

  const handleClearPlacedFurniture = () => {
    setPlacedFurniture([])
    setSelectedFurnitureId(null)
    setShowClearFurnitureConfirm(false)
  }

  const handleZoom = (direction: 'in' | 'out' | 'reset') => {
    if (direction === 'reset') {
      setStageScale(1)
      setStagePosition({ x: 0, y: 0 })
    } else {
      const factor = direction === 'in' ? 1.2 : 1 / 1.2
      setStageScale(Math.min(Math.max(stageScale * factor, 0.1), 10))
    }
  }

  const handleSave = async () => {
    if (saveState === 'saving') return
    setSaveState('saving')
    let pid = currentProjectId
    if (!pid) {
      pid = nanoid()
      setCurrentProjectId(pid)
      localStorage.setItem(LAST_PROJECT_KEY, pid)
    }

    const record: ProjectRecord = {
      id: pid,
      name: projectName,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      calibration: calibration ?? undefined,
      placedFurniture,
    }
    await saveProject(record)
    if (floorplanImageBlob) {
      await saveImage(pid, floorplanImageBlob)
    }

    setSaveState('saved')
    if (saveFeedbackTimerRef.current) {
      clearTimeout(saveFeedbackTimerRef.current)
    }
    saveFeedbackTimerRef.current = setTimeout(() => {
      setSaveState('idle')
      saveFeedbackTimerRef.current = null
    }, 1200)
  }

  const handleExport = async () => {
    await exportProject({
      name: projectName,
      calibration: calibration ?? undefined,
      placedFurniture,
      furnitureLibrary,
      floorplanImageBlob,
    })
  }

  return (
    <>
      <div className="flex h-12 items-center gap-2 border-b border-zinc-200 bg-white px-4">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold tracking-tight text-zinc-800 mx-2">
            Floorplain
          </span>
          <span className="text-zinc-300">|</span>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="w-44 rounded border border-transparent px-1.5 py-0.5 text-sm text-zinc-600 hover:border-zinc-300 focus:border-blue-400 focus:outline-none"
          />
          <Button
            onClick={() => setShowProjects(true)}
            variant="base"
            size="icon"
            className="h-8 w-8"
            title="Projects"
            aria-label="Projects"
          >
            <FolderOpen size={16} />
          </Button>
        </div>

        <div className="mx-2 h-5 w-px bg-zinc-200" />

        <Button onClick={handleSave} variant="base" disabled={saveState === 'saving' || saveState === 'saved'}>
          <Save size={14} />
          <span className="ml-1">
            {saveState === 'saving'
              ? 'Saving...'
              : saveState === 'saved'
                ? 'Saved!'
                : 'Save'}
          </span>
        </Button>
        <Button onClick={handleExport} variant="base">
          <Download size={14} />
          <span className="ml-1">Export</span>
        </Button>

        <div className="mx-2 h-5 w-px bg-zinc-200" />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        {!floorplanImage ? (
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="primary"
          >
            Upload Floorplan
          </Button>
        ) : (
          <>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="base"
            >
              Replace Floorplan
            </Button>
          </>
        )}

        {floorplanImage && (
          <>
            <div className="mx-2 h-5 w-px bg-zinc-200" />
            <Button
              onClick={handleCalibrateToggle}
              variant={
                mode === 'calibrating'
                  ? 'base'
                  : calibration
                    ? 'base'
                    : 'primary'
              }
              className={`rounded px-3 py-1 text-sm font-medium ${
                mode === 'calibrating'
                  ? 'bg-amber-500! text-white! hover:bg-amber-600!'
                  : calibration
                    ? 'border border-green-300! bg-green-50! text-green-700! hover:bg-green-100!'
                    : 'border'
              }`}
            >
              {mode === 'calibrating'
                ? 'Cancel Calibration'
                : calibration
                  ? 'Recalibrate'
                  : 'Calibrate Scale'}
            </Button>
            {calibration && mode !== 'calibrating' && (
              <span className="text-xs text-zinc-400">
                {calibration.pixelsPerCm.toFixed(1)} px/cm
              </span>
            )}
            
            <div className="mx-2 h-5 w-px bg-zinc-200" />

            {/* Tools */}
            <div className="flex flex-1 items-center gap-2">
              {calibration && (
                <Button
                  onClick={handleMeasureToggle}
                  size="icon"
                  className={`rounded px-2 py-1 text-sm font-medium ${
                    mode === 'measuring'
                      ? 'bg-sky-500! text-white! hover:bg-sky-600!'
                      : 'border border-zinc-300! text-zinc-700! hover:bg-zinc-50!'
                  }`}
                  title="Measure distance"
                  aria-label="Measure distance"
                >
                  <Ruler size={16} />
                </Button>
              )}
              <Button
                onClick={() => setShowClearFurnitureConfirm(true)}
                size="icon"
                title="Clear all placed furniture"
                aria-label="Clear all placed furniture"
              >
                <Eraser size={16} />
              </Button>
            </div>
          </>
        )}

        {/* Zoom */}
        <div className="flex items-center bg-gray-50 rounded-md border border-zinc-200 ml-auto">
          <button
            onClick={() => handleZoom('out')}
            className="px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100 border-r border-zinc-200"
            title="Zoom out"
          >
            −
          </button>
          <button
            onClick={() => handleZoom('reset')}
            className="min-w-14 px-2 py-1 text-center text-xs text-zinc-500 hover:bg-zinc-100 border-r border-zinc-200"
            title="Reset zoom"
          >
            {Math.round(stageScale * 100)}%
          </button>
          <button
            onClick={() => handleZoom('in')}
            className="px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100"
            title="Zoom in"
          >
            +
          </button>
        </div>
      </div>

      <ProjectListModal
        open={showProjects}
        onClose={() => setShowProjects(false)}
      />

      {showClearFurnitureConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35"
          onClick={() => setShowClearFurnitureConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-zinc-800">
              Clear all placed furniture?
            </h3>
            <p className="mt-1 text-sm text-zinc-600">
              This will remove all furniture currently placed on the floorplan.
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button
                onClick={() => setShowClearFurnitureConfirm(false)}
                variant="base"
              >
                Cancel
              </Button>
              <Button onClick={handleClearPlacedFurniture} variant="destructive">
                Clear all
              </Button>
            </div>
          </div>
        </div>
      )}

      {pendingUpload && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35"
          onClick={cancelUpload}
        >
          <div
            className="w-full max-w-5xl rounded-xl bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-zinc-800">
                Upload Floorplan
              </h3>
              <Button
                onClick={cancelUpload}
                variant="base"
                size="icon"
                className="h-7 w-7 border-none text-zinc-400 hover:text-zinc-600"
                aria-label="Close"
              >
                <X size={16} />
              </Button>
            </div>

            <div className="mb-4 max-h-[68vh] overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-2">
              <div className="flex justify-center">
                <ReactCrop
                  crop={uploadCrop}
                  onChange={(crop) => setUploadCrop(crop)}
                  onComplete={(cropPx) => setUploadPixelCrop(cropPx)}
                  keepSelection
                >
                  <img
                    src={pendingUpload.previewUrl}
                    alt="Floorplan preview"
                    className="block h-auto max-h-[64vh] w-auto max-w-[calc(100vw-8rem)]"
                    onLoad={handleUploadPreviewLoad}
                  />
                </ReactCrop>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button onClick={cancelUpload} variant="base">
                Cancel
              </Button>
              <Button onClick={commitUpload} variant="primary">
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
