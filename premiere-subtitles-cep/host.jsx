$._artemSubtitleStudio = $._artemSubtitleStudio || {};
// This is the manifest entry point. $.fileName is unreliable here in CEP.
// Additional JSX is loaded explicitly by host-loader.js using the CEP path.
$._artemSubtitleStudio.inspect = function () {
    try {
        var s = app.project ? app.project.activeSequence : null;
        var values = ['ok', app.version, s ? s.name : '', s ? s.frameSizeHorizontal : '', s ? s.frameSizeVertical : ''];
        for (var i = 0; i < values.length; i++) values[i] = encodeURIComponent(String(values[i]));
        return values.join('|');
    } catch (e) {
        return 'error|' + encodeURIComponent(String(e));
    }
};
$._artemSubtitleStudio.selectedAudio = function () {
    function reply(values) { for (var k=0;k<values.length;k++) values[k]=encodeURIComponent(String(values[k]));return values.join('|'); }
    try {
        var s=app.project.activeSequence, clips=[];
        if(!s)return 'ok|none';
        for(var t=0;t<s.audioTracks.numTracks;t++)for(var c=0;c<s.audioTracks[t].clips.numItems;c++) {
            var item=s.audioTracks[t].clips[c];if(item.isSelected())clips.push(item);
        }
        if(!clips.length)return 'ok|none';
        if(clips.length!==1)throw Error('Выдели один аудиоклип. Для нескольких клипов пока выбери готовый аудиофайл.');
        var clip=clips[0],path=clip.projectItem.getMediaPath();
        if(!path||!File(path).exists)throw Error('Исходный файл выделенного клипа недоступен. Для вложенной секвенции сначала экспортируй звук.');
        if(Math.abs(Number(clip.getSpeed())-1)>0.00001||clip.isSpeedReversed())throw Error('Для клипа с изменённой скоростью сначала экспортируй звук: иначе тайминги будут неверными.');
        var start=Math.round(clip.start.seconds*1000),sourceIn=Math.round(clip.inPoint.seconds*1000),duration=Math.round(clip.duration.seconds*1000);
        if(!isFinite(start)||!isFinite(sourceIn)||!isFinite(duration)||start<0||sourceIn<0||duration<=0)throw Error('Не удалось прочитать границы выделенного аудиоклипа.');
        return reply(['ok','clip',path,sourceIn,duration,start,clip.name,s.sequenceID]);
    }catch(e){return reply(['error',String(e)]);}
};

