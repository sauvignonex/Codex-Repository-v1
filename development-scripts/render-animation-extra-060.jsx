(function(){
var rootPath='C:/Users/Artem/Documents/Codex/2026-10-12/files-mentioned-by-the-user-md/outputs/subtitle-studio';
var taskLog=File(rootPath+'/animation-060-render-extra.txt');taskLog.open('w');
try{
var taskComp=null;for(var taskIndex=1;taskIndex<=app.project.numItems;taskIndex++)if(app.project.item(taskIndex).name==='Subtitle Studio Vertical 060')taskComp=app.project.item(taskIndex);
if(!taskComp)throw Error('Missing 060');app.beginSuppressDialogs();
var taskRun=String(new Date().getTime());taskLog.writeln('RUN '+taskRun);
function renderScene(taskName,taskRole,taskMotion,taskSeconds){
 var taskControls=taskComp.layer('Настройки');taskControls.effect(1)(1).setValue(taskRole);taskControls.effect(4)(1).setValue(taskMotion);taskControls.effect(7)(1).setValue(taskSeconds);
 app.purge(PurgeTarget.ALL_CACHES);var taskLayers=['Основной текст','Рукописный акцент','Текст речи'];for(var taskL=0;taskL<taskLayers.length;taskL++){var taskTextLayer=taskComp.layer(taskLayers[taskL]);taskTextLayer.transform.opacity.valueAtTime(taskSeconds/2,false);taskTextLayer.transform.scale.valueAtTime(taskSeconds/2,false);taskTextLayer.transform.position.valueAtTime(taskSeconds/2,false);}
 var taskFolder=Folder(rootPath+'/visual-check-0.6.0/'+taskName);if(!taskFolder.exists)taskFolder.create();var taskFrames=Math.round(taskSeconds*30);taskLog.writeln(taskName+' frames '+taskFrames);
 for(var taskFrame=1;taskFrame<taskFrames;taskFrame++){var taskFile=File(rootPath+'/visual-check-0.6.0/'+taskRun+'-'+taskName+'-'+('000'+taskFrame).slice(-3)+'.png');taskComp.saveFrameToPng(taskFrame/30,taskFile);for(var taskWait=0;taskWait<30&&!File(taskFile.fsName).exists;taskWait++)$.sleep(100);if(!File(taskFile.fsName).exists)throw Error('Missing rendered file '+taskFile.fsName);$.sleep(250);}
 taskLog.writeln('DONE '+taskName);
}
renderScene('speech-soft',2,1,0.8);renderScene('accent-pop',3,2,1.0);
var taskControls=taskComp.layer('Настройки');taskControls.effect(1)(1).setValue(1);taskControls.effect(4)(1).setValue(3);taskControls.effect(7)(1).setValue(6);taskComp.time=1;taskLog.writeln('SUCCESS');
}catch(taskError){taskLog.writeln('ERROR '+String(taskError)+' line '+String(taskError.line));}finally{try{app.endSuppressDialogs(false);}catch(ignore){}taskLog.close();}
})();
