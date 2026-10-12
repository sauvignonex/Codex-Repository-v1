(() => {
  const player=new Audio();player.preload='metadata';
  let generation=0,button=null,timer=null,end=0;
  function stop(){generation++;clearInterval(timer);timer=null;player.pause();if(button){button.textContent='Прослушать';button.setAttribute('aria-pressed','false');}button=null;}
  function fileURL(path){
    if(typeof path!=='string'||!path)throw Error('Исходный звук не найден.');
    const normalized=path.replace(/\\/g,'/');
    if(!/^[a-z]:\//i.test(normalized)&&!normalized.startsWith('//'))throw Error('Нужен абсолютный путь к аудиофайлу.');
    const encoded=normalized.split('/').map(encodeURIComponent).join('/').replace(/^([a-z])%3A/i,'$1:');
    return normalized.startsWith('//')?'file:'+encoded:'file:///'+encoded;
  }
  async function play(cue,media,target){
    if(button===target&&timer){stop();return;}
    stop();const version=generation;
    const source=typeof media==='string'?{path:media,startMs:0}:media;
    if(!source||!Number.isFinite(source.startMs)||source.startMs<0)throw Error('Для этого набора нет звука проверки.');
    const start=Math.max(0,(cue.start-source.startMs)/1000-.12),finish=(cue.end-source.startMs)/1000+.12;
    if(!Number.isFinite(start)||!Number.isFinite(finish)||finish<=start)throw Error('Проверь тайминги фразы.');
    const url=fileURL(source.path);
    if(player.src!==url){player.src=url;player.load();}
    if(player.readyState<1)await new Promise((resolve,reject)=>{
      const timeout=setTimeout(()=>done(Error('Звук не загрузился. Проверь исходный файл.')),8000);
      function done(error){clearTimeout(timeout);player.removeEventListener('loadedmetadata',loaded);player.removeEventListener('error',failed);error?reject(error):resolve();}
      const loaded=()=>done(),failed=()=>done(Error('Не удалось открыть звук. Файл удалён или формат не поддерживается.'));
      player.addEventListener('loadedmetadata',loaded);player.addEventListener('error',failed);
    });
    if(version!==generation)return;
    if(start>=player.duration)throw Error('Фраза находится за пределами аудиофайла.');
    player.currentTime=start;end=Math.min(finish,player.duration);button=target;
    try{await player.play();if(version!==generation)return;button.textContent='Остановить';button.setAttribute('aria-pressed','true');timer=setInterval(()=>{if(player.currentTime>=end||player.ended)stop();},40);}
    catch(error){if(version!==generation)return;stop();throw Error('Не удалось включить звук. Нажми «Прослушать» ещё раз.');}
  }
  window.addEventListener('beforeunload',stop);
  window.SubtitleReviewAudio={play,stop,fileURL,get state(){return {playing:!player.paused,time:player.currentTime,end,source:player.src};}};
})();
