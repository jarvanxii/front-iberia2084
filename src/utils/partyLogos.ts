import gilLogo from '@/assets/parties/logos/gil-logo.png'
import juntsLogo from '@/assets/parties/logos/junts-logo.png'
import pisoeLogo from '@/assets/parties/logos/pisoe-logo.png'
import ppLogo from '@/assets/parties/logos/pp-logo.png'
import puffLogo from '@/assets/parties/logos/puff-logo.png'
import voxLogo from '@/assets/parties/logos/vox-logo.png'

const logos: Record<string, string> = {
  pp: ppLogo,
  pisoe: pisoeLogo,
  gil: gilLogo,
  puff: puffLogo,
  vox: voxLogo,
  junts: juntsLogo,
}

export function partyLogo(code: string) {
  return logos[code] ?? ''
}
