import { nanoid } from 'nanoid'
import { useAppStore } from '../../stores/useAppStore'
import { useHistoryStore } from '../../stores/useHistoryStore'
import { RotateCw } from 'lucide-react'

export function PlacedItemsList() {
  const placedFurniture = useAppStore((s) => s.placedFurniture)
  const selectedFurnitureId = useAppStore((s) => s.selectedFurnitureId)
  const setSelectedFurnitureId = useAppStore((s) => s.setSelectedFurnitureId)
  const updatePlacedFurniture = useAppStore((s) => s.updatePlacedFurniture)
  const removePlacedFurniture = useAppStore((s) => s.removePlacedFurniture)
  const addPlacedFurniture = useAppStore((s) => s.addPlacedFurniture)

  const pushHistory = useHistoryStore((s) => s.push)

  if (placedFurniture.length === 0) return null

  const snap = () => pushHistory([...placedFurniture])

  const handleRotate = (id: string, current: number) => {
    snap()
    updatePlacedFurniture(id, { rotation: (current + 45) % 360 })
  }

  const handleDuplicate = (id: string) => {
    const item = placedFurniture.find((f) => f.id === id)
    if (!item) return
    snap()
    addPlacedFurniture({
      ...item,
      id: nanoid(),
      x: item.x + 20,
      y: item.y + 20,
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Placed Items ({placedFurniture.length})
      </h3>
      <ul className="flex flex-col gap-1">
        {placedFurniture.map((item) => {
          const isSelected = selectedFurnitureId === item.id
          return (
            <li
              key={item.id}
              onClick={() => setSelectedFurnitureId(item.id)}
              className={`flex cursor-pointer flex-col rounded border px-2 py-1.5 text-sm transition-colors ${
                isSelected
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 shrink-0 rounded-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span className="flex-1 truncate text-zinc-700">
                  {item.name}
                </span>
                <span className="text-[10px] text-zinc-400">
                  {item.widthCm}×{item.depthCm}
                  {item.rotation > 0 ? ` ${item.rotation}°` : ''}
                </span>
              </div>

              {isSelected && (
                <div className="mt-1.5 flex gap-1 border-t border-zinc-200 pt-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRotate(item.id, item.rotation)
                    }}
                    className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium text-zinc-600 hover:bg-zinc-200"
                    title="Rotate 45°"
                  >
                    <RotateCw size={12} /> 45°
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDuplicate(item.id)
                    }}
                    className="rounded px-2 py-0.5 text-[10px] font-medium text-zinc-600 hover:bg-zinc-200"
                    title="Duplicate"
                  >
                    Duplicate
                  </button>
                  <div className="flex-1" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      snap()
                      removePlacedFurniture(item.id)
                    }}
                    className="rounded px-2 py-0.5 text-[10px] font-medium text-red-500 hover:bg-red-50"
                    title="Remove"
                  >
                    Remove
                  </button>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
