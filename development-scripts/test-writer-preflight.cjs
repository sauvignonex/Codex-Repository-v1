const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),code=fs.readFileSync(root+'/premiere-subtitles-cep/test-graphic.js','utf8'),checks=[];
const names=['Основной текст','Рукописный акцент','Текст речи','Роль: 1 заголовок, 2 речь, 3 акцент','Масштаб','Масштаб акцента','Высота','Длительность','Анимация: 0 нет, 1 мягкая, 2 акцент, 3 раскрытие','Цвет'];
function setup(){
 const calls=[],elements={};const window={};const context=vm.createContext({window,setTimeout:()=>0,clearTimeout(){},document:{getElementById(id){return elements[id]??=( {value:'',textContent:'',addEventListener(){}} );},fonts:{load:async()=>[]}}});vm.runInContext(code,context);
 const layout={role:'speech',main:'',accent:'',speech:'баня',text:'баня',size:100,accentSize:100,position:50,color:'#ffffff',duration:1,motion:'soft',timing:{start:0,end:1000}};
 window.subtitleTypography={fitSpeech(text){return {valid:true,text};}};
 window.__adobe_cep__={evalScript(script,cb){calls.push(script);const text=script.match(/\.setText\((\d+),("(?:[^"\\]|\\.)*")\)/),number=script.match(/\.setNumber\((\d+),([0-9.]+)\)/);if(text){const obj=decodeURIComponent(JSON.parse(text[2]));cb('ok|'+encodeURIComponent(JSON.stringify(obj)));}else if(number)cb('ok|'+number[2]);else cb('ok');}};
 const rows=names.map((name,index)=>['param',index,name,index<3?JSON.stringify(JSON.stringify({textEditValue:'',fontTextRunLength:[0]})):'50']);
 const encode=data=>[['ok','seq','fixture'],...data].map(row=>row.map(value=>encodeURIComponent(String(value))).join('|')).join('\n');
 return {window,context,calls,layout,rows,encode,write:(testRows=rows,testLayout=layout,guard)=>window.subtitleGraphic.write(encode(testRows),testLayout,'$._artemSubtitleBatch',false,guard)};
}
async function test(name,fn){await fn();checks.push(name);}
(async()=>{
await test('every missing text, numeric or color parameter fails before any setter',async()=>{for(const missing of names){const t=setup();await assert.rejects(t.write(t.rows.filter(row=>row[2]!==missing)));assert.equal(t.calls.length,0,missing);}});
await test('invalid timing, color and target indexes fail before any setter',async()=>{for(const change of ['timing','color','index']){const t=setup();if(change==='timing')t.layout.timing={start:1000,end:500};if(change==='color')t.layout.color='invalid';if(change==='index')t.rows[9][1]='invalid';await assert.rejects(t.write());assert.equal(t.calls.length,0);}});
await test('guard runs after font wait and before first setter',async()=>{const t=setup();let release,stale=false;t.context.document.fonts.load=()=>new Promise(resolve=>release=resolve);const p=t.write(t.rows,t.layout,()=>{if(stale)throw Error('stale snapshot');});stale=true;release([]);await assert.rejects(p,/stale snapshot/);assert.equal(t.calls.length,0);});
await test('valid prepared write confirms text, numeric, color and timing values',async()=>{const t=setup();await t.write();assert.equal(t.calls.filter(s=>s.includes('.setText(')).length,3);assert.equal(t.calls.filter(s=>s.includes('.setNumber(')).length,6);assert.equal(t.calls.filter(s=>s.includes('.setColor(')).length,1);assert.equal(t.calls.filter(s=>s.includes('.setTiming(')).length,1);assert.ok(!t.calls.some(s=>/\.create\(|\.append\(|\.begin\(/.test(s)));});
fs.writeFileSync(root+'/premiere-subtitles-cep/writer-preflight-tests.json',JSON.stringify({status:'writer-contract-tested; native Premiere verification pending',passed:checks.length,checks},null,2)+'\n');console.log({passed:checks.length,checks});
})().catch(error=>{console.error(error);process.exitCode=1;});
