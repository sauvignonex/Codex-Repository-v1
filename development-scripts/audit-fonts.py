import struct,json
from pathlib import Path
paths=[Path('C:/Users/Artem/AppData/Local/Microsoft/Windows/Fonts/bebasneuecyrillic.ttf'),Path('C:/Users/Artem/AppData/Local/Microsoft/Windows/Fonts/Christopher.otf'),Path('C:/Windows/Fonts/CeraPro-Medium.ttf')]
results=[]
for path in paths:
 b=path.read_bytes()
 def u16(o):return struct.unpack_from('>H',b,o)[0]
 def u32(o):return struct.unpack_from('>I',b,o)[0]
 tables={b[o:o+4].decode('ascii'):u32(o+8) for o in range(12,12+u16(4)*16,16)}
 n=tables['name']; names=set()
 for o in range(n+6,n+6+u16(n+2)*12,12):
  platform,encoding,lang,nid,length,offset=struct.unpack_from('>6H',b,o)
  if nid in (1,2,6,16,17):
   raw=b[n+u16(n+4)+offset:n+u16(n+4)+offset+length]
   names.add((nid,raw.decode('utf-16-be' if platform in (0,3) else 'latin1',errors='replace')))
 cmap=tables['cmap']; coverage=set()
 for o in range(cmap+4,cmap+4+u16(cmap+2)*8,8):
  platform,encoding=struct.unpack_from('>HH',b,o)
  if platform not in (0,3):continue
  t=cmap+u32(o+4);fmt=u16(t)
  if fmt==4:
   count=u16(t+6)//2;ends=t+14;starts=ends+2*count+2;deltas=starts+2*count;ranges=deltas+2*count
   for i in range(count):
    for code in range(u16(starts+2*i),u16(ends+2*i)+1):
     r=u16(ranges+2*i);delta=u16(deltas+2*i)
     g=(code+delta)&65535 if r==0 else u16(ranges+2*i+r+2*(code-u16(starts+2*i)))
     if r and g:g=(g+delta)&65535
     if g:coverage.add(code)
  elif fmt==12:
   for g in range(t+16,t+16+u32(t+12)*12,12):
    first,last,glyph=struct.unpack_from('>III',b,g)
    coverage.update(range(first+(glyph==0),last+1))
 letters='АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя'
 results.append({'path':str(path),'names':sorted(names),'missingRussianLetters':''.join(c for c in letters if ord(c) not in coverage)})
print(json.dumps(results,ensure_ascii=False,indent=2))
Path('work/font-audit.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
