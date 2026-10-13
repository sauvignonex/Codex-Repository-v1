from pathlib import Path
from PIL import Image,ImageDraw,ImageChops
import json,sys
folder=Path(sys.argv[1]);zone=Image.new('L',(1080,1920));ImageDraw.Draw(zone).polygon([(72,234),(1018,234),(1018,1348),(864,1348),(864,1600),(72,1600)],fill=255)
rows=[]
for family in 'ABC':
    ims=[Image.open(folder/f'{family}-{f:03d}.png').convert('RGB') for f in range(90)]
    assert all(im.size==(1080,1920) for im in ims)
    visible=[]
    for f,im in enumerate(ims):
        occupied=im.convert('L').point(lambda x:255 if x>3 else 0)
        assert not ImageChops.subtract(occupied,zone).getbbox(),f'Outside contour {family}-{f}'
        if occupied.getbbox():visible.append(f)
    assert visible, f'Empty Program {family}'
    assert all(ImageChops.difference(ims[f],ims[60]).getbbox() is None for f in range(45,84)),f'Drifting hold {family}'
    rows.append({'family':family,'frames':90,'first_visible_frame':visible[0],'reading_hold_equal_frames':39,'reading_bounds':ims[60].getbbox()})
print(json.dumps({'source':'actual opaque Premiere frame exports','rows':rows,'black_shadow_coverage':'AE RGBA samples tested separately','reference_sync_uncertainty_frames':1,'artistic_acceptance':False},indent=2))
