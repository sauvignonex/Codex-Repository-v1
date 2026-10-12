(function(){var base='C:/Users/Artem/Documents/Codex/2026-10-12/files-mentioned-by-the-user-md/outputs/subtitle-studio',log=File(base+'/animation-061-render.txt');log.open('w');try{
 var c=null;for(var i=1;i<=app.project.numItems;i++)if(app.project.item(i).name==='Subtitle Studio Vertical 061')c=app.project.item(i);if(!c)throw Error('061 missing');
 app.beginSuppressDialogs();var ctl=c.layer('Настройки');c.layer('Текст речи').transform.scale.expression=c.layer('Текст речи').transform.scale.expression.replace('64*m/200','55*m/200');
 var names=['Основной текст','Рукописный акцент','Текст речи'];var errors=0,checks=0;
 for(var role=1;role<=3;role++)for(var motion=0;motion<=3;motion++)for(var d=0;d<4;d++){
  var duration=[.1,.233,1.2,6][d];ctl.effect(1)(1).setValue(role);ctl.effect(4)(1).setValue(motion);ctl.effect(7)(1).setValue(duration);
  for(var k=0;k<names.length;k++){var l=c.layer(names[k]),props=[l.text.sourceText,l.transform.scale,l.transform.position,l.transform.opacity];for(var z=0;z<props.length;z++){props[z].valueAtTime(duration*.5,false);checks++;if(props[z].expressionError){errors++;log.writeln('ERROR '+names[k]+' '+props[z].expressionError);}}}
 }
 if(errors)throw Error('Expression errors '+errors);log.writeln('CHECKS '+checks+' ERRORS '+errors);
 log.writeln('LAYERS '+c.numLayers);log.writeln('SUCCESS');
}catch(e){log.writeln('ERROR '+String(e));}finally{try{app.endSuppressDialogs(false);}catch(ignore){}log.close();}})();