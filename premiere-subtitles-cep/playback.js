(() => {
 const button=document.getElementById('playback-prepare'),status=document.getElementById('playback-status');
 let running=false;
 function sync(){button.disabled=running||Boolean(window.subtitleBatch?.getState().busy)||!window.subtitleBatch?.getState().record?.completed;}
 for(const event of ['subtitle:batch-change','subtitle:document-change'])window.addEventListener(event,sync);
 button.addEventListener('click',async()=>{
  const state=window.subtitleBatch?.getState();if(running||state?.busy)return;
  const record=state?.record;if(!record?.completed){status.textContent='Сначала создай субтитры в Premiere.';return;}
  running=true;window.subtitleGraphic.setBusy(true);sync();
  status.textContent='Premiere рассчитывает анимации. Дождись закрытия окна рендера. Его можно отменить без изменения клипов.';
  try{
   await window.subtitleHost.ensure();
   const raw=await window.subtitleGraphic.call('$._artemSubtitleStudio.renderPlayback('+JSON.stringify(record.sequenceID)+')');
   const rows=window.subtitleGraphic.parse(raw);
   status.textContent='Кэш просмотра готов. Нажми пробел в Premiere и проверь воспроизведение. После изменения субтитров повтори расчёт.';
  }catch(e){status.textContent=e.message;}
  finally{running=false;window.subtitleGraphic.setBusy(false);sync();}
 });sync();
})();
