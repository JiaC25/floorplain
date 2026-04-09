import { useCallback, useEffect, useRef, useState } from 'react'
import { Stage, Layer, Line, Rect, Text } from 'react-konva'
import type Konva from 'konva'
import { useAppStore } from '../../stores/useAppStore'
import { FloorplanLayer } from './FloorplanLayer'
import { CalibrationOverlay } from './CalibrationOverlay'
import { FurnitureLayer } from './FurnitureLayer'
import { MeasureOverlay } from './MeasureOverlay'
import { pixelDistance, pixelsToCm } from '../../utils/coordinates'
import { formatCm } from '../../utils/units'

const MIN_SCALE = 0.05
const MAX_SCALE = 10
const ZOOM_FACTOR = 1.1

function maybeLockToAxis(
  start: { x: number; y: number },
  end: { x: number; y: number },
  shouldLock: boolean,
): { x: number; y: number } {
  if (!shouldLock) return end

  const dx = end.x - start.x
  const dy = end.y - start.y

  // Snap to the dominant axis for intuitive behavior.
  if (Math.abs(dx) >= Math.abs(dy)) {
    return { x: end.x, y: start.y }
  }
  return { x: start.x, y: end.y }
}

export function WorkspaceCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const isCroppingRef = useRef(false)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const [hoverStagePoint, setHoverStagePoint] = useState<{
    x: number
    y: number
  } | null>(null)

  const stageScale = useAppStore((s) => s.stageScale)
  const stagePosition = useAppStore((s) => s.stagePosition)
  const setStageScale = useAppStore((s) => s.setStageScale)
  const setStagePosition = useAppStore((s) => s.setStagePosition)
  const floorplanImage = useAppStore((s) => s.floorplanImage)
  const mode = useAppStore((s) => s.mode)
  const calibration = useAppStore((s) => s.calibration)
  const calibrationPoints = useAppStore((s) => s.calibrationPoints)
  const addCalibrationPoint = useAppStore((s) => s.addCalibrationPoint)
  const measurementPoints = useAppStore((s) => s.measurementPoints)
  const addMeasurementPoint = useAppStore((s) => s.addMeasurementPoint)
  const resetMeasurementPoints = useAppStore((s) => s.resetMeasurementPoints)
  const cropStart = useAppStore((s) => s.cropStart)
  const cropEnd = useAppStore((s) => s.cropEnd)
  const setCropStart = useAppStore((s) => s.setCropStart)
  const setCropEnd = useAppStore((s) => s.setCropEnd)
  const setSelectedFurnitureId = useAppStore((s) => s.setSelectedFurnitureId)

  // Measure the container
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      setContainerSize({ width, height })
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Auto-fit image to canvas when a new floorplan is loaded
  useEffect(() => {
    if (!floorplanImage || !containerSize.width || !containerSize.height) return

    const padding = 40
    const scaleX = (containerSize.width - padding * 2) / floorplanImage.width
    const scaleY = (containerSize.height - padding * 2) / floorplanImage.height
    const fitScale = Math.min(scaleX, scaleY, 1)

    const offsetX =
      (containerSize.width - floorplanImage.width * fitScale) / 2
    const offsetY =
      (containerSize.height - floorplanImage.height * fitScale) / 2

    setStageScale(fitScale)
    setStagePosition({ x: offsetX, y: offsetY })
  }, [floorplanImage, containerSize, setStageScale, setStagePosition])

  // Zoom toward cursor on wheel
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault()
      const stage = stageRef.current
      if (!stage) return

      const pointer = stage.getPointerPosition()
      if (!pointer) return

      const oldScale = stageScale
      const direction = e.evt.deltaY < 0 ? 1 : -1
      const newScale = Math.min(
        Math.max(
          direction > 0 ? oldScale * ZOOM_FACTOR : oldScale / ZOOM_FACTOR,
          MIN_SCALE,
        ),
        MAX_SCALE,
      )

      const mousePointTo = {
        x: (pointer.x - stagePosition.x) / oldScale,
        y: (pointer.y - stagePosition.y) / oldScale,
      }

      setStageScale(newScale)
      setStagePosition({
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      })
    },
    [stageScale, stagePosition, setStageScale, setStagePosition],
  )

  // Handle clicks on the canvas for calibration and deselection
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      const stage = stageRef.current
      if (!stage) return

      if (mode === 'calibrating' && calibrationPoints.length < 2) {
        const pointer = stage.getPointerPosition()
        if (!pointer) return
        const rawPoint = {
          x: (pointer.x - stagePosition.x) / stageScale,
          y: (pointer.y - stagePosition.y) / stageScale,
        }
        const shouldLock = 'shiftKey' in e.evt && e.evt.shiftKey
        const finalPoint =
          calibrationPoints.length === 1
            ? maybeLockToAxis(calibrationPoints[0], rawPoint, shouldLock)
            : rawPoint
        addCalibrationPoint(finalPoint)
        setHoverStagePoint(null)
        return
      }

      if (mode === 'measuring') {
        const pointer = stage.getPointerPosition()
        if (!pointer) return
        const rawPoint = {
          x: (pointer.x - stagePosition.x) / stageScale,
          y: (pointer.y - stagePosition.y) / stageScale,
        }
        const shouldLock = 'shiftKey' in e.evt && e.evt.shiftKey

        if (measurementPoints.length >= 2) {
          resetMeasurementPoints()
          addMeasurementPoint(rawPoint)
        } else {
          const finalPoint =
            measurementPoints.length === 1
              ? maybeLockToAxis(measurementPoints[0], rawPoint, shouldLock)
              : rawPoint
          addMeasurementPoint(finalPoint)
        }
        setHoverStagePoint(null)
        return
      }

      // Deselect furniture when clicking empty canvas
      if (e.target === e.currentTarget || e.target.getClassName() === 'Image') {
        setSelectedFurnitureId(null)
      }
    },
    [
      mode,
      calibrationPoints,
      measurementPoints,
      stagePosition,
      stageScale,
      addCalibrationPoint,
      addMeasurementPoint,
      resetMeasurementPoints,
      setSelectedFurnitureId,
    ],
  )

  const cursorStyle =
    mode === 'calibrating' || mode === 'measuring' || mode === 'cropping'
      ? 'crosshair'
      : floorplanImage
        ? 'grab'
        : 'default'

  const handleStageMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const stage = stageRef.current
    if (!stage) return
    const pointer = stage.getPointerPosition()
    if (!pointer) return

    const stagePoint = {
      x: (pointer.x - stagePosition.x) / stageScale,
      y: (pointer.y - stagePosition.y) / stageScale,
    }

    const shouldLock = 'shiftKey' in e.evt && e.evt.shiftKey

    if (mode === 'calibrating' && calibrationPoints.length === 1) {
      setHoverStagePoint(
        maybeLockToAxis(calibrationPoints[0], stagePoint, shouldLock),
      )
      return
    }
    if (mode === 'measuring' && measurementPoints.length === 1) {
      setHoverStagePoint(
        maybeLockToAxis(measurementPoints[0], stagePoint, shouldLock),
      )
      return
    }
    if (mode === 'cropping' && isCroppingRef.current) {
      setCropEnd(stagePoint)
      return
    }
    if (hoverStagePoint) {
      setHoverStagePoint(null)
    }
    },
    [
    mode,
    calibrationPoints,
    measurementPoints,
    setCropEnd,
    stagePosition,
    stageScale,
    hoverStagePoint,
    ],
  )
  const previewLabelFontSize = Math.max(12, 12 / Math.max(stageScale, 0.05))
  const previewLabelPaddingX = Math.max(4, 4 / Math.max(stageScale, 0.05))
  const previewLabelPaddingY = Math.max(2, 2 / Math.max(stageScale, 0.05))
  const previewLabelHeight = previewLabelFontSize + previewLabelPaddingY * 2

  const handlePointerDown = useCallback(() => {
    if (mode !== 'cropping') return
    const stage = stageRef.current
    if (!stage) return
    const pointer = stage.getPointerPosition()
    if (!pointer) return

    const start = {
      x: (pointer.x - stagePosition.x) / stageScale,
      y: (pointer.y - stagePosition.y) / stageScale,
    }

    isCroppingRef.current = true
    setCropStart(start)
    setCropEnd(start)
  }, [mode, stagePosition, stageScale, setCropStart, setCropEnd])

  const handlePointerUp = useCallback(() => {
    if (mode !== 'cropping') return
    isCroppingRef.current = false
  }, [mode])

  return (
    <div
      ref={containerRef}
      className="relative flex-1 bg-zinc-100"
      style={{ cursor: cursorStyle }}
    >
      {containerSize.width > 0 && (
        <Stage
          ref={stageRef}
          width={containerSize.width}
          height={containerSize.height}
          scaleX={stageScale}
          scaleY={stageScale}
          x={stagePosition.x}
          y={stagePosition.y}
          draggable={mode !== 'calibrating' && mode !== 'measuring' && mode !== 'cropping'}
          onWheel={handleWheel}
          onClick={handleStageClick}
          onTap={handleStageClick}
          onMouseDown={handlePointerDown}
          onTouchStart={handlePointerDown}
          onMouseUp={handlePointerUp}
          onTouchEnd={handlePointerUp}
          onMouseMove={handleStageMove}
          onTouchMove={handleStageMove}
          onDragEnd={() => {
            const stage = stageRef.current
            if (stage) {
              setStagePosition({ x: stage.x(), y: stage.y() })
            }
          }}
        >
          <Layer>
            <FloorplanLayer />
            <CalibrationOverlay />
            <MeasureOverlay />
            {mode === 'calibrating' &&
              calibrationPoints.length === 1 &&
              hoverStagePoint && (
                <>
                  <Line
                    points={[
                      calibrationPoints[0].x,
                      calibrationPoints[0].y,
                      hoverStagePoint.x,
                      hoverStagePoint.y,
                    ]}
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dash={[6, 4]}
                    listening={false}
                  />
                  <>
                    <Rect
                      x={
                        (calibrationPoints[0].x + hoverStagePoint.x) / 2 +
                        4 / Math.max(stageScale, 0.05)
                      }
                      y={
                        (calibrationPoints[0].y + hoverStagePoint.y) / 2 -
                        20 / Math.max(stageScale, 0.05)
                      }
                      width={Math.max(
                        44 / Math.max(stageScale, 0.05),
                        `${Math.round(
                          pixelDistance(calibrationPoints[0], hoverStagePoint),
                        )} px`.length * previewLabelFontSize * 0.56 +
                          previewLabelPaddingX * 2,
                      )}
                      height={previewLabelHeight}
                      fill="rgba(255,255,255,0.72)"
                      cornerRadius={6}
                      listening={false}
                    />
                    <Text
                      x={
                        (calibrationPoints[0].x + hoverStagePoint.x) / 2 +
                        8 / Math.max(stageScale, 0.05)
                      }
                      y={
                        (calibrationPoints[0].y + hoverStagePoint.y) / 2 -
                        18 / Math.max(stageScale, 0.05)
                      }
                      text={`${Math.round(
                        pixelDistance(calibrationPoints[0], hoverStagePoint),
                      )} px`}
                      fontSize={previewLabelFontSize}
                      fill="#b45309"
                      fontStyle="bold"
                      listening={false}
                    />
                  </>
                </>
              )}
            {mode === 'measuring' &&
              measurementPoints.length === 1 &&
              hoverStagePoint && (
                <>
                  <Line
                    points={[
                      measurementPoints[0].x,
                      measurementPoints[0].y,
                      hoverStagePoint.x,
                      hoverStagePoint.y,
                    ]}
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    dash={[8, 4]}
                    listening={false}
                  />
                  {calibration && (
                    <>
                      <Rect
                        x={
                          (measurementPoints[0].x + hoverStagePoint.x) / 2 +
                          4 / Math.max(stageScale, 0.05)
                        }
                        y={
                          (measurementPoints[0].y + hoverStagePoint.y) / 2 -
                          20 / Math.max(stageScale, 0.05)
                        }
                        width={Math.max(
                          44 / Math.max(stageScale, 0.05),
                          formatCm(
                            pixelsToCm(
                              pixelDistance(measurementPoints[0], hoverStagePoint),
                              calibration,
                            ),
                          ).length * previewLabelFontSize * 0.56 +
                            previewLabelPaddingX * 2,
                        )}
                        height={previewLabelHeight}
                        fill="rgba(255,255,255,0.72)"
                        cornerRadius={6}
                        listening={false}
                      />
                      <Text
                        x={
                          (measurementPoints[0].x + hoverStagePoint.x) / 2 +
                          8 / Math.max(stageScale, 0.05)
                        }
                        y={
                          (measurementPoints[0].y + hoverStagePoint.y) / 2 -
                          18 / Math.max(stageScale, 0.05)
                        }
                        text={formatCm(
                          pixelsToCm(
                            pixelDistance(measurementPoints[0], hoverStagePoint),
                            calibration,
                          ),
                        )}
                        fontSize={previewLabelFontSize}
                        fill="#0369a1"
                        fontStyle="bold"
                        listening={false}
                      />
                    </>
                  )}
                </>
              )}
            {mode === 'cropping' && cropStart && cropEnd && (
              <Rect
                x={Math.min(cropStart.x, cropEnd.x)}
                y={Math.min(cropStart.y, cropEnd.y)}
                width={Math.abs(cropEnd.x - cropStart.x)}
                height={Math.abs(cropEnd.y - cropStart.y)}
                fill="rgba(59,130,246,0.14)"
                stroke="#3b82f6"
                strokeWidth={2}
                dash={[6, 4]}
                listening={false}
              />
            )}
          </Layer>
          <FurnitureLayer />
        </Stage>
      )}

      {!floorplanImage && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="max-w-xs text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-200 text-2xl text-zinc-400">
              ⌗
            </div>
            <p className="text-base font-medium text-zinc-500">
              No floorplan loaded
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              Upload a floorplan image from a rental listing to get started
            </p>
          </div>
        </div>
      )}

      {mode === 'calibrating' && (
        <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-lg">
          {calibrationPoints.length === 0
            ? 'Click the first point of a known measurement'
            : calibrationPoints.length === 1
              ? 'Click the second point'
              : 'Enter the real-world distance in meters'}
        </div>
      )}

      {mode === 'measuring' && (
        <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow-lg">
          {measurementPoints.length === 0
            ? 'Measure mode: click the first point'
            : measurementPoints.length === 1
              ? 'Click the second point'
              : 'Distance measured. Click again to start a new measurement'}
        </div>
      )}

      {mode === 'cropping' && (
        <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-lg">
          Drag to draw crop area, then click Apply Crop
        </div>
      )}
    </div>
  )
}
