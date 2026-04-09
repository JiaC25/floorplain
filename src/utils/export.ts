import type { Calibration, FurnitureTemplate, PlacedFurniture } from '../types'

interface ExportedProject {
  version: 1
  name: string
  calibration?: Calibration
  placedFurniture: PlacedFurniture[]
  furnitureLibrary: FurnitureTemplate[]
  floorplanImageDataUrl?: string
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/png'
  const bytes = atob(base64)
  const arr = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) {
    arr[i] = bytes.charCodeAt(i)
  }
  return new Blob([arr], { type: mime })
}

export async function exportProject(opts: {
  name: string
  calibration?: Calibration
  placedFurniture: PlacedFurniture[]
  furnitureLibrary: FurnitureTemplate[]
  floorplanImageBlob?: Blob | null
}): Promise<void> {
  const data: ExportedProject = {
    version: 1,
    name: opts.name,
    calibration: opts.calibration ?? undefined,
    placedFurniture: opts.placedFurniture,
    furnitureLibrary: opts.furnitureLibrary,
  }

  if (opts.floorplanImageBlob) {
    data.floorplanImageDataUrl = await blobToDataUrl(opts.floorplanImageBlob)
  }

  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${opts.name.replace(/[^a-z0-9]/gi, '_')}.floorplain.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importProject(
  file: File,
): Promise<{
  name: string
  calibration?: Calibration
  placedFurniture: PlacedFurniture[]
  furnitureLibrary: FurnitureTemplate[]
  floorplanImageBlob?: Blob
}> {
  const text = await file.text()
  const data = JSON.parse(text) as ExportedProject

  if (data.version !== 1) {
    throw new Error('Unsupported file version')
  }

  return {
    name: data.name,
    calibration: data.calibration,
    placedFurniture: data.placedFurniture,
    furnitureLibrary: data.furnitureLibrary,
    floorplanImageBlob: data.floorplanImageDataUrl
      ? dataUrlToBlob(data.floorplanImageDataUrl)
      : undefined,
  }
}
