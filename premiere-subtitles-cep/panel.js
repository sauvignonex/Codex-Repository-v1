(() => {
  const root = document.getElementById('subtitle-studio-preview');
  const q = id => root.querySelector('#' + id);
  const defaults = {text:'Марийский десерт',size:100,accentSize:100,position:50,color:'#ffffff',safe:true,motion:'soft',source:'srt',role:'auto'};
  const state = {...defaults}, design = {radius:16,accent:'#a99afa'};
  const enums = {motion:['soft','pop','none','write'],source:['srt','audio'],role:['auto','speech','title','accent']};
  const measure = document.createElement('canvas').getContext('2d');
  const fontCache = new Map();
  let anim, undo = null, valid = false, saveTimer, lastEmittedText;
  const hex = value => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const normalText = value => value.replace(/\r\n?/g,'\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u200b\ufeff]/g,'');
  const publicState = () => ({...state});
  const appearance = () => Object.fromEntries(['role','size','accentSize','position','color','motion'].map(key=>[key,state[key]]));
  function show(id,text) { q(id).textContent=text;q(id).hidden=!text; }
  async function save() {
    try {
      if (!window.subtitleStorage?.setWidgetState) throw new Error('unavailable');
      await window.subtitleStorage.setWidgetState({modelContent:{subtitlePanel:publicState()},privateContent:{design:{...design},headlineDraft:q('ss-headline-draft').value,undo}});
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
      for(const [key,limits] of Object.entries({size:[70,130],accentSize:[70,150],position:[28,74]}))
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
    const key=name+weight;if(fontCache.get(key)===true)return true;
    const sample='Марийский десерт ЙЁЩ 0123456789';
    const result=['monospace','serif','sans-serif'].some(fallback=>{
      measure.font=weight+' 32px '+fallback;const a=measure.measureText(sample).width;
      measure.font=weight+' 32px "'+name+'",'+fallback;return Math.abs(a-measure.measureText(sample).width)>.1;
    });
    fontCache.set(key,result);return result;
  }
  function setReview(open) {
    q('ss-ai-review').hidden=!open;q('ss-headlines').setAttribute('aria-expanded',String(open));
    (open?q('ss-headline-draft'):q('ss-headlines')).focus();
  }
  function render() {
    if(anim){anim.cancel();anim=null;}
    if(q('ss-text').value!==state.text)q('ss-text').value=state.text;
    for(const [id,key] of [['ss-size','size'],['ss-accent-size','accentSize'],['ss-position','position'],['ss-color','color'],['ss-motion','motion'],['ss-role','role']])q(id).value=state[key];
    q('ss-safe-toggle').checked=state.safe;q('ss-safe-overlay').toggleAttribute('hidden',!state.safe);
    q('ss-size-value').textContent=state.size+'%';q('ss-position-value').textContent=state.position+'%';
    root.querySelectorAll('[data-source]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.source===state.source)));
    q('ss-source-name').textContent=state.source==='srt'?(root.dataset.documentName||'Пример субтитров'):'Аудиодорожка';
    q('ss-source-description').textContent=state.source==='srt'?(root.dataset.documentName?'Выбери блок ниже, чтобы изменить текст и оформление':'Открой SRT ниже для работы с блоками'):'Распознавание аудио пока не подключено';
    q('ss-apply').textContent='Сохранить в панели';
    root.querySelector('.studio').style.borderRadius=design.radius+'px';root.querySelector('.studio').style.setProperty('--highlight',design.accent);
    q('ss-headline-undo').hidden=!(undo && undo.appliedText===state.text);
    const caption=q('ss-caption'),frame=q('ss-frame'),clean=normalText(state.text).trim();
    const count=clean.split(/\s+/).filter(Boolean).length;
    const title=state.role==='title'||(state.role==='auto'&&count<=2),accent=state.role==='accent';
    const family=accent?'Christopher':title?'Bebas Neue Cyrillic':'Cera Pro';
    const weight=title||accent?400:500;
    q('ss-layout-help').textContent=!title&&!accent?'Обычная речь: одно слово · Cera Pro Medium 55 · сверху справа. Предлоги и частицы остаются со словом.':'Хайлайты: до двух строк · масштаб Bebas и Christopher подбирается отдельно.';
    caption.style.fontFamily='"'+family+'", '+(accent?'"Segoe Script", cursive':'Arial, sans-serif');caption.style.fontWeight=weight;caption.style.color=state.color;
    q('ss-current-font').textContent=family==='Cera Pro'?'Cera Pro Medium':family;
    const requiredFonts=title&&window.subtitleTypography.plan(clean,state.role).accent?[family,'Christopher']:[family],missingFonts=requiredFonts.filter(name=>!fontAvailable(name,name==='Cera Pro'?500:400));
    show('ss-font-warning',missingFonts.length?missingFonts.join(', ')+' недоступен в предпросмотре — используется замена.':'');
    let problem=!clean?'Введи текст для предпросмотра.':clean.length>200?'Блок длиннее 200 символов. Раздели его на части.':clean.split('\n').filter(l=>l.trim()).length>2?'Здесь больше двух строк. Раздели блок или убери перенос.':'';
    const w=frame.clientWidth,h=frame.clientHeight;
    valid=false;caption.hidden=true;caption.style.height='';
    if(!problem && w>0 && h>0) {
      const plan=window.subtitleTypography.plan(clean,state.role);
      const display=plan.text;
      const speechFit=!title&&!accent?window.subtitleTypography.fitSpeech(display,state.size):null;
      if(title||accent){
        // Draw independent text layers with the approved AE ink-height/width/position rules.
        caption.hidden=false;caption.replaceChildren();caption.style.width=w+'px';caption.style.height=h+'px';caption.style.left=(w/2)+'px';caption.style.top=(h/2)+'px';
        const layers=title?[{text:plan.main,hand:false,offset:-80},{text:plan.accent,hand:true,offset:80}].filter(l=>l.text):[{text:plan.accent,hand:true,offset:0}];
        let readable=true;
        for(const layer of layers){
          const g=window.subtitleTypography.highlightGeometry(layer.text,layer.hand,state.size,state.accentSize),unit=w/1080;
          const y=Math.max(420,Math.min(1380,state.position*19.2)),height=g.height*g.scale,width=g.width*g.scale;
          const cy=Math.max(260+height/2,Math.min(1570-height/2,y+layer.offset)),cx=cy+height/2>1320?Math.min(540,840-width/2):540;
          const span=document.createElement('span');span.textContent=layer.text;span.style.cssText='position:absolute;display:block;white-space:pre;text-align:center;font-weight:400;font-size:200px;line-height:240px;transform-origin:0 0';
          span.style.fontFamily=g.family;span.style.width=g.advance+'px';span.style.left=cx*unit+'px';span.style.top=cy*unit+'px';caption.append(span);
          const baseline=document.createElement('span');baseline.style.cssText='display:inline-block;width:0;height:0;vertical-align:baseline';
          span.replaceChildren(document.createTextNode(layer.text.split('\n')[0]),baseline);if(layer.text.includes('\n'))span.append(document.createTextNode('\n'+layer.text.split('\n').slice(1).join('\n')));
          const baselineOffset=baseline.getBoundingClientRect().top-span.getBoundingClientRect().top;
          const scale=g.scale*unit,tx=-g.centerX*scale,ty=-(baselineOffset+g.centerY)*scale;
          span.dataset.restTransform='translate('+tx+'px,'+ty+'px) scale('+scale+')';span.style.transform=span.dataset.restTransform;
          span.dataset.revealBox=JSON.stringify([g.left-26,baselineOffset+g.top-26,g.width+52,g.height+52]);
          span.dataset.inkHeight=String(height);span.dataset.inkWidth=String(width);span.dataset.inkCenterY=String(cy);
          if(200*g.scale<30)readable=false;
        }
        valid=readable;if(!readable)problem='Хайлайт слишком длинный для читаемого размера. Сократи текст или раздели его.';
        q('ss-current-font').textContent=title&&plan.accent?'Bebas + Christopher':family;
      }else{

      const options=[speechFit.text.split('\n')],start=speechFit.fontSize*w/1080,min=Math.min(12,start);
      const effect=6,movement=state.motion==='soft'?8:0;
      const topLimit=h*234/1920+effect,bottomLimit=h*1600/1920-effect-movement;
      const leftLimit=w*72/1082+effect,rightLimit=w*1018/1082-effect,notchRight=w*864/1082-effect,notchY=h*1348/1920-effect-movement;
      caption.hidden=false;
      const requestedY=speechFit?h*(320+(state.position-50)*19.2)/1920:h*state.position/100;
      outer: for(let font=Math.max(min,start);font>=min-.001;font-=.5) {
        measure.font=weight+' '+font+'px '+caption.style.fontFamily;
        const ranked=options.map(lines=>{
          const widths=lines.map(line=>{const m=measure.measureText(line);return Math.max(m.width,(m.actualBoundingBoxLeft||0)+(m.actualBoundingBoxRight||0));});
          return{lines,width:Math.max(...widths),score:Math.max(...widths)+(lines.length===2?Math.abs(widths[0]-widths[1])*.12+3:0)};
        }).sort((a,b)=>a.score-b.score);
        for(const option of ranked) {
          const boxWidth=Math.ceil(option.width)+2;
          caption.style.textAlign=speechFit?'right':'center';caption.style.width=boxWidth+'px';caption.style.fontSize=font+'px';caption.textContent=option.lines.join('\n');
          const boxHeight=caption.offsetHeight;
          if(boxHeight>bottomLimit-topLimit)continue;
          const y=clamp(requestedY+(speechFit?boxHeight/2:0),topLimit+boxHeight/2,bottomLimit-boxHeight/2);
          const right=y+boxHeight/2>notchY?notchRight:rightLimit;
          if(boxWidth>right-leftLimit)continue;
          const x=clamp(speechFit?w*964/1080-boxWidth/2:w/2,leftLimit+boxWidth/2,right-boxWidth/2);
          caption.style.left=x+'px';caption.style.top=y+'px';
          if(speechFit){
            // Zero-size inline box measures the actual CSS baseline, including font fallback.
            const baseline=document.createElement('span');baseline.dataset.speechBaseline='';
            baseline.style.cssText='display:inline-block;width:0;height:0;vertical-align:baseline';
            caption.replaceChildren(document.createTextNode(option.lines[0]),baseline);
            if(option.lines.length>1)caption.append(document.createTextNode('\n'+option.lines.slice(1).join('\n')));
            const box=caption.getBoundingClientRect(),offset=baseline.getBoundingClientRect().top-box.top;
            const anchor=window.subtitleTypography.speechPosition(state.position);
            measure.font=weight+' '+font+'px '+caption.style.fontFamily;
            const bearing=Math.min(...option.lines.map(line=>{const ink=measure.measureText(line);return ink.width-ink.actualBoundingBoxRight;}));
            // Right-align visible ink rather than the font's advance/side bearing.
            caption.style.left=(w*anchor.right/1080-boxWidth/2+bearing)+'px';
            caption.style.top=(h*anchor.baseline/1920+box.height/2-offset)+'px';
          }
          valid=true;break outer;
        }
      }
      if(!valid)problem='Текст не помещается читаемым размером. Раздели его на несколько блоков.';
      }
    }
    caption.hidden=!valid;q('ss-apply').disabled=!valid;q('ss-play').disabled=!valid;
    window.subtitlePreview={getLayout:()=>({...window.subtitleTypography.plan(clean,state.role),valid,font:accent?'Christopher':title?'BebasNeueCyrillic':'CeraPro-Medium',size:state.size,accentSize:state.accentSize,position:state.position,color:state.color,motion:state.motion,speech:!title&&!accent?caption.textContent:''})};
    show('ss-validation',problem);q('ss-text').setAttribute('aria-invalid',String(Boolean(problem)));
    q('ss-fit').textContent=valid?'Внутри зоны предпросмотра':'Нужна правка текста';
    q('ss-headline-apply').disabled=!q('ss-headline-draft').value.trim();
    const emission=JSON.stringify({text:state.text,appearance:appearance()});
    if(lastEmittedText!==emission){lastEmittedText=emission;window.dispatchEvent(new CustomEvent('subtitle:block-change',{detail:{text:state.text,appearance:appearance()}}));}
  }
  q('ss-text').addEventListener('input',e=>{state.text=normalText(e.target.value);render();queueSave();});
  for(const [id,key] of [['ss-size','size'],['ss-accent-size','accentSize'],['ss-position','position']])q(id).addEventListener('input',e=>{state[key]=Number(e.target.value);render();queueSave();});
  q('ss-color').addEventListener('input',e=>{if(hex(e.target.value))state.color=e.target.value;render();queueSave();});
  for(const [id,key] of [['ss-motion','motion'],['ss-role','role']])q(id).addEventListener('change',e=>{state[key]=e.target.value;render();queueSave();});
  q('ss-safe-toggle').addEventListener('change',e=>{state.safe=e.target.checked;render();queueSave();});
  root.querySelectorAll('[data-source]').forEach(b=>b.addEventListener('click',()=>{state.source=b.dataset.source;render();queueSave();}));
  root.querySelectorAll('[data-sample]').forEach(b=>b.addEventListener('click',()=>{state.text=b.dataset.sample==='short'?'Марийский десерт':'Новая гастрономическая визитная карточка Марий Эл';render();queueSave();}));
  q('ss-headlines').addEventListener('click',()=>{if(window.SubtitleDocument?.getSnapshot()){q('editorial-group').click();q('editorial-ai').click();q('editorial-status').scrollIntoView({block:'center'});}else setReview(q('ss-ai-review').hidden);});
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
    const layout=window.subtitlePreview.getLayout(),cue=window.SubtitleDocument?.getSelected(),duration=Math.max(.034,Math.min(6,cue?(cue.end-cue.start)/1000:1.2));
    const caption=captionElement(),parts=layout.role!=='speech'&&caption.children.length?[...caption.children]:[caption],scale=q('ss-frame').clientWidth/1080;
    const animations=parts.map((target,i)=>{const hand=layout.role==='accent'||layout.role==='title'&&i===1;
      const frames=[];for(let n=0;n<=Math.max(2,Math.ceil(duration*60));n++){const offset=n/Math.max(2,Math.ceil(duration*60)),m=SubtitleMotion.sample(offset*duration,duration,state.motion,layout.role,hand,Math.max(1,target.textContent.replace(/[^0-9A-Za-zА-Яа-яЁё]/g,'').length));
        const base=target===caption?'translate(-50%,-50%) ':'';
        const rest=target.dataset.restTransform||'',box=target.dataset.revealBox?JSON.parse(target.dataset.revealBox):null;
        let clipPath=hand?'inset(0 '+(100*(1-m.reveal))+'% 0 0)':'inset('+(100*(1-m.reveal))+'% 0 0 0)';
        if(box){const [x,y,w,h]=box,edge=x+w*m.reveal,tip=hand?Math.min(28,w*.08)*Math.sin(Math.PI*m.reveal):0,top=hand?y:y+h*(1-m.reveal);clipPath=hand?'polygon('+x+'px '+y+'px,'+(edge+tip)+'px '+y+'px,'+(edge-tip)+'px '+(y+h)+'px,'+x+'px '+(y+h)+'px)':'polygon('+x+'px '+top+'px,'+(x+w)+'px '+top+'px,'+(x+w)+'px '+(y+h)+'px,'+x+'px '+(y+h)+'px)';}
        frames.push({offset,opacity:m.opacity,transform:base+'translate('+m.x*scale+'px,'+m.y*scale+'px) scale('+m.scale+') '+rest,filter:'blur('+m.blur*scale+'px)',clipPath});
      }return target.animate(frames,{duration:duration*1000,easing:'linear'});
    });anim={cancel(){animations.forEach(a=>a.cancel());}};
  });
  function captionElement(){return q('ss-caption');}
  q('ss-apply').addEventListener('click',async()=>{if(!valid)return;clearTimeout(saveTimer);const settingsSaved=await save();const documentSaved=window.SubtitleDocument?window.SubtitleDocument.save():true;q('ss-status').textContent=settingsSaved&&documentSaved?'Сохранено в панели. Для записи на таймлайн нажми основную кнопку рядом.':'Не все правки удалось сохранить. Не закрывай панель до сохранения.';});
  restore(window.subtitleStorage?.widgetState);render();
  window.SubtitlePanel={getSettings:appearance,setText(text,name,settings){if(typeof text!=='string')return;if(settings)restore({modelContent:{subtitlePanel:{...defaults,...settings,text}}});state.text=normalText(text);if(typeof name==='string'){root.dataset.documentName=name;state.source='srt';}undo=null;render();queueSave();}};
  window.addEventListener('openai:set_globals',e=>{if(e.detail?.globals?.widgetState){restore(e.detail.globals.widgetState);render();}});
  new ResizeObserver(render).observe(q('ss-frame'));
  document.fonts?.ready.then(()=>{fontCache.clear();render();});
  document.fonts?.addEventListener('loadingdone',()=>{fontCache.clear();render();});
  if(globalThis.Tweak){const tweak=new Tweak({container:root.querySelector('.studio'),onChange:()=>{render();queueSave();}});tweak.addSlider(design,'radius',{label:'Скругление панели',min:0,max:20,unit:'px'});tweak.addColorPicker(design,'accent',{label:'Цвет акцента',reference:'--highlight'});}
})();
