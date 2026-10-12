/* Test-only host operations. All mutations are restricted to a new blank sequence. */
$._artemSubtitleTest = $._artemSubtitleTest || (typeof ArtemSubtitleTest!=='undefined'?ArtemSubtitleTest:{});
// $.evalFile can run again when the panel is reopened. Keep mutation guards.
if(typeof $._artemSubtitleTest.sequenceID==='undefined')$._artemSubtitleTest.sequenceID=null;
if(typeof $._artemSubtitleTest.clipID==='undefined')$._artemSubtitleTest.clipID=null;
if(typeof $._artemSubtitleTest.attempted==='undefined')$._artemSubtitleTest.attempted=false;
if(typeof $._artemSubtitleTest.projectPath==='undefined')$._artemSubtitleTest.projectPath=null;
if(typeof $._artemSubtitleTest.phase==='undefined')$._artemSubtitleTest.phase='idle';
$._artemSubtitleTest.encode = function(values) {
    var out=[];for(var i=0;i<values.length;i++)out.push(encodeURIComponent(String(values[i])));return out.join('|');
};
$._artemSubtitleTest.valueJSON = function(value) {
    if(value===null)return 'null';
    if(typeof value==='number')return isFinite(value)?String(value):'null';
    if(typeof value==='boolean')return value?'true':'false';
    if(typeof value==='string')return '"'+value.replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\r/g,'\\r').replace(/\n/g,'\\n').replace(/\t/g,'\\t').replace(/[\x00-\x1f]/g,function(c){return '\\u'+('000'+c.charCodeAt(0).toString(16)).slice(-4);})+'"';
    if(value instanceof Array){var parts=[];for(var i=0;i<value.length;i++)parts.push($._artemSubtitleTest.valueJSON(value[i]));return '['+parts.join(',')+']';}
    return 'null';
};
$._artemSubtitleTest.getSequence = function() {
    if(!this.sequenceID)throw Error('Нет созданной тестовой секвенции.');
    if(!app.project || String(app.project.path)!==this.projectPath)throw Error('Проект изменился после создания теста. Запись остановлена.');
    for(var i=0;i<app.project.sequences.numSequences;i++){var s=app.project.sequences[i];if(String(s.sequenceID)===this.sequenceID)return s;}
    throw Error('Тестовая секвенция закрыта или удалена.');
};
$._artemSubtitleTest.getClip = function() {
    var s=this.getSequence();
    for(var t=0;t<s.videoTracks.numTracks;t++)for(var c=0;c<s.videoTracks[t].clips.numItems;c++){var clip=s.videoTracks[t].clips[c];if(String(clip.nodeId)===this.clipID)return clip;}
    throw Error('Пробный блок не найден.');
};
$._artemSubtitleTest.create = function() {
    var e=this.encode;
    try {
        this.phase='preflight';
        if(this.attempted || this.sequenceID)throw Error('Создание теста уже запускалось в этой сессии Premiere. Повторный импорт заблокирован.');
        var source=app.project.activeSequence;
        if(!source)throw Error('Открой вертикальную секвенцию 1080×1920.');
        if(source.frameSizeHorizontal!==1080||source.frameSizeVertical!==1920)throw Error('Для первого теста нужна секвенция 1080×1920.');
        if(!this.extensionRoot)throw Error('Сначала загрузи host через панель.');
        var template=File(this.extensionRoot+'/templates/Subtitle Studio Vertical 062 Adaptive.mogrt');
        if(!template.exists)throw Error('Не найден исправленный Subtitle Studio Title 07.mogrt в папке панели.');
        var preset=File(app.path+'/Settings/SequencePresets/Social/Social Media Portrait 9x16 30 fps.sqpreset');
        if(!preset.exists)throw Error('Не найден штатный пресет вертикальной секвенции: '+preset.fsName);
        var oldIDs={},i;
        for(i=0;i<app.project.sequences.numSequences;i++)oldIDs[String(app.project.sequences[i].sequenceID)]=true;
        // Create a blank sequence instead of cloning media and captions. The
        // regular CEP DOM cannot enumerate/remove caption tracks reliably.
        this.projectPath=String(app.project.path);
        this.attempted=true;
        this.phase='new-sequence';
        app.enableQE();
        qe.project.newSequence('[Subtitle Studio] Тест '+new Date().getTime(),preset.fsName);
        this.phase='find-sequence';
        var created=[];
        for(i=0;i<app.project.sequences.numSequences;i++){var candidate=app.project.sequences[i];if(!oldIDs[String(candidate.sequenceID)])created.push(candidate);}
        if(created.length!==1)throw Error('Не удалось однозначно определить новую секвенцию. Импорт остановлен.');
        var target=created[0];
        if(String(target.sequenceID)===String(source.sequenceID))throw Error('Не удалось изолировать тест.');
        this.sequenceID=String(target.sequenceID);
        target.name='[Subtitle Studio] Тест '+new Date().getTime();
        var groups=[target.videoTracks,target.audioTracks];
        for(var g=0;g<groups.length;g++)for(var t=0;t<groups[g].numTracks;t++)if(groups[g][t].clips.numItems!==0)throw Error('Новая тестовая секвенция не пуста. Импорт остановлен.');
        this.phase='sequence-settings';
        if(target.frameSizeHorizontal!==1080||target.frameSizeVertical!==1920)throw Error('Штатный пресет не создал кадр 1080×1920.');
        if(String(target.timebase)!==String(source.timebase)){
            var settings=target.getSettings();settings.videoFrameRate=source.getSettings().videoFrameRate;
            target.setSettings(settings);
            if(String(target.timebase)!==String(source.timebase))throw Error('Не удалось согласовать частоту кадров теста.');
        }
        if(target.videoTracks.numTracks<1)throw Error('Нет видеодорожки.');
        app.project.openSequence(target.sequenceID);
        this.phase='import-mogrt';
        var clip=target.importMGT(template.fsName,'0',0,0);
        if(!clip)throw Error('Premiere не импортировал шаблон.');
        this.clipID=String(clip.nodeId);
        this.phase='read-properties';
        var component=clip.getMGTComponent();
        if(!component)throw Error('Шаблон импортирован, но редактируемые параметры пока недоступны.');
        target.setPlayerPosition('508032000000');
        this.phase='created';
        return this.describe();
    }catch(error){return e(['error',String(error)+'; phase='+this.phase+'; line='+error.line,this.sequenceID||'']);}
};
$._artemSubtitleTest.describe = function() {
    var e=this.encode;
    try {
        var target=this.getSequence(),clip=this.getClip(),component=clip.getMGTComponent();
        if(!component)throw Error('Редактируемые параметры графики недоступны.');
        var result=[e(['ok',target.sequenceID,target.name,clip.nodeId])];
        for(var i=0;i<component.properties.numItems;i++){
            var p=component.properties[i],value;
            try{value=this.valueJSON(p.getValue());}catch(ignore){value='null';}
            result.push(e(['param',i,p.displayName,value]));
        }
        return result.join('\n');
    }catch(error){return e(['error',String(error)+'; phase='+this.phase]);}
};
$._artemSubtitleTest.restore = function() {
    if(!this.attempted)return 'none';
    if(this.clipID)return this.describe();
    return this.encode(['error','Предыдущая попытка остановилась на этапе '+this.phase+'. Повторное создание заблокировано.']);
};
$._artemSubtitleTest.setText = function(index,encodedValue) {
    var e=this.encode;
    try {
        if(index!==Math.floor(index)||index<0)throw Error('Некорректный параметр.');
        var clip=this.getClip(),component=clip.getMGTComponent();
        if(!component||index>=component.properties.numItems)throw Error('Параметр не найден.');
        var p=component.properties[index],old=p.getValue();
        if(typeof old!=='string'||old.indexOf('"textEditValue"')<0)throw Error('Выбранный параметр не является ожидаемым текстовым полем.');
        var value=decodeURIComponent(encodedValue);
        if(value.length>20000)throw Error('Слишком большой параметр.');
        p.setValue(value,true);
        return e(['ok',this.valueJSON(p.getValue())]);
    }catch(error){return e(['error',String(error)]);}
};
$._artemSubtitleTest.upgrade = function() {
    var state=this,e=state.encode;
    try{
        var old=state.getClip(),component=old.getMGTComponent();
        for(var i=0;i<component.properties.numItems;i++)if(component.properties[i].displayName==='Масштаб акцента')return state.describe();
        if(state.upgradePending)throw Error('Предыдущая замена шаблона не завершена. Проверь клипы вручную.');
        var s=state.getSequence(),free=-1;
        for(var i=0;i<s.videoTracks.numTracks;i++)if(!s.videoTracks[i].clips.numItems){free=i;break;}
        if(free<0)throw Error('Для замены нужна пустая видеодорожка в тестовой секвенции.');
        var f=File(state.extensionRoot+'/templates/Subtitle Studio Vertical 062 Adaptive.mogrt');if(!f.exists)throw Error('Новый шаблон отсутствует.');
        state.upgradePending=true;
        var clip=s.importMGT(f.fsName,'0',free,0);if(!clip)throw Error('Premiere не вернул новый клип.');
        state.clipID=String(clip.nodeId);
        var c=clip.getMGTComponent(),found=0;for(var i=0;i<c.properties.numItems;i++)if(c.properties[i].displayName==='Основной текст'||c.properties[i].displayName==='Рукописный акцент'||c.properties[i].displayName==='Текст речи')found++;
        if(found!==3)throw Error('Формат нового шаблона не подтверждён.');
        old.remove(false,false);state.upgradePending=false;s.setPlayerPosition('508032000000');return state.describe();
    }catch(error){return e(['error',String(error)]);}
};
$._artemSubtitleTest.setNumber = function(index,value) {
    var state=this,e=state.encode;
    try{var c=state.getClip().getMGTComponent();if(index!==Math.floor(index)||index<0||index>=c.properties.numItems||!isFinite(value))throw Error('Некорректное число.');var p=c.properties[index];if(typeof p.getValue()!=='number')throw Error('Параметр не числовой.');p.setValue(value,true);return e(['ok',p.getValue()]);}catch(error){return e(['error',String(error)]);}
};
$._artemSubtitleTest.show = function() {
    try{var s=this.getSequence(),c=this.getClip(),fraction=.5,p=c.getMGTComponent().properties;for(var i=0;i<p.numItems;i++)if(p[i].displayName.indexOf('Анимация:')===0&&Number(p[i].getValue())===3)fraction=.75;app.project.openSequence(s.sequenceID);s.setPlayerPosition(String(Math.round((Number(c.start.ticks)+(Number(c.end.ticks)-Number(c.start.ticks))*fraction)/Number(s.timebase))*Number(s.timebase)));return 'ok';}catch(e){return this.encode(['error',String(e)]);}
};
$._artemSubtitleTest.setColor = function(index,hex) {
    var state=this,e=state.encode;
    try{if(!/^#[0-9a-f]{6}$/i.test(hex))throw Error('Некорректный цвет.');var c=state.getClip().getMGTComponent();if(index<0||index>=c.properties.numItems||index!==Math.floor(index)||c.properties[index].displayName!=='Цвет')throw Error('Параметр цвета не найден.');var p=c.properties[index];p.setColorValue(255,parseInt(hex.substr(1,2),16),parseInt(hex.substr(3,2),16),parseInt(hex.substr(5,2),16),true);return e(['ok',state.valueJSON(p.getColorValue())]);}catch(error){return e(['error',String(error)]);}
};
$._artemSubtitleTest.setTiming = function(startMs,endMs) {
    var state=this,e=state.encode;
    try{
        if(!isFinite(startMs)||!isFinite(endMs)||startMs<0||endMs<=startMs||endMs-startMs>6000)throw Error('Пробный шаблон поддерживает длительность до 6 секунд.');
        var s=state.getSequence(),c=state.getClip(),tb=Number(s.timebase);
        var a=Math.round(startMs*254016000/tb)*tb,b=Math.round(endMs*254016000/tb)*tb;
        if(b<=a)throw Error('Блок короче одного кадра.');
        var start=new Time(),end=new Time();start.ticks=String(a);end.ticks=String(b);
        c.start=start;c.end=end;
        if(Number(c.start.ticks)!==a||Number(c.end.ticks)!==b)throw Error('Premiere не подтвердил границы клипа.');
        return e(['ok',c.start.ticks,c.end.ticks,(b-a)/254016000000]);
    }catch(error){return e(['error',String(error)]);}
};





