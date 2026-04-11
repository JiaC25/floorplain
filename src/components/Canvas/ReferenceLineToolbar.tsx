import { Trash2 } from 'lucide-react'
import { useAppStore } from '../../stores/useAppStore'
import { Button } from '../ui/Button'

export function ReferenceLineToolbar() {
  const selectedReferenceLineId = useAppStore((s) => s.selectedReferenceLineId)
  const referenceLines = useAppStore((s) => s.referenceLines)
  const stageScale = useAppStore((s) => s.stageScale)
  const stagePosition = useAppStore((s) => s.stagePosition)
  const removeReferenceLine = useAppStore((s) => s.removeReferenceLine)
  const referenceLinesVisible = useAppStore(
    (s) => s.layerVisibility.referenceLines,
  )

  if (!referenceLinesVisible || !selectedReferenceLineId) return null

  const line = referenceLines.find((l) => l.id === selectedReferenceLineId)
  if (!line) return null

  const midX = (line.point1.x + line.point2.x) / 2
  const midY = (line.point1.y + line.point2.y) / 2
  const screenX = midX * stageScale + stagePosition.x
  const screenY = midY * stageScale + stagePosition.y - 36

  const clampedX = Math.max(8, Math.min(screenX - 24, window.innerWidth - 120))
  const clampedY = Math.max(8, screenY)

  const handleDelete = () => {
    removeReferenceLine(line.id)
  }

  return (
    <div
      className="pointer-events-auto absolute z-10 flex items-center gap-1 rounded-lg bg-white px-2 py-1 shadow-lg ring-1 ring-violet-200"
      style={{ left: clampedX, top: clampedY }}
    >
      <span className="mr-1 text-xs font-medium text-violet-800">Reference</span>
      <Button
        onClick={handleDelete}
        size="icon"
        variant="base"
        className="h-6 w-6 border-none text-red-500 hover:bg-red-50"
        title="Delete reference line"
        aria-label="Delete reference line"
      >
        <Trash2 size={14} />
      </Button>
    </div>
  )
}
