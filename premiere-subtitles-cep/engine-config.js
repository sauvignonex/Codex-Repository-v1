(() => {
 const labels={python:'Python',ffmpeg:'FFmpeg',whisper:'Whisper',model:'модель распознавания',llama:'движок смысловых заголовков',topicsModel:'модель смысловых заголовков'};
 const guidance='Настрой локальные движки в папке плагина и повтори. Текущие фразы сохранены.';
 const fail=message=>{throw Error(message+' '+guidance);};
 function read(mode){
  if(!window.cep?.fs||!window.__adobe_cep__?.getSystemPath)throw Error('Открой панель в Premiere для работы с локальными движками.');
  const root=decodeURI(window.__adobe_cep__.getSystemPath('extension')).replace(/^file:\/\/\//,'').replace(/\\/g,'/').replace(/\/$/,'');
  const raw=window.cep.fs.readFile(root+'/transcription-config.json');
  if(raw.err!==0)fail('Не найдены настройки локальных движков.');
  let config;try{config=JSON.parse(raw.data.replace(/^\ufeff/,''));}catch(_){fail('Повреждён файл настроек локальных движков.');}
  if(!config||typeof config!=='object'||Array.isArray(config))fail('Неверный формат настроек локальных движков.');
  const keys=mode==='speech'?['python','ffmpeg','whisper','model']:mode==='topics'?['python','llama','topicsModel']:null;
  if(!keys)throw Error('Неизвестный тип локального движка.');
  // Validate all path values before passing anything to CEP or starting a process.
  for(const key of keys)if(typeof config[key]!=='string'||!config[key].trim())fail('Не указан путь: '+labels[key]+'.');
  if(mode==='topics'&&(typeof config.llamaSha256!=='string'||!/^[0-9a-f]{64}$/i.test(config.llamaSha256)))fail('Не задана контрольная сумма движка смысловых заголовков.');
  for(const key of keys){const file=window.cep.fs.stat(config[key]);if(file.err!==0||file.data?.isDirectory===true||file.data?.isFile===false)fail('Не найден файл: '+labels[key]+'.');}
  const worker=mode==='speech'?'transcription-worker.py':'local-ai-launcher.py';
  if(window.cep.fs.stat(root+'/'+worker).err!==0)fail('Не найден обработчик локального движка.');
  return config;
 }
 window.SubtitleEngineConfig={read};
})();
