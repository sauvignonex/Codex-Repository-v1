from pathlib import Path
import re
root=Path('outputs/premiere-subtitles-cep')
(root/'CSXS').mkdir(parents=True,exist_ok=True)
source=Path('outputs/plugin-ui-v3/panel-source.html').read_text(encoding='utf-8')
css=re.search(r'<style>(.*?)</style>',source,re.S).group(1)
css=re.sub(r'light-dark\(([^,()]+),([^()]+)\)',lambda m:m[2],css)
css=re.sub(r'color-mix\([^)]*\)', '#77698f',css) if False else css
css=css.replace('color-mix(in srgb,var(--highlight) 35%,transparent)','#655c7b').replace('color-mix(in srgb,var(--highlight) 45%,var(--line))','#716184')
css+='\nbody{margin:0;background:#202024;color:#f2f2f5;color-scheme:dark} #subtitle-studio-preview{padding:0} #subtitle-studio-preview .studio{border:0;border-radius:0;max-width:none} #subtitle-studio-preview .demo{padding-right:0} #host-check{margin-top:12px} #host-status{white-space:pre-wrap;overflow-wrap:anywhere} [hidden]{display:none!important}\n'
html=re.sub(r'<style>.*?</style>','',source,flags=re.S)
html=re.sub(r'<script>.*?</script>','',html,flags=re.S)
html=html.replace('Макет панели','CEP · 0.1').replace('<footer class="foot">','<div class="body"><button id="host-check" type="button">Проверить связь с Premiere</button><p id="host-status" role="status">Проверка читает версию и параметры активной секвенции.</p></div><footer class="foot">')
(root/'index.html').write_text('<!doctype html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Субтитры</title><link rel="stylesheet" href="panel.css"></head><body>'+html+'<script src="storage.js"></script><script src="panel.js"></script><script src="bridge.js"></script></body></html>',encoding='utf-8')
(root/'panel.css').write_text(css,encoding='utf-8')
js=Path('outputs/plugin-ui-v3/panel.js').read_text(encoding='utf-8').replace('window.openai','window.subtitleStorage').replace('Подключение к Premiere — следующий этап.','Создание графики на таймлайне пока не подключено.')
(root/'panel.js').write_text(js,encoding='utf-8')
(root/'CSXS/manifest.xml').write_text('''<?xml version="1.0" encoding="UTF-8"?>
<ExtensionManifest Version="7.0" ExtensionBundleId="com.artem.subtitle-studio" ExtensionBundleVersion="0.1.0" ExtensionBundleName="Субтитры">
<ExtensionList><Extension Id="com.artem.subtitle-studio.panel" Version="0.1.0"/></ExtensionList>
<ExecutionEnvironment><HostList><Host Name="PPRO" Version="[26.2,26.9]"/></HostList><LocaleList><Locale Code="All"/></LocaleList><RequiredRuntimeList><RequiredRuntime Name="CSXS" Version="12.0"/></RequiredRuntimeList></ExecutionEnvironment>
<DispatchInfoList><Extension Id="com.artem.subtitle-studio.panel"><DispatchInfo>
<Resources><MainPath>./index.html</MainPath><ScriptPath>./host.jsx</ScriptPath></Resources>
<Lifecycle><AutoVisible>true</AutoVisible></Lifecycle>
<UI><Type>Panel</Type><Menu>Субтитры — Artem</Menu><Geometry><Size><Width>520</Width><Height>850</Height></Size><MinSize><Width>320</Width><Height>400</Height></MinSize></Geometry></UI>
</DispatchInfo></Extension></DispatchInfoList></ExtensionManifest>''',encoding='utf-8')
