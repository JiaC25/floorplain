import type { PixelCrop } from 'react-image-crop'
import type { FloorplanCropPixels } from '../types'

export type { FloorplanCropPixels }

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/** Convert react-image-crop pixel crop (relative to displayed image size) to natural pixels. */
export function naturalCropFromPixelCrop(
  pixelCrop: PixelCrop,
  sourceImg: HTMLImageElement,
): FloorplanCropPixels {
  const scaleX = sourceImg.naturalWidth / sourceImg.width
  const scaleY = sourceImg.naturalHeight / sourceImg.height
  return {
    x: Math.round(pixelCrop.x * scaleX),
    y: Math.round(pixelCrop.y * scaleY),
    width: Math.round(pixelCrop.width * scaleX),
    height: Math.round(pixelCrop.height * scaleY),
  }
}

/** PixelCrop in display coordinates for ReactCrop from a natural-pixel crop. */
export function pixelCropFromNaturalCrop(
  natural: FloorplanCropPixels,
  sourceImg: HTMLImageElement,
): PixelCrop {
  const scaleX = sourceImg.width / sourceImg.naturalWidth
  const scaleY = sourceImg.height / sourceImg.naturalHeight
  return {
    unit: 'px',
    x: natural.x * scaleX,
    y: natural.y * scaleY,
    width: natural.width * scaleX,
    height: natural.height * scaleY,
  }
}

export function fullNaturalCrop(img: HTMLImageElement): FloorplanCropPixels {
  return {
    x: 0,
    y: 0,
    width: img.naturalWidth,
    height: img.naturalHeight,
  }
}

/** Rasterize cropped region from original image blob. */
export async function renderCroppedFloorplan(
  originalBlob: Blob,
  crop: FloorplanCropPixels,
): Promise<{ image: HTMLImageElement; blob: Blob }> {
  const url = URL.createObjectURL(originalBlob)
  try {
    const img = await loadImageElement(url)
    const w = Math.max(1, Math.round(crop.width))
    const h = Math.max(1, Math.round(crop.height))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('no 2d context')
    ctx.drawImage(
      img,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      w,
      h,
    )
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png'),
    )
    if (!blob) throw new Error('toBlob failed')
    const outUrl = URL.createObjectURL(blob)
    try {
      const outImg = await loadImageElement(outUrl)
      return { image: outImg, blob }
    } finally {
      URL.revokeObjectURL(outUrl)
    }
  } finally {
    URL.revokeObjectURL(url)
  }
}
