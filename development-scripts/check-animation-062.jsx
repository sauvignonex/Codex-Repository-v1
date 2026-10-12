(function(){var base='C:/Users/Artem/Documents/Codex/2026-10-12/files-mentioned-by-the-user-md/outputs/subtitle-studio',log=File(base+'/animation-062-render.txt');log.open('w');try{
 var c=null;for(var i=1;i<=app.project.numItems;i++)if(app.project.item(i).name==='Subtitle Studio Vertical 062 Adaptive')c=app.project.item(i);if(!c)throw Error('062 missing');
 app.beginSuppressDialogs();var ctl=c.layer('Настройки'),saved=[ctl.effect(1)(1).value,ctl.effect(4)(1).value,ctl.effect(7)(1).value];
 var names=['Основной текст','Рукописный акцент','Текст речи'];var errors=0,checks=0;
 for(var role=1;role<=3;role++)for(var motion=0;motion<=3;motion++)for(var d=0;d<4;d++){
  var duration=[.1,.233,1.2,6][d];ctl.effect(1)(1).setValue(role);ctl.effect(4)(1).setValue(motion);ctl.effect(7)(1).setValue(duration);
  for(var moment=0;moment<5;moment++)for(var k=0;k<names.length;k++){var l=c.layer(names[k]),props=[l.text.sourceText,l.transform.scale,l.transform.position,l.transform.opacity];for(var z=0;z<props.length;z++){props[z].valueAtTime(duration*[0,.08,.20,.5,.98][moment],false);checks++;if(props[z].expressionError){errors++;log.writeln('ERROR '+names[k]+' '+props[z].expressionError);}}}
 }
 for(var restore=0;restore<3;restore++)ctl.effect([1,4,7][restore])(1).setValue(saved[restore]);if(errors)throw Error('Expression errors '+errors);log.writeln('CHECKS '+checks+' ERRORS '+errors);
 log.writeln('LAYERS '+c.numLayers);log.writeln('SUCCESS');
}catch(e){log.writeln('ERROR '+String(e));}finally{try{app.endSuppressDialogs(false);}catch(ignore){}log.close();}})();