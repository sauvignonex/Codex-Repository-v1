// Run only in the dedicated 064 project; restore all modified controls and do not save.
(function(){
 var base=File($.fileName).parent.parent.fsName,log=File(base+'/dual-color-native-064.txt'),c=null,saved=[],props=[];log.open('w');
 try{
  for(var i=1;i<=app.project.numItems;i++)if(app.project.item(i).name==='Subtitle Studio Vertical 064 Dual Color')c=app.project.item(i);
  if(!c)throw Error('Открой отдельный проект 064 Dual Color.');
  var ctl=c.layer('Настройки'),ids=[1,5,8,9,10],names=['Основной текст','Рукописный акцент','Текст речи'],fonts=['BebasNeueCyrillic','Christopher','CeraPro-Medium'];
  for(i=0;i<ids.length;i++){props.push(ctl.effect(ids[i])(1));saved.push(props[i].value);}
  var shared=[.2,.3,.4],red=[1,0,0],white=[1,1,1];ctl.effect(5)(1).setValue(shared);ctl.effect(9)(1).setValue(red);ctl.effect(10)(1).setValue(white);
  var count=0;
  for(var split=0;split<=1;split++)for(var role=1;role<=3;role++){
   ctl.effect(8)(1).setValue(split);ctl.effect(1)(1).setValue(role);
   for(var n=0;n<names.length;n++){
    var property=c.layer(names[n]).text.sourceText,value=property.valueAtTime(.6,false),expected=split===0||n===2?shared:n===0?red:white;
    if(property.expressionError)throw Error(property.expressionError);
    if(value.font!==fonts[n])throw Error('Неверный шрифт: '+names[n]);
    for(var channel=0;channel<3;channel++)if(Math.abs(value.fillColor[channel]-expected[channel])>.001)throw Error('Неверный цвет '+names[n]+' role='+role+' split='+split);
    count++;
   }
  }
  log.writeln('SUCCESS color/font samples='+count);log.writeln('Это проверка свойств AE; видео в Premiere, экспорт MOGRT и подключение панели ещё требуют приёмки.');
 }catch(e){log.writeln('ERROR '+String(e));}
 finally{for(var r=0;r<saved.length;r++)try{props[r].setValue(saved[r]);}catch(e){log.writeln('RESTORE ERROR '+String(e));}log.close();}
})();
