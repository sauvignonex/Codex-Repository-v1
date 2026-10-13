"""Same readability detector for baked reference and unchanged native Pass5.
Each source has its own hold-derived letter-core mask; frame pixels are not equal.
"""
from pathlib import Path
from PIL import Image,ImageFilter
import numpy as np,json,hashlib,sys
r=Path(sys.argv[1]);roi=(110,1438,845,1585);out=[]
for name,folder in [('reference',r/'dist/art001-reference-timing/A'),('Pass5-Premiere',r/'dist/art001-pass5-a/native/premiere-frames')]:
 files=sorted(folder.glob('*.png'));assert len(files)==89
 hold=np.asarray(Image.open(files[48]).convert('RGB').crop(roi));white=(hold.min(axis=2)>240)&((hold.max(axis=2)-hold.min(axis=2))<12)
 core=np.asarray(Image.fromarray((white*255).astype('uint8')).filter(ImageFilter.MinFilter(7)))>0;assert core.sum()>1000
 cols=np.flatnonzero(white.any(axis=0));gaps=[(int(b-a-1),int(a+1),int(b)) for a,b in zip(cols,cols[1:]) if b-a>1 and 220<a<330];gap=max(gaps)
 first=core.copy();first[:,(gap[1]+gap[2])//2:]=False
 rows=[];hashes=[]
 for i,p in enumerate(files):
  im=Image.open(p).convert('RGB').crop(roi);frame=np.asarray(im);v=frame.min(axis=2)>=235
  rows.append({'local_frame':i,'body':round(float(v[core].mean()),6),'first_word':round(float(v[first].mean()),6)});hashes.append(hashlib.sha256(im.tobytes()).hexdigest())
 def earliest(key,t):return next((i for i in range(87) if all(rows[j][key]>=t for j in range(i,i+3))),None)
 anchors={f'{key}_{t}':earliest(key,t) for key in ['body','first_word'] for t in [.95,.98]}
 stable=next((i for i in range(87) if len(set(hashes[i:i+3]))==1),None)
 out.append({'source':name,'core_pixels':int(core.sum()),'word_gap_pixels':gap[0],'readability_local_frames':anchors,'earliest3_identical_RGB_crop_frames':stable,'earliest3_stable_readable_body':next((i for i in range(87) if all(rows[j]['body']>=.98 for j in range(i,i+3)) and len(set(hashes[i:i+3]))==1),None),'rows':rows})
deltas={k:out[1]['readability_local_frames'][k]-out[0]['readability_local_frames'][k] for k in out[0]['readability_local_frames']}
print(json.dumps({'method':'Same thresholds/erosion7/hold48/3consecutive frames; each source own hold-derived mask; not native keyframe reconstruction','sources':out,'Pass5_minus_reference_frames':deltas,'typography_prior_evidence':{'reference_body_height':143,'Pass5_body_height':119,'height_relative_error':(119-143)/143},'next_priority':'Typographic height/spacing exceeds temporal mismatch; keep timing until typography study reviewed','uncertainty':'Heuristic white-core readability, ±1frame plus ROI/whitebackground sensitivity. Equal RGB crop stability is separate and expected absent on moving background. No media published; unchanged native exports only.'},indent=2))
