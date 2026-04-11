import {
  defaultLayerVisibility,
  type LayerVisibility,
} from '../types'

const STORAGE_KEY = 'floorplain:layerVisibility'

/** Merge stored prefs with defaults so new keys get defaults after app updates. */
export function readStoredLayerVisibility(): LayerVisibility {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaultLayerVisibility }
    const parsed = JSON.parse(raw) as Partial<LayerVisibility>
    return { ...defaultLayerVisibility, ...parsed }
  } catch {
    return { ...defaultLayerVisibility }
  }
}

export function writeStoredLayerVisibility(lv: LayerVisibility): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lv))
  } catch {
    // ignore quota / private mode
  }
}
