"""Check rendered AE alpha including shadow/blur against the actual Reels contour.

Only exported sample frames are covered; not every frame of every matrix case.
"""
from pathlib import Path
from PIL import Image,ImageDraw,ImageChops
import json,sys
folder=Path(sys.argv[1]);zone=Image.new('L',(1080,1920));ImageDraw.Draw(zone).polygon([(72,234),(1018,234),(1018,1348),(864,1348),(864,1600),(72,1600)],fill=255)
rows=[];failures=[]
for f in sorted(folder.glob('*.png')):
    im=Image.open(f).convert('RGBA');alpha=im.getchannel('A')
    if alpha.getextrema()==(255,255):raise RuntimeError('Opaque PNG cannot verify black shadows; alpha required')
    occupied=alpha.point(lambda x:255 if x>2 else 0)
    escaped=ImageChops.subtract(occupied,zone).getbbox()
    if escaped:failures.append({'file':f.name,'escaped':escaped})
    # All 0.25 sec cases use immediate. Some short 0.5 sec cases can animate
    # while retaining the required reading hold, so they may start transparent.
    parts=f.stem.split('-')
    if len(parts)==4 and parts[2]=='0' and parts[3]=='0' and not occupied.getbbox():failures.append({'file':f.name,'empty_immediate':True})
    rows.append({'file':f.name,'bounds':occupied.getbbox()})
print(json.dumps({'source':'AE rendered RGBA; alpha threshold >2/255','frames':len(rows),'full_motion_path_verified':False,'failures':failures,'rows':rows},indent=2))
if failures:raise SystemExit(1)
