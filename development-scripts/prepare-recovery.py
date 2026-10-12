from pathlib import Path
import shutil,json,hashlib
out=Path('outputs'); dest=out/'recovery-inputs'; rows=[]
def copy(src,target):
    src=Path(src);target=Path(target)
    try:
        target.parent.mkdir(parents=True,exist_ok=True)
        shutil.copy2(src,target)
        digest=hashlib.sha256(src.read_bytes()).hexdigest()
        if hashlib.sha256(target.read_bytes()).hexdigest()!=digest:raise RuntimeError('SHA-256 mismatch')
        rows.append({'source':str(src),'backup':str(target),'sha256':digest,'status':'verified'})
    except Exception as e:rows.append({'source':str(src),'status':'failed','error':str(e)})
for name in ['Создание плагина.docx','Создание плагина 2.docx','создание плагина 3.docx']:
    copy(Path('C:/Users/Artem/Desktop')/name,dest/'documents'/name)
copy('D:/Projects Adobe/Шаблон/Безопасная зона reels.png',dest/'references/Безопасная зона reels.png')
for src in [Path('D:/Projects Adobe/Рилс Колобки/Рилс Колобки.prproj'),Path('D:/Projects Adobe/Разработка плагина/Тестовая секвенция Разработка плагина.prproj')]:copy(src,dest/'projects'/src.name)
base=Path('D:/Projects Adobe/Рилс Колобки')
for src in base.rglob('*.srt'):copy(src,dest/'srt'/src.relative_to(base))
templates=Path('C:/Users/Artem/AppData/Roaming/Adobe/Common/Motion Graphics Templates')
for pattern in ['Reels Text Animation *.mogrt','SaaS Pack Title *.mogrt']:
    for src in templates.glob(pattern):copy(src,dest/'templates'/src.name)
for src in ['C:/Users/Artem/AppData/Local/Microsoft/Windows/Fonts/bebasneuecyrillic.ttf','C:/Users/Artem/AppData/Local/Microsoft/Windows/Fonts/Christopher.otf','C:/Windows/Fonts/CeraPro-Medium.ttf']:copy(src,dest/'fonts'/Path(src).name)
storage=Path('C:/Users/Artem/AppData/Local/Temp/cep_cache/PPRO_26.2.0_com.artem.subtitle-studio.panel/Local Storage')
for src in storage.rglob('*'):
    if src.is_file() and src.name!='LOCK':copy(src,dest/'cep-local-storage'/src.relative_to(storage))
for pattern in ['*.py','*.cjs']:
    for src in Path('work').glob(pattern):copy(src,out/'development-scripts'/src.name)
for src in [Path('work/font-audit.json'),Path('work/panel-audit-before.json'),Path('work/srt-recording/detail.png')]:
    if src.exists():copy(src,dest/'evidence'/src.name)
(out/'recovery-copy-report.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'verified':sum(r['status']=='verified' for r in rows),'failed':[r for r in rows if r['status']=='failed']},ensure_ascii=False))
