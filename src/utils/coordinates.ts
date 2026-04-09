import type { Calibration } from '../types'

export function cmToPixels(cm: number, calibration: Calibration): number {
  return cm * calibration.pixelsPerCm
}

export function pixelsToCm(px: number, calibration: Calibration): number {
  return px / calibration.pixelsPerCm
}

export function pixelDistance(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
): number {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  return Math.sqrt(dx * dx + dy * dy)
}

export function computeCalibration(
  point1: { x: number; y: number },
  point2: { x: number; y: number },
  realWorldDistanceCm: number,
): Calibration {
  const pxDist = pixelDistance(point1, point2)
  return {
    point1,
    point2,
    realWorldDistanceCm,
    pixelsPerCm: pxDist / realWorldDistanceCm,
  }
}

/**
 * Convert a screen-space point to stage (image) coordinates,
 * accounting for the current pan and zoom transform.
 */
export function screenToStage(
  screenX: number,
  screenY: number,
  stagePosition: { x: number; y: number },
  stageScale: number,
): { x: number; y: number } {
  return {
    x: (screenX - stagePosition.x) / stageScale,
    y: (screenY - stagePosition.y) / stageScale,
  }
}
