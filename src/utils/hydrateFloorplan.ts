import type { ProjectRecord } from '../db/database'
import {
  loadFloorplanOriginal,
  loadImage,
} from '../db/projectStorage'
import type { FloorplanCropPixels } from '../types'
import {
  fullNaturalCrop,
  renderCroppedFloorplan,
} from './floorplanImage'

function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(blob)
    img.onload = () => {
      resolve(img)
      URL.revokeObjectURL(url)
    }
    img.onerror = reject
    img.src = url
  })
}

export async function hydrateFloorplanFromProject(
  projectId: string,
  project: ProjectRecord,
  setFloorplanComplete: (p: {
    floorplanImage: HTMLImageElement
    floorplanImageBlob: Blob
    floorplanOriginalBlob: Blob
    floorplanCropPixels: FloorplanCropPixels
  }) => void,
  clearFloorplan: () => void,
): Promise<void> {
  const displayBlob = await loadImage(projectId)
  if (!displayBlob) {
    clearFloorplan()
    return
  }

  const originalBlob =
    (await loadFloorplanOriginal(projectId)) ?? displayBlob

  let crop: FloorplanCropPixels
  if (project.floorplanCrop) {
    crop = project.floorplanCrop
  } else {
    const img = await blobToImage(originalBlob)
    crop = fullNaturalCrop(img)
  }

  try {
    const { image, blob } = await renderCroppedFloorplan(originalBlob, crop)
    setFloorplanComplete({
      floorplanImage: image,
      floorplanImageBlob: blob,
      floorplanOriginalBlob: originalBlob,
      floorplanCropPixels: crop,
    })
  } catch {
    const img = await blobToImage(displayBlob)
    const fallbackCrop = fullNaturalCrop(img)
    setFloorplanComplete({
      floorplanImage: img,
      floorplanImageBlob: displayBlob,
      floorplanOriginalBlob: originalBlob,
      floorplanCropPixels: fallbackCrop,
    })
  }
}
