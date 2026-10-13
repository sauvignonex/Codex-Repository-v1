(function(){
 var stroot=File($.fileName).parent.parent.fsName,stout=Folder(stroot+'/dist/art001-readability-comparison/typography');if(!stout.exists)stout.create();
 var stlog=File(stout.fsName+'/metrics.txt');stlog.open('w');
 try{
  if(!app.project.file||decodeURI(app.project.file.name).indexOf('Subtitle Studio')<0)throw Error('Foreign project');
  var stbase=null;
  for(var sti=1;sti<=app.project.numItems;sti++){
   var stitem=app.project.item(sti);if(stitem.name==='SS ART001 Pass5 A A')stbase=stitem;
   if(stitem.name.indexOf('SS ART001 Spacing Study ')===0)throw Error('Study already exists; inspect before replay');
  }
  if(!stbase)throw Error('Missing own source comp');
  var stvalues=[-24,-36,-48];
  for(var stn=0;stn<stvalues.length;stn++){
   var stcomp=stbase.duplicate();stcomp.name='SS ART001 Spacing Study '+stvalues[stn];
   var stmain=stcomp.layer('Подстрока'),stprop=stmain.text.sourceText,stdoc=stprop.value;
   stdoc.tracking=stvalues[stn];stprop.setValue(stdoc);
   var sttmp=stcomp.layer('Резерв речи'),stword=stprop.value;stword.text=stword.text.split(/\s+/)[0];sttmp.text.sourceText.setValue(stword);
   var stwr=sttmp.sourceRectAtTime(0,false),stmr=stmain.sourceRectAtTime(0,false);
   stcomp.layer('Настройки').effect(2)(1).setValue((stwr.width+22)/(stmr.width+36));stword.text='';sttmp.text.sourceText.setValue(stword);
   var stfont=stprop.valueAtTime(1.6,false),stscale=stmain.transform.scale.valueAtTime(1.6,false);
   if(stprop.expressionError||stmain.transform.scale.expressionError||stmain.transform.position.expressionError)throw Error('Expression error');
   stlog.writeln('tracking='+stvalues[stn]+' font='+stfont.font+' style='+stfont.fontObject.styleName+' substitute='+stfont.fontObject.isSubstitute+' scaleX='+stscale[0]+' scaleY='+stscale[1]+' layers='+stcomp.numLayers);
   stcomp.saveFrameToPng(25/30,File(stout.fsName+'/first-'+(-stvalues[stn])+'.png'));
   stcomp.saveFrameToPng(1.6,File(stout.fsName+'/hold-'+(-stvalues[stn])+'.png'));
  }
  app.project.save(File(stout.fsName+'/Subtitle Studio A Typography Study.aep'));stlog.writeln('SUCCESS 3 snapshots x first/hold; not full motion or Premiere acceptance');
 }catch(ste){stlog.writeln('ERROR '+String(ste));}
 stlog.close();
})();
