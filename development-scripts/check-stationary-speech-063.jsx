// Read-only project geometry check: run on the dedicated 063 AE project after building it.
(function(){
 var base=File($.fileName).parent.parent.fsName,log=File(base+'/stationary-speech-native-063.txt'),c=null,saved=[],original=null,errors=0,checks=0;
 log.open('w');
 try{
  for(var i=1;i<=app.project.numItems;i++)if(app.project.item(i).name==='Subtitle Studio Vertical 063 Adaptive')c=app.project.item(i);
  if(!c)throw Error('Сначала собери отдельный 063 Adaptive.');
  var ctl=c.layer('Настройки'),l=c.layer('Текст речи'),ids=[1,3,4,7],words=['и','лес','баня','мёд','где','скрабирование','пихтового'];
  for(i=0;i<ids.length;i++)saved.push(ctl.effect(ids[i])(1).value);
  original=l.text.sourceText.value;ctl.effect(1)(1).setValue(2);
  if(original.font!=='CeraPro-Medium')throw Error('Неверный шрифт речи: '+original.font);
  for(var pos=0;pos<3;pos++)for(var mode=0;mode<4;mode++)for(var d=0;d<4;d++)for(var w=0;w<words.length;w++){
   var height=[0,50,100][pos],duration=[.06,.1,.233,1.2][d];ctl.effect(3)(1).setValue(height);ctl.effect(4)(1).setValue(mode);ctl.effect(7)(1).setValue(duration);
   var text=l.text.sourceText.value;text.text=words[w];l.text.sourceText.setValue(text);
   for(var k=0;k<5;k++){
    var t=duration*[0,.05,.5,.9,.99][k],a=l.transform.anchorPoint.valueAtTime(t,false),s=l.transform.scale.valueAtTime(t,false),p=l.transform.position.valueAtTime(t,false),opacity=l.transform.opacity.valueAtTime(t,false),r=l.sourceRectAtTime(t,false);
    var props=[l.text.sourceText,l.transform.anchorPoint,l.transform.scale,l.transform.position,l.transform.opacity];
    for(var z=0;z<props.length;z++)if(props[z].expressionError)throw Error(props[z].expressionError);
    var right=p[0]+(r.left+r.width-a[0])*s[0]/100,baseline=p[1]-a[1]*s[1]/100,expected=Math.max(315,Math.min(1100,375+(height-50)*19.2));
    if(Math.abs(right-964)>.01||Math.abs(baseline-expected)>.01)throw Error('Скачок: '+words[w]+' t='+t+' right='+right+' baseline='+baseline);
    var expectedScale=Math.min(55/200,620/Math.max(1,r.width),170/Math.max(1,r.height))*100;
    if(Math.abs(s[0]-expectedScale)>.01||Math.abs(s[1]-expectedScale)>.01)throw Error('Анимационный масштаб речи: '+words[w]);
    if(duration<=.1&&opacity<99.99)throw Error('Короткое слово невидимо: '+words[w]);checks++;
   }
  }
  log.writeln('SUCCESS geometry samples='+checks+' font='+original.font);
  log.writeln('Это проверка свойств AE. Видео стыков слов, Premiere и полный кэш ещё требуют отдельной проверки.');
 }catch(e){errors++;log.writeln('ERROR '+String(e));}
 finally{
  if(c&&original)try{l.text.sourceText.setValue(original);for(var restore=0;restore<saved.length;restore++)ctl.effect(ids[restore])(1).setValue(saved[restore]);}catch(e){log.writeln('RESTORE ERROR '+String(e));}
  log.close();
 }
})();
