import avisoVecino from '@/assets/notifications/aviso-vecino.mp3'
import jefeEquipo from '@/assets/notifications/jefe-equipo.mp3'
import ordenLey from '@/assets/notifications/orden-ley.mp3'
import tonoNokia from '@/assets/notifications/tono-nokia.mp3'

export interface NotificationSoundOption {
  key: string
  label: string
  src: string
}

export const notificationSounds: NotificationSoundOption[] = [
  { key: 'tono-nokia', label: 'Tono clásico', src: tonoNokia },
  { key: 'aviso-vecino', label: 'Aviso vecinal', src: avisoVecino },
  { key: 'jefe-equipo', label: 'Jefe de equipo', src: jefeEquipo },
  { key: 'orden-ley', label: 'Orden y ley', src: ordenLey },
]
