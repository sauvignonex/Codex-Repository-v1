(() => {
  const byId=id=>document.getElementById(id),key='artem.subtitle-studio.document.v1';
  let doc=null,selected=0,loading=false,timer,request=0;
  const status=text=>{byId('srt-status').textContent=text;};
  byId('srt-browse').addEventListener('click',()=>byId('srt-file').click());
  function save(){
    clearTimeout(timer);
    try{localStorage.setItem(key,JSON.stringify({doc,selected}));return true;}
    catch(_){status('Не удалось сохранить SRT локально. Текущие изменения остаются в открытой панели.');return false;}
  }
  function list(){
    const select=byId('srt-cues');select.replaceChildren();
    if(!doc)return;
    const fragment=document.createDocumentFragment();
    doc.cues.forEach((cue,index)=>{const option=document.createElement('option');option.value=String(index);option.textContent=(index+1)+'. '+SubtitleSRT.format(cue.start)+' · '+cue.text.replace(/\n/g,' ').slice(0,60);fragment.append(option);});
    select.append(fragment);select.value=String(selected);
  }
  function display(){
    byId('srt-editor').hidden=!doc;
    if(!doc)return;
    const cue=doc.cues[selected];loading=true;
    document.querySelector('.samples').hidden=true;
    byId('ss-headlines').disabled=false;byId('ss-headlines').title='Подготовить фразы и предложить смысловые заголовки локально.';
    byId('ss-ai-review').hidden=true;byId('ss-headlines').setAttribute('aria-expanded','false');
    if(!cue.appearance)cue.appearance=selected===0?window.SubtitlePanel.getSettings():{role:'speech',size:100,accentSize:100,position:50,color:'#ffffff',motion:'soft'};
    try{window.SubtitlePanel.setText(cue.text,doc.name,cue.appearance);cue.appearance=window.SubtitlePanel.getSettings();}finally{loading=false;}
    byId('srt-cues').value=String(selected);
    byId('srt-time').textContent=SubtitleSRT.format(cue.start)+' → '+SubtitleSRT.format(cue.end)+' · '+((cue.end-cue.start)/1000).toFixed(3)+' с';
    byId('srt-original').textContent=cue.originalText;
    byId('srt-prev').disabled=selected===0;byId('srt-next').disabled=selected===doc.cues.length-1;
    byId('srt-summary').textContent=doc.name+' · '+doc.cues.length+' блоков';
  }
  function select(index){if(!doc||!Number.isInteger(index)||index<0||index>=doc.cues.length)return;selected=index;display();save();}
  byId('srt-cues').addEventListener('change',e=>select(Number(e.target.value)));
  byId('srt-prev').addEventListener('click',()=>select(selected-1));byId('srt-next').addEventListener('click',()=>select(selected+1));
  byId('srt-reset').addEventListener('click',()=>{if(!doc)return;doc.cues[selected].text=doc.cues[selected].originalText;list();display();save();status('Исходный текст блока восстановлен.');});
  window.addEventListener('subtitle:block-change',e=>{
    if(!doc||loading)return;
    const cue=doc.cues[selected];if(cue.text===e.detail.text&&JSON.stringify(cue.appearance)===JSON.stringify(e.detail.appearance))return;
    cue.text=e.detail.text;
    if(cue.spokenText&&e.detail.appearance.role==='speech')cue.spokenText=e.detail.text;
    cue.appearance={...e.detail.appearance};
    byId('srt-cues').options[selected].textContent=(selected+1)+'. '+SubtitleSRT.format(cue.start)+' · '+cue.text.replace(/\n/g,' ').slice(0,60);
    clearTimeout(timer);timer=setTimeout(()=>{if(save())status('Правки сохранены локально. Тайминги не изменены.');},300);
  });
  window.addEventListener('pagehide',()=>{if(doc)save();});
  const documentID=()=>typeof crypto.randomUUID==='function'?crypto.randomUUID():Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
  function replacePrepared(cues){
    if(!doc||window.subtitleGraphic?.busy)throw Error('Дождись завершения записи в Premiere.');
    if(!Array.isArray(cues)||!cues.length||cues.some(c=>!Number.isSafeInteger(c.start)||!Number.isSafeInteger(c.end)||c.end<=c.start||typeof c.text!=='string'||!c.text.trim()))throw Error('Некорректные фразы.');
    const previous=JSON.parse(JSON.stringify(doc));
    doc={...doc,id:documentID(),cues,previous};selected=0;list();display();save();
    window.dispatchEvent(new Event('subtitle:document-change'));
    status('Подготовлено '+cues.length+' фраз. Создай новую секвенцию SRT, чтобы записать их в Premiere.');
  }
  function importTranscript(cues,name,sourceMedia){
    if(window.subtitleGraphic?.busy)throw Error('Дождись завершения записи в Premiere.');
    if(!Array.isArray(cues)||!cues.length||cues.some(c=>!Number.isSafeInteger(c.start)||!Number.isSafeInteger(c.end)||c.start<0||c.end<=c.start||typeof c.text!=='string'||!c.text.trim()))throw Error('Некорректное распознавание.');
    const previous=doc?JSON.parse(JSON.stringify(doc)):null;
    doc={id:documentID(),name:name+' — распознано',sourceMedia,cues,previous};selected=0;list();display();save();window.dispatchEvent(new Event('subtitle:document-change'));
    status('Распознано '+cues.length+' фраз. Проверь имена и синхронизацию перед созданием.');
  }
  function correctText(cues){
    if(!doc||window.subtitleGraphic?.busy)throw Error('Дождись завершения записи в Premiere.');
    if(!Array.isArray(cues)||cues.length!==doc.cues.length||cues.some((c,i)=>c.start!==doc.cues[i].start||c.end!==doc.cues[i].end||typeof c.text!=='string'||!c.text.trim()))throw Error('Сверка не должна менять количество блоков и тайминги.');
    if(cues.some((c,i)=>['title','accent'].includes(doc.cues[i].appearance?.role)&&JSON.stringify(c)!==JSON.stringify(doc.cues[i])))throw Error('Сверка не должна менять хайлайты.');
    const previous=JSON.parse(JSON.stringify(doc)),correctionPending=cues.flatMap((c,i)=>!['title','accent'].includes(c.appearance?.role)&&c.text!==doc.cues[i].text?[i]:[]);doc={...doc,cues,previous,correctionPending:[...new Set([...(doc.correctionPending||[]),...correctionPending])]};list();display();save();window.dispatchEvent(new Event('subtitle:document-change'));
    status('Исправления сохранены в панели. Связь с клипами и тайминги сохранены; запись в Premiere выполняется основной кнопкой.');
  }
  window.SubtitleDocument={select,replacePrepared,importTranscript,correctText,attachSourceMedia(path){if(doc&&typeof path==='string'){doc.sourceMedia=path;save();}},undoPreparation:()=>{if(!doc?.previous||window.subtitleGraphic?.busy)return;doc=doc.previous;selected=0;list();display();save();window.dispatchEvent(new Event('subtitle:document-change'));status('Предыдущий набор восстановлен.');},save:()=>doc?save():true,getSelected:()=>doc?{...doc.cues[selected],index:selected}:null,getSnapshot:()=>doc?{id:doc.id,name:doc.name,sourceMedia:doc.sourceMedia,correctionPending:doc.correctionPending,selected,cues:doc.cues.map(c=>({...c,appearance:c.appearance?{...c.appearance}:null}))}:null};
  byId('srt-file').addEventListener('change',async e=>{
    const file=e.target.files[0];if(!file)return;
    const currentRequest=++request,encoding=byId('srt-encoding').value;
    status('Читаем файл…');
    try{
      if(file.size>4000000)throw Error('Файл больше 4 МБ. Выбери меньший SRT.');
      const data=await file.arrayBuffer();if(currentRequest!==request)return;
      const bytes=new Uint8Array(data);
      const detected=bytes[0]===255&&bytes[1]===254?'utf-16le':bytes[0]===254&&bytes[1]===255?'utf-16be':encoding;
      let text;try{text=new TextDecoder(detected,{fatal:true}).decode(bytes);}catch(_){throw Error('Ошибка кодировки. Выбери Windows-1251 и открой файл повторно.');}
      const parsed=SubtitleSRT.parse(text);
      // Parse completely before replacing the currently open document.
      const fingerprint=JSON.stringify(parsed.cues.map(c=>[c.start,c.end,c.originalText]));
      const existing=doc?.sourceFingerprint|| (doc?JSON.stringify(doc.cues.map(c=>[c.start,c.end,c.originalText])):null);
      if(existing===fingerprint&&doc.name===file.name){doc.sourceFingerprint=fingerprint;list();display();save();status('Этот SRT уже открыт. Правки и связь с клипами сохранены.');return;}
      if(window.subtitleGraphic?.busy)throw Error('Дождись завершения записи в Premiere.');
      doc={id:documentID(),name:file.name,sourceFingerprint:fingerprint,cues:parsed.cues.map(c=>({...c,appearance:{role:'speech',size:100,accentSize:100,position:50,color:'#ffffff',motion:'soft'}}))};selected=0;list();display();
      window.dispatchEvent(new Event('subtitle:document-change'));
      if(save())status('Открыто '+doc.cues.length+' блоков. Тайминги сохранены.'+(parsed.warnings.length?'\nПредупреждений: '+parsed.warnings.length+'\n'+parsed.warnings.slice(0,8).join('\n'):''));
    }catch(error){if(currentRequest===request)status(error.message+' Текущий набор субтитров не заменён.');}
    finally{if(currentRequest===request)e.target.value='';}
  });
  try{
    const saved=JSON.parse(localStorage.getItem(key)||'null');
    if(saved){
      const d=saved.doc;
      if(!d||typeof d.name!=='string'||!Array.isArray(d.cues)||!d.cues.length||d.cues.length>10000)throw Error('bad document');
      for(const c of d.cues)if(!Number.isSafeInteger(c.start)||!Number.isSafeInteger(c.end)||c.start<0||c.end<=c.start||c.end>=3600000000||typeof c.text!=='string'||typeof c.originalText!=='string')throw Error('bad cue');
      doc=d;if(typeof doc.id!=='string'||!doc.id)doc.id=documentID();selected=Number.isInteger(saved.selected)?Math.max(0,Math.min(d.cues.length-1,saved.selected)):0;list();display();save();status('Восстановлены локальные правки SRT.');
    }
  }catch(_){status('Сохранённый SRT повреждён или недоступен. Открой исходный файл повторно.');}
})();
