import { Layer } from 'react-konva'
import { useAppStore } from '../../stores/useAppStore'
import { FurnitureRect } from './FurnitureRect'

export function FurnitureLayer() {
  const placedFurniture = useAppStore((s) => s.placedFurniture)
  const calibration = useAppStore((s) => s.calibration)

  if (!calibration || placedFurniture.length === 0) return null

  return (
    <Layer>
      {placedFurniture.map((item) => (
        <FurnitureRect key={item.id} item={item} calibration={calibration} />
      ))}
    </Layer>
  )
}
