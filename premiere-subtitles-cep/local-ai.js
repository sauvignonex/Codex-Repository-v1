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
      const folder=decodeURI(window.__adobe_cep__.getSystemPath('userData')).replace(/^file:\/\/\//,'').replace(/\\/g,'/').replace(/\/$/,'')+'/SubtitleStudio';
      if(window.cep.fs.stat(folder).err!==0&&window.cep.fs.makedir(folder).err!==0)throw Error('Не удалось сохранить задание запуска модели.');
      const statusPath=folder+'/topics-'+crypto.randomUUID()+'.json';
      if(window.cep.fs.writeFile(statusPath,JSON.stringify({phase:'pending'})).err!==0)throw Error('Не удалось сохранить задание запуска модели.');
      try{
        const process=window.cep.process.createProcess(config.python,root+'/local-ai-launcher.py',statusPath);if(process.err!==0)throw Error('Не удалось запустить локальную модель.');
        const readStatus=()=>{
          const raw=window.cep.fs.readFile(statusPath);if(raw.err!==0)return null;
          let status;try{status=JSON.parse(raw.data.replace(/^\ufeff/,''));}catch(_){throw Error('Повреждён ответ запуска локальной модели.');}
          if(!status||!['pending','started','loading','ready','error'].includes(status.phase))throw Error('Неверный ответ запуска локальной модели.');
          return status;
        };
        for(let i=0;i<60;i++){
          await new Promise(r=>setTimeout(r,1000));
          let status=readStatus();
          if(!status||status.phase==='pending'){
            const running=window.cep.process.isRunning(process.data);
            if(running.err===0&&running.data===false){
              // The wrapper may have published its response between readFile and isRunning.
              status=readStatus();
              if(!status||status.phase==='pending')throw Error('Python остановился до запуска модели. Проверь установку. Фразы сохранены.');
            }
          }
          if(status?.phase==='error')throw Error((typeof status.message==='string'&&status.message||'Не удалось запустить локальную модель.')+' Фразы сохранены; можно оформить темы вручную.');
          try{if(await healthy())return;}catch(error){if(error.message.includes('занят'))throw error;}
        }
        throw Error('Модель не загрузилась. Фразы сохранены; можно оформить темы вручную.');
      }finally{try{window.cep.fs.deleteFile(statusPath);}catch(_){}}

    })().finally(()=>{loading=null;});
    return loading;
  }};
})();
