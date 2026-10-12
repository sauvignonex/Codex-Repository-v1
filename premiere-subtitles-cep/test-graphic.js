(() => {
  const button=document.getElementById('graphic-test'),status=document.getElementById('graphic-status'),report=document.getElementById('graphic-report');
  let busy=false,mutationStarted=false;
  const decode=line=>line.split('|').map(decodeURIComponent);
  function call(script){return new Promise((resolve,reject)=>{
    if(!window.__adobe_cep__?.evalScript){reject(Error('Открой панель внутри Premiere.'));return;}
    const timer=setTimeout(()=>{status.textContent='Premiere пока не ответил. Операция может ещё выполняться; дождись ответа.';},30000);
    const guarded='(function(){try{return '+script+';}catch(e){return "error|"+encodeURIComponent(String(e)+"; line="+e.line+"; file="+e.fileName);}})()';
    try{window.__adobe_cep__.evalScript(guarded,raw=>{clearTimeout(timer);resolve(String(raw));});}catch(error){clearTimeout(timer);reject(error);}
  });}
  function parse(raw){
    if(raw==='EvalScript error.')throw Error('Premiere вернул EvalScript error. Результат операции неизвестен; повторный импорт заблокирован.');
    const rows=raw.split('\n').map(decode);
    if(rows[0][0]!=='ok')throw Error(rows[0][1]||'Неизвестный ответ Premiere: '+raw);
    return rows;
  }
  async function write(raw,layout,scope="$._artemSubtitleTest",show=true){
    if(layout.role==='speech'){
      await document.fonts.load('500 200px "Cera Pro"');
      const fit=window.subtitleTypography.fitSpeech(layout.speech,layout.size);
      if(!fit.valid)throw Error(fit.reason);
      layout={...layout,speech:fit.text};
    }
    const rows=parse(raw),fields=[];
    const normalized=rows.some(r=>r[0]==='param'&&r[2]==='Масштаб акцента');
    if(!normalized&&(layout.size>100||layout.accentSize>100))throw Error('В старом шаблоне увеличение ограничено. Создай новую секвенцию SRT с исправленным шаблоном.');
    const motionRow=rows.find(r=>r[0]==='param'&&r[2].startsWith('Анимация:'));
    if(!motionRow)throw Error('В шаблоне отсутствует управление анимацией.');
    if(layout.motion==='write'&&!motionRow[2].includes('3 раскрытие'))throw Error('В этом клипе ещё старый шаблон. Для раскрытия рукописной строки создай новую секвенцию SRT.');
    for(const row of rows.slice(1)){
      if(row[0]!=='param')continue;
      try{const v=JSON.parse(row[3]);if(typeof v==='string'){const obj=JSON.parse(v);if(typeof obj.textEditValue==='string')fields.push({index:Number(row[1]),name:row[2],obj});}}catch(_){}
    }
    const texts={'Основной текст':layout.main,'Рукописный акцент':layout.accent,'Текст речи':layout.speech};
    for(const [name,text] of Object.entries(texts)){
      const field=fields.find(f=>f.name===name);if(!field)throw Error('В шаблоне отсутствует '+name);
      field.obj.textEditValue=(text||'').replace(/\n/g,'\r');field.obj.fontTextRunLength=[field.obj.textEditValue.length];field.obj.capPropTextRunCount=1;
      const result=decode(await call(scope+'.setText('+field.index+','+JSON.stringify(encodeURIComponent(JSON.stringify(field.obj)))+')'));
      if(result[0]!=='ok')throw Error(result[1]);
      if(JSON.parse(JSON.parse(result[1])).textEditValue!==field.obj.textEditValue)throw Error('Premiere не подтвердил '+name);
      report.value+='\n'+name+': '+field.obj.textEditValue;
    }
    const numbers={'Роль: 1 заголовок, 2 речь, 3 акцент':({title:1,speech:2,accent:3})[layout.role],[normalized?'Масштаб':'Размер']:normalized?layout.size/2:layout.size,[normalized?'Масштаб акцента':'Размер акцента']:normalized?layout.accentSize/2:layout.accentSize,'Высота':layout.position,'Длительность':layout.duration||6,[motionRow[2]]:({none:0,soft:1,pop:2,write:3})[layout.motion]};
    for(const [name,value] of Object.entries(numbers)){
      const row=rows.find(r=>r[0]==='param'&&r[2]===name);if(!row)throw Error('В шаблоне отсутствует '+name);
      const result=decode(await call(scope+'.setNumber('+Number(row[1])+','+value+')'));
      if(result[0]!=='ok'||Number(result[1])!==value)throw Error('Premiere не подтвердил '+name);
    }
    const colorRow=rows.find(r=>r[0]==='param'&&r[2]==='Цвет');if(!colorRow)throw Error('Параметр цвета отсутствует.');
    const colored=decode(await call(scope+'.setColor('+Number(colorRow[1])+','+JSON.stringify(layout.color)+')'));if(colored[0]!=='ok')throw Error(colored[1]);
    if(layout.timing){const timed=decode(await call(scope+'.setTiming('+layout.timing.start+','+layout.timing.end+')'));if(timed[0]!=='ok')throw Error(timed[1]);report.value+='\nTIMING: '+timed.join(' | ');}
    if(show){const shown=await call(scope+'.show()');if(shown!=='ok')throw Error(decode(shown)[1]||'Не удалось открыть пробный блок.');}
    button.textContent='Обновить пробный блок';
    status.textContent='«'+rows[0][2]+'»: текст и оформление записаны и прочитаны обратно.'+(layout.timing?' Тайминг выбранного SRT применён с точностью до кадра.':' Длительность примера — 6 секунд.');
  }
  button.addEventListener('click',async()=>{
    if(busy)return;
    const layout=window.subtitlePreview.getLayout();
    const cue=window.SubtitleDocument?.getSelected();if(cue){layout.timing=cue;layout.duration=(cue.end-cue.start)/1000;}
    const text=(layout?.valid?layout.text:document.getElementById('ss-text').value.trim()).replace(/\n/g,'\r');
    if(!text||text.length>200){status.textContent='Введи короткий текст блока (до 200 символов).';return;}
    busy=true;button.disabled=true;mutationStarted=false;
    try{
      status.textContent='Проверяем загрузку JSX…';
      report.value='LOAD: '+await window.subtitleHost.ensure();
      let raw=await call('$._artemSubtitleTest.restore()');
      if(raw==='none'){
        status.textContent='Создаём пустую тестовую секвенцию и импортируем шаблон…';
        mutationStarted=true;
        raw=await call('$._artemSubtitleTest.create()');
      }else parse(raw);
      report.value+='\n'+raw;
      mutationStarted=true;
      raw=await call('$._artemSubtitleTest.upgrade()');
      await write(raw,layout);
      busy=false;button.disabled=false;
    }catch(error){
      report.value+='\nERROR: '+error.message;
      if(!mutationStarted){busy=false;button.disabled=false;status.textContent=error.message+' Создание не запускалось.';}
      else status.textContent=error.message+' Операция остановлена. Проверь диагностику перед продолжением.';
    }
  });
  window.subtitleGraphic={call,parse,write,get busy(){return busy;},setBusy(value){busy=value;button.disabled=value;}};
  if(window.__adobe_cep__?.evalScript){
    window.subtitleHost.ensure().then(()=>call('$._artemSubtitleTest.restore()')).then(raw=>{
      if(busy||raw==='none')return;
      const first=parse(raw)[0];
      button.textContent='Обновить пробный блок';
      status.textContent='Найден пробный блок в «'+first[2]+'». Можно обновить его текст.';
    }).catch(error=>{if(!busy){report.value='RESTORE: '+error.message;status.textContent=error.message;}});
  }
})();


