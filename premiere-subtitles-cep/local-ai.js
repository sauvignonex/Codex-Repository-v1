(() => {
  let loading=null;
  async function healthy(){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),1800);let response;try{response=await fetch('http://127.0.0.1:18767/v1/models',{signal:controller.signal});}finally{clearTimeout(timer);}
    if(!response.ok)return false;
    const data=await response.json();
    if(!Array.isArray(data.data)||!data.data.some(m=>typeof m?.id==='string'&&m.id.includes('Qwen3-4B-Instruct-2507')))throw Error('Локальный порт занят другой моделью.');
    return true;
  }
  window.subtitleLocalAI={ensure(){
    if(loading)return loading;
    loading=(async()=>{
      try{if(await healthy())return;}catch(error){if(error.message.includes('занят'))throw error;}
      if(!window.cep?.process)throw Error('Локальная модель не запущена. Открой панель в Premiere.');
      const root=decodeURI(window.__adobe_cep__.getSystemPath('extension')).replace(/^file:\/\/\//,'').replace(/\\/g,'/').replace(/\/$/,'');
      const config=window.SubtitleEngineConfig.read('topics');
      const process=window.cep.process.createProcess(config.python,root+'/local-ai-launcher.py');if(process.err!==0)throw Error('Не удалось запустить локальную модель.');
      for(let i=0;i<60;i++){await new Promise(r=>setTimeout(r,1000));try{if(await healthy())return;}catch(error){if(error.message.includes('занят'))throw error;}}
      throw Error('Модель не загрузилась. Фразы сохранены; можно оформить темы вручную.');
    })().finally(()=>{loading=null;});
    return loading;
  }};
})();
