import { useEffect, useMemo, useRef, useState } from 'react'
import { nanoid } from 'nanoid'
import {
  Anchor,
  Download,
  Eye,
  FolderOpen,
  Palette,
  RotateCcw,
  Ruler,
  Save,
  Settings2,
} from 'lucide-react'
import { useAppStore } from '../stores/useAppStore'
import {
  saveProject,
  saveImage,
  saveFloorplanOriginal,
} from '../db/projectStorage'
import { exportProject } from '../utils/export'
import { ProjectListModal } from './Modals/ProjectListModal'
import { Button } from './ui/Button'
import { FloorplanModal } from './Modals/FloorplanModal'
import type { ProjectRecord } from '../db/database'
import type { FloorplanCropPixels, FurnitureTemplate } from '../types'
import { renderCroppedFloorplan } from '../utils/floorplanImage'
import { useHistoryStore } from '../stores/useHistoryStore'

const LAST_PROJECT_KEY = 'floorplain:lastProjectId'
const TOOL_ICON_SIZE = 16

/** Active state for icon tools (reference line, measure, palette, visibility, etc.) */
const TOOL_ACTIVE =
  'bg-violet-600! text-white! hover:bg-violet-700!'
const TOOL_IDLE =
  'border border-zinc-300! text-zinc-700! hover:bg-zinc-50!'

function groupLibraryByColor(library: FurnitureTemplate[]) {
  const map = new Map<string, FurnitureTemplate[]>()
  for (const t of library) {
    const key = t.color.trim().toLowerCase()
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(t)
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, templates]) => ({
      key,
      displayColor: templates[0].color,
      templates: [...templates].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
      ),
    }))
}

