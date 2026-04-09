import { Group, Rect, Text } from 'react-konva'
import type { PlacedFurniture, Calibration } from '../../types'
import { cmToPixels } from '../../utils/coordinates'
import { useAppStore } from '../../stores/useAppStore'
import { useHistoryStore } from '../../stores/useHistoryStore'

interface Props {
  item: PlacedFurniture
  calibration: Calibration
}

export function FurnitureRect({ item, calibration }: Props) {
  const selectedFurnitureId = useAppStore((s) => s.selectedFurnitureId)
  const stageScale = useAppStore((s) => s.stageScale)
  const setSelectedFurnitureId = useAppStore((s) => s.setSelectedFurnitureId)
  const updatePlacedFurniture = useAppStore((s) => s.updatePlacedFurniture)
  const pushHistory = useHistoryStore((s) => s.push)

  const widthPx = cmToPixels(item.widthCm, calibration)
  const depthPx = cmToPixels(item.depthCm, calibration)
  const isSelected = selectedFurnitureId === item.id
  const minDim = Math.min(widthPx, depthPx)

  const minReadableLabel = 12 / Math.max(stageScale, 0.05)
  const minReadableDims = 10 / Math.max(stageScale, 0.05)
  const labelSize = Math.max(minReadableLabel, Math.max(8, Math.min(14, minDim / 4)))
  const dimsSize = Math.max(minReadableDims, Math.max(7, Math.min(11, minDim / 5)))

  return (
    <Group
      x={item.x}
      y={item.y}
      rotation={item.rotation}
      offsetX={widthPx / 2}
      offsetY={depthPx / 2}
      draggable
      onClick={(e) => {
        e.cancelBubble = true
        setSelectedFurnitureId(item.id)
      }}
      onTap={(e) => {
        e.cancelBubble = true
        setSelectedFurnitureId(item.id)
      }}
      onDragStart={() => {
        pushHistory([...useAppStore.getState().placedFurniture])
      }}
      onDragEnd={(e) => {
        const node = e.target
        updatePlacedFurniture(item.id, {
          x: node.x(),
          y: node.y(),
        })
      }}
    >
      {/* Selection shadow */}
      {isSelected && (
        <Rect
          width={widthPx + 6}
          height={depthPx + 6}
          x={-3}
          y={-3}
          fill="transparent"
          stroke="#3b82f6"
          strokeWidth={3}
          cornerRadius={4}
          dash={[8, 4]}
          listening={false}
        />
      )}

      <Rect
        width={widthPx}
        height={depthPx}
        fill={item.color}
        opacity={0.6}
        stroke={isSelected ? '#1d4ed8' : 'rgba(0,0,0,0.4)'}
        strokeWidth={isSelected ? 2 : 1}
        cornerRadius={2}
      />

      <Text
        width={widthPx}
        height={depthPx * 0.55}
        y={depthPx * 0.1}
        text={item.name}
        fontSize={labelSize}
        fill="#1e293b"
        fontStyle="bold"
        align="center"
        verticalAlign="middle"
        listening={false}
      />
      <Text
        width={widthPx}
        height={depthPx * 0.35}
        y={depthPx * 0.55}
        text={`${item.widthCm} × ${item.depthCm}`}
        fontSize={dimsSize}
        fill="#475569"
        align="center"
        verticalAlign="middle"
        listening={false}
      />
    </Group>
  )
}
