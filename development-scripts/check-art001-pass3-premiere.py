from pathlib import Path
from PIL import Image,ImageChops,ImageDraw
import json,sys,hashlib
root=Path(sys.argv[1]);folder=root/'dist/art001-pass3/native/premiere-frames'
zone=Image.new('L',(1080,1920));ImageDraw.Draw(zone).polygon([(72,234),(1018,234),(1018,1348),(864,1348),(864,1600),(72,1600)],fill=255)
rows=[];failures=[]
for family,count,start,end in [('A',89,41,88),('B',135,30,127),('C',144,15,134)]:
 hashes=[];bounds=[]
 for i in range(count):
  im=Image.open(folder/f'{family}-{i:03}.png').convert('RGB');occupied=im.convert('L').point(lambda x:255 if x>3 else 0)
  if ImageChops.subtract(occupied,zone).getbbox():failures.append({'family':family,'frame':i,'outside':True})
  bounds.append(occupied.getbbox());hashes.append(hashlib.sha256(im.tobytes()).hexdigest())
 stable=len(set(hashes[start:end+1]))==1
 if not stable:failures.append({'family':family,'unstable_hold':True})
 rows.append({'family':family,'frames':count,'first_visible':next((i for i,b in enumerate(bounds) if b),None),'hold':[start,end],'stable':stable})
before=json.loads((root/'dist/art001-pass3/document-before.json').read_text(encoding='utf-8'));after=json.loads((root/'dist/art001-pass3/document-after.json').read_text(encoding='utf-8'))
seq_before=json.loads((root/'dist/art001-pass3/sequences-before.json').read_text(encoding='utf-8'));seq_after=json.loads((root/'dist/art001-pass3/sequences-after.json').read_text(encoding='utf-8'))
old_preserved=all(row in seq_after for row in seq_before)
if before!=after or not old_preserved:failures.append({'document_equal':before==after,'prior_sequences_equal':old_preserved})
print(json.dumps({'source':'368 actual Premiere PNG; RGB-visible contour excludes invisible black shadow, separately verified in AE full alpha','rows':rows,'live_document_identical':before==after,'prior_sequence_ids_names_counts_preserved':old_preserved,'prior_sequences':seq_before,'failures':failures},indent=2,ensure_ascii=False))
if failures:raise SystemExit(1)
