(() => {
  const q=id=>document.getElementById(id),key='artem.subtitle-studio.transcription.v1';
  let job=null,pid=null,timer=null,busy=false,choosing=false;
  const message=text=>q('transcription-status').textContent=text;
  const notify=()=>window.dispatchEvent(new Event('subtitle:batch-change'));
  function setBusy(value){busy=value;q('transcription-browse').disabled=value;q('transcription-file').disabled=value;q('transcription-cancel').hidden=!value;notify();}
  const root=()=>decodeURI(window.__adobe_cep__.getSystemPath('extension')).replace(/^file:\/\/\//,'').replace(/\\/g,'/').replace(/\/$/,'');
  function read(path){const result=window.cep.fs.readFile(path);if(result.err!==0)throw Error('Не удалось прочитать '+path);return JSON.parse(result.data.replace(/^\ufeff/,''));}
  function write(path,data){const result=window.cep.fs.writeFile(path,JSON.stringify(data));if(result.err!==0)throw Error('Не удалось сохранить задание распознавания.');}
  function stop(){clearTimeout(timer);timer=null;setBusy(false);}
  async function poll(){
    if(!job)return;
    try{
      const result=window.cep.fs.readFile(job.folder+'/status.json');
      if(result.err===0){
        const status=JSON.parse(result.data.replace(/^\ufeff/,''));
        if(status.id!==job.id)throw Error('Ответ относится к другому заданию.');
        message(status.message+(Number.isFinite(status.progress)?' '+status.progress+'%':''));
        if(['error','cancelled'].includes(status.phase)){stop();return;}
        if(status.phase==='complete'){
          stop();
          if(window.subtitleGraphic.busy)throw Error('Заверши запись в Premiere, затем открой готовое распознавание ещё раз.');
          const cues=SubtitlePhrases.fromWords(status.words,subtitleTypography.fitSpeech);
          window.SubtitleEditorialUI.reviewTranscript(cues,status.name,status.previewMedia||job.input||read(job.folder+'/job.json').input,status.id);
          message('Распознано '+cues.length+' фраз. Проверь текст ниже и нажми «Использовать фразы». Текущий набор пока сохранён.');
          job.phase='complete';write(job.folder+'/ui.json',job);localStorage.setItem(key,JSON.stringify(job));
          return;
        }
      }
      if(pid!==null){const running=window.cep.process.isRunning(pid);if(running.err===0&&running.data===false)throw Error('Движок остановился без результата. Текущий набор сохранён; повтори распознавание.');}
      if(Date.now()-job.created>3600000)throw Error('Распознавание слишком долго выполняется. Отмени и выбери короткий фрагмент.');
      timer=setTimeout(poll,700);
    }catch(error){stop();message(error.message);}
  }
  async function start(path,selection=null){
    if(busy||window.subtitleGraphic.busy||window.SubtitleEditorialUI?.busy)throw Error('Дождись текущей операции.');
    if(!window.cep?.process||!window.__adobe_cep__?.getSystemPath)throw Error('Открой панель в Premiere для распознавания.');
    if(typeof path!=='string'||!path)throw Error('Выбери аудио или видео.');
    const config=window.SubtitleEngineConfig.read('speech');
    const base=decodeURI(window.__adobe_cep__.getSystemPath('userData')).replace(/^file:\/\/\//,'').replace(/\\/g,'/').replace(/\/$/,'')+'/SubtitleStudio';
    for(const folder of [base,base+'/jobs']){if(window.cep.fs.stat(folder).err!==0&&window.cep.fs.makedir(folder).err!==0)throw Error('Не удалось создать папку распознавания.');}
    const id=crypto.randomUUID(),folder=base+'/jobs/'+id;
    if(window.cep.fs.makedir(folder).err!==0)throw Error('Не удалось сохранить новое задание.');
    job={id,folder,input:path,selection,created:Date.now(),phase:'running'};write(folder+'/job.json',{id,input:path,selection,language:q('transcription-language').value});write(folder+'/ui.json',job);localStorage.setItem(key,JSON.stringify(job));
    let process;pid=null;
    try{process=window.cep.process.createProcess(config.python,root()+'/transcription-worker.py',folder+'/job.json');if(process.err!==0)throw Error('Не удалось запустить локальное распознавание.');}
    catch(error){job.phase='error';try{write(folder+'/ui.json',job);localStorage.setItem(key,JSON.stringify(job));}catch(_){try{localStorage.removeItem(key);}catch(ignore){}}throw error;}
    pid=process.data;setBusy(true);message(selection?'Распознаём выделенный клип «'+selection.name+'»…':'Запускаем локальное распознавание…');timer=setTimeout(poll,500);
  }
  async function recognize(fromFile=false){
    if(busy||choosing)return;
    choosing=true;q('transcription-browse').disabled=true;q('transcription-file').disabled=true;
    try{
      if(!window.cep?.fs)throw Error('Выбор аудио доступен в панели Premiere.');
      if(window.subtitleGraphic.busy||window.SubtitleEditorialUI?.busy)throw Error('Дождись текущей операции.');
      if(!fromFile){
        await window.subtitleHost.ensure();
        const raw=await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Premiere не ответил. Повтори распознавание.')),10000);window.__adobe_cep__.evalScript('$._artemSubtitleStudio.selectedAudio()',value=>{clearTimeout(timeout);resolve(value);});});
        const row=String(raw).split('|').map(decodeURIComponent);
        if(row[0]!=='ok')throw Error(row[1]||'Не удалось прочитать выделенный аудиоклип.');
        if(row[1]==='clip'){
          const selection={sourceInMs:Number(row[3]),durationMs:Number(row[4]),timelineStartMs:Number(row[5]),name:row[6],sequenceID:row[7]};
          if(![selection.sourceInMs,selection.durationMs,selection.timelineStartMs].every(Number.isFinite)||selection.sourceInMs<0||selection.durationMs<=0||selection.timelineStartMs<0)throw Error('Некорректные границы аудиоклипа.');
          await start(row[2],selection);return;
        }
        if(row[1]!=='none')throw Error('Неизвестный ответ Premiere.');
      }
      const picked=window.cep.fs.showOpenDialog(false,false,'Аудио или видео для субтитров','',['wav','mp3','m4a','aac','flac','ogg','mp4','mov','mkv','webm']);
      if(picked.err!==0)throw Error('Не удалось открыть выбор файла.');
      if(picked.data?.[0])await start(picked.data[0]);
    }catch(error){stop();message(error.message);}
    finally{choosing=false;q('transcription-browse').disabled=busy;q('transcription-file').disabled=busy;}
  }
  q('transcription-browse').addEventListener('click',()=>recognize());
  q('transcription-file').addEventListener('click',()=>recognize(true));
  q('transcription-cancel').addEventListener('click',()=>{if(!job||!busy)return;const result=window.cep.fs.writeFile(job.folder+'/cancel','cancel');if(result.err!==0){message('Не удалось отменить задание. Дождись результата.');return;}message('Отменяем распознавание…');});
  window.addEventListener('subtitle:document-change',()=>{if(job?.phase==='complete'){job.phase='used';try{localStorage.setItem(key,JSON.stringify(job));}catch(_){} }});
  window.subtitleTranscription={start,recognize,get busy(){return busy||choosing;}};
  // A reopened panel resumes the same job, never starts a second recognition process.
  try{const saved=JSON.parse(localStorage.getItem(key)||'null');if(saved&&window.cep?.fs){const base=decodeURI(window.__adobe_cep__.getSystemPath('userData')).replace(/^file:\/\/\//,'').replace(/\\/g,'/').replace(/\/$/,'')+'/SubtitleStudio/jobs/';if(typeof saved.id==='string'&&/^[a-f0-9-]{36}$/.test(saved.id)&&saved.folder===base+saved.id){job=saved;if(job.phase==='running'||job.phase==='complete'){if(job.phase==='running')setBusy(true);timer=setTimeout(poll,500);}else message('Последнее распознавание сохранено. Можно выбрать новый файл.');}}}catch(_){message('Выбери аудио или видео для нового распознавания.');}
})();
