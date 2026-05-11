import favoresIcon from '@/assets/resources/favores.svg'
import pesetasIcon from '@/assets/resources/pesetas.svg'
import votosIcon from '@/assets/resources/votos.svg'

const icons: Record<string, string> = {
  favores: favoresIcon,
  pesetas: pesetasIcon,
  votos: votosIcon,
}

export function resourceIcon(code?: string | null) {
  if (!code) return pesetasIcon
  return icons[code] ?? pesetasIcon
}
