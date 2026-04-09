import { useEffect } from 'react'
import { useAppStore } from '../stores/useAppStore'
import { useHistoryStore } from '../stores/useHistoryStore'

export function useKeyboardShortcuts() {
  const removePlacedFurniture = useAppStore((s) => s.removePlacedFurniture)
  const updatePlacedFurniture = useAppStore((s) => s.updatePlacedFurniture)
  const setSelectedFurnitureId = useAppStore((s) => s.setSelectedFurnitureId)
  const setPlacedFurniture = useAppStore((s) => s.setPlacedFurniture)
  const setMode = useAppStore((s) => s.setMode)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      const { selectedFurnitureId, placedFurniture, mode } =
        useAppStore.getState()

      // Escape - exit tool mode or deselect furniture
      if (e.key === 'Escape') {
        if (mode !== 'default') {
          setMode('default')
        } else {
          setSelectedFurnitureId(null)
        }
        return
      }

      // Delete/Backspace - remove selected furniture
      if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        selectedFurnitureId
      ) {
        const history = useHistoryStore.getState()
        history.push([...placedFurniture])
        removePlacedFurniture(selectedFurnitureId)
        return
      }

      // R - rotate selected furniture 45°
      if (e.key === 'r' || e.key === 'R') {
        if (selectedFurnitureId) {
          const item = placedFurniture.find(
            (f) => f.id === selectedFurnitureId,
          )
          if (item) {
            const history = useHistoryStore.getState()
            history.push([...placedFurniture])
            updatePlacedFurniture(selectedFurnitureId, {
              rotation: (item.rotation + 45) % 360,
            })
          }
        }
        return
      }

      // Ctrl+Z - undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        const history = useHistoryStore.getState()
        const prev = history.undo([...placedFurniture])
        if (prev) {
          setPlacedFurniture(prev)
          setSelectedFurnitureId(null)
        }
        return
      }

      // Ctrl+Shift+Z / Ctrl+Y - redo
      if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') ||
        ((e.ctrlKey || e.metaKey) && e.key === 'y')
      ) {
        e.preventDefault()
        const history = useHistoryStore.getState()
        const next = history.redo([...placedFurniture])
        if (next) {
          setPlacedFurniture(next)
          setSelectedFurnitureId(null)
        }
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    removePlacedFurniture,
    updatePlacedFurniture,
    setSelectedFurnitureId,
    setPlacedFurniture,
    setMode,
  ])
}
