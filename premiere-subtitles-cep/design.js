(() => {
  const buttons=[...document.querySelectorAll('[data-stage]')],panes=[...document.querySelectorAll('[data-pane]')];
  let stage='source';
  function select(value){
    stage=value;
    for(const button of buttons){const active=button.dataset.stage===value;button.setAttribute('aria-selected',String(active));if(active)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');}
    for(const pane of panes){const active=pane.dataset.pane===value;pane.classList.toggle('inactive-pane',!active);pane.inert=!active;pane.setAttribute('aria-hidden',String(!active));}
    document.querySelector('.studio').dataset.stage=value;
    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('subtitle:stage-change'));
  }
  buttons.forEach((button,i)=>{button.addEventListener('click',()=>select(button.dataset.stage));button.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();const target=buttons[(i+(e.key==='ArrowRight'?1:buttons.length-1))%buttons.length];target.focus();select(target.dataset.stage);});});
  window.addEventListener('subtitle:document-change',()=>{if(stage==='source'&&window.SubtitleDocument?.getSnapshot())select('text');});
  window.addEventListener('subtitle:review-open',()=>select('text'));
  let hadDraft=!document.getElementById('editorial-draft').hidden;
  new MutationObserver(()=>{const pending=!document.getElementById('editorial-draft').hidden;if(pending&&!hadDraft)select('text');if(!pending&&hadDraft)select('style');hadDraft=pending;}).observe(document.getElementById('editorial-draft'),{attributes:true,attributeFilter:['hidden']});
  document.getElementById('scenario-open').addEventListener('click',()=>select('text'));
  document.getElementById('design-review').addEventListener('click',()=>select('text'));
  document.getElementById('design-finish').addEventListener('click',()=>select('finish'));
  document.getElementById('design-style').addEventListener('click',()=>select('style'));
  document.getElementById('finish-edit').addEventListener('click',()=>select(window.SubtitleDocument?.getSnapshot()?'style':'source'));
  let making=false;
  function summary(){
    const review=window.SubtitleEditorialUI?.getReviewSnapshot(),current=window.SubtitleDocument?.getSnapshot(),doc=review||current,batch=subtitleBatch.getState();
    document.querySelector('.source').hidden=!current||stage==='style'||stage==='finish';
    document.getElementById('finish-edit').textContent=current?'Вернуться к оформлению':'Выбрать источник';
    const stale=review&&(review.sourceID||null)!==(current?.id||null);
    let output=doc?.cues||[],splitError='';try{output=SubtitlePhrases.prepare(output);}catch(e){splitError=e.message;}
    const error=splitError||window.SubtitleEditorialUI?.timingError||(stale?'Проверка относится к другому набору. Вернись к тексту и подготовь текущий набор заново.':'');
    document.getElementById('finish-name').textContent=doc?.name||'Текст ещё не загружен';
    document.getElementById('finish-count').textContent=doc?'Блоков: '+output.length+' · Смысловых акцентов: '+output.filter(c=>['title','accent'].includes(c.appearance?.role)).length:'Сначала распознай речь или открой SRT.';
    document.getElementById('finish-review').textContent=error||(!batch.connected?'Запись доступна в панели Premiere.':review?'Будут использованы фразы из текущей проверки. Кнопка применит их и создаст субтитры.':'Текущее оформление сохранено в панели.');
    document.getElementById('finish-make').disabled=making||!doc||Boolean(error)||batch.busy||!batch.connected||!batch.ready||!batch.canCreate;
    const progress=document.getElementById('srt-batch-status').textContent;
    if(batch.issue)document.getElementById('finish-make-status').textContent=batch.issue;
    else if(batch.busy||/^(Готово:|Остановлено)/.test(progress))document.getElementById('finish-make-status').textContent=progress;
  }
  document.getElementById('finish-make').addEventListener('click',async()=>{
    const status=document.getElementById('finish-make-status');if(making)return;making=true;summary();
    try{
      const batch=subtitleBatch.getState();if(!batch.connected||!batch.ready||!batch.canCreate||batch.busy)throw Error('Запись пока недоступна. Проверь сообщение внизу.');
      if(!document.getElementById('editorial-draft').hidden){document.getElementById('editorial-apply').click();if(!document.getElementById('editorial-draft').hidden)throw Error(document.getElementById('editorial-status').textContent||'Не удалось применить проверку текста.');await Promise.resolve();select('finish');}
      if(!SubtitleDocument.getSnapshot()?.cues.length)throw Error('Сначала распознай речь или открой SRT.');
      const current=SubtitleDocument.getSnapshot(),words=SubtitlePhrases.prepare(current.cues);if(JSON.stringify(words)!==JSON.stringify(current.cues))SubtitleDocument.replacePrepared(words);
      status.textContent='Подготавливаем запись…';
      for(let i=0;i<50&&!subtitleBatch.getState().ready;i++)await new Promise(r=>setTimeout(r,100));
      const ready=subtitleBatch.getState();if(!ready.ready||!ready.canCreate||ready.busy)throw Error('Создание заблокировано. Проверь сообщение внизу.');
      document.getElementById('srt-create-all').click();status.textContent='Создание запущено. Ход записи показан внизу.';
    }catch(e){status.textContent=e.message;}finally{making=false;summary();}
  });
  for(const name of ['subtitle:document-change','subtitle:draft-change','subtitle:stage-change','subtitle:batch-change'])window.addEventListener(name,summary);
  new MutationObserver(summary).observe(document.getElementById('srt-batch-status'),{childList:true,characterData:true,subtree:true});
  summary();
  window.SubtitleDesign={select,get stage(){return stage;}};
  select(!document.getElementById('editorial-draft').hidden?'text':window.SubtitleDocument?.getSnapshot()?'style':'source');
})();
