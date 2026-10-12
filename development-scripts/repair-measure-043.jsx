(function(){
var base='C:/Users/Artem/Documents/Codex/2026-10-12/files-mentioned-by-the-user-md/outputs/subtitle-studio',log=File(base+'/template-measure-043.txt');log.open('w');
try{
 if(!app.project.file||decodeURI(app.project.file.name)!=='Subtitle Studio Vertical 043.aep')throw Error('Нужен собственный проект 043');
 var c=null;for(var i=1;i<=app.project.numItems;i++)if(app.project.item(i).name==='Subtitle Studio Vertical 043')c=app.project.item(i);if(!c)throw Error('Нет композиции');
 var names=['Основной текст','Рукописный акцент','Текст речи'],fonts=['BebasNeueCyrillic','Christopher','CeraPro-Medium'];
 for(var i=0;i<names.length;i++){var l=c.layer(names[i]),ref=c.layer('Размер: '+names[i]),p=ref.property('ADBE Text Properties').property('ADBE Text Document');p.setValue(l.property('ADBE Text Properties').property('ADBE Text Document').value);p.expression='text.sourceText.style.setFont("'+fonts[i]+'").setFontSize(200).setAllCaps(false).setSmallCaps(false).setText(thisComp.layer("'+names[i]+'").text.sourceText.toString());';var r=ref.sourceRectAtTime(1,false);log.writeln(names[i]+' '+r.width+' '+r.height);}
 c.time=1;c.saveFrameToPng(1,File(base+'/visual-check-0.4.2/043-fixed.png'));app.project.save();log.writeln('EXPORT '+c.exportAsMotionGraphicsTemplate(true,base+'/premiere-subtitles-cep/templates'));
}catch(e){log.writeln('ERROR '+String(e));}finally{log.close();}
})();
