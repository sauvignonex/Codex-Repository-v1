/* All batch writes stay in a separately owned blank sequence. */
$._artemSubtitleBatch=$._artemSubtitleBatch||{attempted:false,sequenceID:null,clipID:null,projectPath:null,phase:'idle',completed:0,pending:false,clips:[]};
(function(){var names=['encode','valueJSON','getSequence','getClip','create','describe','setText','setNumber','setColor','setTiming','show'];for(var i=0;i<names.length;i++)$._artemSubtitleBatch[names[i]]=$._artemSubtitleTest[names[i]];})();
$._artemSubtitleBatch.prepareBegin=function(total,documentKey,newSequence){
    try{
        if(total!==Math.floor(total)||total<1||total>1000)throw Error('Неподдерживаемое число блоков.');
        if(typeof documentKey!=='string'||!documentKey||documentKey.length>100)throw Error('Не определён документ SRT.');
        if(this.attempted){
            if(newSequence!==true||this.pending||(this.phase!=='complete'&&this.phase!=='ready'))throw Error('Последний импорт не подтверждён. Повторное создание остановлено.');
            var binding=this.verifyBinding();if(binding.indexOf('ok|')!==0)throw Error(decodeURIComponent(binding.split('|')[1]));
        }
        var source=app.project.activeSequence;
        if(!source||source.frameSizeHorizontal!==1080||source.frameSizeVertical!==1920)throw Error('Открой вертикальную секвенцию 1080×1920.');
        var root=$._artemSubtitleTest.extensionRoot;
        if(!root||!File(root+'/templates/Subtitle Studio Vertical 062 Adaptive.mogrt').exists)throw Error('Шаблон субтитров не найден.');
        if(!File(app.path+'/Settings/SequencePresets/Social/Social Media Portrait 9x16 30 fps.sqpreset').exists)throw Error('Пресет вертикальной секвенции не найден.');
        return 'ok';
    }catch(error){return this.encode(['error',String(error),'unchanged']);}
};
$._artemSubtitleBatch.begin=function(total,documentKey,newSequence){
    var e=this.encode;
    var prepared=this.prepareBegin(total,documentKey,newSequence);if(prepared!=='ok')return prepared;
    try{
        if(total!==Math.floor(total)||total<1||total>1000)throw Error('Неподдерживаемое число блоков.');
        if(typeof documentKey!=='string'||!documentKey||documentKey.length>100)throw Error('Не определён документ SRT.');
        if(this.attempted){
            if(newSequence!==true||this.pending||(this.phase!=='complete'&&this.phase!=='ready'))throw Error('Пакет уже запускался. Неподтверждённый импорт повторять нельзя.');
            var binding=this.verifyBinding();if(binding.indexOf('ok|')!==0)return binding;
            this.previousRuns=this.previousRuns||[];this.previousRuns.push({sequenceID:this.sequenceID,projectPath:this.projectPath,clips:this.clips,documentKey:this.documentKey});
            this.attempted=false;this.sequenceID=null;this.clipID=null;this.projectPath=null;this.completed=0;this.clips=[];this.audioAttempted=false;this.phase='idle';
        }
        this.documentKey=documentKey;this.extensionRoot=$._artemSubtitleTest.extensionRoot;this.total=total;this.pending=true;var raw=this.create();if(raw.indexOf('ok|')!==0)return raw;this.getSequence().name='[Subtitle Studio] SRT '+new Date().getTime();return this.describe();
    }catch(error){return e(['error',String(error)]);}
};
$._artemSubtitleBatch.append=function(index,startMs){
    var e=this.encode;
    try{
        if(this.pending||index!==this.completed||index>=this.total)throw Error('Неподтверждённый или повторный шаг пакета.');
        if(typeof startMs!=='number'||!isFinite(startMs)||startMs<0)throw Error('Неверный тайминг блока.');
        var s=this.getSequence(),tb=Number(s.timebase),ticks=Math.round(startMs*254016000/tb)*tb;
        var track=-1;
        for(var t=0;t<s.videoTracks.numTracks;t++){var busy=false;for(var k=0;k<s.videoTracks[t].clips.numItems;k++)if(Number(s.videoTracks[t].clips[k].end.ticks)>ticks)busy=true;if(!busy){track=t;break;}}
        if(track<0)throw Error('Нет свободной дорожки для перекрывающегося блока.');
        var file=File(this.extensionRoot+'/templates/Subtitle Studio Vertical 062 Adaptive.mogrt');if(!file.exists)throw Error('Шаблон не найден.');
        this.pending=true;this.phase='import-'+index;
        var c=s.importMGT(file.fsName,String(ticks),track,0);if(!c)throw Error('Импорт не вернул клип.');this.clipID=String(c.nodeId);return this.describe();
    }catch(error){return e(['error',String(error)]);}
};
$._artemSubtitleBatch.commit=function(index){
    try{this.getClip();if(!this.pending||index!==this.completed)throw Error('Шаг уже подтверждён или нарушен порядок.');this.clips.push(this.clipID);this.completed++;this.pending=false;this.phase=this.completed===this.total?'complete':'ready';return this.encode(['ok',this.completed,this.total]);}catch(error){return this.encode(['error',String(error)]);}
};
$._artemSubtitleBatch.finish=function(){
    try{if(this.pending||this.completed!==this.total)throw Error('Пакет ещё не завершён.');this.clipID=this.clips[0];return this.show();}catch(error){return this.encode(['error',String(error)]);}
};
$._artemSubtitleBatch.select=function(index,documentKey){
    try{if(this.verifyBinding()!=='ok|present')throw Error('Клипы предыдущего набора изменены или удалены. Создай новую секвенцию.');if(documentKey!==this.documentKey||!documentKey)throw Error('Этот SRT не связан с созданной секвенцией. Создай новую секвенцию для изменённого набора.');if(this.pending||(this.phase!=='complete'&&this.phase!=='ready'))throw Error('Последний импорт не подтверждён.');if(index!==Math.floor(index)||index<0||index>=this.completed||index>=this.clips.length)throw Error('Этот блок ещё не создан. Создай новую секвенцию SRT.');this.clipID=this.clips[index];return this.describe();}catch(error){return this.encode(['error',String(error)]);}
};
$._artemSubtitleBatch.status=function(){return this.encode(['ok',this.completed,this.total||0,this.phase,this.sequenceID||'',this.documentKey||'']);};
$._artemSubtitleBatch.addSourceAudio=function(path){
    try{
        if(this.verifyBinding()!=='ok|present'||this.completed!==this.total)throw Error('Графика ещё не подтверждена.');
        var startMs=0;if(typeof path==='object'&&path){startMs=Number(path.startMs);path=path.path;}
        if(typeof path!=='string'||!isFinite(startMs)||startMs<0)throw Error('Некорректный исходный звук.');
        var s=this.getSequence(),file=File(path),track=s.audioTracks[0];
        if(!file.exists||!track)throw Error('Исходный звук не найден.');
        if(track.clips.numItems!==0)throw Error('На звуковой дорожке уже есть клип. Автоматическая перезапись остановлена.');
        if(this.audioAttempted)throw Error('Добавление звука уже запускалось. Проверь секвенцию.');
        this.audioAttempted=true;
        // Import a fresh item into our bin so existing project-item in/out points stay intact.
        var bin=app.project.rootItem.createBin('[Subtitle Studio] Исходник '+new Date().getTime());
        if(!bin||!app.project.importFiles([file.fsName],true,bin,false)||bin.children.numItems!==1)throw Error('Не удалось однозначно импортировать звук.');
        var count=0;for(var t=0;t<s.videoTracks.numTracks;t++)count+=s.videoTracks[t].clips.numItems;
        var ticks=Math.round(startMs*254016000/Number(s.timebase))*Number(s.timebase),time=new Time();time.ticks=String(ticks);
        track.overwriteClip(bin.children[0],time.seconds);
        var after=0;for(var t=0;t<s.videoTracks.numTracks;t++)after+=s.videoTracks[t].clips.numItems;
        if(track.clips.numItems!==1||after!==count||Number(track.clips[0].start.ticks)!==ticks)throw Error('Проверь добавленный звук. Результат отличается от ожидаемого.');
        return 'ok';
    }catch(error){return this.encode(['error',String(error)]);}
};
$._artemSubtitleBatch.registry=function(){return this.encode(['ok',this.documentKey||'',this.projectPath||'',this.sequenceID||'',this.total||0,this.completed,this.phase,this.pending?'1':'0',this.clipID||''].concat(this.clips));};
$._artemSubtitleBatch.verifyBinding=function(){
    try{
        if(String(app.project.path)!==this.projectPath)throw Error('Пакет относится к другому проекту.');
        if(this.pending||(this.phase!=='ready'&&this.phase!=='complete'))throw Error('Последний импорт не подтверждён.');
        var s=null;for(var i=0;i<app.project.sequences.numSequences;i++)if(String(app.project.sequences[i].sequenceID)===this.sequenceID)s=app.project.sequences[i];
        if(!s)return this.encode(['ok','missing']);
        var found={};for(var t=0;t<s.videoTracks.numTracks;t++)for(var k=0;k<s.videoTracks[t].clips.numItems;k++)found[String(s.videoTracks[t].clips[k].nodeId)]=s.videoTracks[t].clips[k];
        for(var j=0;j<this.clips.length;j++)if(!found[this.clips[j]]||!found[this.clips[j]].getMGTComponent())return this.encode(['ok','changed']);
        return this.encode(['ok','present']);
    }catch(error){return this.encode(['error',String(error)]);}
};
$._artemSubtitleBatch.restoreRegistry=function(record){
    try{
        if(this.attempted||this.sequenceID)return this.status();
        if(!record||record.version!==1||typeof record.documentKey!=='string'||!record.documentKey||typeof record.sequenceID!=='string'||!record.sequenceID||typeof record.projectPath!=='string'||String(app.project.path)!==record.projectPath)throw Error('Сохранённый пакет относится к другому проекту.');
        if((record.phase!=='complete'&&record.phase!=='ready')||record.pending||record.completed<1||record.completed>record.total||(record.phase==='complete'&&record.total!==record.completed)||record.total<1||record.total>1000||!record.clips||record.clips.length!==record.completed)throw Error('Предыдущий пакет содержит неподтверждённый импорт. Проверь секвенцию перед повторным созданием.');
        var s=null;for(var i=0;i<app.project.sequences.numSequences;i++)if(String(app.project.sequences[i].sequenceID)===record.sequenceID)s=app.project.sequences[i];
        if(!s){this.sequenceID=record.sequenceID;this.projectPath=record.projectPath;this.documentKey=record.documentKey;this.total=record.total;this.completed=record.completed;this.clips=record.clips.slice();this.clipID=this.clips[0];this.phase=record.phase;this.pending=false;this.attempted=true;return this.status();}
        var found={},unique={};for(var t=0;t<s.videoTracks.numTracks;t++)for(var k=0;k<s.videoTracks[t].clips.numItems;k++)found[String(s.videoTracks[t].clips[k].nodeId)]=s.videoTracks[t].clips[k];
        for(var j=0;j<record.clips.length;j++){var id=record.clips[j];if(typeof id!=='string'||!id||unique[id])throw Error('Состав сохранённого пакета изменён.');unique[id]=true;}
        this.sequenceID=record.sequenceID;this.projectPath=record.projectPath;this.documentKey=record.documentKey;this.total=record.total;this.completed=record.completed;this.clips=record.clips.slice();this.clipID=this.clips[0];this.phase=record.phase;this.pending=false;this.attempted=true;return this.status();
    }catch(error){return this.encode(['error',String(error)]);}
};

