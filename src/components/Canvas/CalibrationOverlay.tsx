import { Circle, Group, Line, Rect, Text } from 'react-konva'
import { useAppStore } from '../../stores/useAppStore'
import { pixelDistance } from '../../utils/coordinates'
import { formatCm } from '../../utils/units'

export function CalibrationOverlay() {
  const calibration = useAppStore((s) => s.calibration)
  const calibrationPoints = useAppStore((s) => s.calibrationPoints)
  const mode = useAppStore((s) => s.mode)
  const stageScale = useAppStore((s) => s.stageScale)

  const pointsToRender =
    mode === 'calibrating'
      ? calibrationPoints
      : calibration
        ? [calibration.point1, calibration.point2]
        : []

  if (pointsToRender.length === 0) return null

  const showLine = pointsToRender.length === 2
  const showLabel = calibration && mode !== 'calibrating'
  const labelFontSize = Math.max(13, 13 / Math.max(stageScale, 0.05))
  const labelPaddingX = Math.max(4, 4 / Math.max(stageScale, 0.05))
  const labelPaddingY = Math.max(2, 2 / Math.max(stageScale, 0.05))
  const labelHeight = labelFontSize + labelPaddingY * 2
  const labelY =
    (pointsToRender[0]?.y + pointsToRender[1]?.y) / 2 -
    (18 / Math.max(stageScale, 0.05))
  const labelX =
    (pointsToRender[0]?.x + pointsToRender[1]?.x) / 2 +
    (8 / Math.max(stageScale, 0.05))

  return (
    <Group listening={false}>
      {showLine && (
        <Line
          points={[
            pointsToRender[0].x,
            pointsToRender[0].y,
            pointsToRender[1].x,
            pointsToRender[1].y,
          ]}
          stroke={mode === 'calibrating' ? '#f59e0b' : '#22c55e'}
          strokeWidth={2}
          dash={[6, 4]}
        />
      )}

      {pointsToRender.map((p, i) => (
        <Circle
          key={i}
          x={p.x}
          y={p.y}
          radius={5}
          fill={mode === 'calibrating' ? '#f59e0b' : '#22c55e'}
          stroke="#fff"
          strokeWidth={2}
        />
      ))}

      {showLabel && showLine && (
        <>
          <Rect
            x={labelX - labelPaddingX}
            y={labelY - labelPaddingY}
            width={Math.max(
              44 / Math.max(stageScale, 0.05),
              formatCm(calibration.realWorldDistanceCm).length *
                labelFontSize *
                0.56 +
                labelPaddingX * 2,
            )}
            height={labelHeight}
            fill="rgba(255,255,255,0.72)"
            cornerRadius={6}
          />
          <Text
            x={labelX}
            y={labelY}
            text={formatCm(calibration.realWorldDistanceCm)}
            fontSize={labelFontSize}
            fill="#22c55e"
            fontStyle="bold"
          />
        </>
      )}

      {mode === 'calibrating' && showLine && (
        <>
          <Rect
            x={labelX - labelPaddingX}
            y={labelY - labelPaddingY}
            width={Math.max(
              44 / Math.max(stageScale, 0.05),
              `${Math.round(pixelDistance(pointsToRender[0], pointsToRender[1]))} px`.length *
                labelFontSize *
                0.56 +
                labelPaddingX * 2,
            )}
            height={labelHeight}
            fill="rgba(255,255,255,0.72)"
            cornerRadius={6}
          />
          <Text
            x={labelX}
            y={labelY}
            text={`${Math.round(pixelDistance(pointsToRender[0], pointsToRender[1]))} px`}
            fontSize={labelFontSize}
            fill="#f59e0b"
            fontStyle="bold"
          />
        </>
      )}
    </Group>
  )
}
