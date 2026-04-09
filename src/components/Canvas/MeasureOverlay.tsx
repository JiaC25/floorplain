import { Circle, Group, Line, Rect, Text } from 'react-konva'
import { useAppStore } from '../../stores/useAppStore'
import { pixelDistance, pixelsToCm } from '../../utils/coordinates'
import { formatCm } from '../../utils/units'

export function MeasureOverlay() {
  const mode = useAppStore((s) => s.mode)
  const measurementPoints = useAppStore((s) => s.measurementPoints)
  const calibration = useAppStore((s) => s.calibration)
  const stageScale = useAppStore((s) => s.stageScale)

  if (mode !== 'measuring' || measurementPoints.length === 0) return null

  const showLine = measurementPoints.length === 2
  const hasCalibration = Boolean(calibration)

  let distanceLabel = ''
  if (showLine && hasCalibration && calibration) {
    const px = pixelDistance(measurementPoints[0], measurementPoints[1])
    const cm = pixelsToCm(px, calibration)
    distanceLabel = formatCm(cm)
  }
  const labelFontSize = Math.max(13, 13 / Math.max(stageScale, 0.05))
  const labelPaddingX = Math.max(4, 4 / Math.max(stageScale, 0.05))
  const labelPaddingY = Math.max(2, 2 / Math.max(stageScale, 0.05))
  const labelHeight = labelFontSize + labelPaddingY * 2

  return (
    <Group listening={false}>
      {showLine && (
        <Line
          points={[
            measurementPoints[0].x,
            measurementPoints[0].y,
            measurementPoints[1].x,
            measurementPoints[1].y,
          ]}
          stroke="#0ea5e9"
          strokeWidth={2}
          dash={[8, 4]}
        />
      )}

      {measurementPoints.map((p, i) => (
        <Circle
          key={i}
          x={p.x}
          y={p.y}
          radius={5}
          fill="#0ea5e9"
          stroke="#fff"
          strokeWidth={2}
        />
      ))}

      {showLine && distanceLabel && (
        <>
          <Rect
            x={
              (measurementPoints[0].x + measurementPoints[1].x) / 2 +
              4 / Math.max(stageScale, 0.05)
            }
            y={
              (measurementPoints[0].y + measurementPoints[1].y) / 2 -
              20 / Math.max(stageScale, 0.05)
            }
            width={Math.max(
              44 / Math.max(stageScale, 0.05),
              distanceLabel.length * labelFontSize * 0.56 + labelPaddingX * 2,
            )}
            height={labelHeight}
            fill="rgba(255,255,255,0.72)"
            cornerRadius={6}
          />
          <Text
            x={
              (measurementPoints[0].x + measurementPoints[1].x) / 2 +
              8 / Math.max(stageScale, 0.05)
            }
            y={
              (measurementPoints[0].y + measurementPoints[1].y) / 2 -
              18 / Math.max(stageScale, 0.05)
            }
            text={distanceLabel}
            fontSize={labelFontSize}
            fill="#0284c7"
            fontStyle="bold"
          />
        </>
      )}
    </Group>
  )
}
