(() => {
  let loading=null;
  window.subtitleHost={
    ensure() {
      if(loading)return loading;
      loading=new Promise((resolve,reject)=>{
        let timer;
        try {
          const cep=window.__adobe_cep__;
          if(!cep?.evalScript||!cep.getSystemPath)throw Error('Открой панель внутри Premiere. CEP-загрузка недоступна.');
          let root=decodeURI(cep.getSystemPath('extension')).replace(/\\/g,'/');
          root=root.replace(/^file:\/\/\//,'').replace(/\/$/,'');
          if(!root)throw Error('CEP не вернул путь расширения.');
          const script='(function(){try{var root='+JSON.stringify(root)+';'+
            'var files=["host.jsx","test-graphic.jsx","batch.jsx"];'+
            'for(var i=0;i<files.length;i++){var f=File(root+"/"+files[i]);if(!f.exists)throw Error("Не найден JSX: "+f.fsName);}' +
            'for(var i=0;i<files.length;i++)$.evalFile(File(root+"/"+files[i]));'+
            'if(typeof $._artemSubtitleStudio==="undefined"||typeof $._artemSubtitleStudio.inspect!=="function"||typeof $._artemSubtitleTest==="undefined"||typeof $._artemSubtitleTest.create!=="function")throw Error("JSX загружен не полностью");'+
            '$._artemSubtitleTest.extensionRoot=root;return "ready|0.6.2";}catch(e){return "load-error|"+encodeURIComponent(String(e)+"; line="+e.line+"; file="+e.fileName);}})()';
          timer=setTimeout(()=>reject(Error('Premiere не ответил на проверку загрузки JSX за 10 секунд. Создание не запускалось.')),10000);
          cep.evalScript(script,raw=>{
            clearTimeout(timer);
            try{
            if(raw==='ready|0.6.2')resolve(raw);
            else {
              const detail=String(raw).startsWith('load-error|')?decodeURIComponent(String(raw).slice(11)):String(raw);
              reject(Error('Ошибка загрузки JSX: '+detail));
            }
            }catch(error){reject(Error('Premiere вернул повреждённый ответ загрузки JSX: '+String(error)));}
          });
        }catch(error){clearTimeout(timer);reject(error);}
      });
      loading=loading.catch(error=>{loading=null;throw error;});
      return loading;
    }
  };
})();





