(() => {
  const sentence=text=>text.toLocaleLowerCase('ru').replace(/\p{L}/u,c=>c.toLocaleUpperCase('ru'));
  function plan(text,role='auto'){
    text=text.replace(/\r\n?/g,'\n').trim();
    const words=text.split(/\s+/).filter(Boolean);
    if(role==='auto')role=window.SubtitleStyleAdvisor.inferRole(text);
    if(role==='accent')return {role,main:'',accent:sentence(text),speech:'',text:sentence(text)};
    if(role==='speech')return {role,main:'',accent:'',speech:text,text};
    const lines=text.split('\n').filter(l=>l.trim());
    const main=(lines.length>1?lines[0]:words.length>1?words.slice(0,-1).join(' '):text).toLocaleUpperCase('ru');
    const accent=sentence(lines.length>1?lines.slice(1).join(' '):words.length>1?words.at(-1):'');
    return {role:'title',main,accent,speech:'',text:main+(accent?'\n'+accent:'')};
  }
  const canvas=document.createElement('canvas'),measure=canvas.getContext('2d');
  function fitSpeech(text,size=100){
    const explicit=text.replace(/\r\n?/g,'\n').split('\n').map(s=>s.replace(/[ \t]+/g,' ').trim()).filter(Boolean);
    if(!explicit.length||explicit.length>2)return {valid:false,text,reason:'Нужно от одной до двух строк.'};
    const words=explicit[0].split(' '),options=[explicit];
    if(explicit.length===1)for(let i=1;i<words.length;i++)options.push([words.slice(0,i).join(' '),words.slice(i).join(' ')]);
    measure.font='500 200px "Cera Pro"';
    const ranked=options.map(lines=>{
      const metrics=lines.map(line=>measure.measureText(line));
      const width=Math.max(...metrics.map(m=>Math.max(m.width,m.actualBoundingBoxLeft+m.actualBoundingBoxRight)));
      const height=Math.max(...metrics.map(m=>m.actualBoundingBoxAscent+m.actualBoundingBoxDescent))+240*(lines.length-1);
      const scale=Math.min(55*size/100/200,620/Math.max(1,width),170/Math.max(1,height));
      return {text:lines.join('\n'),fontSize:200*scale,width:width*scale,height:height*scale,scale};
    }).sort((a,b)=>b.fontSize-a.fontSize);
    const best=ranked[0];return {...best,valid:best.fontSize>=30,reason:best.fontSize>=30?'':'Фраза слишком длинная для читаемого размера. Раздели блок.'};
  }
  // A font baseline, not the visible glyph box, anchors consecutive words.
  function speechPosition(position=50){return {right:964,baseline:Math.max(315,Math.min(1100,375+(position-50)*19.2))};}
  function highlightGeometry(text,hand=false,size=100,accentSize=100){
    const lines=text.split('\n'),family=hand?'"Christopher", "Segoe Script", cursive':'"Bebas Neue Cyrillic", Arial, sans-serif';
    measure.font='400 200px '+family;
    const metrics=lines.map(line=>measure.measureText(line)),advance=Math.max(...metrics.map(m=>m.width));
    const left=Math.min(...metrics.map(m=>(advance-m.width)/2-m.actualBoundingBoxLeft));
    const right=Math.max(...metrics.map(m=>(advance-m.width)/2+m.actualBoundingBoxRight));
    const top=-metrics[0].actualBoundingBoxAscent,bottom=240*(lines.length-1)+metrics.at(-1).actualBoundingBoxDescent;
    const height=Math.max(1,bottom-top),width=Math.max(1,right-left),m=Math.max(.7,Math.min(1.3,size/100)),a=hand?Math.max(.7,Math.min(1.5,accentSize/100)):1;
    const scale=Math.min((hand?130:145)*m*a/height,710/width);
    return {family,advance,left,top,width,height,scale,centerX:(left+right)/2,centerY:(top+bottom)/2};
  }
  window.subtitleTypography={plan,sentence,fitSpeech,speechPosition,highlightGeometry};
})();
