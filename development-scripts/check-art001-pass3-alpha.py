"""Full AE RGBA paths for reference-length studies; matrix coverage remains sampled."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageChops
import json,sys,hashlib
root=Path(sys.argv[1]); folder=root/'dist/art001-pass3/native'
zone=Image.new('L',(1080,1920));ImageDraw.Draw(zone).polygon([(72,234),(1018,234),(1018,1348),(864,1348),(864,1600),(72,1600)],fill=255)
failures=[];rows=[]
for family,count,hold_start,hold_end in [('A',89,41,88),('B',135,30,127),('C',144,15,134)]:
    hashes=[];bounds=[]
    for frame in range(count):
        p=folder/'full-alpha'/f'{family}-{frame:03}.png'
        im=Image.open(p).convert('RGBA');alpha=im.getchannel('A')
        if alpha.getextrema()==(255,255):raise RuntimeError('Opaque frame '+str(p))
        occupied=alpha.point(lambda x:255 if x>2 else 0)
        escaped=ImageChops.subtract(occupied,zone).getbbox()
        if escaped:failures.append({'file':p.name,'escaped':escaped})
        bounds.append(occupied.getbbox());hashes.append(hashlib.sha256(im.tobytes()).hexdigest())
    stable=len(set(hashes[hold_start:hold_end+1]))==1
    if not stable:failures.append({'family':family,'unstable_hold':[hold_start,hold_end]})
    rows.append({'family':family,'frames':count,'first_visible':next((i for i,b in enumerate(bounds) if b),None),'stable_hold_frames':[hold_start,hold_end],'stable_hold':stable,'full_motion_path_verified':True,'last_bounds':bounds[-1]})
print(json.dumps({'source':'Every exported AE RGBA frame, alpha >2/255 includes shadow/blur; reference-length cases only','frames':sum(r['frames'] for r in rows),'rows':rows,'failures':failures},indent=2))
if failures:raise SystemExit(1)
