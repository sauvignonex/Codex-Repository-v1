(function(){
// Run this script from its repository location in a dedicated Subtitle Studio AE project.
var base=File($.fileName).parent.parent.fsName;
var log=File(base+'/template-build-063.txt'),c=null;log.open('w');
try{
 var name=app.project&&app.project.file?decodeURI(app.project.file.name):'';
 if(!app.project||app.project.numItems>0&&name.indexOf('Subtitle Studio')<0&&name.indexOf('template07')<0)throw Error('Открыт чужой проект.');
 for(var i=1;i<=app.project.numItems;i++)if(app.project.item(i).name==='Subtitle Studio Vertical 063 Adaptive')throw Error('Шаблон уже создан. Повторный запуск остановлен.');
 // Create only output folders inside this checkout; source bundles do not contain recovery data.
 var outputs=['/recovery-inputs','/recovery-inputs/templates','/premiere-subtitles-cep/templates'];
 for(var folderIndex=0;folderIndex<outputs.length;folderIndex++){var outputFolder=Folder(base+outputs[folderIndex]);if(!outputFolder.exists&&!outputFolder.create())throw Error('Не удалось создать папку: '+outputFolder.fsName);}
 app.beginSuppressDialogs();
 c=app.project.items.addComp('Subtitle Studio Vertical 063 Adaptive',1080,1920,1,6,30);c.motionGraphicsTemplateName=c.name;c.motionBlur=true;c.shutterAngle=180;c.shutterPhase=-90;c.motionBlurSamplesPerFrame=8;c.motionBlurAdaptiveSampleLimit=16;
 var ctl=c.layers.addNull();ctl.name='Настройки';ctl.enabled=false;
 function slider(n,v){var e=ctl.property('ADBE Effect Parade').addProperty('ADBE Slider Control');e.name=n;e.property(1).setValue(v);e.property(1).addToMotionGraphicsTemplateAs(c,n);}
 slider('Роль: 1 заголовок, 2 речь, 3 акцент',1);slider('Масштаб',50);slider('Высота',50);slider('Анимация: 0 нет, 1 мягкая, 2 акцент, 3 раскрытие',3);
 var color=ctl.property('ADBE Effect Parade').addProperty('ADBE Color Control');color.name='Цвет';color.property(1).setValue([1,1,1]);color.property(1).addToMotionGraphicsTemplateAs(c,'Цвет');
 slider('Масштаб акцента',50);slider('Длительность',6);
 function layer(n,text,font,height,offset){
  var l=c.layers.addText(text);l.name=n;l.motionBlur=true;
  var p=l.property('ADBE Text Properties').property('ADBE Text Document'),t=p.value;t.fontCapsOption=FontCapsOption.FONT_NORMAL_CAPS;t.fauxBold=false;t.fauxItalic=false;t.font=font;t.fontSize=200;t.justification=ParagraphJustification.CENTER_JUSTIFY;t.applyFill=true;t.fillColor=[1,1,1];t.applyStroke=false;t.autoLeading=true;p.setValue(t);if(p.value.font!==font)throw Error('Шрифт недоступен: '+font+'; получен '+p.value.font);
  p.expression='text.sourceText.style.setFont("'+font+'").setFontSize(200).setAllCaps(false).setSmallCaps(false).setFillColor(thisComp.layer("Настройки").effect(5)(1)).setText(value.toString());';p.addToMotionGraphicsTemplateAs(c,n);
  // Text geometry is independent of transforms and layer masks. No duplicate text layers.
  var rect='var r=thisLayer.sourceRectAtTime(0,false);';
  var prefix='var ctl=thisComp.layer("Настройки");var role=Math.round(ctl.effect(1)(1));var motion=Math.round(ctl.effect(4)(1));var duration=Math.max(.034,Math.min(6,ctl.effect(7)(1)));var hand=thisLayer.name==="Рукописный акцент";var speech=role==2;var letters=Math.max(1,text.sourceText.toString().replace(/[^0-9A-Za-zА-Яа-яЁё]/g,"").length);var delay=role==1&&hand&&motion!=0?Math.min(.075+.005*Math.min(14,letters),duration*.12):0;var speed=speech?.095+.005*Math.min(14,letters):hand&&motion==3?.30+.02*Math.min(14,letters):.16+.0075*Math.min(18,letters);var intro=Math.min(speed,duration*.32);var outro=Math.min(speech?.07:.10,duration*.16);function sat(x){return Math.max(0,Math.min(1,x));}function out(x){x=sat(x);return 1-Math.pow(1-x,3);}function smooth(x){x=sat(x);return x*x*(3-2*x);}var u=sat((time-delay)/intro);var leave=sat((time-(duration-outro))/outro);';
  var active=n==='Основной текст'?'role==1':n==='Рукописный акцент'?'(role==1||role==3)':'role==2';
  var roleGuard='var role=Math.round(thisComp.layer("Настройки").effect(1)(1));';
  l.transform.anchorPoint.expression=roleGuard+'if('+active+'){'+rect+'role==2?[r.left+r.width,0]:[r.left+r.width/2,r.top+r.height/2];}else [0,0];';
  l.transform.scale.expression=roleGuard+'if('+active+'){'+prefix+rect+'var m=Math.max(.7,Math.min(1.3,ctl.effect(2)(1)/50));var a=hand?Math.max(.7,Math.min(1.5,ctl.effect(6)(1)/50)):1;var s=speech?Math.min(55*m/200,620/Math.max(1,r.width),170/Math.max(1,r.height)):Math.min('+height+'*m*a/Math.max(1,r.height),710/Math.max(1,r.width));var f=1;if(motion==2&&!speech){if(u<.72)f=.955+.057*out(u/.72);else f=1.012-.012*smooth((u-.72)/.28);}[100*s*f,100*s*f];}else [0,0];';
  l.transform.position.expression=roleGuard+'if('+active+'){'+prefix+rect+'if(speech){[964,Math.max(315,Math.min(1100,375+(ctl.effect(3)(1)-50)*19.2))];}else{var y=Math.max(420,Math.min(1380,ctl.effect(3)(1)*19.2));var dy=role==1?'+offset+':0;var w=r.width*transform.scale[0]/100,h=r.height*transform.scale[1]/100;var cy=speech?Math.max(260+h/2,Math.min(1200-h/2,320+h/2+(ctl.effect(3)(1)-50)*19.2)):Math.max(260+h/2,Math.min(1570-h/2,y+dy));var x=speech?964-w/2:cy+h/2>1320?Math.min(540,840-w/2):540;var lift=motion==0?0:(speech?8:motion==2?16:22)*(1-out(u))-(speech?4:8)*smooth(leave);var shift=hand&&motion==3?-8*(1-smooth(u)):0;[x+shift,Math.max(250+h/2,Math.min(1570-h/2,cy+lift))];}}else [0,0];';
  var visible=n==='Основной текст'?'role==1':n==='Рукописный акцент'?'(role==1||role==3)':'role==2';
  l.transform.opacity.expression=prefix+'var fade=Math.min(speech?.035:.055,duration*.12);var f=motion==0||speech&&duration<=.100001?100:100*Math.min(out((time-delay)/fade),1-smooth(leave));('+visible+')?f:0;';
  if(n==='Рукописный акцент'||n==='Основной текст'){
   var mask=l.property('ADBE Mask Parade').addProperty('ADBE Mask Atom');mask.name='Раскрытие';mask.maskMode=MaskMode.ADD;
   mask.property('ADBE Mask Shape').expression=roleGuard+'if('+active+'){'+prefix+rect+'var pad=26;var f=motion==3?(hand?smooth(u):out(u)):1;var x=r.left-pad,y=r.top-pad,w=r.width+2*pad,h=r.height+2*pad;var edge=x+w*f;if(hand){var tip=Math.min(28,w*.08)*Math.sin(Math.PI*f);createPath([[x,y],[edge+tip,y],[edge-tip,y+h],[x,y+h]],[],[],true);}else{var top=y+h*(1-f);createPath([[x,top],[x+w,top],[x+w,y+h],[x,y+h]],[],[],true);}}else createPath([[0,0],[0,0],[0,0]],[],[],true);';
  }
  // A single small shadow preserves legibility without a soft blur over every word.
  var shadow=l.property('ADBE Effect Parade').addProperty('ADBE Drop Shadow');shadow.property(2).setValue(45);shadow.property(4).setValue(2);shadow.property(5).setValue(0);
  log.writeln(n+' font='+p.value.font+' textError='+p.expressionError);
 }
 layer('Основной текст','КЕДРОВАЯ','BebasNeueCyrillic',145,-80);layer('Рукописный акцент','Бочка','Christopher',130,80);layer('Текст речи','Текст речи','CeraPro-Medium',190,0);
 var folder=Folder(base+'/visual-check-0.6.2');if(!folder.exists)folder.create();c.time=1;c.saveFrameToPng(1,File(folder.fsName+'/063-full.png'));
 log.writeln('MOTIONBLUR '+c.motionBlur+' shutter='+c.shutterAngle);
 app.project.save(File(base+'/recovery-inputs/templates/Subtitle Studio Vertical 063 Adaptive.aep'));
 var result=c.exportAsMotionGraphicsTemplate(true,base+'/premiere-subtitles-cep/templates');log.writeln('EXPORT '+result);if(!result)throw Error('Экспорт не подтверждён');log.writeln('SUCCESS');
}catch(e){log.writeln('ERROR '+String(e));if(c)try{c.remove();}catch(ignore){}}
finally{try{app.endSuppressDialogs(false);}catch(ignore){}log.close();}
})();
