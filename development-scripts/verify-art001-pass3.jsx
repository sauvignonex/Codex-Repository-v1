(function(){
 var p3v_root=File($.fileName).parent.parent.fsName,p3v_out=Folder(p3v_root+'/dist/art001-pass3/native');
 var p3v_pf=File(p3v_root+'/development-scripts/art001-pass3-plan.json');p3v_pf.open('r');var p3v_plans=eval('('+p3v_pf.read()+')');p3v_pf.close();
 var p3v_log=File(p3v_out.fsName+'/verification.txt');p3v_log.open('w');
 try{
  if(!app.project.file||decodeURI(app.project.file.name).indexOf('Subtitle Studio ART001 Pass3')<0)throw Error('Wrong own project');
  for(var p3v_n=0;p3v_n<p3v_plans.length;p3v_n++){
   var p3v_spec=p3v_plans[p3v_n],p3v_comp=null;
   for(var p3v_i=1;p3v_i<=app.project.numItems;p3v_i++)if(app.project.item(p3v_i).name==='SS ART001 Pass3 '+p3v_spec.id)p3v_comp=app.project.item(p3v_i);
   if(!p3v_comp)throw Error('Missing own p3v_comp '+p3v_spec.id);
   p3v_log.writeln('INPUT root='+p3v_root+' id='+p3v_spec.id+' frames='+p3v_spec.referenceFrames);p3v_comp.layer('Настройки').effect(1)(1).setValue(p3v_spec.referenceFrames/30);
   if(Math.abs(p3v_comp.layer('Настройки').effect(1)(1).value-p3v_spec.referenceFrames/30)>.00001)throw Error('Duration mismatch');
   for(var p3v_j=0;p3v_j<2;p3v_j++){
    var p3v_layer=p3v_comp.layer(p3v_spec.layers[p3v_j].name),p3v_tp=p3v_layer.text.sourceText;
    var p3v_td=p3v_tp.valueAtTime(1.6,false);
    p3v_log.writeln(p3v_spec.id+' '+p3v_layer.name+' font='+p3v_td.font+' text='+p3v_td.text+' scale='+p3v_layer.transform.scale.valueAtTime(1.6,false)[0]);
    if(p3v_td.font!==p3v_spec.layers[p3v_j].font||p3v_td.text!==p3v_spec.layers[p3v_j].text)throw Error('Actual font/text mismatch');
   }
   if(p3v_spec.id==='A')for(var p3v_f=0;p3v_f<p3v_spec.referenceFrames;p3v_f++)p3v_comp.saveFrameToPng(p3v_f/30,File(p3v_out.fsName+'/full-alpha/A-'+('000'+p3v_f).slice(-3)+'.png'));
   p3v_comp.saveFrameToPng(1.6,File(p3v_out.fsName+'/'+p3v_spec.id+'-reference-hold.png'));
   p3v_log.writeln('DURATION '+p3v_spec.id+' '+p3v_comp.layer('Настройки').effect(1)(1).value);
  }
  app.project.save();p3v_log.writeln('SUCCESS actual font/text and duration readback');
 }catch(p3v_e){p3v_log.writeln('ERROR line='+p3v_e.line+' '+String(p3v_e));}
 p3v_log.close();
})();

