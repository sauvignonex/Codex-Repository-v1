"""Exclusive cooperative lock for manual/scheduled Subtitle Studio writers.

No stale lock is removed automatically: unknown native outcomes need inspection.
"""
import argparse,json,os,uuid
from pathlib import Path
from datetime import datetime,timezone
p=argparse.ArgumentParser();p.add_argument('action',choices=['acquire','release','status']);p.add_argument('--path',required=True);p.add_argument('--owner');p.add_argument('--token');a=p.parse_args()
path=Path(a.path)
if a.action=='acquire':
    if not a.owner:p.error('--owner required')
    path.parent.mkdir(parents=True,exist_ok=True)
    record={'owner':a.owner,'token':str(uuid.uuid4()),'created_utc':datetime.now(timezone.utc).isoformat(),'automatic_stale_removal':False}
    try: fd=os.open(path,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
    except FileExistsError: print(json.dumps({'acquired':False,'reason':'writer lock exists; do not remove automatically'}));raise SystemExit(3)
    with os.fdopen(fd,'w',encoding='utf-8') as f:json.dump(record,f);f.flush();os.fsync(f.fileno())
    print(json.dumps({'acquired':True,**record}))
elif a.action=='release':
    if not a.token or not a.owner:p.error('--token and --owner required')
    record=json.loads(path.read_text(encoding='utf-8'))
    if record.get('token')!=a.token or record.get('owner')!=a.owner:print(json.dumps({'released':False,'reason':'ownership mismatch'}));raise SystemExit(4)
    path.unlink();print(json.dumps({'released':True}))
else:
    print(json.dumps({'locked':path.exists(),'record':json.loads(path.read_text(encoding='utf-8')) if path.exists() else None}))
