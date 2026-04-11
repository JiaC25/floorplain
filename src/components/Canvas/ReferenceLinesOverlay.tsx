import { Group, Line, Rect, Text, Circle } from 'react-konva'
import { useAppStore } from '../../stores/useAppStore'
import { pixelDistance, pixelsToCm } from '../../utils/coordinates'
import { formatCm } from '../../utils/units'

/** Persistent reference lines with real-distance labels (n/a if not calibrated). */
export function ReferenceLinesOverlay() {
  const referenceLines = useAppStore((s) => s.referenceLines)
  const selectedReferenceLineId = useAppStore((s) => s.selectedReferenceLineId)
  const calibration = useAppStore((s) => s.calibration)
  const stageScale = useAppStore((s) => s.stageScale)
  const setSelectedReferenceLineId = useAppStore(
    (s) => s.setSelectedReferenceLineId,
  )
  const setSelectedFurnitureId = useAppStore((s) => s.setSelectedFurnitureId)
  const referenceLinesVisible = useAppStore(
    (s) => s.layerVisibility.referenceLines,
  )

  if (!referenceLinesVisible || referenceLines.length === 0) return null

  const labelFontSize = Math.max(13, 13 / Math.max(stageScale, 0.05))
  const labelPaddingX = Math.max(4, 4 / Math.max(stageScale, 0.05))
  const labelPaddingY = Math.max(2, 2 / Math.max(stageScale, 0.05))
  const labelHeight = labelFontSize + labelPaddingY * 2

  const labelForSegment = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    if (!calibration) return 'n/a'
    const px = pixelDistance(p1, p2)
    const cm = pixelsToCm(px, calibration)
    return formatCm(cm)
  }

  return (
    <Group>
      {referenceLines.map((line) => {
        const p1 = line.point1
        const p2 = line.point2
        const text = labelForSegment(p1, p2)
        const midX = (p1.x + p2.x) / 2
        const midY = (p1.y + p2.y) / 2
        const isSelected = selectedReferenceLineId === line.id
        const stroke = isSelected ? '#5b21b6' : '#7c3aed'
        const strokeW = isSelected ? 3 : 2

        const selectThis = (e: { cancelBubble: boolean }) => {
          e.cancelBubble = true
          setSelectedFurnitureId(null)
          setSelectedReferenceLineId(line.id)
        }

        return (
          <Group key={line.id}>
            <Line
              points={[p1.x, p1.y, p2.x, p2.y]}
              stroke={stroke}
              strokeWidth={strokeW}
              dash={isSelected ? [] : [6, 3]}
              hitStrokeWidth={16}
              lineCap="round"
              onClick={selectThis}
              onTap={selectThis}
            />
            <Circle
              x={p1.x}
              y={p1.y}
              radius={isSelected ? 5 : 4}
              fill={stroke}
              stroke="#fff"
              strokeWidth={2}
              onClick={selectThis}
              onTap={selectThis}
            />
            <Circle
              x={p2.x}
              y={p2.y}
              radius={isSelected ? 5 : 4}
              fill={stroke}
              stroke="#fff"
              strokeWidth={2}
              onClick={selectThis}
              onTap={selectThis}
            />
            <Rect
              x={midX + 4 / Math.max(stageScale, 0.05) - labelPaddingX}
              y={midY - 20 / Math.max(stageScale, 0.05) - labelPaddingY}
              width={Math.max(
                36 / Math.max(stageScale, 0.05),
                text.length * labelFontSize * 0.56 + labelPaddingX * 2,
              )}
              height={labelHeight}
              fill={
                isSelected ? 'rgba(245,243,255,0.95)' : 'rgba(255,255,255,0.85)'
              }
              stroke={isSelected ? '#c4b5fd' : 'transparent'}
              strokeWidth={isSelected ? 1 : 0}
              cornerRadius={6}
              onClick={selectThis}
              onTap={selectThis}
            />
            <Text
              x={midX + 8 / Math.max(stageScale, 0.05)}
              y={midY - 18 / Math.max(stageScale, 0.05)}
              text={text}
              fontSize={labelFontSize}
              fill={isSelected ? '#4c1d95' : '#5b21b6'}
              fontStyle="bold"
              onClick={selectThis}
              onTap={selectThis}
            />
          </Group>
        )
      })}
    </Group>
  )
}
