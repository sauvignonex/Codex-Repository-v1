(function(root){
  'use strict';
  function time(value){
    const match=/^(\d{2,3}):(\d{2}):(\d{2})[,.](\d{3})$/.exec(value);
    if(!match||+match[2]>59||+match[3]>59)throw Error('Некорректный таймкод: '+value);
    return (+match[1]*3600 + +match[2]*60 + +match[3])*1000 + +match[4];
  }
  function format(ms){
    if(!Number.isSafeInteger(ms)||ms<0||ms>=3600000000)throw Error('Некорректное время');
    const pad=(v,n)=>String(v).padStart(n,'0');
    return pad(Math.floor(ms/3600000),2)+':'+pad(Math.floor(ms/60000)%60,2)+':'+pad(Math.floor(ms/1000)%60,2)+','+pad(ms%1000,3);
  }
  function parse(input){
    if(typeof input!=='string'||input.length>2000000)throw Error('SRT слишком большой: максимум 2 млн символов.');
    if(input.includes('\ufffd'))throw Error('Не удалось прочитать кодировку. Попробуй Windows-1251.');
    if(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(input))throw Error('В файле есть недопустимые управляющие символы.');
    const text=input.replace(/^\ufeff/,'').replace(/\r\n?/g,'\n').trim();
    if(!text)throw Error('Файл пуст.');
    const blocks=text.split(/\n[ \t]*\n+/),cues=[],warnings=[];
    if(blocks.length>10000)throw Error('В файле больше 10 000 блоков.');
    let previousStart=-1,maxEnd=-1;
    for(let i=0;i<blocks.length;i++){
      const lines=blocks[i].split('\n');
      if(/^\d+$/.test(lines[0].trim()))lines.shift();
      const match=/^\s*(\d{2,3}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2,3}:\d{2}:\d{2}[,.]\d{3})\s*$/.exec(lines.shift()||'');
      if(!match)throw Error('Блок '+(i+1)+': неверная строка времени. Нужен файл SRT.');
      const start=time(match[1]),end=time(match[2]),body=lines.join('\n').trim();
      if(end<=start)throw Error('Блок '+(i+1)+': конец должен быть позже начала.');
      if(start<previousStart)throw Error('Блок '+(i+1)+': нарушен порядок времени.');
      if(!body)throw Error('Блок '+(i+1)+': отсутствует текст.');
      if(start<maxEnd)warnings.push('Блок '+(i+1)+': пересекается с предыдущими по времени.');
      if(body.split('\n').length>2||body.length>200)warnings.push('Блок '+(i+1)+': потребуется сократить текст или разделить блок для оформления.');
      if(/<\/?[a-z][^>]*>|\{\\/.test(body))warnings.push('Блок '+(i+1)+': разметка показана как текст; оформление SRT не переносится.');
      cues.push({start,end,text:body,originalText:body});previousStart=start;maxEnd=Math.max(maxEnd,end);
    }
    return {cues,warnings};
  }
  const api={parse,time,format};root.SubtitleSRT=api;
  if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='object'?window:globalThis);
