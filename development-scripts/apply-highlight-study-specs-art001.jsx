(function(){
 var artRoot=File($.fileName).parent.parent.fsName,artFile=File(artRoot+'/development-scripts/art001-motion-specs.json');
 var artOut=Folder(artRoot+'/dist/art001-r3');if(!artOut.exists)artOut.create();
 var artLog=File(artOut.fsName+'/native.txt');function artNote(x){artLog.open('a');artLog.writeln(x);artLog.close();}
 try{
  if(!app.project.file||decodeURI(app.project.file.name)!=='Subtitle Studio ART001 Studies.aep')throw Error('Wrong study project');
  artFile.open('r');var artPlans=eval('('+artFile.read()+')');artFile.close();
  var artCount=0;
  for(var artI=1;artI<=app.project.numItems;artI++){
   var artComp=app.project.item(artI);if(!(artComp instanceof CompItem)||artComp.name.indexOf('SS ART001 Study ')!==0)continue;
   var artId=artComp.name.charAt(16),artPlan=null;
   for(var artN=0;artN<artPlans.length;artN++)if(artPlans[artN].id==artId)artPlan=artPlans[artN];
   if(!artPlan)throw Error('Missing literal plan '+artComp.name);
   for(var artK=0;artK<artPlan.layers.length;artK++){
    var artSpec=artPlan.layers[artK],artLayer=artComp.layer(artSpec.name);
    artLayer.transform.position.expression=artSpec.position;
    artLayer.transform.opacity.expression=artSpec.opacity;
    artLayer.property('ADBE Text Properties').property('ADBE Text Document').expression=artSpec.text;
    artLayer.property('ADBE Mask Parade').property(1).property('ADBE Mask Shape').expression=artSpec.mask;
    if(artLayer.transform.position.expression!==artSpec.position||artLayer.property('ADBE Text Properties').property('ADBE Text Document').expression!==artSpec.text||artLayer.property('ADBE Mask Parade').property(1).property('ADBE Mask Shape').expression!==artSpec.mask)throw Error('Readback mismatch '+artId);
   }
   for(var artF=0;artF<36;artF++){
    for(var artL=0;artL<artPlan.layers.length;artL++){
     var artLayerCheck=artComp.layer(artPlan.layers[artL].name),artProps=[artLayerCheck.transform.position,artLayerCheck.transform.scale,artLayerCheck.transform.opacity,artLayerCheck.property('ADBE Text Properties').property('ADBE Text Document'),artLayerCheck.property('ADBE Mask Parade').property(1).property('ADBE Mask Shape')];
     for(var artP=0;artP<artProps.length;artP++){artProps[artP].valueAtTime(artF/30,false);if(artProps[artP].expressionError)throw Error(artProps[artP].expressionError);}
    }
    artComp.saveFrameToPng(artF/30,File(artOut.fsName+'/'+artId+'-'+('000'+artF).slice(-3)+'.png'));
   }
   artNote('PASS '+artId+' literalReadback frames=36 propertyReads=360');artCount++;
  }
  if(artCount!==3)throw Error('Unexpected comp count '+artCount);
  app.project.save();artNote('SUCCESS 3 literal plans');
 }catch(artError){artNote('ERROR '+String(artError));}
})();
