from pathlib import Path
import json,zipfile,gzip
base=Path('C:/Users/Artem/AppData/Roaming/Adobe/Common/Motion Graphics Templates')
project=gzip.decompress(Path('D:/Projects Adobe/Рилс Колобки/Рилс Колобки.prproj').read_bytes()).decode('utf-8')
result=[]
for p in sorted(list(base.glob('Reels Text Animation *.mogrt'))+list(base.glob('SaaS*.mogrt'))):
    with zipfile.ZipFile(p) as z:d=json.loads(z.read('definition.json'))
    source=next(iter(d.get('sourceInfoLocalized',{}).values()),{})
    controls=[]
    for c in d.get('clientControls',[]):
        controls.append({'id':c.get('id'),'name':c.get('uiName',{}).get('strDB',[]),'type':c.get('type'),'font':c.get('fonteditinfo'),'value':c.get('value')})
    result.append({'path':str(p),'name':d.get('capsuleName'),'family':'SaaS' if p.name.startswith('SaaS') else 'Reels','nameFoundInProject':p.stem in project,'frame':source.get('framesize'),'duration':source.get('duration'),'responsiveDesignVersion':d.get('responsiveDesignVersion'),'usedEffects':d.get('usedEffects',[]),'controls':controls})
Path('outputs/template-inventory.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print('Templates:',len(result),'names found in project:',sum(x['nameFoundInProject'] for x in result))
