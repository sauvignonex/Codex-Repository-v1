"""Save verified snapshots. Retain current + previous in the user-selected folder."""
from pathlib import Path
import hashlib, json, zipfile, datetime, argparse, xml.etree.ElementTree as ET

parser=argparse.ArgumentParser()
parser.add_argument('--destination',default=r'D:\Projects Adobe\Разработка плагина\Версии')
args=parser.parse_args()
source=Path(__file__).resolve().parent
destination=Path(args.destination).resolve()
destination.mkdir(parents=True,exist_ok=True)
requirements=(source/'plugin-requirements.md').read_bytes()
requirements_temp=destination/'.requirements.tmp'
requirements_temp.write_bytes(requirements)
if requirements_temp.read_bytes()!=requirements:raise RuntimeError('Requirements copy failed')
requirements_temp.replace(destination/'Актуальные требования.md')
continuation_source=source/'ПРОДОЛЖИТЬ РАЗРАБОТКУ.md'
if continuation_source.exists():
    continuation=continuation_source.read_bytes()
    continuation_temp=destination/'.continuation.tmp'
    continuation_temp.write_bytes(continuation)
    if continuation_temp.read_bytes()!=continuation:raise RuntimeError('Continuation copy failed')
    continuation_temp.replace(destination/continuation_source.name)
files=sorted(p for p in source.rglob('*') if p.is_file() and p.relative_to(source).as_posix()!='snapshot.json' and not {'__pycache__','plugin-ui-v1','plugin-ui-v2'}.intersection(p.relative_to(source).parts) and p.suffix!='.zip')
manifest={str(p.relative_to(source)).replace('\\','/'):hashlib.sha256(p.read_bytes()).hexdigest() for p in files}
digest=hashlib.sha256(json.dumps(manifest,sort_keys=True).encode()).hexdigest()
existing=sorted(destination.glob('subtitle-studio-*.zip'))
if existing:
    with zipfile.ZipFile(existing[-1]) as z:
        if json.loads(z.read('snapshot.json'))['digest']==digest:
            print('Unchanged: '+str(existing[-1]));raise SystemExit(0)
stamp=datetime.datetime.now().strftime('%Y%m%d-%H%M%S-%f')
final=destination/f'subtitle-studio-{stamp}.zip'
temporary=destination/f'.subtitle-studio-{stamp}.tmp'
with zipfile.ZipFile(temporary,'w',zipfile.ZIP_DEFLATED) as z:
    for p in files:z.write(p,p.relative_to(source).as_posix())
    z.writestr('snapshot.json',json.dumps({'created':stamp,'digest':digest,'sha256':manifest},ensure_ascii=False,indent=2))
with zipfile.ZipFile(temporary) as z:
    if z.testzip() is not None:raise RuntimeError('Archive validation failed')
    for name,expected in manifest.items():
        if hashlib.sha256(z.read(name)).hexdigest()!=expected:raise RuntimeError('Hash mismatch: '+name)
temporary.replace(final)
# Re-saving one release must not evict the previous release.
current_version=ET.parse(source/'premiere-subtitles-cep/CSXS/manifest.xml').getroot().get('ExtensionBundleVersion')
older=sorted(p for p in destination.glob('subtitle-studio-*.zip') if p!=final)
previous_release=None
for candidate in reversed(older):
    with zipfile.ZipFile(candidate) as z:
        version=ET.fromstring(z.read('premiere-subtitles-cep/CSXS/manifest.xml')).get('ExtensionBundleVersion')
    if version!=current_version:
        previous_release=candidate
        break
keep={final}
if previous_release:keep.add(previous_release)
elif older:keep.add(older[-1])
for old in sorted(p for p in destination.glob('subtitle-studio-*.zip') if p not in keep):
    if old.resolve().parent!=destination:raise RuntimeError('Invalid archive path')
    old.unlink()
print('Saved and verified: '+str(final))
