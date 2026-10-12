(function(){
var base='C:/Users/Artem/Documents/Codex/2026-10-12/files-mentioned-by-the-user-md/outputs/subtitle-studio';
var log=File(base+'/template-build-060.txt'),c=null;log.open('w');
try{
 var name=app.project&&app.project.file?decodeURI(app.project.file.name):'';
 if(!app.project||app.project.numItems>0&&name.indexOf('Subtitle Studio')<0&&name.indexOf('template07')<0)throw Error('Открыт чужой проект.');
 for(var i=1;i<=app.project.numItems;i++)if(app.project.item(i).name==='Subtitle Studio Vertical 060')throw Error('Шаблон уже создан. Повторный запуск остановлен.');
 app.beginSuppressDialogs();
 c=app.project.items.addComp('Subtitle Studio Vertical 060',1080,1920,1,6,30);c.motionGraphicsTemplateName=c.name;c.motionBlur=true;c.shutterAngle=180;c.shutterPhase=-90;c.motionBlurSamplesPerFrame=16;c.motionBlurAdaptiveSampleLimit=64;
 var ctl=c.layers.addNull();ctl.name='Настройки';ctl.enabled=false;
 function slider(n,v){var e=ctl.property('ADBE Effect Parade').addProperty('ADBE Slider Control');e.name=n;e.property(1).setValue(v);e.property(1).addToMotionGraphicsTemplateAs(c,n);}
 slider('Роль: 1 заголовок, 2 речь, 3 акцент',1);slider('Масштаб',50);slider('Высота',50);slider('Анимация: 0 нет, 1 мягкая, 2 акцент, 3 раскрытие',3);
 var color=ctl.property('ADBE Effect Parade').addProperty('ADBE Color Control');color.name='Цвет';color.property(1).setValue([1,1,1]);color.property(1).addToMotionGraphicsTemplateAs(c,'Цвет');
 slider('Масштаб акцента',50);slider('Длительность',6);
 function layer(n,text,font,height,offset){
  var l=c.layers.addText(text);l.name=n;l.motionBlur=true;
  var p=l.property('ADBE Text Properties').property('ADBE Text Document'),t=p.value;t.fontCapsOption=FontCapsOption.FONT_NORMAL_CAPS;t.fauxBold=false;t.fauxItalic=false;t.font=font;t.fontSize=200;t.justification=ParagraphJustification.CENTER_JUSTIFY;t.applyFill=true;t.fillColor=[1,1,1];t.applyStroke=false;t.autoLeading=true;p.setValue(t);
  p.expression='text.sourceText.style.setFont("'+font+'").setFontSize(200).setAllCaps(false).setSmallCaps(false).setFillColor(thisComp.layer("Настройки").effect(5)(1)).setText(value.toString());';p.addToMotionGraphicsTemplateAs(c,n);
  // The reference has no masks or animators. Reveal geometry cannot feed back into its bounds.
  var ref=c.layers.addText(text);ref.name='Размер: '+n;ref.guideLayer=true;ref.shy=true;ref.transform.opacity.setValue(0);
  ref.property('ADBE Text Properties').property('ADBE Text Document').setValue(t);
  ref.property('ADBE Text Properties').property('ADBE Text Document').expression='text.sourceText.style.setFont("'+font+'").setFontSize(200).setAllCaps(false).setSmallCaps(false).setText(thisComp.layer("'+n+'").text.sourceText.toString());';
  var rect='var r=thisComp.layer("Размер: '+n+'").sourceRectAtTime(time,false);';
  var prefix='var ctl=thisComp.layer("Настройки");var role=Math.round(ctl.effect(1)(1));var motion=Math.round(ctl.effect(4)(1));var duration=Math.max(.034,Math.min(6,ctl.effect(7)(1)));var hand=thisLayer.name==="Рукописный акцент";var speech=role==2;var delay=role==1&&hand&&motion!=0?Math.min(.12,duration*.10):0;var intro=Math.min(speech?.16:hand&&motion==3?.36:.24,duration*.30);var outro=Math.min(speech?.10:.14,duration*.16);function sat(x){return Math.max(0,Math.min(1,x));}function out(x){x=sat(x);return 1-Math.pow(1-x,3);}var u=sat((time-delay)/intro);var leave=sat((time-(duration-outro))/outro);';
  l.transform.anchorPoint.expression=rect+'[r.left+r.width/2,r.top+r.height/2];';
  l.transform.scale.expression=prefix+rect+'var m=Math.max(.7,Math.min(1.3,ctl.effect(2)(1)/50));var a=hand?Math.max(.7,Math.min(1.5,ctl.effect(6)(1)/50)):1;var s=speech?Math.min(55*m/200,620/Math.max(1,r.width),170/Math.max(1,r.height)):Math.min('+height+'*m*a/Math.max(1,r.height),710/Math.max(1,r.width));var f=1;if(motion==2){if(speech)f=.97+.03*out(u);else if(u<.65)f=.92+.105*out(u/.65);else f=1.025-.025*out((u-.65)/.35);}if(motion!=0)f*=1-.015*leave;[100*s*f,100*s*f];';
  l.transform.position.expression=prefix+rect+'var y=Math.max(420,Math.min(1380,ctl.effect(3)(1)*19.2));var dy=role==1?'+offset+':0;var w=r.width*transform.scale[0]/100,h=r.height*transform.scale[1]/100;var cy=speech?Math.max(260+h/2,Math.min(1200-h/2,320+h/2+(ctl.effect(3)(1)-50)*19.2)):Math.max(260+h/2,Math.min(1570-h/2,y+dy));var x=speech?964-w/2:cy+h/2>1320?Math.min(540,840-w/2):540;var lift=motion==0?0:(speech?14:motion==2?18:30)*(1-out(u))-10*leave;var shift=hand&&motion==3?-18*(1-out(u)):0;[x+shift,Math.max(250+h/2,Math.min(1570-h/2,cy+lift))];';
  var visible=n==='Основной текст'?'role==1':n==='Рукописный акцент'?'(role==1||role==3)':'role==2';
  l.transform.opacity.expression=prefix+'var fade=Math.min(speech?.06:.07,duration*.12);var f=motion==0?100:100*Math.min(out((time-delay)/fade),1-leave*leave);('+visible+')?f:0;';
  if(n==='Рукописный акцент'||n==='Основной текст'){
   var mask=l.property('ADBE Mask Parade').addProperty('ADBE Mask Atom');mask.name='Раскрытие';mask.maskMode=MaskMode.ADD;
   mask.property('ADBE Mask Shape').expression=prefix+rect+'var pad=26;var f=motion==3?out(u):1;var x=r.left-pad,y=r.top-pad,w=(r.width+2*pad)*f,h=r.height+2*pad;createPath([[x,y],[x+w,y],[x+w,y+h],[x,y+h]],[],[],true);';
  }
  var shadow=l.property('ADBE Effect Parade').addProperty('ADBE Drop Shadow');shadow.property(2).setValue(45);shadow.property(4).setValue(3);shadow.property(5).setValue(8);
  log.writeln(n+' font='+p.value.font+' textError='+p.expressionError);
 }
 layer('Основной текст','КЕДРОВАЯ','BebasNeueCyrillic',145,-80);layer('Рукописный акцент','Бочка','Christopher',130,80);layer('Текст речи','Текст речи','CeraPro-Medium',190,0);
 var folder=Folder(base+'/visual-check-0.6.0');if(!folder.exists)folder.create();c.time=1;c.saveFrameToPng(1,File(folder.fsName+'/060-full.png'));
 log.writeln('MOTIONBLUR '+c.motionBlur+' shutter='+c.shutterAngle);
 app.project.save(File(base+'/recovery-inputs/templates/Subtitle Studio Vertical 060.aep'));
 var result=c.exportAsMotionGraphicsTemplate(true,base+'/premiere-subtitles-cep/templates');log.writeln('EXPORT '+result);if(!result)throw Error('Экспорт не подтверждён');log.writeln('SUCCESS');
}catch(e){log.writeln('ERROR '+String(e));if(c)try{c.remove();}catch(ignore){}}
finally{try{app.endSuppressDialogs(false);}catch(ignore){}log.close();}
})();
