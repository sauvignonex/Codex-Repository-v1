(function(){
 var p2root=File($.fileName).parent.parent.fsName,p2out=Folder(p2root+'/dist/art001-pass4-a/native');if(!p2out.exists)p2out.create();
 var p2log=File(p2out.fsName+'/build.txt');function p2note(s){p2log.open('a');p2log.writeln(s);p2log.close();}
 try{
  if(!app.project.file||decodeURI(app.project.file.name).indexOf('Subtitle Studio')<0)throw Error('Foreign or unsaved AE project');
  for(var p2i=1;p2i<=app.project.numItems;p2i++)if(app.project.item(p2i).name.indexOf('SS ART001 Pass4 A r2 ')===0)throw Error('Pass4 A r2 already exists: inspect before rerun');
  var p2file=File(p2root+'/development-scripts/art001-pass4-a-plan.json');p2file.open('r');var p2plans=eval('('+p2file.read()+')');p2file.close();
  var p2cases=0,p2reads=0;function p4Boundary(c){var main=c.layer('Подстрока'),tmp=c.layer('Резерв речи'),td=main.text.sourceText.value;td.text=td.text.split(/\s+/)[0];tmp.text.sourceText.setValue(td);var wr=tmp.sourceRectAtTime(0,false),mr=main.sourceRectAtTime(0,false);c.layer('Настройки').effect(2)(1).setValue((wr.width+22)/(mr.width+36));td.text='';tmp.text.sourceText.setValue(td);}
  for(var p2n=0;p2n<p2plans.length;p2n++){
   var p2spec=p2plans[p2n],p2comp=app.project.items.addComp('SS ART001 Pass4 A r2 '+p2spec.id,1080,1920,1,6,30);
   p2comp.motionGraphicsTemplateName=p2comp.name;p2comp.motionBlur=true;p2comp.shutterAngle=180;p2comp.shutterPhase=-90;p2comp.motionBlurSamplesPerFrame=8;p2comp.motionBlurAdaptiveSampleLimit=16;
   var p2ctl=p2comp.layers.addNull();p2ctl.name='Настройки';p2ctl.enabled=false;
   var p2duration=p2ctl.property('ADBE Effect Parade').addProperty('ADBE Slider Control');p2duration.name='Длительность';p2duration.property(1).setValue(3);p2duration.property(1).addToMotionGraphicsTemplateAs(p2comp,'Длительность');var p4edge=p2ctl.property('ADBE Effect Parade').addProperty('ADBE Slider Control');p4edge.name='Граница первого слова';p4edge.property(1).setValue(.36);p2duration=p2ctl.property('ADBE Effect Parade').property(1);
   for(var p2k=0;p2k<2;p2k++){
    var p2ls=p2spec.layers[p2k],p2layer=p2comp.layers.addText(p2ls.text);p2layer.name=p2ls.name;p2layer.motionBlur=true;
    var p2text=p2layer.property('ADBE Text Properties').property('ADBE Text Document'),p2td=p2text.value;
    p2td.font=p2ls.font;p2td.fontSize=200;p2td.tracking=p2ls.tracking;p2td.fontCapsOption=FontCapsOption.FONT_NORMAL_CAPS;p2td.fauxBold=false;p2td.fauxItalic=false;p2td.applyFill=true;p2td.fillColor=[1,1,1];p2td.applyStroke=false;p2td.justification=ParagraphJustification.LEFT_JUSTIFY;p2td.autoLeading=true;p2text.setValue(p2td);
    p2text.expression=p2ls.source;p2text.addToMotionGraphicsTemplateAs(p2comp,p2ls.name);
    p2layer.transform.anchorPoint.expression=p2ls.anchor;p2layer.transform.position.expression=p2ls.position;p2layer.transform.scale.expression=p2ls.scale;p2layer.transform.opacity.expression=p2ls.opacity;
    var p2mask=p2layer.property('ADBE Mask Parade').addProperty('ADBE Mask Atom');p2mask.maskMode=MaskMode.ADD;p2mask.property('ADBE Mask Shape').expression=p2ls.mask;
    var p2shadow=p2layer.property('ADBE Effect Parade').addProperty('ADBE Drop Shadow');p2shadow.property(2).setValue(45);p2shadow.property(4).setValue(2);p2shadow.property(5).setValue(0);
    if(p2text.expression!==p2ls.source||p2layer.transform.position.expression!==p2ls.position||p2mask.property('ADBE Mask Shape').expression!==p2ls.mask)throw Error('Literal readback failed');
   }
   var p2reserve=p2comp.layers.addText('');p2reserve.name='Резерв речи';p2reserve.enabled=false;
   var p2durations=[.25,.5,1.2,3];
   for(var p2type=0;p2type<2;p2type++)for(var p2d=0;p2d<p2durations.length;p2d++){
    var p2dur=p2durations[p2d];p2duration.property(1).setValue(p2dur);
    var p2words=p2type===0?['Дар','Леса']:['Приобщение','Природная\rмудрость'];
    for(var p2w=0;p2w<2;p2w++){var p2tp=p2comp.layer(p2spec.layers[p2w].name).property('ADBE Text Properties').property('ADBE Text Document');var p2doc=p2tp.value;p2doc.text=p2words[p2w];p2tp.setValue(p2doc);}
    p4Boundary(p2comp);var p2frames=Math.ceil(p2dur*30);
    for(var p2f=0;p2f<p2frames;p2f++){
     var p2time=Math.min(p2dur-.001,p2f/30);
     for(var p2z=0;p2z<2;p2z++){
      var p2check=p2comp.layer(p2spec.layers[p2z].name),p2props=[p2check.transform.position,p2check.transform.anchorPoint,p2check.transform.scale,p2check.transform.opacity,p2check.property('ADBE Text Properties').property('ADBE Text Document'),p2check.property('ADBE Mask Parade').property(1).property('ADBE Mask Shape')];
      for(var p2p=0;p2p<p2props.length;p2p++){p2props[p2p].valueAtTime(p2time,false);p2reads++;if(p2props[p2p].expressionError)throw Error(p2props[p2p].expressionError);}
     }
     if(p2f===0||p2f===Math.floor(p2frames/3)||p2f===Math.floor(p2frames/2)||p2f===p2frames-1)p2comp.saveFrameToPng(p2time,File(p2out.fsName+'/'+p2spec.id+'-'+p2type+'-'+p2d+'-'+p2f+'.png'));
    }
    p2cases++;p2note('CASE '+p2spec.id+' type='+p2type+' duration='+p2dur+' frames='+p2frames+' expressionErrors=0');
   }
   for(var p2r=0;p2r<2;p2r++){var p2restore=p2comp.layer(p2spec.layers[p2r].name).property('ADBE Text Properties').property('ADBE Text Document'),p2restored=p2restore.value;p2restored.text=p2spec.layers[p2r].text;p2restore.setValue(p2restored);}
   p4Boundary(p2comp);p2duration.property(1).setValue(p2spec.referenceFrames/30);p2comp.saveFrameToPng(1.6,File(p2out.fsName+'/'+p2spec.id+'-reference-hold.png'));
   var p3frames=p2spec.referenceFrames;var p3folder=Folder(p2out.fsName+'/full-alpha');if(!p3folder.exists)p3folder.create();for(var p3f=0;p3f<p3frames;p3f++){p2comp.saveFrameToPng(p3f/30,File(p3folder.fsName+'/'+p2spec.id+'-'+('000'+p3f).slice(-3)+'.png'));}p2note('FULL_ALPHA '+p2spec.id+' frames='+p3frames);
   p2note('COMP '+p2comp.name+' layers='+p2comp.numLayers+' literalReadback=true');
  }
  app.project.save(File(p2out.fsName+'/Subtitle Studio ART001 Pass4 A r2.aep'));p2note('SUCCESS cases='+p2cases+' reads='+p2reads+' sampleFrames=32+1 fullFrames=89');
 }catch(p2error){p2note('ERROR '+String(p2error));}
})();
