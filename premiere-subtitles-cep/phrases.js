((root)=>{
  const normalize=text=>text.replace(/\s+/g,' ').trim();
  const trailing=/(?:^|\s)(?:и|а|в|во|с|со|к|ко|на|от|до|для|по|из|не|это|через)$/iu;
  const style={role:'speech',size:100,accentSize:100,position:50,color:'#ffffff',motion:'soft'};
  function fromWords(words,fit){
    if(!Array.isArray(words)||!words.length)throw Error('Речь не найдена.');
    const result=[];let pending=[];
    function flush(){if(!pending.length)return;const text=pending.map(w=>w.text).join(' ');result.push({start:pending[0].start,end:pending.at(-1).end,text,originalText:text,words:pending.map(w=>({...w})),timingEstimated:pending.some(w=>w.estimated),appearance:{...style}});pending=[];}
    words.forEach((w,i)=>{
      if(typeof w.text!=='string'||!w.text.trim()||!Number.isSafeInteger(w.start)||!Number.isSafeInteger(w.end)||w.start<0||w.end<=w.start||i&&w.start<words[i-1].start)throw Error('Некорректный тайминг распознавания.');
      const previous=pending.at(-1),candidate=pending.map(x=>x.text).concat(w.text).join(' ');
      const pause=previous&&(w.start-previous.end>350||w.start<previous.end);
      if(pending.length&&(pause||w.end-pending[0].start>5500||candidate.length>40||fit&&!fit(candidate,100).valid)){
        // Move a trailing preposition/conjunction with the phrase it introduces.
        let moved=[];if(!pause)while(pending.length>1&&trailing.test(pending.at(-1).text))moved.unshift(pending.pop());
        flush();pending=moved;
      }
      pending.push({...w,text:normalize(w.text)});
      if(/[.!?…][»”"]?$/.test(w.text)||(/[,:;][»”"]?$/.test(w.text)&&pending.map(x=>x.text).join(' ').length>=22))flush();
    });flush();
    return result;
  }
  function splitCue(cue,fit){
    if(cue.appearance?.role==='title'||cue.appearance?.role==='accent')return [{...cue}];
    if(cue.end-cue.start<=6000&&cue.text.length<=40&&(!fit||fit(cue.text,cue.appearance?.size||100).valid))return [{...cue}];
    const text=normalize(cue.text),parts=text.split(' '),weight=parts.reduce((n,p)=>n+p.length,0);let at=0;
    const supplied=cue.words?.length===parts.length&&cue.words.every((w,i)=>w.text===parts[i]);
    const words=supplied?cue.words:parts.map((part,i)=>{const start=cue.start+Math.round((cue.end-cue.start)*at/weight);at+=part.length;return {text:part,start,end:i===parts.length-1?cue.end:cue.start+Math.round((cue.end-cue.start)*at/weight),estimated:true};});
    const split=fromWords(words,fit);
    return split.map(c=>({...cue,...c,sourceOriginalText:cue.sourceOriginalText||cue.originalText,appearance:{...style,...cue.appearance}}));
  }
  const connectors=new Set('в во на с со к ко от до для по из у о об обо за под над перед при через без и а но или не ни же бы ли ну ах ох эх'.split(' '));
  const content=token=>{const word=token.toLocaleLowerCase('ru').replace(/[^\p{L}\p{N}-]/gu,'');return word&&!connectors.has(word);};
  function speechWords(cue){
    if(['title','accent'].includes(cue.appearance?.role))return [{...cue}];
    const parts=normalize(cue.text).split(' ').filter(Boolean);if(!parts.length)throw Error('Пустой текст речи.');
    const groups=[];let pending=[];
    for(const token of parts){const prefix=!content(token)&&/\p{L}/u.test(token)&&!['же','бы','ли'].includes(token.toLocaleLowerCase('ru'));if(pending.length&&(pending.length>=3||(content(token)||prefix)&&pending.some(content))){groups.push(pending);pending=[];}pending.push(token);}if(pending.length)groups.push(pending);
    if(groups.length===1)return [{...cue}];
    const supplied=cue.words?.length===parts.length&&cue.words.every((w,i)=>w.text===parts[i]&&Number.isSafeInteger(w.start)&&Number.isSafeInteger(w.end)&&w.start>=cue.start&&w.end<=cue.end&&w.end>w.start&&(!i||w.start>=cue.words[i-1].end));
    const weights=groups.map(g=>g.reduce((n,w)=>n+Math.max(1,w.replace(/[^\p{L}\p{N}]/gu,'').length),0)),total=weights.reduce((a,b)=>a+b,0);let at=0,index=0;
    const result=groups.map((g,i)=>{const first=index;index+=g.length;const start=supplied?cue.words[first].start:cue.start+Math.round((cue.end-cue.start)*at/total);at+=weights[i];const end=supplied?cue.words[index-1].end:i===groups.length-1?cue.end:cue.start+Math.round((cue.end-cue.start)*at/total);
      if(end-start<34)throw Error('Слово короче одного кадра. Уточни тайминг речи перед созданием.');
      const text=g.join(' ');return {...cue,start,end,text,originalText:text,sourceOriginalText:cue.sourceOriginalText||cue.originalText,words:supplied?cue.words.slice(first,index):undefined,timingEstimated:!supplied||cue.timingEstimated,appearance:{...style,...cue.appearance,role:'speech'}};});
    return result;
  }
  function prepare(cues,fit){return cues.flatMap(c=>speechWords(c));}
  root.SubtitlePhrases={fromWords,splitCue,prepare,speechWords,content};
  if(typeof module!=='undefined')module.exports=root.SubtitlePhrases;
})(typeof window==='undefined'?globalThis:window);
