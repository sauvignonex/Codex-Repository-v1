from pathlib import Path
import re
source=Path('C:/Users/Artem/.codex/visualizations/2026/10/12/01a12f77-4800-7460-855a-5cbc1f247b7f/subtitle-panel.html')
js=Path('outputs/plugin-ui-v3/panel.js').read_text(encoding='utf-8')
html=source.read_text(encoding='utf-8')
html,count=re.subn(r'<script>.*?</script>',lambda _: '<script>\n'+js+'\n</script>',html,flags=re.S)
assert count==1
source.write_text(html,encoding='utf-8')
Path('outputs/plugin-ui-v3/panel-source.html').write_text(html,encoding='utf-8')
