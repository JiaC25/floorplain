import { useState, useEffect, useRef, useMemo } from 'react'
import { useAppStore } from '../../stores/useAppStore'
import { computeCalibration } from '../../utils/coordinates'
import { Button } from '../ui/Button'

type Props = {
  containerWidth: number
  containerHeight: number
}

/** Stage-space point below the segment midpoint (perpendicular toward +Y in image space). */
function anchorBelowCalibrationLine(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  gapStagePx: number,
) {
  const mx = (p0.x + p1.x) / 2
  const my = (p0.y + p1.y) / 2
  const dx = p1.x - p0.x
  const dy = p1.y - p0.y
  const len = Math.hypot(dx, dy) || 1
  let nx = -dy / len
  let ny = dx / len
  if (ny < 0) {
    nx = -nx
    ny = -ny
  }
  if (Math.abs(ny) < 0.15) {
    nx = 0
    ny = 1
  }
  return {
    x: mx + nx * gapStagePx,
    y: my + ny * gapStagePx,
  }
}

const EST_FORM_W = 440
const EST_FORM_H = 56
const CLAMP_MARGIN = 12

export function CalibrationInput({ containerWidth, containerHeight }: Props) {
  const mode = useAppStore((s) => s.mode)
  const calibrationPoints = useAppStore((s) => s.calibrationPoints)
  const stageScale = useAppStore((s) => s.stageScale)
  const stagePosition = useAppStore((s) => s.stagePosition)
  const setCalibration = useAppStore((s) => s.setCalibration)
  const setMode = useAppStore((s) => s.setMode)
  const resetCalibrationPoints = useAppStore((s) => s.resetCalibrationPoints)

  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const visible =
    mode === 'calibrating' &&
    calibrationPoints.length === 2 &&
    containerWidth > 0 &&
    containerHeight > 0

  const position = useMemo(() => {
    if (!visible) return null
    const p0 = calibrationPoints[0]
    const p1 = calibrationPoints[1]
    const anchor = anchorBelowCalibrationLine(p0, p1, 40)
    const left = stagePosition.x + anchor.x * stageScale
    const top = stagePosition.y + anchor.y * stageScale
    const halfW = EST_FORM_W / 2
    const clampedLeft = Math.min(
      Math.max(left, CLAMP_MARGIN + halfW),
      containerWidth - CLAMP_MARGIN - halfW,
    )
    const clampedTop = Math.min(
      Math.max(top, CLAMP_MARGIN),
      containerHeight - CLAMP_MARGIN - EST_FORM_H,
    )
    return { left: clampedLeft, top: clampedTop }
  }, [
    visible,
    calibrationPoints,
    stagePosition,
    stageScale,
    containerWidth,
    containerHeight,
  ])

  useEffect(() => {
    if (visible) {
      setValue('')
      setError('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [visible])

  if (!visible || !position) return null

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
    <div
      className="pointer-events-none absolute z-30"
      style={{
        left: position.left,
        top: position.top,
        transform: 'translate(-50%, 0)',
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="pointer-events-auto flex max-w-[min(100vw-2rem,32rem)] flex-wrap items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-xl ring-1 ring-zinc-200"
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
          placeholder="e.g. 3.2"
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
        {error && <span className="text-xs text-red-500">{error}</span>}
      </form>
    </div>
  )
}
