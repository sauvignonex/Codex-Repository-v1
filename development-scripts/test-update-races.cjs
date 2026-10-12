// Browser/native contract tests. No actual Premiere project or MOGRT is changed.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),checks=[];
(async()=>{
 const runtime=await require('./browser-test-runtime.cjs')(root);
 try{
 async function fixture(){const p=await runtime.browser.newPage();await p.goto(runtime.url);await p.evaluate(()=>{
  const a={role:'speech',size:100,accentSize:100,position:50,color:'#ffffff',motion:'soft'};
  SubtitleDocument.importTranscript(['баня','мёд'].map((text,i)=>({text,originalText:text,start:i*2000,end:i*2000+1000,appearance:{...a}})),'fixture');
  const d=SubtitleDocument.getSnapshot();window.fixtureDoc=d;window.requests=[];window.writes=[];
  localStorage.setItem('artem.subtitle-studio.batch.v1',JSON.stringify({version:1,documentKey:d.id,sequenceID:'seq',total:2,completed:2,pending:false,phase:'complete',applied:d.cues.map(subtitleBatch.signature)}));
  subtitleHost.ensure=async()=>{};
  subtitleGraphic.call=async script=>{requests.push(script);if(script.includes('.registry()'))return ['ok',d.id,'project','seq',2,2,'complete',0,'clip0','clip0','clip1'].join('|');if(script.includes('.verifyBinding()'))return 'ok|present';return 'ok';};
  subtitleGraphic.write=async(_,layout,scope,show,guard)=>{if(guard)guard();writes.push(JSON.parse(JSON.stringify(layout)));};
 });return p;}
 async function run(p){await p.evaluate(()=>document.getElementById('srt-update-block').dispatchEvent(new Event('click')));}
 async function settle(p){await p.waitForFunction(()=>!subtitleBatch.getState().busy);}
 for(const change of ['text','role','selection','document']){
  const p=await fixture();await p.evaluate(()=>{subtitleHost.ensure=()=>new Promise(resolve=>window.releaseHost=resolve);});await run(p);
  await p.evaluate(change=>{if(change==='text')SubtitlePanel.setText('ручная правка','fixture',SubtitlePanel.getSettings());if(change==='role')SubtitlePanel.setText('баня','fixture',{...SubtitlePanel.getSettings(),role:'title'});if(change==='selection')SubtitleDocument.select(1);if(change==='document'){const snapshot=SubtitleDocument.getSnapshot();SubtitleDocument.getSnapshot=()=>({...snapshot,id:'different'});}releaseHost();},change);await settle(p);
  const result=await p.evaluate(()=>({writes,requests,status:document.getElementById('srt-batch-status').textContent}));assert.equal(result.writes.length,0);assert.equal(result.requests.filter(x=>x.includes('.select(')).length,0);assert.match(result.status,/изменился/);await p.close();
 }
 checks.push('text, role, selected cue or document changed during host load stop before native selection/write');
 {
  const p=await fixture();await p.evaluate(()=>{const original=subtitleGraphic.call;subtitleGraphic.call=async script=>{if(script.includes('.select(')){await new Promise(resolve=>window.releaseSelect=resolve);return 'ok';}return original(script);};});await run(p);await p.waitForFunction(()=>Boolean(window.releaseSelect));await p.evaluate(()=>{SubtitlePanel.setText('поздняя правка','fixture',SubtitlePanel.getSettings());releaseSelect();});await settle(p);assert.equal(await p.evaluate(()=>writes.length),0);await p.close();
 }
 checks.push('edit while host selects linked clip is rejected by writer guard before mutation');
 {
  const p=await fixture();await p.evaluate(()=>{subtitleGraphic.write=async(_,layout)=>{writes.push(layout);await new Promise(resolve=>window.releaseWrite=resolve);};});await run(p);await p.waitForFunction(()=>Boolean(window.releaseWrite));await p.evaluate(()=>{SubtitlePanel.setText('правка после начала записи','fixture',SubtitlePanel.getSettings());releaseWrite();});await settle(p);
  const result=await p.evaluate(()=>({record:JSON.parse(localStorage.getItem('artem.subtitle-studio.batch.v1')),current:subtitleBatch.signature(SubtitleDocument.getSelected()),original:subtitleBatch.signature(fixtureDoc.cues[0]),status:document.getElementById('srt-batch-status').textContent,requests}));
  assert.equal(result.record.applied[0],result.original);assert.notEqual(result.record.applied[0],result.current);assert.match(result.status,/Новые правки.*не записаны/);assert.ok(!result.requests.some(x=>/\.begin\(|\.append\(|\.create\(/.test(x)));await p.close();
 }
 checks.push('edits after native write begins remain pending; checkpoint uses written snapshot and update never imports');
 {
  const p=await fixture();await p.evaluate(()=>{const old=fixtureDoc,c=old.cues.map(c=>({...c}));c[0].text='исправленная речь';SubtitleDocument.correctText(c);subtitleHost.ensure=()=>new Promise(resolve=>window.releaseHost=resolve);document.getElementById('srt-update-corrections').dispatchEvent(new Event('click'));});await p.waitForFunction(()=>Boolean(window.releaseHost));await p.evaluate(()=>{SubtitlePanel.setText('исправленная речь','fixture',{...SubtitlePanel.getSettings(),role:'title'});releaseHost();});await settle(p);assert.equal(await p.evaluate(()=>writes.length),0);await p.close();
 }
 checks.push('speech correction promoted to highlight while waiting is never written by correction batch');
 {
  const p=await fixture();await run(p);await settle(p);assert.equal(await p.evaluate(()=>writes.length),1);assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('artem.subtitle-studio.batch.v1')).applied[0]),await p.evaluate(()=>subtitleBatch.signature(SubtitleDocument.getSelected())));await p.close();
 }
 checks.push('unchanged linked cue updates once and saves confirmed signature');
 {
  const p=await fixture();await p.evaluate(()=>{
   const a={role:'speech',size:100,accentSize:100,position:50,color:'#ffffff',motion:'soft'};
   SubtitleDocument.importTranscript(['речь','Акцент','КЕДРОВАЯ\nБочка','мёд'].map((text,i)=>({text,originalText:text,start:i*2000,end:i*2000+1000,appearance:{...a,role:i===1?'accent':i===2?'title':'speech'}})),'protected');
   const d=SubtitleDocument.getSnapshot();window.protectedBefore=JSON.parse(JSON.stringify([d.cues[1],d.cues[2]]));
   localStorage.setItem('artem.subtitle-studio.batch.v1',JSON.stringify({version:1,documentKey:d.id,sequenceID:'seq',total:4,completed:4,pending:false,phase:'complete',applied:d.cues.map(subtitleBatch.signature)}));
   subtitleGraphic.call=async script=>{requests.push(script);if(script.includes('.registry()'))return ['ok',d.id,'project','seq',4,4,'complete',0,'clip0','clip0','clip1','clip2','clip3'].join('|');return 'ok';};
   const c=d.cues.map(c=>({...c}));c[0].text='обычная речь';c[3].text='с мёдом';SubtitleDocument.correctText(c);
   document.getElementById('srt-update-corrections').dispatchEvent(new Event('click'));
  });await settle(p);const result=await p.evaluate(()=>({writes,requests,before:protectedBefore,after:[SubtitleDocument.getSnapshot().cues[1],SubtitleDocument.getSnapshot().cues[2]]}));
  assert.deepEqual(result.writes.map(w=>w.timing.index),[0,3]);assert.deepEqual(result.after,result.before);assert.ok(!result.requests.some(x=>/\.begin\(|\.append\(|\.create\(/.test(x)));await p.close();
 }
 checks.push('all pending speech corrections update exact linked cues while complete highlights and timings remain unchanged');

 }finally{await runtime.close();}
 fs.writeFileSync(root+'/premiere-subtitles-cep/update-race-tests.json',JSON.stringify({status:'browser-contract-tested; native Premiere verification pending',passed:checks.length,checks},null,2)+'\n');console.log({passed:checks.length,checks});
})().catch(error=>{console.error(error);process.exitCode=1;});
