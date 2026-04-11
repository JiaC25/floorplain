import { useMemo, useState } from 'react'
import { nanoid } from 'nanoid'
import { Trash2 } from 'lucide-react'
import { useAppStore } from '../../stores/useAppStore'
import { useHistoryStore } from '../../stores/useHistoryStore'
import { FurnitureForm } from './FurnitureForm'
import { saveTemplate, deleteTemplate } from '../../db/furnitureStorage'
import type { FurnitureTemplate } from '../../types'

function colorSortKey(color: string) {
  return color.trim().toLowerCase()
}

export function FurnitureLibrary() {
  const furnitureLibrary = useAppStore((s) => s.furnitureLibrary)
  const addFurnitureTemplate = useAppStore((s) => s.addFurnitureTemplate)
  const updateFurnitureTemplate = useAppStore((s) => s.updateFurnitureTemplate)
  const removeFurnitureTemplate = useAppStore((s) => s.removeFurnitureTemplate)
  const calibration = useAppStore((s) => s.calibration)
  const addPlacedFurniture = useAppStore((s) => s.addPlacedFurniture)
  const floorplanImage = useAppStore((s) => s.floorplanImage)

  const pushHistory = useHistoryStore((s) => s.push)

  const [showForm, setShowForm] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)

  const sortedLibrary = useMemo(() => {
    return [...furnitureLibrary].sort((a, b) => {
      const byColor = colorSortKey(a.color).localeCompare(colorSortKey(b.color))
      if (byColor !== 0) return byColor
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    })
  }, [furnitureLibrary])

  const handleAdd = async (data: Omit<FurnitureTemplate, 'id'>) => {
    const template: FurnitureTemplate = { id: nanoid(), ...data }
    addFurnitureTemplate(template)
    await saveTemplate(template)
    setShowForm(false)
  }

  const handleUpdate = async (data: Omit<FurnitureTemplate, 'id'>) => {
    if (!editingItemId) return
    const editingItem = furnitureLibrary.find((item) => item.id === editingItemId)
    if (!editingItem) return
    const updated: FurnitureTemplate = { ...editingItem, ...data }
    updateFurnitureTemplate(updated)
    await saveTemplate(updated)
    setEditingItemId(null)
  }

  const handleDelete = async (id: string) => {
    removeFurnitureTemplate(id)
    await deleteTemplate(id)
  }

  const handlePlace = (template: FurnitureTemplate) => {
    if (!calibration || !floorplanImage) return
    pushHistory([...useAppStore.getState().placedFurniture])
    addPlacedFurniture({
      id: nanoid(),
      templateId: template.id,
      name: template.name,
      widthCm: template.widthCm,
      depthCm: template.depthCm,
      color: template.color,
      x: floorplanImage.width / 2,
      y: floorplanImage.height / 2,
      rotation: 0,
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          My Furniture
        </h3>
        {!showForm && !editingItemId && (
          <button
            onClick={() => {
              setEditingItemId(null)
              setShowForm(true)
            }}
            className="text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            + Add
          </button>
        )}
      </div>

      {showForm && (
        <FurnitureForm
          onSave={handleAdd}
          onCancel={() => setShowForm(false)}
        />
      )}

      {furnitureLibrary.length === 0 && !showForm ? (
        <p className="text-xs text-zinc-400">
          No furniture yet. Click "+ Add" to create your first item.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {sortedLibrary.map((item) => {
            const isEditing = editingItemId === item.id
            if (isEditing) {
              return (
                <li key={item.id} className="rounded border border-zinc-200 p-1">
                  <FurnitureForm
                    initial={item}
                    onSave={handleUpdate}
                    onCancel={() => setEditingItemId(null)}
                    embedded
                  />
                </li>
              )
            }

            return (
              <li
                key={item.id}
                className="group flex items-center gap-2 rounded border border-zinc-200 px-2 py-1.5 text-sm hover:bg-zinc-50"
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-sm"
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex flex-1 flex-col overflow-hidden">
                  <span className="truncate text-zinc-700">{item.name}</span>
                  <span className="text-[10px] text-zinc-400">
                    {item.widthCm} × {item.depthCm} cm
                  </span>
                </div>
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {calibration && (
                    <button
                      onClick={() => handlePlace(item)}
                      className="rounded px-1.5 py-0.5 text-[10px] font-medium text-blue-600 hover:bg-blue-50"
                      title="Place on floorplan"
                    >
                      Place
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowForm(false)
                      setEditingItemId(item.id)
                    }}
                    className="rounded px-1.5 py-0.5 text-[10px] text-zinc-500 hover:bg-zinc-100"
                    title="Edit"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="rounded p-1 text-red-500 hover:bg-red-50"
                    title="Delete"
                    aria-label={`Delete ${item.name}`}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
