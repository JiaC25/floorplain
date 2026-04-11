import { nanoid } from 'nanoid'
import { Trash2 } from 'lucide-react'
import { useAppStore } from '../../stores/useAppStore'
import { useHistoryStore } from '../../stores/useHistoryStore'
import { cmToPixels } from '../../utils/coordinates'
import { Button } from '../ui/Button'

export function SelectionToolbar() {
  const selectedFurnitureId = useAppStore((s) => s.selectedFurnitureId)
  const placedFurniture = useAppStore((s) => s.placedFurniture)
  const calibration = useAppStore((s) => s.calibration)
  const stageScale = useAppStore((s) => s.stageScale)
  const stagePosition = useAppStore((s) => s.stagePosition)
  const furnitureVisible = useAppStore((s) => s.layerVisibility.furniture)
  const updatePlacedFurniture = useAppStore((s) => s.updatePlacedFurniture)
  const removePlacedFurniture = useAppStore((s) => s.removePlacedFurniture)
  const addPlacedFurniture = useAppStore((s) => s.addPlacedFurniture)

  const pushHistory = useHistoryStore((s) => s.push)

  if (!furnitureVisible || !selectedFurnitureId || !calibration) return null

  const item = placedFurniture.find((f) => f.id === selectedFurnitureId)
  if (!item) return null

  const widthPx = cmToPixels(item.widthCm, calibration)
  const screenX = item.x * stageScale + stagePosition.x
  const screenY =
    (item.y - cmToPixels(item.depthCm, calibration) / 2) * stageScale +
    stagePosition.y -
    44

  const clampedX = Math.max(8, Math.min(screenX - 80, window.innerWidth - 260))
  const clampedY = Math.max(8, screenY)

  const snap = () => pushHistory([...placedFurniture])

  const handleRotate = () => {
    snap()
    updatePlacedFurniture(item.id, {
      rotation: (item.rotation + 45) % 360,
    })
  }

  const handleDuplicate = () => {
    snap()
    const offsetPx = widthPx * 0.3
    addPlacedFurniture({
      ...item,
      id: nanoid(),
      x: item.x + offsetPx,
      y: item.y + offsetPx,
    })
  }

  const handleDelete = () => {
    snap()
    removePlacedFurniture(item.id)
  }

  return (
    <div
      className="pointer-events-auto absolute z-10 flex items-center gap-1 rounded-lg bg-white px-2 py-1 shadow-lg ring-1 ring-zinc-200"
      style={{ left: clampedX, top: clampedY }}
    >
      <span className="mr-1 max-w-[100px] truncate text-xs font-medium text-zinc-600">
        {item.name}
      </span>
      <Button
        onClick={handleRotate}
        size="sm"
        variant="base"
        className="border-none text-zinc-600 hover:bg-zinc-100"
        title="Rotate 45°"
      >
        ↻ 45°
      </Button>
      <Button
        onClick={handleDuplicate}
        size="sm"
        variant="base"
        className="border-none text-zinc-600 hover:bg-zinc-100"
        title="Duplicate"
      >
        Copy
      </Button>
      <Button
        onClick={handleDelete}
        size="icon"
        variant="base"
        className="h-6 w-6 border-none text-red-500 hover:bg-red-50"
        title="Delete"
        aria-label={`Delete ${item.name}`}
      >
        <Trash2 size={14} />
      </Button>
    </div>
  )
}
