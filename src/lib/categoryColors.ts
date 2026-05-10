export const CATEGORY_COLORS: { name: string; value: string }[] = [
  { name: 'Teal', value: '#0d9488' },
  { name: 'Blau', value: '#2563eb' },
  { name: 'Indigo', value: '#4f46e5' },
  { name: 'Violett', value: '#7c3aed' },
  { name: 'Pink', value: '#db2777' },
  { name: 'Rot', value: '#dc2626' },
  { name: 'Orange', value: '#ea580c' },
  { name: 'Gelb', value: '#ca8a04' },
  { name: 'Lime', value: '#65a30d' },
  { name: 'Grün', value: '#16a34a' },
  { name: 'Cyan', value: '#0891b2' },
  { name: 'Stein', value: '#57534e' },
]

export const DEFAULT_PROJECT_COLOR = CATEGORY_COLORS[0].value
export const DEFAULT_TAG_COLOR = CATEGORY_COLORS[1].value

export function pickColor(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0
  }
  const index = Math.abs(hash) % CATEGORY_COLORS.length
  return CATEGORY_COLORS[index].value
}
