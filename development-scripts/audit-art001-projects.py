"""Read-only audit. Never opens/restores/writes Premiere project files."""
import gzip, hashlib, json, sys
from pathlib import Path
root=Path(sys.argv[1])
qa_id='898bde27-30ca-4683-8387-dcb9fd69c2cf'
study_id='c4f43473-d57d-4153-a868-997826aacd63'
paths=[root/'Тестовая секвенция Разработка плагина.prproj']
paths+=list((root/'Adobe Premiere Pro Auto-Save').glob('*.prproj'))
paths+=list((root/'Локальные резервные копии').rglob('*.prproj'))
rows=[]
for p in sorted(paths,key=lambda p:p.stat().st_mtime):
    raw=p.read_bytes()
    try: text=(gzip.decompress(raw) if raw[:2]==b'\x1f\x8b' else raw).decode('utf-8-sig')
    except Exception as e: rows.append({'file':str(p.relative_to(root)),'error':str(e)}); continue
    rows.append({'file':str(p.relative_to(root)),'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw),'full063_id_present':qa_id in text,'study_r3_id_present':study_id in text,'full063_name_present':'Субтитры 0.6.3 QA' in text})
print(json.dumps(rows,ensure_ascii=False,indent=2))
