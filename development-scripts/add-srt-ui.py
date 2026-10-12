from pathlib import Path
p=Path('outputs/premiere-subtitles-cep/index.html')
s=p.read_text(encoding='utf-8')
s=s.replace('CEP · 0.1','CEP · 0.2')
marker='    <div class="workspace">'
assert s.count(marker)==1
s=s.replace(marker,'''    <section class="srt-import" aria-label="Импорт SRT">
      <div class="row"><label class="label" for="srt-file">Открыть SRT</label><select id="srt-encoding" aria-label="Кодировка SRT"><option value="utf-8">UTF-8 (обычно)</option><option value="windows-1251">Windows-1251</option></select></div>
      <input id="srt-file" type="file" accept=".srt" aria-label="Выбрать файл SRT">
      <p id="srt-status" role="status" aria-live="polite">Тайминги сохраняются. Правки текста хранятся локально в панели.</p>
      <div id="srt-editor" hidden><div class="label" id="srt-summary"></div><label for="srt-cues">Блок субтитров</label><select id="srt-cues"></select><p id="srt-time"></p><div class="row"><button id="srt-prev" type="button">← Предыдущий</button><button id="srt-next" type="button">Следующий →</button></div><details><summary>Исходный текст</summary><p id="srt-original"></p><button id="srt-reset" type="button">Восстановить текст блока</button></details></div>
    </section>
'''+marker)
s=s.replace('<script src="bridge.js"></script>','<script src="bridge.js"></script><script src="srt.js"></script><script src="srt-ui.js"></script>')
# Bundled icons, no network or icon library dependency.
icons={'captions':'<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M6 10h4m4 0h4M6 14h12"/>','file-text':'<path d="M6 3h8l4 4v14H6zM9 12h6m-6 4h6"/>','play':'<path d="m8 4 12 8-12 8z"/>','sparkles':'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/>'}
for name,paths in icons.items():
    s=s.replace(f'<i data-lucide="{name}" aria-hidden="true"></i>',f'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">{paths}</svg>')
p.write_text(s,encoding='utf-8')
css=Path('outputs/premiere-subtitles-cep/panel.css')
css.write_text(css.read_text(encoding='utf-8')+'\n#subtitle-studio-preview .srt-import{border:1px solid var(--line);padding:12px;border-radius:9px;margin-bottom:18px} #subtitle-studio-preview #srt-file{max-width:100%} #srt-encoding{max-width:180px} #srt-status,#srt-original{white-space:pre-wrap;overflow-wrap:anywhere} #srt-status,#srt-time{font-size:12px;color:var(--dim)} #srt-summary{overflow-wrap:anywhere}\n',encoding='utf-8')
m=Path('outputs/premiere-subtitles-cep/CSXS/manifest.xml')
m.write_text(m.read_text(encoding='utf-8').replace('0.1.0','0.2.0'),encoding='utf-8')
