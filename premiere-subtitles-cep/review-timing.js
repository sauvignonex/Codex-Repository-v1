(() => {
  function parse(value){
    value=String(value).trim();
    if(/^\d{2,3}:\d{2}:\d{2}[,.]\d{3}$/.test(value))return SubtitleSRT.time(value);
    if(!/^\d+(?:[,.]\d{1,3})?$/.test(value))throw Error('Введи секунды, например 12,450, или таймкод 00:00:12,450.');
    const ms=Math.round(Number(value.replace(',','.'))*1000);
    if(!Number.isSafeInteger(ms)||ms<0||ms>=3600000000)throw Error('Время за пределами допустимого диапазона.');
    return ms;
  }
  function check(cues){
    const errors=cues.map(()=>''),valid=(c)=>Number.isSafeInteger(c.start)&&Number.isSafeInteger(c.end)&&c.start>=0&&c.end<3600000000&&c.end>c.start;
    let latestEnd=-1,latestIndex=-1;
    cues.forEach((c,i)=>{
      if(!valid(c))errors[i]='Конец должен быть позже начала; время не может быть отрицательным.';
      else if(c.end-c.start<34)errors[i]='Фраза слишком короткая: нужно хотя бы 34 мс для кадра 30 fps.';
      else if(c.end-c.start>6000)errors[i]='Фраза длиннее 6 секунд. Раздели её при подготовке.';
      else if(i&&c.start<cues[i-1].start)errors[i]='Начало раньше предыдущей фразы: нарушен порядок блоков.';
      else if(c.start<latestEnd)errors[i]='Пересечение с фразой '+(latestIndex+1)+'. Исправь конец предыдущей или начало этой.';
      if(valid(c)&&c.end>latestEnd){latestEnd=c.end;latestIndex=i;}
    });
    return errors;
  }
  window.SubtitleReviewTiming={parse,check};
})();
