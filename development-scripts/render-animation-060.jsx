(function(){var base='C:/Users/Artem/Documents/Codex/2026-10-12/files-mentioned-by-the-user-md/outputs/subtitle-studio',log=File(base+'/animation-060-render.txt');log.open('w');try{
 var c=null;for(var i=1;i<=app.project.numItems;i++)if(app.project.item(i).name==='Subtitle Studio Vertical 060')c=app.project.item(i);if(!c)throw Error('060 missing');
 app.beginSuppressDialogs();var ctl=c.layer('Настройки');c.layer('Текст речи').transform.scale.expression=c.layer('Текст речи').transform.scale.expression.replace('64*m/200','55*m/200');
 var names=['Основной текст','Рукописный акцент','Текст речи'];var errors=0,checks=0;
 for(var role=1;role<=3;role++)for(var motion=0;motion<=3;motion++)for(var d=0;d<4;d++){
  var duration=[.1,.233,1.2,6][d];ctl.effect(1)(1).setValue(role);ctl.effect(4)(1).setValue(motion);ctl.effect(7)(1).setValue(duration);
  for(var k=0;k<names.length;k++){var l=c.layer(names[k]),props=[l.text.sourceText,l.transform.scale,l.transform.position,l.transform.opacity];for(var z=0;z<props.length;z++){props[z].valueAtTime(duration*.5,false);checks++;if(props[z].expressionError){errors++;log.writeln('ERROR '+names[k]+' '+props[z].expressionError);}}}
 }
 if(errors)throw Error('Expression errors '+errors);log.writeln('CHECKS '+checks+' ERRORS '+errors);
 var folder=Folder(base+'/visual-check-0.6.0');if(!folder.exists)folder.create();
 var scenes=[{name:'title-write',role:1,motion:3,duration:1.2},{name:'speech-soft',role:2,motion:1,duration:.8},{name:'accent-pop',role:3,motion:2,duration:1}];
 var p=c.layer('Текст речи').text.sourceText,t=p.value;t.text='фитотерапия';p.setValue(t);
 for(var s=0;s<scenes.length;s++){var scene=scenes[s],out=Folder(folder.fsName+'/'+scene.name);if(!out.exists)out.create();ctl.effect(1)(1).setValue(scene.role);ctl.effect(4)(1).setValue(scene.motion);ctl.effect(7)(1).setValue(scene.duration);for(var f=0;f<Math.round(scene.duration*30);f++){c.saveFrameToPng(f/30,File(out.fsName+'/'+('000'+f).slice(-3)+'.png'));}log.writeln('RENDER '+scene.name);}
 ctl.effect(1)(1).setValue(1);ctl.effect(4)(1).setValue(3);ctl.effect(7)(1).setValue(6);c.time=1;
 app.project.save(File(base+'/recovery-inputs/templates/Subtitle Studio Vertical 060.aep'));
 var exported=c.exportAsMotionGraphicsTemplate(true,base+'/premiere-subtitles-cep/templates');log.writeln('EXPORT '+exported);if(!exported)throw Error('Export failed');log.writeln('SUCCESS');
}catch(e){log.writeln('ERROR '+String(e));}finally{try{app.endSuppressDialogs(false);}catch(ignore){}log.close();}})();
