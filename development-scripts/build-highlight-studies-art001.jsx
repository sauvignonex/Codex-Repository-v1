(function () {
    // Isolated artistic studies. Never updates the installed template or live cues.
    var root = File($.fileName).parent.parent.fsName;
    var out = Folder(root + '/dist/art001');
    if (!out.exists) out.create();
    var log = File(out.fsName + '/native-study-build.txt');
    function note(s) { log.open('a'); log.writeln(s); log.close(); }
    var base = null, created = [];
    try {
        if (!app.project.file || decodeURI(app.project.file.name).indexOf('Subtitle Studio') < 0) throw Error('Foreign or unsaved project');
        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            if (item instanceof CompItem && item.name === 'Subtitle Studio Vertical 063 Adaptive') base = item;
            if (item.name.indexOf('SS ART001 Study ') === 0) throw Error('Studies already exist; inspect before rerun');
        }
        if (!base) throw Error('Verified 063 comp missing');
        var studyPlanFile=File(root+'/development-scripts/art001-motion-specs.json');
        studyPlanFile.open('r');var studyLiteralPlans=eval('('+studyPlanFile.read()+')');studyPlanFile.close();
        var specs = [
            {id:'A', name:'Stacked rise', main:'КЕДРОВАЯ', hand:'Бочка', color:[1,1,1], ref:'04.00-05.50: small leading line and condensed body'},
            {id:'B', name:'Hand first', main:'ДАР ЛЕСА', hand:'Ритуал', color:[1,.83,.08], ref:'00.50-02.50 and 24.00-27.00: handwriting leads the composition'},
            {id:'C', name:'Contrast cut', main:'ПОЧЕМУ', hand:'Кедр', color:[1,.08,.08], ref:'19.00-23.00: red emphatic word and subordinate second line'}
        ];
        for (var n = 0; n < specs.length; n++) {
            var studySpec = specs[n], c = base.duplicate(); created.push(c);
            c.name = 'SS ART001 Study ' + studySpec.id + ' ' + studySpec.name;
            c.motionGraphicsTemplateName = c.name;
            c.duration = 1.2;
            c.layer('Настройки').effect(7)(1).setValue(1.2);
            c.layer('Настройки').effect(1)(1).setValue(1);
            c.motionBlur = true; c.shutterAngle = 180; c.shutterPhase = -90;
            c.motionBlurSamplesPerFrame = 8; c.motionBlurAdaptiveSampleLimit = 16;
            var main = c.layer('Основной текст'), hand = c.layer('Рукописный акцент');
            var layers = [main, hand];
            for (var k = 0; k < layers.length; k++) {
                var l = layers[k], isHand = k === 1;
                var text = l.property('ADBE Text Properties').property('ADBE Text Document');
                var td = text.value; td.text = isHand ? studySpec.hand : studySpec.main;
                td.fontCapsOption = FontCapsOption.FONT_NORMAL_CAPS; text.setValue(td);
                var col = studySpec.id === 'B' && isHand || studySpec.id === 'C' && !isHand ? studySpec.color : [1,1,1];
                text.expression = 'text.sourceText.style.setFont("' + (isHand ? 'Christopher' : 'BebasNeueCyrillic') + '").setFontSize(200).setAllCaps(false).setSmallCaps(false).setFillColor([' + col.join(',') + ']).setText(value.toString());';
                // Keep accepted scale: replace only the motion overshoot, not font fitting.
                l.transform.scale.expression = l.transform.scale.expression.replace('if(motion==2&&!speech)', 'if(false)');
                var delay = studySpec.id === 'B' ? (isHand ? 0 : .16) : (isHand ? .14 : 0);
                var seconds = isHand ? .32 : .20;
                if (studySpec.id === 'C') seconds = isHand ? .22 : .16;
                var p = 'var r=sourceRectAtTime(0,false);var d=Math.max(.034,thisComp.layer("Настройки").effect(7)(1));var delay=Math.min(' + delay + ',d*.12);var intro=Math.min(' + seconds + ',d*.32);function sat(x){return Math.max(0,Math.min(1,x));}var u=sat((time-delay)/intro);var q=1-Math.pow(1-u,3);var v=sat((time-(d-Math.min(.09,d*.12)))/Math.min(.09,d*.12));';
                var offset = studySpec.id === 'B' ? (isHand ? -80 : 80) : (isHand ? 80 : -80);
                var dx = studySpec.id === 'C' ? (isHand ? -20 : 35) : 0;
                var dy = studySpec.id === 'A' ? (isHand ? 8 : 30) : studySpec.id === 'B' ? (isHand ? 0 : 24) : 0;
                l.transform.position.expression = p + '[540+' + dx + '*(1-q),960+' + offset + '+' + dy + '*(1-q)];';
                l.transform.opacity.expression = p + '100*Math.min(sat((time-delay)/Math.min(.033,d*.08)),1-v);';
                var mask = l.property('ADBE Mask Parade').property(1).property('ADBE Mask Shape');
                var direction = studySpec.id === 'C' && isHand ? 'right' : isHand ? 'left' : studySpec.id === 'C' ? 'left' : 'bottom';
                var shape = direction === 'bottom' ? '[[x,y+h*(1-q)],[x+w,y+h*(1-q)],[x+w,y+h],[x,y+h]]' : direction === 'right' ? '[[x+w*(1-q),y],[x+w,y],[x+w,y+h],[x+w*(1-q),y+h]]' : '[[x,y],[x+w*q,y],[x+w*q,y+h],[x,y+h]]';
                mask.expression = p + 'var pad=26,x=r.left-pad,y=r.top-pad,w=r.width+2*pad,h=r.height+2*pad;createPath(' + shape + ',[],[],true);';
                // Native expression evaluation can expose script variable collisions.
                // The authoritative literal plan was compiled outside AE and read back exactly.
                var studyLiteral=studyLiteralPlans[n].layers[k];
                l.transform.position.expression=studyLiteral.position;
                l.transform.opacity.expression=studyLiteral.opacity;
                text.expression=studyLiteral.text;
                mask.expression=studyLiteral.mask;
                if(l.transform.position.expression!==studyLiteral.position||text.expression!==studyLiteral.text||mask.expression!==studyLiteral.mask)throw Error('Literal readback mismatch');
            }
            note('STUDY '+studySpec.id+' reference='+studySpec.ref+' layers='+c.numLayers+' blur=180/-90/8/16');
            for (var f = 0; f < 36; f++) {
                var t = f / 30;
                for (var z = 0; z < layers.length; z++) {
                    var layer = layers[z];
                    var props = [layer.transform.anchorPoint,layer.transform.position,layer.transform.scale,layer.transform.opacity,layer.property('ADBE Text Properties').property('ADBE Text Document'),layer.property('ADBE Mask Parade').property(1).property('ADBE Mask Shape')];
                    for (var a = 0; a < props.length; a++) { props[a].valueAtTime(t,false); if (props[a].expressionError) throw Error(studySpec.id+' frame '+f+': '+props[a].expressionError); }
                    var r = layer.sourceRectAtTime(t,false), sc = layer.transform.scale.valueAtTime(t,false), pos = layer.transform.position.valueAtTime(t,false);
                    if (pos[0]-r.width*sc[0]/200 < 100 || pos[0]+r.width*sc[0]/200 > 980 || pos[1]-r.height*sc[1]/200 < 260 || pos[1]+r.height*sc[1]/200 > 1320) throw Error('Study outside safe rectangle '+studySpec.id+' frame '+f);
                }
                c.saveFrameToPng(t,File(out.fsName+'/'+studySpec.id+'-'+('000'+f).slice(-3)+'.png'));
            }
            note('CHECK '+studySpec.id+' frames=36 propertyReads=432 noExpressionErrors=true');
        }
        app.project.save(File(out.fsName+'/Subtitle Studio ART001 Studies.aep'));
        note('SUCCESS studies=3 frames=108 installed063Unchanged=true');
    } catch(e) { note('ERROR '+String(e)); }
})();
