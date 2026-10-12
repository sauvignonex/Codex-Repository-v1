(() => {
  const root = document.getElementById('subtitle-studio-preview');
  const q = id => root.querySelector('#' + id);
  const defaults = {text:'Марийский десерт',size:100,position:50,color:'#ffffff',safe:true,motion:'soft',source:'srt',role:'auto'};
  const state = {...defaults}, design = {radius:16,accent:'#a99afa'};
  const enums = {motion:['soft','pop','none'],source:['srt','audio'],role:['auto','speech','title','accent']};
  const measure = document.createElement('canvas').getContext('2d');
  const fontCache = new Map();
  let anim, undo = null, valid = false, saveTimer;
  const hex = value => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const normalText = value => value.replace(/\r\n?/g,'\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u200b\ufeff]/g,'');
  const publicState = () => ({...state});
  function show(id,text) { q(id).textContent=text;q(id).hidden=!text; }
  async function save() {
    try {
      if (!window.openai?.setWidgetState) throw new Error('unavailable');
      await window.openai.setWidgetState({modelContent:{subtitlePanel:publicState()},privateContent:{design:{...design},headlineDraft:q('ss-headline-draft').value,undo}});
      show('ss-storage-warning','');return true;
    } catch (_) {
      show('ss-storage-warning','Не удалось сохранить настройки. Текущий текст остаётся в панели.');return false;
    }
  }
  function queueSave() {clearTimeout(saveTimer);saveTimer=setTimeout(save,200);}
  function restore(saved) {
    const s=saved?.modelContent?.subtitlePanel;
    if(s && typeof s==='object') {
      if(typeof s.text==='string')state.text=normalText(s.text);
      for(const [key,limits] of Object.entries({size:[70,130],position:[28,74]}))
        if(key in s)state[key]=Number.isFinite(s[key])?clamp(s[key],...limits):defaults[key];
      for(const [key,values] of Object.entries(enums))if(key in s)state[key]=values.includes(s[key])?s[key]:defaults[key];
      if('color' in s)state.color=hex(s.color)?s.color:defaults.color;
      if(typeof s.safe==='boolean')state.safe=s.safe;
    }
    const p=saved?.privateContent;
    if(p?.design && typeof p.design==='object') {
      if(Number.isFinite(p.design.radius))design.radius=clamp(p.design.radius,0,20);
      if(hex(p.design.accent))design.accent=p.design.accent;
    }
    if(typeof p?.headlineDraft==='string')q('ss-headline-draft').value=p.headlineDraft.slice(0,120);
    const u=p?.undo;
    if(u && typeof u.beforeText==='string' && u.beforeText.length<=200 && typeof u.appliedText==='string' && u.appliedText.length<=120 && enums.role.includes(u.beforeRole))undo={beforeText:u.beforeText,beforeRole:u.beforeRole,appliedText:u.appliedText};
  }
  function fontAvailable(name,weight) {
    const key=name+weight;if(fontCache.has(key))return fontCache.get(key);
    const sample='Марийский десерт ЙЁЩ 0123456789';
    const result=['monospace','serif','sans-serif'].some(fallback=>{
      measure.font=weight+' 32px '+fallback;const a=measure.measureText(sample).width;
      measure.font=weight+' 32px "'+name+'",'+fallback;return Math.abs(a-measure.measureText(sample).width)>.1;
    });
    fontCache.set(key,result);return result;
  }
  function lineOptions(text) {
    const explicit=text.split('\n').map(l=>l.replace(/[ \t]+/g,' ').trim()).filter(Boolean);
    if(explicit.length>1)return [explicit];
    const words=(explicit[0]||'').split(' '), variants=[[explicit[0]||'']];
    for(let i=1;i<words.length;i++)variants.push([words.slice(0,i).join(' '),words.slice(i).join(' ')]);
    return variants;
  }
  function setReview(open) {
    q('ss-ai-review').hidden=!open;q('ss-headlines').setAttribute('aria-expanded',String(open));
    (open?q('ss-headline-draft'):q('ss-headlines')).focus();
  }
  function render() {
    if(anim){anim.cancel();anim=null;}
    if(q('ss-text').value!==state.text)q('ss-text').value=state.text;
    for(const [id,key] of [['ss-size','size'],['ss-position','position'],['ss-color','color'],['ss-motion','motion'],['ss-role','role']])q(id).value=state[key];
    q('ss-safe-toggle').checked=state.safe;q('ss-safe-overlay').toggleAttribute('hidden',!state.safe);
    q('ss-size-value').textContent=state.size+'%';q('ss-position-value').textContent=state.position+'%';
    root.querySelectorAll('[data-source]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.source===state.source)));
    q('ss-source-name').textContent=state.source==='srt'?'Колобки · пример субтитров':'Аудиодорожка · пример';
    q('ss-source-description').textContent=state.source==='srt'?'SRT или субтитры последовательности':'Распознавание речи и сверка со сценарием';
    root.querySelector('.studio').style.borderRadius=design.radius+'px';root.querySelector('.studio').style.setProperty('--highlight',design.accent);
    q('ss-headline-undo').hidden=!(undo && undo.appliedText===state.text);
    const caption=q('ss-caption'),frame=q('ss-frame'),clean=normalText(state.text).trim();
    const count=clean.split(/\s+/).filter(Boolean).length;
    const title=state.role==='title'||(state.role==='auto'&&count<=2),accent=state.role==='accent';
    const family=accent?'Christopher':title?'Bebas Neue Cyrillic':'Cera Pro';
    const weight=title||accent?400:500;
    caption.style.fontFamily='"'+family+'", '+(accent?'"Segoe Script", cursive':'Arial, sans-serif');caption.style.fontWeight=weight;caption.style.color=state.color;
    q('ss-current-font').textContent=family==='Cera Pro'?'Cera Pro Medium':family;
    show('ss-font-warning',fontAvailable(family,weight)?'':family+' недоступен в предпросмотре — используется замена.');
    let problem=!clean?'Введи текст для предпросмотра.':clean.length>200?'Блок длиннее 200 символов. Раздели его на части.':clean.split('\n').filter(l=>l.trim()).length>2?'Здесь больше двух строк. Раздели блок или убери перенос.':'';
    const w=frame.clientWidth,h=frame.clientHeight;
    valid=false;caption.hidden=true;
    if(!problem && w>0 && h>0) {
      const display=title?clean.toLocaleUpperCase('ru'):clean;
      const options=lineOptions(display),start=w*(title?.136:accent?.135:.105)*state.size/100,min=12;
      const effect=6,movement=state.motion==='soft'?8:0;
      const topLimit=h*234/1920+effect,bottomLimit=h*1600/1920-effect-movement;
      const leftLimit=w*72/1082+effect,rightLimit=w*1018/1082-effect,notchRight=w*864/1082-effect,notchY=h*1348/1920-effect-movement;
      caption.hidden=false;
      const requestedY=h*state.position/100;
      outer: for(let font=Math.max(min,start);font>=min-.001;font-=.5) {
        measure.font=weight+' '+font+'px '+caption.style.fontFamily;
        const ranked=options.map(lines=>{
          const widths=lines.map(line=>{const m=measure.measureText(line);return Math.max(m.width,(m.actualBoundingBoxLeft||0)+(m.actualBoundingBoxRight||0));});
          return{lines,width:Math.max(...widths),score:Math.max(...widths)+(lines.length===2?Math.abs(widths[0]-widths[1])*.12+3:0)};
        }).sort((a,b)=>a.score-b.score);
        for(const option of ranked) {
          const boxWidth=Math.ceil(option.width)+2;
          caption.style.width=boxWidth+'px';caption.style.fontSize=font+'px';caption.textContent=option.lines.join('\n');
          const boxHeight=caption.offsetHeight;
          if(boxHeight>bottomLimit-topLimit)continue;
          const y=clamp(requestedY,topLimit+boxHeight/2,bottomLimit-boxHeight/2);
          const right=y+boxHeight/2>notchY?notchRight:rightLimit;
          if(boxWidth>right-leftLimit)continue;
          const x=clamp(w/2,leftLimit+boxWidth/2,right-boxWidth/2);
          caption.style.left=x+'px';caption.style.top=y+'px';valid=true;break outer;
        }
      }
      if(!valid)problem='Текст не помещается читаемым размером. Раздели его на несколько блоков.';
    }
    caption.hidden=!valid;q('ss-apply').disabled=!valid;q('ss-play').disabled=!valid;
    show('ss-validation',problem);q('ss-text').setAttribute('aria-invalid',String(Boolean(problem)));
    q('ss-fit').textContent=valid?'Внутри зоны предпросмотра':'Нужна правка текста';
    q('ss-headline-apply').disabled=!q('ss-headline-draft').value.trim();
  }
  q('ss-text').addEventListener('input',e=>{state.text=normalText(e.target.value);render();queueSave();});
  for(const [id,key] of [['ss-size','size'],['ss-position','position']])q(id).addEventListener('input',e=>{state[key]=Number(e.target.value);render();queueSave();});
  q('ss-color').addEventListener('input',e=>{if(hex(e.target.value))state.color=e.target.value;render();queueSave();});
  for(const [id,key] of [['ss-motion','motion'],['ss-role','role']])q(id).addEventListener('change',e=>{state[key]=e.target.value;render();queueSave();});
  q('ss-safe-toggle').addEventListener('change',e=>{state.safe=e.target.checked;render();queueSave();});
  root.querySelectorAll('[data-source]').forEach(b=>b.addEventListener('click',()=>{state.source=b.dataset.source;render();queueSave();}));
  root.querySelectorAll('[data-sample]').forEach(b=>b.addEventListener('click',()=>{state.text=b.dataset.sample==='short'?'Марийский десерт':'Новая гастрономическая визитная карточка Марий Эл';render();queueSave();}));
  q('ss-headlines').addEventListener('click',()=>setReview(q('ss-ai-review').hidden));
  q('ss-headline-cancel').addEventListener('click',()=>setReview(false));
  q('ss-ai-review').addEventListener('keydown',e=>{if(e.key==='Escape')setReview(false);});
  q('ss-headline-draft').addEventListener('input',()=>{q('ss-headline-apply').disabled=!q('ss-headline-draft').value.trim();queueSave();});
  q('ss-headline-apply').addEventListener('click',()=>{
    const draft=normalText(q('ss-headline-draft').value).trim();if(!draft)return;
    undo={beforeText:state.text,beforeRole:state.role,appliedText:draft};state.text=draft;state.role='title';render();queueSave();setReview(false);
    q('ss-status').textContent='Заголовок примера применён. Его можно изменить или отменить.';
  });
  q('ss-headline-undo').addEventListener('click',()=>{if(!undo||undo.appliedText!==state.text)return;state.text=undo.beforeText;state.role=undo.beforeRole;undo=null;render();queueSave();q('ss-status').textContent='Исходный текст восстановлен.';});
  q('ss-play').addEventListener('click',()=>{
    if(!valid)return;if(anim)anim.cancel();
    if(state.motion==='none'||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const end={opacity:1,transform:'translate(-50%,-50%) scale(1)'};
    const frames=state.motion==='pop'?[{opacity:0,transform:'translate(-50%,-50%) scale(.82)'},end]:[{opacity:0,transform:'translate(-50%,calc(-50% + 8px))'},end];
    anim=captionElement().animate(frames,{duration:state.motion==='pop'?280:440,easing:'cubic-bezier(.2,.8,.2,1)'});
  });
  function captionElement(){return q('ss-caption');}
  q('ss-apply').addEventListener('click',async()=>{if(!valid)return;clearTimeout(saveTimer);q('ss-status').textContent=await save()?'Настройки примера сохранены. Подключение к Premiere — следующий этап.':'Пример обновлён. Сохранение настроек недоступно.';});
  restore(window.openai?.widgetState);render();
  window.addEventListener('openai:set_globals',e=>{if(e.detail?.globals?.widgetState){restore(e.detail.globals.widgetState);render();}});
  new ResizeObserver(render).observe(q('ss-frame'));
  document.fonts?.ready.then(()=>{fontCache.clear();render();});
  if(globalThis.Tweak){const tweak=new Tweak({container:root.querySelector('.studio'),onChange:()=>{render();queueSave();}});tweak.addSlider(design,'radius',{label:'Скругление панели',min:0,max:20,unit:'px'});tweak.addColorPicker(design,'accent',{label:'Цвет акцента',reference:'--highlight'});}
})();
