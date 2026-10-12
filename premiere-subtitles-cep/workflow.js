(() => {
  const q=id=>document.getElementById(id),next=q('workflow-next'),note=q('workflow-status');
  let action='srt-browse';
  const text=(element,value)=>{if(element.textContent!==value)element.textContent=value;};
  function refresh(){
    const doc=window.SubtitleDocument?.getSnapshot(),batch=window.subtitleBatch.getState(),record=batch.record;
    const stage=window.SubtitleDesign?.stage;
    const bound=Boolean(doc&&record?.documentKey===doc.id&&!record.pending&&['ready','complete'].includes(record.phase)&&doc.selected<record.completed);
    next.hidden=stage==='finish'&&(!bound||!q('editorial-draft').hidden);
    q('srt-create-all').hidden=stage!=='finish'||!bound||batch.busy||!batch.canCreate;
    q('ss-headlines').disabled=!doc||batch.busy;
    q('srt-update-block').disabled=!bound||batch.busy||!batch.connected;
    if(!q('editorial-draft').hidden&&!batch.busy){if(stage==='finish'){action='design-review';text(next,'Завершить проверку текста');text(note,'Кнопка «Сделать субтитры» выше применит текущие фразы и создаст отдельную секвенцию.');next.disabled=false;return;}action='editorial-apply';text(next,'Использовать '+q('editorial-review').querySelectorAll('textarea').length+' фраз');text(note,window.SubtitleEditorialUI?.timingError||'Проверь предложения выше. Кнопка применит их в панели; затем можно создать субтитры в Premiere.');next.disabled=q('editorial-apply').disabled;return;}
    if(!doc){action='srt-browse';text(next,'Выбрать SRT');text(note,'Распознай аудио или открой SRT, затем проверь фразы и оформление.');next.disabled=batch.busy;return;}
    if(batch.busy){text(next,window.subtitleTranscription?.busy?'Распознаём речь…':window.SubtitleEditorialUI?.busy?'Выбираем темы…':'Записываем в Premiere…');text(note,window.subtitleTranscription?.busy?q('transcription-status').textContent:window.SubtitleEditorialUI?.busy?q('editorial-status').textContent:q('srt-batch-status').textContent);next.disabled=true;return;}
    if(stage&&stage!=='finish'){action=stage==='text'||stage==='source'?'design-style':'design-finish';text(next,action==='design-style'?'Далее: оформление':'Далее: сделать субтитры');text(note,'Правки сохраняются в панели. Запись в Premiere — на последнем шаге.');next.disabled=false;return;}
    if(!batch.connected){text(next,'Открой панель в Premiere');text(note,'Предпросмотр доступен. Запись на таймлайн работает в панели Premiere.');next.disabled=true;return;}
    if(!batch.ready){text(next,'Проверяем связь с клипами…');text(note,q('srt-batch-status').textContent);next.disabled=true;return;}
    if(bound){const corrections=(doc.correctionPending||[]).filter(i=>Number.isInteger(i)&&i>=0&&i<record.completed&&!['title','accent'].includes(doc.cues[i]?.appearance?.role)&&record.applied?.[i]!==window.subtitleBatch.signature(doc.cues[i]));if(corrections.length){action='srt-update-corrections';text(next,'Записать '+corrections.length+' исправлений речи');text(note,batch.issue||'Обновятся только исправленные блоки речи. Хайлайты и тайминги сохранятся.');next.disabled=false;return;}action='srt-update-block';text(next,'Обновить блок '+(doc.selected+1)+' в Premiere');const applied=record.applied?.[doc.selected],current=window.subtitleBatch.signature(doc.cues[doc.selected]);text(note,batch.issue|| (applied===current?'Блок записан в Premiere. Можно изменить текст или оформление и обновить его ещё раз.':applied?'Правки этого блока ещё не записаны в Premiere. Кнопка обновит существующий клип.':'Блок связан с клипом. Кнопка запишет текущее оформление и откроет его в Program.'));next.disabled=!window.subtitlePreview.getLayout().valid;}
    else{action='srt-create-all';text(next,'Сделать субтитры · '+doc.cues.length+' блоков');text(note,batch.issue||(batch.canCreate?(q('srt-batch-status').textContent.includes('изменены или удалены')?q('srt-batch-status').textContent:'Кнопка создаст отдельную секвенцию с этим набором.'):q('srt-batch-status').textContent));next.disabled=!batch.canCreate;}
  }
  next.addEventListener('click',()=>{if(next.disabled)return;q(action).click();refresh();});
  for(const event of ['subtitle:block-change','subtitle:document-change','subtitle:batch-change','subtitle:draft-change','subtitle:stage-change'])window.addEventListener(event,()=>queueMicrotask(refresh));
  document.addEventListener('change',()=>queueMicrotask(refresh));
  new MutationObserver(refresh).observe(q('srt-batch-status'),{childList:true,characterData:true,subtree:true});
  new MutationObserver(refresh).observe(q('srt-status'),{childList:true,characterData:true,subtree:true});
  new MutationObserver(refresh).observe(q('editorial-draft'),{attributes:true,attributeFilter:['hidden'],childList:true,subtree:true});
  refresh();
})();
