import gilLogo from '@/assets/parties/logos/gil-logo.svg'
import juntsLogo from '@/assets/parties/logos/junts-logo.svg'
import pisoeLogo from '@/assets/parties/logos/pisoe-logo.svg'
import ppLogo from '@/assets/parties/logos/pp-logo.svg'
import puffLogo from '@/assets/parties/logos/puff-logo.svg'
import voxLogo from '@/assets/parties/logos/vox-logo.svg'

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
