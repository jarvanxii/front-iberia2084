import gilPortrait from '@/assets/parties/gil.png'
import juntsPortrait from '@/assets/parties/junts.png'
import pisoePortrait from '@/assets/parties/pisoe.png'
import ppPortrait from '@/assets/parties/pp.png'
import puffPortrait from '@/assets/parties/puff.png'
import voxPortrait from '@/assets/parties/vox.png'

const portraits: Record<string, string> = {
  pp: ppPortrait,
  pisoe: pisoePortrait,
  gil: gilPortrait,
  puff: puffPortrait,
  vox: voxPortrait,
  junts: juntsPortrait,
}

export function partyPortrait(code: string) {
  return portraits[code] ?? ''
}
