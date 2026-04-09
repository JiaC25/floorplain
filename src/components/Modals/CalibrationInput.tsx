import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '../../stores/useAppStore'
import { computeCalibration } from '../../utils/coordinates'
import { Button } from '../ui/Button'

export function CalibrationInput() {
  const mode = useAppStore((s) => s.mode)
  const calibrationPoints = useAppStore((s) => s.calibrationPoints)
  const setCalibration = useAppStore((s) => s.setCalibration)
  const setMode = useAppStore((s) => s.setMode)
  const resetCalibrationPoints = useAppStore((s) => s.resetCalibrationPoints)

  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const visible = mode === 'calibrating' && calibrationPoints.length === 2

  useEffect(() => {
    if (visible) {
      setValue('')
      setError('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [visible])

  if (!visible) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const meters = Number(value)
    if (!Number.isFinite(meters) || meters <= 0) {
      setError('Enter a valid numeric distance in meters')
      return
    }
    const cm = meters * 100
    const cal = computeCalibration(
      calibrationPoints[0],
      calibrationPoints[1],
      cm,
    )
    setCalibration(cal)
  }

  const handleCancel = () => {
    setMode('default')
    resetCalibrationPoints()
  }

  return (
    <div className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2">
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-xl ring-1 ring-zinc-200"
      >
        <label className="text-sm font-medium text-zinc-700">
          Real distance (m):
        </label>
        <input
          ref={inputRef}
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setError('')
          }}
          placeholder='e.g. 3.2'
          className="w-40 rounded border border-zinc-300 px-2 py-1 text-sm focus:border-blue-400 focus:outline-none"
        />
        <Button type="submit" variant="primary">
          Set
        </Button>
        <Button
          type="button"
          onClick={handleCancel}
          variant="base"
          className="text-zinc-500 hover:bg-zinc-100"
        >
          Cancel
        </Button>
        {error && (
          <span className="text-xs text-red-500">{error}</span>
        )}
      </form>
    </div>
  )
}
