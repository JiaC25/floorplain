/**
 * Parse a user-entered distance string into centimeters.
 * Supports formats like: "320", "320cm", "3.2m", "3.2 m", "150 cm"
 * Defaults to cm if no unit is specified.
 */
export function parseDistanceCm(input: string): number | null {
  const trimmed = input.trim().toLowerCase()
  if (!trimmed) return null

  const match = trimmed.match(/^([0-9]*\.?[0-9]+)\s*(m|cm)?$/)
  if (!match) return null

  const value = parseFloat(match[1])
  if (isNaN(value) || value <= 0) return null

  const unit = match[2] || 'cm'
  return unit === 'm' ? value * 100 : value
}

export function formatCm(cm: number): string {
  if (cm >= 100) {
    const m = cm / 100
    return `${Number(m.toFixed(2))}m`
  }
  return `${Math.round(cm)}cm`
}
