import { useState } from 'react'
import type { FurnitureTemplate } from '../../types'

const PRESET_COLORS = [
  '#3b82f6',
  '#ef4444',
  '#22c55e',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#f97316',
]

interface Props {
  initial?: FurnitureTemplate
  onSave: (data: Omit<FurnitureTemplate, 'id'>) => void
  onCancel: () => void
  embedded?: boolean
}

export function FurnitureForm({ initial, onSave, onCancel, embedded = false }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [widthCm, setWidthCm] = useState(initial?.widthCm?.toString() ?? '')
  const [depthCm, setDepthCm] = useState(initial?.depthCm?.toString() ?? '')
  const [color, setColor] = useState(initial?.color ?? PRESET_COLORS[0])
  const [notes, setNotes] = useState(initial?.notes ?? '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const w = parseFloat(widthCm)
    const d = parseFloat(depthCm)
    if (!name.trim() || isNaN(w) || w <= 0 || isNaN(d) || d <= 0) return
    onSave({ name: name.trim(), widthCm: w, depthCm: d, color, notes: notes.trim() || undefined })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex flex-col gap-2 rounded-lg p-3 ${
        embedded ? 'border-0 bg-transparent p-2' : 'border border-zinc-200 bg-zinc-50'
      }`}
    >
      <input
        type="text"
        placeholder="Name (e.g. Queen Bed)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded border border-zinc-300 px-2 py-1 text-sm focus:border-blue-400 focus:outline-none"
        autoFocus
      />
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] uppercase text-zinc-400">Width (cm)</label>
          <input
            type="number"
            min="1"
            step="0.1"
            placeholder="cm"
            value={widthCm}
            onChange={(e) => setWidthCm(e.target.value)}
            className="rounded border border-zinc-300 px-2 py-1 text-sm focus:border-blue-400 focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] uppercase text-zinc-400">Depth (cm)</label>
          <input
            type="number"
            min="1"
            step="0.1"
            placeholder="cm"
            value={depthCm}
            onChange={(e) => setDepthCm(e.target.value)}
            className="rounded border border-zinc-300 px-2 py-1 text-sm focus:border-blue-400 focus:outline-none"
          />
        </div>
      </div>
      <div className="flex flex-col gap-0.5">
        <label className="text-[10px] uppercase text-zinc-400">Color</label>
        <div className="flex gap-1">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`h-5 w-5 rounded-full border-2 transition-transform ${
                color === c ? 'scale-125 border-zinc-800' : 'border-transparent hover:scale-110'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <input
        type="text"
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="rounded border border-zinc-300 px-2 py-1 text-sm focus:border-blue-400 focus:outline-none"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 rounded bg-blue-600 py-1 text-sm font-medium text-white hover:bg-blue-700"
        >
          {initial ? 'Update' : 'Add'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded px-3 py-1 text-sm text-zinc-500 hover:bg-zinc-200"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
