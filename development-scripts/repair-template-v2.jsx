(function(){
var out=File('C:/Users/Artem/Documents/Codex/2026-10-12/files-mentioned-by-the-user-md/work/ae-repair.txt');out.open('w');
try{
out.writeln('PROJECT '+(app.project&&app.project.file?app.project.file.fsName:'unsaved')); if(!app.project||app.project.file&&app.project.file.name.indexOf('template07')<0&&decodeURI(app.project.file.name).indexOf('Subtitle Studio Title 07')<0)throw new Error('Expected our copied template project');
app.beginSuppressDialogs();
for(var i=1;i<=app.project.numItems;i++){var c=app.project.item(i);if(!(c instanceof CompItem))continue;
for(var j=1;j<=c.numLayers;j++){var l=c.layer(j);if(!(l instanceof TextLayer))continue;
var p=l.property('ADBE Text Properties').property('ADBE Text Document'),t=p.value;
t.font='BebasNeueCyrillic';t.fontSize=420;t.justification=ParagraphJustification.CENTER_JUSTIFY;t.autoLeading=true;p.setValue(t);
if(l.name==='Text 01')p.expression='var t=value.toString(); text.sourceText.style.setFont("BebasNeueCyrillic").setFontSize(420).setText(t);';
if(l.name==='Special Word')p.expression='var t=thisComp.layer("Text 01").text.sourceText; t.style.setFont("BebasNeueCyrillic").setFontSize(420).setText(t);';
out.writeln('PATCH '+c.name+'/'+l.name+' font='+p.value.font+' size='+p.value.fontSize+' expressionError='+p.expressionError);
}}
var main=null;for(var i=1;i<=app.project.numItems;i++)if(app.project.item(i).name==='SaaS Pack Title 07')main=app.project.item(i);
if(!main)throw new Error('Main composition missing');
main.motionGraphicsTemplateName='Subtitle Studio Title 07 v2';
app.project.save(File('C:/Users/Artem/Documents/Codex/2026-10-12/files-mentioned-by-the-user-md/outputs/subtitle-studio/recovery-inputs/templates/Subtitle Studio Title 07 v2.aep'));
var destination='C:/Users/Artem/Documents/Codex/2026-10-12/files-mentioned-by-the-user-md/outputs/subtitle-studio/recovery-inputs/templates';
out.writeln('EXPORT '+main.exportAsMotionGraphicsTemplate(true,destination)); 
app.endSuppressDialogs(false);
}catch(e){out.writeln('ERROR '+e+' line='+e.line);}finally{out.close();}
})();





