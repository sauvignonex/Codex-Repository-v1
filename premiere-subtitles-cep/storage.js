(() => {
  const key='artem.subtitle-studio.v1';
  let saved=null,readFailed=false;
  try {saved=JSON.parse(localStorage.getItem(key)||'null');} catch (_) {readFailed=true;}
  window.subtitleStorage={widgetState:saved,setWidgetState:async value=>{
    localStorage.setItem(key,JSON.stringify(value));
    window.subtitleStorage.widgetState=value;
  }};
  if(readFailed) window.addEventListener('load',()=>{
    const warning=document.getElementById('ss-storage-warning');
    warning.textContent='Сохранённые настройки недоступны. Открыты настройки по умолчанию.';
    warning.hidden=false;
  });
})();