export function Toolbar() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const saveFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showProjects, setShowProjects] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [batchByColorOpen, setBatchByColorOpen] = useState(false)
  const batchByColorRef = useRef<HTMLDivElement>(null)
  const [visibilityMenuOpen, setVisibilityMenuOpen] = useState(false)
  const visibilityMenuRef = useRef<HTMLDivElement>(null)
  const [floorplanModal, setFloorplanModal] = useState<{
    mode: 'new' | 'configure'
    previewUrl: string
    sourceBlob: Blob
    initialNaturalCrop: FloorplanCropPixels | null
    /** User picked a new image via Upload New; confirm will reset annotations */
    pendingNewFloorplanUpload: boolean
  } | null>(null)

  const floorplanImage = useAppStore((s) => s.floorplanImage)
  const floorplanImageBlob = useAppStore((s) => s.floorplanImageBlob)
  const floorplanOriginalBlob = useAppStore((s) => s.floorplanOriginalBlob)
  const floorplanCropPixels = useAppStore((s) => s.floorplanCropPixels)
  const mode = useAppStore((s) => s.mode)
  const calibration = useAppStore((s) => s.calibration)
  const setFloorplanComplete = useAppStore((s) => s.setFloorplanComplete)
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
  const referenceLines = useAppStore((s) => s.referenceLines)
  const clearReferenceLines = useAppStore((s) => s.clearReferenceLines)
  const setSelectedReferenceLineId = useAppStore(
    (s) => s.setSelectedReferenceLineId,
  )
  const addPlacedFurniture = useAppStore((s) => s.addPlacedFurniture)
  const layerVisibility = useAppStore((s) => s.layerVisibility)
  const setLayerVisibility = useAppStore((s) => s.setLayerVisibility)
  const pushHistory = useHistoryStore((s) => s.push)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const previewUrl = URL.createObjectURL(file)
    setFloorplanModal({
      mode: 'new',
      previewUrl,
      sourceBlob: file,
      initialNaturalCrop: null,
      pendingNewFloorplanUpload: false,
    })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const openConfigureFloorplan = () => {
    const orig = floorplanOriginalBlob ?? floorplanImageBlob
    if (!orig) return
    const previewUrl = URL.createObjectURL(orig)
    setFloorplanModal({
      mode: 'configure',
      previewUrl,
      sourceBlob: orig,
      initialNaturalCrop: floorplanCropPixels,
      pendingNewFloorplanUpload: false,
    })
  }

  const handleFloorplanUploadNew = (file: File) => {
    setFloorplanModal((prev) => {
      if (!prev) return prev
      URL.revokeObjectURL(prev.previewUrl)
      return {
        ...prev,
        previewUrl: URL.createObjectURL(file),
        sourceBlob: file,
        initialNaturalCrop: null,
        pendingNewFloorplanUpload: true,
      }
    })
  }

  const cancelFloorplanModal = () => {
    if (!floorplanModal) return
    URL.revokeObjectURL(floorplanModal.previewUrl)
    setFloorplanModal(null)
  }

  const commitFloorplanModal = async (
    naturalCrop: FloorplanCropPixels,
  ) => {
    if (!floorplanModal) return
    const {
      previewUrl,
      mode,
      sourceBlob,
      pendingNewFloorplanUpload,
    } = floorplanModal
    const resetAnnotations =
      mode === 'new' || pendingNewFloorplanUpload
    try {
      const { image, blob } = await renderCroppedFloorplan(
        sourceBlob,
        naturalCrop,
      )
      setFloorplanComplete({
        floorplanImage: image,
        floorplanImageBlob: blob,
        floorplanOriginalBlob: sourceBlob,
        floorplanCropPixels: naturalCrop,
      })
    } finally {
      URL.revokeObjectURL(previewUrl)
      setFloorplanModal(null)
    }
    if (resetAnnotations) {
      setMode('default')
      resetCrop()
      clearCalibration()
      setPlacedFurniture([])
      clearReferenceLines()
      setSelectedFurnitureId(null)
      setSelectedReferenceLineId(null)
      setLayerVisibility({
        furniture: true,
        calibrationLine: true,
        referenceLines: true,
      })
    }
  }

  useEffect(() => {
    return () => {
      if (saveFeedbackTimerRef.current) {
        clearTimeout(saveFeedbackTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    return () => {
      if (floorplanModal) {
        URL.revokeObjectURL(floorplanModal.previewUrl)
      }
    }
  }, [floorplanModal])

  const handleCalibrateToggle = () => {
    setBatchByColorOpen(false)
    setVisibilityMenuOpen(false)
    if (mode === 'calibrating') {
      setMode('default')
    } else {
      setMode('calibrating')
    }
  }

  const handleMeasureToggle = () => {
    setBatchByColorOpen(false)
    setVisibilityMenuOpen(false)
    if (mode === 'measuring') {
      setMode('default')
    } else {
      setMode('measuring')
    }
  }

  const handleReferenceLineToggle = () => {
    setBatchByColorOpen(false)
    setVisibilityMenuOpen(false)
    if (mode === 'referenceLine') {
      setMode('default')
    } else {
      setMode('referenceLine')
    }
  }

  const handleResetCanvas = () => {
    setPlacedFurniture([])
    clearReferenceLines()
    setSelectedFurnitureId(null)
    setSelectedReferenceLineId(null)
    setLayerVisibility({
      furniture: true,
      calibrationLine: true,
      referenceLines: true,
    })
    setShowResetConfirm(false)
  }

  const colorGroups = useMemo(
    () => groupLibraryByColor(furnitureLibrary),
    [furnitureLibrary],
  )

  useEffect(() => {
    if (!batchByColorOpen) return
    const onPointerDown = (e: PointerEvent) => {
      if (batchByColorRef.current?.contains(e.target as Node)) return
      setBatchByColorOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setBatchByColorOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [batchByColorOpen])

  useEffect(() => {
    if (!visibilityMenuOpen) return
    const onPointerDown = (e: PointerEvent) => {
      if (visibilityMenuRef.current?.contains(e.target as Node)) return
      setVisibilityMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setVisibilityMenuOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [visibilityMenuOpen])

  const handlePlaceAllByColor = (templates: FurnitureTemplate[]) => {
    if (!calibration || !floorplanImage || templates.length === 0) return
    pushHistory([...useAppStore.getState().placedFurniture])
    const cx = floorplanImage.width / 2
    const cy = floorplanImage.height / 2
    const n = templates.length
    const cols = Math.max(1, Math.ceil(Math.sqrt(n)))
    const rows = Math.ceil(n / cols)
    const spacing = 72
    for (let i = 0; i < n; i++) {
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = cx + (col - (cols - 1) / 2) * spacing
      const y = cy + (row - (rows - 1) / 2) * spacing
      const t = templates[i]
      addPlacedFurniture({
        id: nanoid(),
        templateId: t.id,
        name: t.name,
        widthCm: t.widthCm,
        depthCm: t.depthCm,
        color: t.color,
        x,
        y,
        rotation: 0,
      })
    }
    setSelectedFurnitureId(null)
    setBatchByColorOpen(false)
    setVisibilityMenuOpen(false)
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
      referenceLines: referenceLines.length > 0 ? referenceLines : undefined,
      floorplanCrop: floorplanCropPixels ?? undefined,
    }
    await saveProject(record)
    if (floorplanImageBlob) {
      await saveImage(pid, floorplanImageBlob)
    }
    if (floorplanOriginalBlob) {
      await saveFloorplanOriginal(pid, floorplanOriginalBlob)
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
      floorplanOriginalBlob,
      floorplanCrop: floorplanCropPixels,
      referenceLines: referenceLines.length > 0 ? referenceLines : undefined,
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
            className="w-50 rounded border border-transparent px-1.5 py-0.5 text-sm text-zinc-600 hover:border-zinc-300 focus:border-blue-400 focus:outline-none"
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

        <Button onClick={handleSave} variant={floorplanImage && calibration ? 'primary' : 'base'} disabled={saveState === 'saving' || saveState === 'saved'}>
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
          <Button onClick={openConfigureFloorplan} variant="base">
            <Settings2 size={14} />
            <span className="ml-1">Floorplan</span>
          </Button>
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
                  ? `bg-amber-500! text-white! hover:bg-amber-600!`
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
            <div className="flex flex-1 items-center gap-1.5">
              <Button
                onClick={handleReferenceLineToggle}
                size="icon"
                className={`rounded px-2 py-1 text-sm font-medium ${
                  mode === 'referenceLine' ? TOOL_ACTIVE : TOOL_IDLE
                }`}
                title="Reference line — click two points; distance uses calibration when set"
                aria-label="Reference line"
              >
                <Anchor size={TOOL_ICON_SIZE} />
              </Button>
              {calibration && (
                <Button
                  onClick={handleMeasureToggle}
                  size="icon"
                  className={`rounded px-2 py-1 text-sm font-medium ${
                    mode === 'measuring' ? TOOL_ACTIVE : TOOL_IDLE
                  }`}
                  title="Measure distance"
                  aria-label="Measure distance"
                >
                  <Ruler size={TOOL_ICON_SIZE} />
                </Button>
              )}
              {calibration && (
                <div className="relative" ref={batchByColorRef}>
                  <Button
                    onClick={() => {
                      const willOpen = !batchByColorOpen
                      setVisibilityMenuOpen(false)
                      if (
                        willOpen &&
                        (mode === 'measuring' || mode === 'referenceLine')
                      ) {
                        setMode('default')
                      }
                      setBatchByColorOpen((o) => !o)
                    }}
                    size="icon"
                    disabled={furnitureLibrary.length === 0}
                    className={`rounded px-2 py-1 text-sm font-medium ${
                      batchByColorOpen ? TOOL_ACTIVE : TOOL_IDLE
                    }`}
                    title={
                      furnitureLibrary.length === 0
                        ? 'Add furniture in My Furniture first'
                        : 'Place all library items of one color'
                    }
                    aria-label="Place all furniture by color"
                    aria-expanded={batchByColorOpen}
                    aria-haspopup="listbox"
                  >
                    <Palette size={TOOL_ICON_SIZE} />
                  </Button>
                  {batchByColorOpen && colorGroups.length > 0 && (
                    <div
                      className="absolute left-0 top-full z-50 mt-1 min-w-[220px] rounded-lg border border-zinc-200 bg-white py-1 shadow-lg"
                      role="listbox"
                      aria-label="Choose color to place all matching furniture"
                    >
                      <p className="border-b border-zinc-100 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                        Place all of color
                      </p>
                      <ul className="max-h-60 overflow-y-auto py-1">
                        {colorGroups.map((g) => (
                          <li key={g.key}>
                            <button
                              type="button"
                              role="option"
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
                              onClick={() => handlePlaceAllByColor(g.templates)}
                            >
                              <span
                                className="h-4 w-4 shrink-0 rounded-sm border border-zinc-200"
                                style={{ backgroundColor: g.displayColor }}
                              />
                              <span className="flex-1 truncate">
                                {g.templates.length} item
                                {g.templates.length === 1 ? '' : 's'}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              <div className="relative" ref={visibilityMenuRef}>
                <Button
                  onClick={() => {
                    const willOpen = !visibilityMenuOpen
                    setBatchByColorOpen(false)
                    if (
                      willOpen &&
                      (mode === 'measuring' || mode === 'referenceLine')
                    ) {
                      setMode('default')
                    }
                    setVisibilityMenuOpen((o) => !o)
                  }}
                  size="icon"
                  className={`rounded px-2 py-1 text-sm font-medium ${
                    visibilityMenuOpen ? TOOL_ACTIVE : TOOL_IDLE
                  }`}
                  title="Show or hide furniture, dimensions, calibration, and reference lines"
                  aria-label="Layer visibility"
                  aria-expanded={visibilityMenuOpen}
                  aria-haspopup="menu"
                >
                  <Eye size={TOOL_ICON_SIZE} />
                </Button>
                {visibilityMenuOpen && (
                  <div
                    className="absolute right-0 top-full z-50 mt-1 w-64 rounded-lg border border-zinc-200 bg-white py-2 shadow-lg"
                    role="menu"
                    aria-label="Toggle layer visibility"
                  >
                    <p className="border-b border-zinc-100 px-3 pb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                      Visibility
                    </p>
                    <ul className="px-3 pt-1">
                      <li>
                        <label className="flex cursor-pointer items-center gap-2 py-2 text-sm text-zinc-700">
                          <input
                            type="checkbox"
                            className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                            checked={layerVisibility.furniture}
                            onChange={(e) =>
                              setLayerVisibility({
                                furniture: e.target.checked,
                              })
                            }
                          />
                          Furniture
                        </label>
                      </li>
                      <li className="pl-7">
                        <label
                          className={`flex cursor-pointer items-center gap-2 py-1.5 text-xs text-zinc-600 ${
                            !layerVisibility.furniture ? 'opacity-50' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                            checked={layerVisibility.furnitureDimensions}
                            disabled={!layerVisibility.furniture}
                            onChange={(e) =>
                              setLayerVisibility({
                                furnitureDimensions: e.target.checked,
                              })
                            }
                          />
                          Show dimensions (W × D)
                        </label>
                      </li>
                      <li>
                        <label className="flex cursor-pointer items-center gap-2 py-2 text-sm text-zinc-700">
                          <input
                            type="checkbox"
                            className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                            checked={layerVisibility.calibrationLine}
                            onChange={(e) =>
                              setLayerVisibility({
                                calibrationLine: e.target.checked,
                              })
                            }
                          />
                          Calibration line
                        </label>
                      </li>
                      <li>
                        <label className="flex cursor-pointer items-center gap-2 py-2 text-sm text-zinc-700">
                          <input
                            type="checkbox"
                            className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                            checked={layerVisibility.referenceLines}
                            onChange={(e) =>
                              setLayerVisibility({
                                referenceLines: e.target.checked,
                              })
                            }
                          />
                          Reference lines
                        </label>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
              <Button
                onClick={() => {
                  setBatchByColorOpen(false)
                  setVisibilityMenuOpen(false)
                  setShowResetConfirm(true)
                }}
                size="icon"
                className={`rounded px-2 py-1 text-sm font-medium ${TOOL_IDLE}`}
                title="Reset — remove all placed furniture and reference lines"
                aria-label="Reset floorplan annotations"
              >
                <RotateCcw size={TOOL_ICON_SIZE} />
              </Button>
            </div>
          </>
        )}

        {/* Zoom */}
        <div className="flex items-center bg-zinc-50 rounded-md border border-zinc-200 ml-auto">
          <button
            onClick={() => handleZoom('out')}
            className="px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100 border-r border-zinc-200"
            title="Zoom out"
          >
            −
          </button>
          <button
            onClick={() => handleZoom('reset')}
            className="min-w-14 px-2 py-1 text-center text-xs text-zinc-600 hover:bg-zinc-100 border-r border-zinc-200"
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

      {showResetConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35"
          onClick={() => setShowResetConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-zinc-800">
              Reset floorplan annotations?
            </h3>
            <p className="mt-1 text-sm text-zinc-600">
              This removes all placed furniture and all reference lines from the
              current floorplan.
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button
                onClick={() => setShowResetConfirm(false)}
                variant="base"
              >
                Cancel
              </Button>
              <Button onClick={handleResetCanvas} variant="destructive">
                Reset
              </Button>
            </div>
          </div>
        </div>
      )}

      {floorplanModal && (
        <FloorplanModal
          open
          title={
            floorplanModal.mode === 'configure'
              ? 'Floorplan'
              : 'Upload Floorplan'
          }
          previewUrl={floorplanModal.previewUrl}
          initialNaturalCrop={floorplanModal.initialNaturalCrop}
          showUploadNew={floorplanModal.mode === 'configure'}
          showNewFloorplanWarning={floorplanModal.pendingNewFloorplanUpload}
          onUploadNew={handleFloorplanUploadNew}
          onClose={cancelFloorplanModal}
          onConfirm={(naturalCrop) => {
            void commitFloorplanModal(naturalCrop)
          }}
        />
      )}
    </>
  )
}
