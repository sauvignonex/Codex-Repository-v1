from pathlib import Path
from PIL import Image
import json,sys
root=Path(sys.argv[1]);rows=[]
for name,path in [('reference',root/'dist/art001-pass3/ref/C-hold.png'),('pass2',root/'dist/art001-pass2/native/C-reference-hold.png'),('pass3',root/'dist/art001-pass3/native/C-reference-hold.png')]:
 im=Image.open(path).convert('RGB');points=[]
 for y in range(1460,1585):
  for x in range(230,820):
   r,g,b=im.getpixel((x,y))
   if min(r,g,b)>240 and max(r,g,b)-min(r,g,b)<12:points.append((x,y))
 rows.append({'source':name,'method':'near-white threshold in manually isolated caption ROI; background contamination possible','bounds':[min(x for x,y in points),min(y for x,y in points),max(x for x,y in points)+1,max(y for x,y in points)+1]})
print(json.dumps(rows,indent=2))
