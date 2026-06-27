export interface AvatarOption {
  key: string
  label: string
  src: string
}

const avatarModules = import.meta.glob('../assets/personajes/*.{png,jpg,jpeg,webp,avif,gif,svg}', {
  eager: true,
  import: 'default',
}) as Record<string, string>

function slug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function title(value: string) {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export const avatars: AvatarOption[] = Object.entries(avatarModules)
  .map(([path, src]) => {
    const rawName = path.split('/').pop()?.replace(/\.[^.]+$/, '') ?? 'avatar'
    return {
      key: slug(rawName),
      label: title(rawName),
      src,
    }
  })
  .sort((a, b) => a.label.localeCompare(b.label, 'es'))

export const DEFAULT_AVATAR = avatars.find((avatar) => avatar.key === 'abalos')?.key ?? avatars[0]?.key ?? ''

export function avatarByKey(key: string | null | undefined) {
  return avatars.find((avatar) => avatar.key === key) ?? avatars.find((avatar) => avatar.key === DEFAULT_AVATAR) ?? avatars[0]
}

export function avatarSrc(key: string | null | undefined) {
  return avatarByKey(key)?.src ?? ''
}
