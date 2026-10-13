"""Pixel typography checks supplement source constants; use real native AE renders."""
from pathlib import Path
from PIL import Image
import json,sys
r=Path(sys.argv[1]);rows=[];premiere=len(sys.argv)>2 and sys.argv[2]=='premiere'
for name,folder in [('before','art001-pass4-a'),('after','art001-pass5-a')]:
 im=Image.open(r/'dist'/folder/('native/premiere-frames/A-025.png' if premiere and name=='after' else 'native/full-alpha/A-025.png')).convert('RGBA')
 points=set()
 for y in range(1438,1600):
  for x in range(80,850):
   red,g,b,a=im.getpixel((x,y))
   if a>240 and min(red,g,b)>240:points.add((x,y))
 boxes=[]
 while points:
  seed=points.pop();stack=[seed];component=[seed]
  while stack:
   x,y=stack.pop()
   for dx in (-1,0,1):
    for dy in (-1,0,1):
     p=(x+dx,y+dy)
     if p in points:points.remove(p);stack.append(p);component.append(p)
  if len(component)>10:boxes.append([min(x for x,y in component),min(y for x,y in component),max(x for x,y in component)+1,max(y for x,y in component)+1])
 boxes.sort();gaps=[b[0]-a[2] for a,b in zip(boxes,boxes[1:])]
 hold=Image.open(r/'dist'/folder/('native/premiere-frames/A-048.png' if premiere and name=='after' else 'native/A-reference-hold.png')).convert('RGBA')
 cols=[]
 for x in range(80,850):
  if any(hold.getpixel((x,y))[3]>240 and min(hold.getpixel((x,y))[:3])>240 for y in range(1438,1600)):cols.append(x)
 word_gaps=sorted([(b-a-1,a+1,b) for a,b in zip(cols,cols[1:]) if b-a>1],reverse=True)
 rows.append({'source':name,'first_word_8_connected_components':len(boxes),'glyph_bounds':boxes,'bounding_box_horizontal_gaps':gaps,'full_body_empty_column_runs':word_gaps[:12]})
after=rows[1]
assert after['first_word_8_connected_components']==4, 'ВКУС must have four separate native glyphs'
assert min(after['bounding_box_horizontal_gaps'])>=1,'Glyph boxes must remain separate'
assert after['full_body_empty_column_runs'][0][0]>=10,'Visible inter-word gap must remain'
print(json.dumps({'source':('Native Premiere' if premiere else 'Native AE')+' white opaque glyph pixels; 8-connected component check of ВКУС, not generic language segmentation','rows':rows,'pass':True},indent=2))
