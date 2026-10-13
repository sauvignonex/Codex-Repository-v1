from pathlib import Path
from PIL import Image,ImageDraw,ImageChops
import json,hashlib,sys
root=Path(sys.argv[1]);folder=root/'dist/art001-pass5-a/native'
zone=Image.new('L',(1080,1920));ImageDraw.Draw(zone).polygon([(72,234),(1018,234),(1018,1348),(864,1348),(864,1600),(72,1600)],fill=255)
hashes=[];bad=[];rows=[]
for f in range(89):
 im=Image.open(folder/'full-alpha'/f'A-{f:03}.png').convert('RGBA');a=im.getchannel('A');occ=a.point(lambda x:255 if x>2 else 0)
 if a.getextrema()==(255,255):raise RuntimeError('Opaque PNG')
 escaped=ImageChops.subtract(occ,zone).getbbox()
 if escaped:bad.append({'frame':f,'escaped':escaped})
 hashes.append(hashlib.sha256(im.tobytes()).hexdigest());rows.append({'frame':f,'bounds':occ.getbbox()})
word_pause=len(set(hashes[25:28]))==1;hold=len(set(hashes[36:89]))==1
if not word_pause or not hold:bad.append({'first_word_pause':word_pause,'hold':hold})
def bounds(path,alpha):
 im=Image.open(path).convert('RGBA');pts=[]
 # The reference source is cropped: origin80,1320. Body-only ROI excludes leader.
 if not alpha:im=im.crop((0,118,780,280))
 else:im=im.crop((80,1438,860,1600))
 for y in range(im.height):
  for x in range(im.width):
   r,g,b,a=im.getpixel((x,y))
   if min(r,g,b)>240 and max(r,g,b)-min(r,g,b)<12 and (not alpha or a>240):pts.append((x,y))
 bx=[min(x for x,y in pts)+80,min(y for x,y in pts)+1438,max(x for x,y in pts)+81,max(y for x,y in pts)+1439]
 return {'bounds':bx,'width':bx[2]-bx[0],'height':bx[3]-bx[1]}
geometry={n:bounds(p,a) for n,p,a in [('reference',root/'dist/art001-a-calibration/reference-hold-roi.png',False),('pass3',root/'dist/art001-pass3/native/A-reference-hold.png',True),('pass5',folder/'A-reference-hold.png',True)]}
print(json.dumps({'source':'Every native AE RGBA frame; not Premiere; body near-white ROI manual isolation','frames':89,'first_word_pause_frames':[25,27],'first_word_pause_stable':word_pause,'reading_hold_frames':[36,88],'hold_stable':hold,'geometry':geometry,'failures':bad,'rows':rows},indent=2))
if bad:raise SystemExit(1)
