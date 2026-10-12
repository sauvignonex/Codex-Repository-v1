(() => {
  const button=document.getElementById('host-check'),status=document.getElementById('host-status');
  button.addEventListener('click',async()=>{
    if(!window.__adobe_cep__?.evalScript){status.textContent='Панель открыта вне Premiere. Связь с приложением недоступна.';return;}
    button.disabled=true;status.textContent='Проверяем связь…';
    let finished=false;
    const finish=text=>{if(finished)return;finished=true;clearTimeout(timer);button.disabled=false;status.textContent=text;};
    const timer=setTimeout(()=>finish('Premiere не ответил за 10 секунд. Заверши открытые диалоги и повтори проверку.'),10000);
    try {
      await window.subtitleHost.ensure();
      window.__adobe_cep__.evalScript('$._artemSubtitleStudio.inspect()',raw=>{
        try {
          const parts=String(raw).split('|').map(decodeURIComponent);
          if(parts[0]!=='ok'||parts.length!==5)throw new Error('bad response');
          finish('Premiere '+parts[1]+(parts[2]?'\nСеквенция: '+parts[2]+'\nКадр: '+parts[3]+' × '+parts[4]:'\nАктивная секвенция не открыта.'));
        } catch (_) {finish('Не удалось прочитать параметры Premiere. Повтори проверку после открытия проекта.');}
      });
    } catch (error) {finish('Не удалось загрузить связь с Premiere: '+error.message);}
  });
})();
