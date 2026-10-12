(function(){
var base='C:/Users/Artem/Documents/Codex/2026-10-12/files-mentioned-by-the-user-md/outputs/subtitle-studio';
var log=File(base+'/template-build.txt');log.open('w');
try{
 if(!app.project)app.newProject();
 var filename=app.project.file?decodeURI(app.project.file.name):'';
 if(app.project.numItems>0&&filename.indexOf('Subtitle Studio')<0&&filename.indexOf('template07')<0)throw 'Открыт чужой проект. Открой пустой проект.';
 app.beginSuppressDialogs();
 var c=app.project.items.addComp('Subtitle Studio Vertical 040',1080,1920,1,6,30);
 c.motionGraphicsTemplateName='Subtitle Studio Vertical 040';
 var ctl=c.layers.addNull();ctl.name='Настройки';ctl.enabled=false;
 function slider(name,value){var e=ctl.property('ADBE Effect Parade').addProperty('ADBE Slider Control');e.name=name;e.property(1).setValue(value);e.property(1).addToMotionGraphicsTemplateAs(c,name);}
 slider('Роль: 1 заголовок, 2 речь, 3 акцент',1);slider('Масштаб',50);slider('Высота',50);slider('Анимация: 0 нет, 1 мягкая, 2 акцент',1);
 var color=ctl.property('ADBE Effect Parade').addProperty('ADBE Color Control');color.name='Цвет';color.property(1).setValue([1,1,1]);color.property(1).addToMotionGraphicsTemplateAs(c,'Цвет');
 slider('Масштаб акцента',50);slider('Длительность',6);
 function layer(name,text,font,height,offset){
  var l=c.layers.addText(text);l.name=name;
  var p=l.property('ADBE Text Properties').property('ADBE Text Document'),t=p.value;t.fontCapsOption=FontCapsOption.FONT_NORMAL_CAPS;t.fauxBold=false;t.fauxItalic=false;t.font=font;t.fontSize=200;t.justification=ParagraphJustification.CENTER_JUSTIFY;t.applyFill=true;t.fillColor=[1,1,1];t.applyStroke=false;t.autoLeading=true;p.setValue(t);
  p.expression='text.sourceText.style.setFont("'+font+'").setFontSize(200).setAllCaps(false).setSmallCaps(false).setFillColor(thisComp.layer("Настройки").effect(5)(1)).setText(value.toString());';
  p.addToMotionGraphicsTemplateAs(c,name);
  var prefix='var ctl=thisComp.layer("Настройки");var role=Math.round(ctl.effect(1)(1));var motion=Math.round(ctl.effect(4)(1));';
  l.transform.anchorPoint.expression='var r=sourceRectAtTime(time,false);[r.left+r.width/2,r.top+r.height/2];';
  l.transform.scale.expression=prefix+'var r=sourceRectAtTime(time,false);var m=Math.max(.7,Math.min(1.3,ctl.effect(2)(1)/50));var a=thisLayer.name==="Рукописный акцент"?Math.max(.7,Math.min(1.5,ctl.effect(6)(1)/50)):1;var s=Math.min('+height+'*m*a/Math.max(1,r.height),730/Math.max(1,r.width));var fade=motion==2?ease(time,0,.22,.9,1):1;[100*s*fade,100*s*fade];';
  l.transform.position.expression=prefix+'var y=Math.max(420,Math.min(1380,ctl.effect(3)(1)*19.2));var dy=role==1?'+offset+':0;var r=sourceRectAtTime(time,false);var w=r.width*transform.scale[0]/100,h=r.height*transform.scale[1]/100;var cy=Math.max(260+h/2,Math.min(1570-h/2,y+dy));var x=cy+h/2>1320?Math.min(540,840-w/2):540;[x,cy];';
  var visible=name==='Основной текст'?'role==1':name==='Рукописный акцент'?'(role==1||role==3)':'role==2';
  l.transform.opacity.expression=prefix+'var visible='+visible+';var duration=Math.max(.034,Math.min(6,ctl.effect(7)(1)));var fade=Math.min(.18,duration/4);var f=motion==0?100:Math.min(ease(time,0,fade,0,100),ease(time,duration-fade,duration,100,0));visible?f:0;';
  log.writeln(name+' font='+p.value.font+' bounds='+l.sourceRectAtTime(2,false).height+' error='+p.expressionError);
 }
 layer('Основной текст','МАРИЙСКИЙ','BebasNeueCyrillic',145,-80);
 layer('Рукописный акцент','Десерт','Christopher',130,80);
 layer('Текст речи','Марийский десерт','CeraPro-Medium',190,0);
 app.project.save(File(base+'/recovery-inputs/templates/Subtitle Studio Vertical 040.aep'));
 log.writeln('EXPORT '+c.exportAsMotionGraphicsTemplate(true,base+'/premiere-subtitles-cep/templates'));
 app.endSuppressDialogs(false);
}catch(e){log.writeln('ERROR '+String(e));try{app.endSuppressDialogs(false);}catch(ignore){}}
finally{log.close();}
})();


