import { Image } from 'react-konva'
import { useAppStore } from '../../stores/useAppStore'

export function FloorplanLayer() {
  const floorplanImage = useAppStore((s) => s.floorplanImage)

  if (!floorplanImage) return null

  return <Image image={floorplanImage} />
}
