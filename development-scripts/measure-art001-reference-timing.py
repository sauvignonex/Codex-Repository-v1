"""Estimate A reading anchors from baked footage; no claim of exact authoring keys.

Prepare local frames with FFmpeg at30fps from2.9s, frame names001..089.
User footage/frame crops are local-only; publish only numeric output.
"""
from pathlib import Path
from PIL import Image,ImageFilter
import numpy as np,json,sys
root=Path(sys.argv[1]);folder=root/'dist/art001-reference-timing/A'
files=sorted(folder.glob('*.png'))
assert len(files)==89,'Expected complete reference interval'
roi=(110,1438,830,1585)
hold=np.asarray(Image.open(files[48]).convert('RGB').crop(roi))
white=(hold.min(axis=2)>240)&((hold.max(axis=2)-hold.min(axis=2))<12)
core=np.asarray(Image.fromarray((white*255).astype('uint8')).filter(ImageFilter.MinFilter(7)))>0
assert core.sum()>1000,'Not enough isolated white letter core pixels'
# Locate the word gap in a manually restricted plausible first-word boundary.
cols=np.flatnonzero(white.any(axis=0));gaps=[(int(b-a-1),int(a+1),int(b)) for a,b in zip(cols,cols[1:]) if b-a>1 and 220<a<330]
assert gaps,'No plausible word gap'
gap=max(gaps);split=(gap[1]+gap[2])//2
first=core.copy();first[:,split:]=False
assert first.sum()>1000
rows=[]
for i,path in enumerate(files):
 frame=np.asarray(Image.open(path).convert('RGB').crop(roi));visible=frame.min(axis=2)>=235
 rows.append({'local_frame':i,'analysis_frame':87+i,'seconds':round(2.9+i/30,6),'body_core_coverage':round(float(visible[core].mean()),6),'first_word_core_coverage':round(float(visible[first].mean()),6)})
def stable(key,threshold):
 return next((i for i in range(len(rows)-2) if all(rows[j][key]>=threshold for j in range(i,i+3))),None)
anchors={}
for name,key in [('body','body_core_coverage'),('first_word','first_word_core_coverage')]:
 for threshold in [.95,.98]:
  index=stable(key,threshold);anchors[f'{name}_{threshold}']=None if index is None else rows[index]['analysis_frame']
print(json.dumps({'source':'Baked reference A, 30fps analysis grid; white core of manually isolated body ROI','method':'Hold sample local48, RGB min>240/spread<12, erosion7px; observed RGB min>=235; earliest3consecutive coverage frames','roi':roi,'core_pixels':int(core.sum()),'first_word_core_pixels':int(first.sum()),'word_gap':{'pixels':gap[0],'global_x':[110+gap[1],110+gap[2]]},'anchors':anchors,'uncertainty':'Heuristic, ±1 analysis frame plus threshold/ROI sensitivity. White photography may contaminate mask; does not prove exact animation hold/keyframes or native alpha. Native variants unchanged.','rows':rows},indent=2))