// Render all subtitle ranges, independently of the user's marked In/Out/work area.
$._artemSubtitleStudio.renderPlayback = function(expectedSequenceID) {
    function reply(a){for(var i=0;i<a.length;i++)a[i]=encodeURIComponent(String(a[i]));return a.join('|');}
    var s=null,saved=null,changed=false,response=null;
    try {
        s=app.project.activeSequence;
        if(!s||String(s.sequenceID)!==expectedSequenceID||s.name.indexOf('[Subtitle Studio]')!==0)throw Error('Открой созданную секвенцию субтитров перед подготовкой просмотра.');
        var clips=[],first=Infinity,last=0;
        for(var t=0;t<s.videoTracks.numTracks;t++)for(var c=0;c<s.videoTracks[t].clips.numItems;c++){
            var clip=s.videoTracks[t].clips[c];if(clip.getMGTComponent()){
                var a=Number(clip.start.seconds),b=Number(clip.end.seconds);if(!isFinite(a)||!isFinite(b)||b<=a)throw Error('Не удалось прочитать границы субтитров.');
                clips.push([a,b]);first=Math.min(first,a);last=Math.max(last,b);
            }
        }
        if(!clips.length)throw Error('В активной секвенции нет редактируемых субтитров.');
        app.enableQE();var q=qe.project.getActiveSequence();
        if(!q||typeof q.renderAll!=='function'||typeof q.getGreenBarTimes!=='function')throw Error('В этой версии Premiere запусти Sequence → Render In to Out.');
        saved={inPoint:s.getInPointAsTime(),outPoint:s.getOutPointAsTime(),workIn:s.getWorkAreaInPointAsTime(),workOut:s.getWorkAreaOutPointAsTime(),workEnabled:s.isWorkAreaEnabled()};
        var frame=Number(s.timebase)/254016000000;
        if(!isFinite(frame)||frame<=0)throw Error('Не удалось прочитать частоту кадров секвенции.');
        if(!saved.inPoint||!saved.outPoint||!isFinite(saved.inPoint.seconds)||!isFinite(saved.outPoint.seconds)||saved.workEnabled&&(!saved.workIn||!saved.workOut||!isFinite(saved.workIn.seconds)||!isFinite(saved.workOut.seconds)))throw Error('Не удалось сохранить исходные диапазоны. Расчёт не запускался.');
        changed=true;if(s.setInPoint(first)===false||s.setOutPoint(last)===false)throw Error('Premiere не изменил диапазон расчёта.');if(saved.workEnabled){if(s.setWorkAreaInPoint(first)===false||s.setWorkAreaOutPoint(last)===false)throw Error('Premiere не изменил рабочий диапазон. Отключи Work Area Bar и повтори.');}
        var started=new Date().getTime(),result=q.renderAll();
        if(!app.project.activeSequence||String(app.project.activeSequence.sequenceID)!==expectedSequenceID)throw Error('Активная секвенция изменилась во время расчёта. Проверь кэш созданных субтитров.');
        var green=q.getGreenBarTimes(),ranges=[],covered=0,tolerance=frame+.000001;
        if(!green||typeof green.length!=='number'||green.length%2!==0)throw Error('Premiere вернул неполные диапазоны кэша.');
        for(var i=0;i+1<green.length;i+=2){var a=green[i]?Number(green[i].secs):NaN,b=green[i+1]?Number(green[i+1].secs):NaN;if(!isFinite(a)||!isFinite(b)||a<0||b<=a)throw Error('Premiere вернул неверные границы кэша.');ranges.push([a,b]);}
        ranges.sort(function(a,b){return a[0]-b[0];});
        var merged=[];for(var i=0;i<ranges.length;i++){var r=ranges[i],prev=merged.length?merged[merged.length-1]:null;if(prev&&r[0]<=prev[1]+tolerance)prev[1]=Math.max(prev[1],r[1]);else merged.push(r);}
        for(var i=0;i<clips.length;i++)for(var j=0;j<merged.length;j++)if(merged[j][0]<=clips[i][0]+tolerance&&merged[j][1]>=clips[i][1]-tolerance){covered++;break;}
        if(result!==true||covered!==clips.length)throw Error('Расчёт не завершён: кэш покрывает '+covered+' из '+clips.length+' блоков. Можно повторить; клипы не изменены.');
        response=reply(['ok',s.sequenceID,covered,(new Date().getTime()-started)/1000]);
    }catch(e){response=reply(['error',String(e)]);}
    finally{if(changed&&saved){
        // Attempt every restoration even when a setter fails. Do not report success with lost marks.
        var failures=[];
        function restore(method,value,label){try{if(s[method](value)===false)throw Error('Premiere отклонил значение');}catch(e){failures.push(label+': '+String(e));}}
        restore('setInPoint',saved.inPoint.seconds,'In');restore('setOutPoint',saved.outPoint.seconds,'Out');
        if(saved.workEnabled){restore('setWorkAreaInPoint',saved.workIn.seconds,'Work In');restore('setWorkAreaOutPoint',saved.workOut.seconds,'Work Out');}
        if(failures.length){var previous=response&&response.indexOf('error|')===0?decodeURIComponent(response.slice(6))+' ':'';response=reply(['error',previous+'Не удалось восстановить диапазоны: '+failures.join('; ')+'. Проверь метки перед следующим расчётом.']);}
    }}
    return response;
};
