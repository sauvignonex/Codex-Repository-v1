// Capture/evaluate builder expressions in a VM. No native AE project/export is produced.
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..');
function capture(version){
 const layers={},effects=[],exports=[],logs=[];
 const prop=()=>({value:{},setValue(v){this.value=v;},addToMotionGraphicsTemplateAs(){},property(){return prop();},addProperty(){return prop();}});
 const ctl={property(){return {addProperty(type){const value=prop(),e={type,name:'',value,property(){return value;}};effects.push(e);return e;}};}};
 const comp={layers:{addNull:()=>ctl,addText(){const text=prop(),mask=prop(),p={transform:{anchorPoint:{},scale:{},position:{},opacity:{}},property(name){if(name==='ADBE Text Properties')return {property:()=>text};if(name==='ADBE Mask Parade')return {addProperty:()=>({property:()=>mask})};return prop();},text,mask};Object.defineProperty(p,'name',{get(){return Object.keys(layers).find(n=>layers[n]===p);},set(n){layers[n]=p;}});return p;}},saveFrameToPng(){},exportAsMotionGraphicsTemplate(){exports.push(this.motionGraphicsTemplateName);return true;}};
 function File(){return {parent:{parent:{fsName:root}},open(){},writeln(v){logs.push(v);},close(){}};}function Folder(){return {exists:true,fsName:root};}
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,`build-vertical-template-${version}.jsx`),'utf8'),{File,Folder,$:{fileName:'builder.jsx'},app:{project:{numItems:0,items:{addComp(name){comp.name=name;return comp;}},save(){}},beginSuppressDialogs(){},endSuppressDialogs(){}},FontCapsOption:{FONT_NORMAL_CAPS:0},ParagraphJustification:{CENTER_JUSTIFY:0},MaskMode:{ADD:0}});
 assert.ok(logs.includes('SUCCESS'));assert.equal(exports.length,1);return {layers,effects,exports};
}
const original=capture('063'),next=capture('064'),checks=[];
assert.equal(next.exports[0],'Subtitle Studio Vertical 064 Dual Color');assert.equal(Object.keys(next.layers).length,3);assert.equal(next.effects.length,10);
assert.deepEqual(next.effects.slice(0,7).map(e=>[e.name,JSON.stringify(e.value.value)]),original.effects.map(e=>[e.name,JSON.stringify(e.value.value)]));checks.push('separate 064 comp, three text layers, first seven control names/defaults unchanged');
for(const name of Object.keys(original.layers)){for(const key of ['anchorPoint','scale','position','opacity'])assert.equal(next.layers[name].transform[key].expression,original.layers[name].transform[key].expression);assert.equal(next.layers[name].mask.expression,original.layers[name].mask.expression);}
checks.push('geometry, timing, opacity, speech stability and reveal expressions byte-identical to 063');
function sample(name,split,shared,main,hand){const controls={5:shared,8:split,9:main,10:hand};let result={};const style={};for(const method of ['setFont','setFontSize','setAllCaps','setSmallCaps','setFillColor','setText'])style[method]=v=>{result[method]=v;return style;};vm.runInNewContext(next.layers[name].text.expression,{text:{sourceText:{style}},value:'Контрольный текст',thisLayer:{name},thisComp:{layer(){return {effect(i){return ()=>controls[i];}};}}});return result;}
const names=['Основной текст','Рукописный акцент','Текст речи'],shared=[.2,.3,.4],red=[1,0,0],white=[1,1,1];
for(const name of names)assert.deepEqual(sample(name,0,shared,red,white).setFillColor,shared);checks.push('disabled split colors preserve shared color for all three layers');
assert.deepEqual(sample(names[0],1,shared,red,white).setFillColor,red);assert.deepEqual(sample(names[1],1,shared,red,white).setFillColor,white);assert.deepEqual(sample(names[2],1,shared,red,white).setFillColor,shared);checks.push('enabled red/white headline colors stay independent while speech keeps shared color');
const yellow=[1,.85,0];assert.deepEqual(sample(names[1],1,shared,white,yellow).setFillColor,yellow);assert.deepEqual(sample(names[0],1,shared,white,yellow).setFillColor,white);checks.push('white/yellow variant changes only the chosen line');
for(const name of names){const result=sample(name,1,shared,red,white);assert.equal(result.setAllCaps,false);assert.equal(result.setSmallCaps,false);assert.equal(result.setFontSize,200);assert.equal(result.setText,'Контрольный текст');}checks.push('text, font size and normal caps are preserved by color expressions');
fs.writeFileSync(root+'/premiere-subtitles-cep/dual-color-template-tests.json',JSON.stringify({status:'AE-expression-model-tested; actual AE export/render pending; panel integration pending',passed:checks.length,checks},null,2)+'\n');console.log({passed:checks.length,checks});
