((root) => {
  const trailing=/(?:^|\s)(?:и|а|в|во|с|со|к|ко|на|от|до|для|по|из|не|это|через)$/iu;
  const normalize=s=>s.replace(/\s+/g,' ').trim();
  function alignReference(cues,reference){
    const clean=s=>s.toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/[^\p{L}\p{N}]/gu,'');
    const words=[];cues.forEach((c,index)=>normalize(c.text).split(' ').forEach(text=>{if(clean(text))words.push({text,index});}));
    const target=[];normalize(reference).split(' ').forEach(word=>{if(clean(word))target.push(word);else if(target.length)target[target.length-1]+=' '+word;});const n=words.length,m=target.length;
    if(!m)return cues.map(c=>({...c}));
    if(n>3000||m>3000)throw Error('Для сверки со сценарием поддерживается до 3000 слов.');
    const dp=Array.from({length:n+1},()=>new Uint16Array(m+1));
    for(let j=0;j<=m;j++)dp[0][j]=j;
    const opening=new Set(words.slice(0,8).map(w=>clean(w.text)));
    if(target.slice(0,8).filter(w=>opening.has(clean(w))).length>=2)for(let i=1;i<=n;i++)dp[i][0]=i;
    for(let i=1;i<=n;i++)for(let j=1;j<=m;j++)dp[i][j]=Math.min(dp[i-1][j-1]+(clean(words[i-1].text)===clean(target[j-1])?0:1),dp[i-1][j]+1,dp[i][j-1]+1);
    let end=n;for(let i=n-1;i>0;i--)if(dp[i][m]<dp[end][m])end=i;
    let i=end,j=m,matches=0;const pairs=[];
    while(j>0){const same=i>0&&clean(words[i-1].text)===clean(target[j-1]);
      if(i>0&&dp[i][j]===dp[i-1][j-1]+(same?0:1)){pairs.push({source:i-1,text:target[j-1]});if(same)matches++;i--;j--;}
      else if(i>0&&dp[i][j]===dp[i-1][j]+1){pairs.push({source:i-1,text:''});i--;}
      else {pairs.push({source:/[.!?…][»”"]?$/.test(target[j-1])?Math.max(0,i-1):Math.min(n-1,i),text:target[j-1]});j--;}
    }
    if(matches/m<.45)throw Error('Сценарий слишком сильно отличается от SRT. Сверь выбранный файл.');
    const start=i,byIndex=new Map();
    for(let k=start;k<end;k++)byIndex.set(words[k].index,[]);
    pairs.reverse().forEach(p=>{const index=words[p.source].index;if(!byIndex.has(index))byIndex.set(index,[]);if(p.text)byIndex.get(index).push(p.text);});
    // Keep text outside the matched script span unchanged, including an omitted introduction.
    for(let k=0;k<start;k++){const index=words[k].index;if(byIndex.has(index))byIndex.get(index).unshift(words[k].text);}
    for(let k=end;k<n;k++){const index=words[k].index;if(byIndex.has(index))byIndex.get(index).push(words[k].text);}
    return cues.map((c,index)=>({...c,text:byIndex.has(index)?byIndex.get(index).join(' '):c.text}));
  }
  function group(cues){
    if(!Array.isArray(cues)||!cues.length)throw Error('Сначала открой SRT.');
    const result=[];let pending=[];
    function flush(){if(!pending.length)return;const first=pending[0],last=pending.at(-1);result.push({start:first.c.start,end:last.c.end,text:normalize(pending.map(x=>x.c.text).join(' ')),originalText:pending.map(x=>x.c.originalText).join(' '),sourceIndices:pending.map(x=>x.i),words:pending.every(x=>Array.isArray(x.c.words))?pending.flatMap(x=>x.c.words):undefined,timingEstimated:pending.some(x=>x.c.timingEstimated),appearance:{role:'speech',size:100,accentSize:100,position:50,color:'#ffffff',motion:'soft'}});pending=[];}
    cues.forEach((c,i)=>{
      if(!Number.isSafeInteger(c.start)||!Number.isSafeInteger(c.end)||c.end<=c.start||c.end-c.start>6000)throw Error('Некорректный тайминг блока '+(i+1));
      if(pending.length){const prev=pending.at(-1).c,text=normalize(pending.map(x=>x.c.text).join(' ')),next=normalize(text+' '+c.text);
        const boundary=c.start<prev.end||c.start-prev.end>350||c.end-pending[0].c.start>6000;
        const full=next.length>40&&text.length>=18&&!trailing.test(text);
        if(boundary||full)flush();
      }
      pending.push({c,i});const text=normalize(pending.map(x=>x.c.text).join(' '));
      if(/[.!?…]$/.test(text)||(/[,:;]$/.test(text)&&text.length>=22))flush();
    });flush();
    for(let i=1;i<result.length;i++){
      const current=result[i],previous=result[i-1];
      if(current.text.split(/\s+/).length>2||current.end-current.start>1200||current.start-previous.end>350||current.start<previous.end)continue;
      if((previous.text+' '+current.text).length<=48&&current.end-previous.start<=6000&&!/[.!?…]$/.test(previous.text)){
        previous.text=previous.text+' '+current.text;previous.originalText+=' '+current.originalText;previous.end=current.end;previous.sourceIndices.push(...current.sourceIndices);result.splice(i,1);i--;continue;
      }
      if(previous.sourceIndices.length>2&&!/[.!?…]$/.test(previous.text)){
        const retained=previous.sourceIndices.slice(0,-1),moved=[previous.sourceIndices.at(-1)];
        let remaining=retained.map(k=>cues[k].text).join(' ').trim();
        while(retained.length>1&&trailing.test(remaining)){moved.unshift(retained.pop());remaining=retained.map(k=>cues[k].text).join(' ').trim();}
        if(remaining.length>=18){previous.sourceIndices=retained;current.sourceIndices.unshift(...moved);previous.text=normalize(remaining);previous.end=cues[retained.at(-1)].end;current.start=cues[moved[0]].start;current.text=normalize(moved.map(k=>cues[k].text).join(' ')+' '+current.text);previous.originalText=previous.sourceIndices.map(k=>cues[k].originalText).join(' ');current.originalText=current.sourceIndices.map(k=>cues[k].originalText).join(' ');}
      }
    }
    return result;
  }
  function validate(source,proposals){
    if(!Array.isArray(proposals)||proposals.length!==source.length)throw Error('План должен содержать все фразы.');
    let highlights=0;
    const result=source.map((cue,i)=>{const p=proposals[i];
      if(p.index!==i||typeof p.text!=='string'||!p.text.trim()||p.text.length>120||p.text.split('\n').length>2||!['speech','title','accent'].includes(p.role))throw Error('Некорректная фраза '+(i+1));
      if(p.role!=='speech')highlights++;
      return {...cue,spokenText:cue.spokenText||cue.text,text:p.text.trim(),appearance:{...cue.appearance,role:p.role,motion:p.role==='title'?'write':cue.appearance?.motion||'soft'}};
    });
    if(highlights>Math.ceil(source.length*.25))throw Error('Слишком много акцентов. Максимум один на четыре фразы.');
    return result;
  }
  function correctReference(cues,reference){
    if(!reference.trim())throw Error('Вставь сценарий для сверки.');
    const transcript=cues.map(c=>({...c,text:c.spokenText||c.text})),aligned=alignReference(transcript,reference);
    return aligned.map((c,i)=>{
      // Reference correction is for ordinary speech only. Highlights are immutable here.
      if(['title','accent'].includes(cues[i].appearance?.role))return {...cues[i]};
      const appearance={role:'speech',size:100,accentSize:100,position:50,color:'#ffffff',motion:'soft',...cues[i].appearance};
      if(!['speech','title','accent'].includes(appearance.role))appearance.role='speech';
      // A deleted transcript word must not create an empty clip or move neighbouring timing.
      if(!c.text.trim())return {...cues[i],appearance,referenceReview:true};
      const changed=c.text!==transcript[i].text;
      return {...c,start:cues[i].start,end:cues[i].end,text:c.text,spokenText:cues[i].spokenText?c.text:undefined,appearance,words:changed?null:cues[i].words,sourceWords:changed?(cues[i].sourceWords||cues[i].words):cues[i].sourceWords,referenceCorrected:changed};
    });
  }
  root.SubtitleEditorial={group,validate,alignReference,correctReference};
  if(typeof module!=='undefined')module.exports=root.SubtitleEditorial;
})(typeof window==='undefined'?globalThis:window);
