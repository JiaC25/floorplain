import { useRef, useState } from 'react'
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from '../ui/Button'
import type { FloorplanCropPixels } from '../../types'
import {
  naturalCropFromPixelCrop,
  pixelCropFromNaturalCrop,
} from '../../utils/floorplanImage'

type Props = {
  open: boolean
  title: string
  previewUrl: string
  /** When set (configure mode), initialize selection to this natural-pixel crop */
  initialNaturalCrop: FloorplanCropPixels | null
  showUploadNew: boolean
  /** Shown after user picks a new file via Upload New */
  showNewFloorplanWarning?: boolean
  onUploadNew: (file: File) => void
  onClose: () => void
  onConfirm: (naturalCrop: FloorplanCropPixels, sourceImg: HTMLImageElement) => void
}

export function FloorplanModal({
  open,
  title,
  previewUrl,
  initialNaturalCrop,
  showUploadNew,
  showNewFloorplanWarning = false,
  onUploadNew,
  onClose,
  onConfirm,
}: Props) {
  const imgRef = useRef<HTMLImageElement | null>(null)
  const uploadNewInputRef = useRef<HTMLInputElement>(null)
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  })
  const [pixelCrop, setPixelCrop] = useState<PixelCrop | null>(null)

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    imgRef.current = img
    if (initialNaturalCrop) {
      const pc = pixelCropFromNaturalCrop(initialNaturalCrop, img)
      setPixelCrop(pc)
      setCrop({
        unit: 'px',
        x: pc.x,
        y: pc.y,
        width: pc.width,
        height: pc.height,
      })
    } else {
      setCrop({
        unit: '%',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      })
      const { width, height } = img
      setPixelCrop({
        x: 0,
        y: 0,
        width,
        height,
        unit: 'px',
      })
    }
  }

  const handleConfirm = () => {
    const img = imgRef.current
    if (!img || !pixelCrop || pixelCrop.width < 2 || pixelCrop.height < 2) return
    const natural = naturalCropFromPixelCrop(pixelCrop, img)
    onConfirm(natural, img)
  }

  const handleUploadNewChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onUploadNew(file)
    e.target.value = ''
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl rounded-xl bg-white p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-zinc-800">{title}</h3>
          <Button
            onClick={onClose}
            variant="base"
            size="icon"
            className="h-7 w-7 border-none text-zinc-400 hover:text-zinc-600"
            aria-label="Close"
          >
            <X size={16} />
          </Button>
        </div>

        <div className="mb-4 max-h-[68vh] overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-2">
          <div className="flex justify-center">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(cpx) => setPixelCrop(cpx)}
              keepSelection
            >
              <img
                key={previewUrl}
                src={previewUrl}
                alt="Floorplan preview"
                className="block h-auto max-h-[64vh] w-auto max-w-[calc(100vw-8rem)]"
                onLoad={handleImageLoad}
              />
            </ReactCrop>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            {showUploadNew && (
              <>
                <input
                  ref={uploadNewInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUploadNewChange}
                />
                <Button
                  type="button"
                  variant="base"
                  onClick={() => uploadNewInputRef.current?.click()}
                >
                  Upload New
                </Button>
                {showNewFloorplanWarning && (
                  <div
                    className="flex min-w-0 max-w-xl items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-amber-950"
                    role="status"
                  >
                    <AlertTriangle
                      className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
                      aria-hidden
                    />
                    <p className="text-xs leading-snug">
                      New floorplan image selected. If you confirm the change, all existing annotations will be cleared
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button onClick={onClose} variant="base">
              Cancel
            </Button>
            <Button onClick={handleConfirm} variant="primary">
              Confirm
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
