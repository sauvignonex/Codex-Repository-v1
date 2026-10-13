(() => {

  const button=document.getElementById('srt-create-all'),stop=document.getElementById('srt-stop'),update=document.getElementById('srt-update-block'),status=document.getElementById('srt-batch-status');

  let issue=null,running=false,cancel=false,started=false,completed=false,bindingMissing=false,bindingReady=!window.__adobe_cep__?.evalScript;

  const registryKey='artem.subtitle-studio.batch.v1';

  const changed=()=>window.dispatchEvent(new Event('subtitle:batch-change'));

  const signature=cue=>JSON.stringify([cue.text,cue.start,cue.end,['role','size','accentSize','position','color','motion'].map(key=>cue.appearance?.[key])]);

  window.subtitleBatch={signature,getState:()=>{let record=null;try{record=JSON.parse(localStorage.getItem(registryKey)||'null');}catch(_){}return{issue,ready:bindingReady,connected:Boolean(window.__adobe_cep__?.evalScript),busy:running||window.subtitleGraphic.busy||Boolean(window.subtitleTranscription?.busy)||Boolean(window.SubtitleEditorialUI?.busy),canCreate:bindingReady&&!button.disabled,record:bindingReady&&!bindingMissing?record:null};}};

  function invalidateApplied(documentKey,index){
    const record=JSON.parse(localStorage.getItem(registryKey)||'null');
    if(record?.documentKey!==documentKey||!Number.isInteger(index)||index<0||index>=record.completed)throw Error('Связь с клипом изменилась. Запись не начиналась.');
    if(Array.isArray(record.applied))record.applied[index]=null;
    try{localStorage.setItem(registryKey,JSON.stringify(record));changed();}catch(_){throw Error('Не удалось сохранить состояние перед записью. Клип не изменён.');}
  }

  async function checkpoint(appliedIndex,written){

    const row=window.subtitleGraphic.parse(await window.subtitleGraphic.call('$._artemSubtitleBatch.registry()'))[0];

    const record={version:1,documentKey:row[1],projectPath:row[2],sequenceID:row[3],total:Number(row[4]),completed:Number(row[5]),phase:row[6],pending:row[7]==='1',clipID:row[8],clips:row.slice(9)};

    const previous=JSON.parse(localStorage.getItem(registryKey)||'null');record.applied=previous?.sequenceID===record.sequenceID&&Array.isArray(previous.applied)?previous.applied:[];

    if(Number.isInteger(appliedIndex)&&written?.documentKey===record.documentKey&&typeof written.signature==='string')record.applied[appliedIndex]=written.signature;

    try{localStorage.setItem(registryKey,JSON.stringify(record));bindingMissing=false;changed();}catch(_){throw Error('Не удалось сохранить связь с клипами. Операция остановлена. Не закрывай панель.');}

  }

  button.addEventListener('click',async()=>{

    if(running||window.subtitleGraphic.busy||window.subtitleTranscription?.busy||window.SubtitleEditorialUI?.busy)return;

    issue=null;
    started=false;running=true;cancel=false;button.disabled=true;window.subtitleGraphic.setBusy(true);
    try{

    const doc=window.SubtitleDocument.getSnapshot(),settings=window.subtitlePreview.getLayout();

    if(!doc?.cues.length){status.textContent='Сначала открой SRT.';return;}

    if(doc.cues.length>1000){status.textContent='За один пакет поддерживается до 1000 блоков.';return;}

    await document.fonts.load('500 200px "Cera Pro"');
    const current=window.SubtitleDocument.getSnapshot();
    if(current?.id!==doc.id||JSON.stringify(current.cues)!==JSON.stringify(doc.cues))throw Error('Текст или оформление изменились во время подготовки. Повтори создание с актуальными правками.');
    if(cancel){status.textContent='Создание отменено до импорта.';return;}

    const plans=doc.cues.map((cue,index)=>{const style=index===doc.selected?settings:cue.appearance||{...settings,role:'speech'};const plan={...style,...window.subtitleTypography.plan(cue.text,style.role),timing:{start:cue.start,end:cue.end},duration:(cue.end-cue.start)/1000};if(plan.role==='speech'){const fit=window.subtitleTypography.fitSpeech(plan.speech,plan.size);plan.speech=fit.text;plan.fitValid=fit.valid;}else{const lines=plan.role==='title'?[{text:plan.main,hand:false},{text:plan.accent,hand:true}]:[{text:plan.accent,hand:true}];plan.fitValid=lines.filter(l=>l.text).every(l=>200*window.subtitleTypography.highlightGeometry(l.text,l.hand,plan.size,plan.accentSize).scale>=30);}return plan;});

    const invalid=plans.findIndex((p,i)=>!p.text.trim()||p.text.length>200||p.text.split('\n').length>2||!Number.isSafeInteger(p.timing.start)||!Number.isSafeInteger(p.timing.end)||p.timing.start<0||!Number.isFinite(p.duration)||p.duration<.034||p.duration>6||!['title','speech','accent'].includes(p.role)||!['none','soft','pop','write'].includes(p.motion)||!/^#[0-9a-f]{6}$/i.test(p.color)||!Number.isFinite(p.size)||p.size<70||p.size>130||!Number.isFinite(p.accentSize)||p.accentSize<70||p.accentSize>150||!Number.isFinite(p.position)||p.position<28||p.position>74||(i>0&&p.timing.start<plans[i-1].timing.end));

    const unreadable=plans.findIndex(p=>p.fitValid===false);

    if(unreadable>=0){issue='Блок '+(unreadable+1)+': текст слишком длинный для читаемого размера. Сократи его или раздели блок при подготовке текста.';status.textContent=issue;window.SubtitleDocument.select(unreadable);document.getElementById('ss-text').scrollIntoView({block:'center'});changed();return;}

    if(invalid>=0){issue='Проверь блок '+(invalid+1)+': текст до 200 символов, длительность от одного кадра до 6 секунд, тайминги без пересечений.';status.textContent=issue;window.SubtitleDocument.select(invalid);changed();return;}

    stop.hidden=false;

      await window.subtitleHost.ensure();

      const createNew=completed;

      const prepared=await window.subtitleGraphic.call('$._artemSubtitleBatch.prepareBegin('+plans.length+','+JSON.stringify(doc.id)+','+createNew+')');

      if(prepared!=='ok')window.subtitleGraphic.parse(prepared);

      const previousRegistry=localStorage.getItem(registryKey);

      completed=false;

      localStorage.setItem(registryKey,JSON.stringify({version:1,documentKey:doc.id,phase:'intent',pending:true}));

      started=true;

      let raw=await window.subtitleGraphic.call('$._artemSubtitleBatch.begin('+plans.length+','+JSON.stringify(doc.id)+','+createNew+')');

      if(String(raw).split('|')[2]==='unchanged'){if(previousRegistry===null)localStorage.removeItem(registryKey);else localStorage.setItem(registryKey,previousRegistry);started=false;completed=createNew;}

      window.subtitleGraphic.parse(raw);

      await checkpoint();

      for(let i=0;i<plans.length;i++){

        if(i){if(cancel){completed=true;status.textContent='Остановлено после '+i+' блоков. Можно обновлять созданные блоки или создать новую секвенцию. Частичная секвенция сохранена.';break;}raw=await window.subtitleGraphic.call('$._artemSubtitleBatch.append('+i+','+plans[i].timing.start+')');await checkpoint();}

        status.textContent='Создаём блок '+(i+1)+' из '+plans.length+'…';

        await window.subtitleGraphic.write(raw,plans[i],'$._artemSubtitleBatch',false);

        window.subtitleGraphic.parse(await window.subtitleGraphic.call('$._artemSubtitleBatch.commit('+i+')'));

        await checkpoint(i,{documentKey:doc.id,signature:signature(doc.cues[i])});

        if(i===plans.length-1){completed=true;let audioWarning='';if(doc.sourceMedia){try{const audio=await window.subtitleGraphic.call('$._artemSubtitleBatch.addSourceAudio('+JSON.stringify(doc.sourceMedia)+')');if(audio!=='ok')window.subtitleGraphic.parse(audio);}catch(error){audioWarning=' Звук для проверки не добавлен: '+error.message;}}const result=await window.subtitleGraphic.call('$._artemSubtitleBatch.finish()');if(result!=='ok')window.subtitleGraphic.parse(result);completed=true;let playbackMessage='';
          if(document.getElementById('playback-auto')?.checked){
            stop.hidden=true;
            status.textContent='Субтитры созданы. Premiere готовит плавное воспроизведение всех '+plans.length+' блоков…';
            try{
              const prepared=window.subtitleGraphic.parse(await window.subtitleGraphic.call('$._artemSubtitleStudio.renderPlayback('+JSON.stringify(window.subtitleBatch.getState().record?.sequenceID)+')'))[0];
              if(Number(prepared[2])!==plans.length)throw Error('Не подтверждён полный кэш субтитров.');
              playbackMessage=' Кэш всех блоков готов для плавного просмотра.';
            }catch(error){playbackMessage=' Кэш просмотра ещё не готов: '+error.message+' Нажми «Подготовить плавный просмотр», чтобы повторить без создания новых клипов.';}
          }else playbackMessage=' Для плавного просмотра нажми «Подготовить плавный просмотр».';
          status.textContent='Готово: '+plans.length+' редактируемых блоков в отдельной секвенции. Тайминги округлены до кадра.'+audioWarning+playbackMessage;}

      }

    }catch(error){issue=error.message;status.textContent=error.message+(started?' Пакет остановлен; повторный импорт заблокирован, чтобы не создать дубликаты.':'');}

    finally{running=false;stop.hidden=true;window.subtitleGraphic.setBusy(false);if(!started||completed){button.disabled=false;if(completed)button.textContent='Создать новую секвенцию SRT';}stop.disabled=false;stop.textContent='Остановить';changed();}

  });

  stop.addEventListener('click',()=>{cancel=true;stop.disabled=true;stop.textContent='Остановка после текущего блока…';});

  update.addEventListener('click',async()=>{

    if(running||window.subtitleGraphic.busy||window.subtitleTranscription?.busy||window.SubtitleEditorialUI?.busy)return;

    issue=null;

    const doc=window.SubtitleDocument.getSnapshot(),cue=window.SubtitleDocument.getSelected(),layout=window.subtitlePreview.getLayout();

    if(!doc||!cue||!doc.cues[cue.index]||!layout.valid){status.textContent='Выбери корректный блок SRT.';return;}
    const written={documentKey:doc.id,signature:signature(doc.cues[cue.index])};
    const guard=()=>{const current=window.SubtitleDocument.getSnapshot();if(current?.id!==doc.id||current.selected!==cue.index||!current.cues[cue.index]||signature(current.cues[cue.index])!==written.signature)throw Error('Выбранный блок изменился во время подготовки. Повтори обновление с актуальными правками.');};

    running=true;update.disabled=true;window.subtitleGraphic.setBusy(true);

    try{

      await window.subtitleHost.ensure();
      guard();

      const raw=await window.subtitleGraphic.call('$._artemSubtitleBatch.select('+cue.index+','+JSON.stringify(doc.id)+')');

      window.subtitleGraphic.parse(raw);

      await window.subtitleGraphic.write(raw,{...layout,timing:cue,duration:(cue.end-cue.start)/1000},'$._artemSubtitleBatch',true,guard,()=>invalidateApplied(doc.id,cue.index));

      await checkpoint(cue.index,written);

      const current=window.SubtitleDocument.getSnapshot(),saved=window.SubtitleDocument.save();
      status.textContent='Блок '+(cue.index+1)+' обновлён в созданной секвенции. Новый клип не импортировался.'+(current?.id!==doc.id||!current.cues[cue.index]||signature(current.cues[cue.index])!==written.signature?' Новые правки в панели ещё не записаны.':'')+(saved?'':' Не удалось сохранить панель; не закрывай её до сохранения.');

    }catch(error){try{const binding=window.subtitleGraphic.parse(await window.subtitleGraphic.call('$._artemSubtitleBatch.verifyBinding()'))[0];if(binding[1]!=='present'){bindingMissing=true;completed=true;button.disabled=false;}}catch(_){}issue=error.message;status.textContent=error.message;document.getElementById('ss-status').textContent='Не удалось обновить блок '+(cue.index+1)+': '+error.message;}

    finally{running=false;update.disabled=false;window.subtitleGraphic.setBusy(false);changed();}

  });
  document.getElementById('srt-update-corrections').addEventListener('click',async()=>{
    if(running||window.subtitleGraphic.busy||window.subtitleTranscription?.busy||window.SubtitleEditorialUI?.busy)return;
    const doc=SubtitleDocument.getSnapshot(),state=subtitleBatch.getState(),record=state.record;
    if(!doc||record?.documentKey!==doc.id||record.pending||!['ready','complete'].includes(record.phase)){status.textContent='Нет связи исправленных фраз с клипами. Создай отдельную секвенцию.';return;}
    const indices=(doc.correctionPending||[]).filter(i=>Number.isInteger(i)&&i>=0&&i<record.completed&&Boolean(doc.cues[i])&&!['title','accent'].includes(doc.cues[i]?.appearance?.role)&&record.applied?.[i]!==signature(doc.cues[i]));
    if(!indices.length)return;
    // Preflight every correction before touching any native clip.
    try{for(const i of indices){SubtitleDocument.select(i);if(!subtitlePreview.getLayout().valid)throw Error('Блок '+(i+1)+': исправленный текст слишком длинный. Сократи его перед записью.');}}
    catch(error){issue=error.message;status.textContent=error.message;changed();return;}
    running=true;issue=null;window.subtitleGraphic.setBusy(true);
    try{
      await subtitleHost.ensure();
      for(let n=0;n<indices.length;n++){
        const i=indices[n];SubtitleDocument.select(i);const cue=SubtitleDocument.getSelected(),layout=subtitlePreview.getLayout();
        const written={documentKey:doc.id,signature:signature(doc.cues[i])};
        const guard=()=>{const current=SubtitleDocument.getSnapshot();if(current?.id!==doc.id||current.selected!==i||!current.cues[i]||signature(current.cues[i])!==written.signature||['title','accent'].includes(current.cues[i].appearance?.role))throw Error('Фраза или её оформление изменились во время записи. Запись остальных исправлений остановлена.');};
        guard();
        status.textContent='Записываем исправление '+(n+1)+' из '+indices.length+'…';
        const raw=await subtitleGraphic.call('$._artemSubtitleBatch.select('+i+','+JSON.stringify(doc.id)+')');subtitleGraphic.parse(raw);
        await subtitleGraphic.write(raw,{...layout,timing:cue,duration:(cue.end-cue.start)/1000},'$._artemSubtitleBatch',true,guard,()=>invalidateApplied(doc.id,i));await checkpoint(i,written);
      }
      const latest=SubtitleDocument.getSnapshot(),newEdits=latest?.id!==doc.id||indices.some(i=>!latest.cues[i]||signature(latest.cues[i])!==signature(doc.cues[i]));
      status.textContent='Записано исправлений речи: '+indices.length+'. Хайлайты и тайминги сохранены. Новые клипы не импортировались.'+(newEdits?' Новые правки в панели ещё не записаны.':'');
    }catch(error){issue=error.message;status.textContent='Запись исправлений остановлена: '+error.message+'. Подтверждённые правки сохранены.';}
    finally{if(SubtitleDocument.getSnapshot()?.id===doc.id)SubtitleDocument.select(doc.selected);running=false;window.subtitleGraphic.setBusy(false);changed();}
  });

  if(window.__adobe_cep__?.evalScript){button.disabled=true;window.subtitleHost.ensure().then(async()=>{

    let raw=await window.subtitleGraphic.call('$._artemSubtitleBatch.status()');

    const row=window.subtitleGraphic.parse(raw)[0];

    if(row[3]==='idle'){

      const stored=localStorage.getItem(registryKey);

      if(stored){raw=await window.subtitleGraphic.call('$._artemSubtitleBatch.restoreRegistry('+JSON.stringify(JSON.parse(stored))+')');window.subtitleGraphic.parse(raw);const binding=window.subtitleGraphic.parse(await window.subtitleGraphic.call('$._artemSubtitleBatch.verifyBinding()'))[0];bindingMissing=binding[1]!=='present';}

    }else if(row[3]==='complete'||row[3]==='ready'){

      const binding=window.subtitleGraphic.parse(await window.subtitleGraphic.call('$._artemSubtitleBatch.verifyBinding()'))[0];bindingMissing=binding[1]!=='present';

      const detached=bindingMissing;await checkpoint();bindingMissing=detached;

    }

    return raw;

  }).then(raw=>{

    if(running||started)return;

    bindingReady=true;

    const row=window.subtitleGraphic.parse(raw)[0];

    if(row[3]==='idle')button.disabled=false;

    if(row[3]!=='idle'){completed=row[3]==='complete'||row[3]==='ready';button.disabled=!completed;if(completed)button.textContent='Создать новую секвенцию SRT';status.textContent=row[3]==='complete'?'Созданы '+row[1]+' блоков. Можно обновить выбранный блок или создать новую секвенцию.':'Предыдущий пакет: '+row[1]+' из '+row[2]+'. '+(completed?'Созданные блоки можно обновить или создать новую секвенцию.':'Проверь созданную секвенцию перед продолжением.');}

    if(bindingMissing)status.textContent='Клипы предыдущего набора изменены или удалены. Фразы сохранены; можно создать новую секвенцию.';

    changed();

  }).catch(error=>{if(!running){bindingReady=true;bindingMissing=true;issue=error.message;button.disabled=true;status.textContent=error.message;changed();}});}

})();

