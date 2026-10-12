const fs=require('fs'),path=require('path'),assert=require('assert/strict');const root=path.resolve(__dirname,'..'),checks=[];
(async()=>{const runtime=await require('./browser-test-runtime.cjs')(root);try{
 const p=await runtime.browser.newPage();await p.goto(runtime.url);
 await p.evaluate(()=>{
  window.files={};window.processCalls=[];window.statCalls=[];
  window.config={python:'/python',ffmpeg:'/ffmpeg',whisper:'/whisper',model:'/model',llama:'/llama',topicsModel:'/topics',llamaSha256:'a'.repeat(64)};
  window.__adobe_cep__={getSystemPath:kind=>kind==='extension'?'/plugin':'/userdata'};
  window.cep={fs:{readFile(file){if(file.endsWith('transcription-config.json'))return {err:0,data:JSON.stringify(config)};return files[file]?{err:0,data:files[file]}:{err:1};},stat(file){statCalls.push(file);return {err:file===window.missingFile?1:0};},makedir:()=>({err:0}),writeFile(file,data){files[file]=data;return {err:0};}},process:{createProcess(...args){processCalls.push(args);return window.launchFails?{err:1}:{err:0,data:42};},isRunning:()=>({err:0,data:true})}};
  SubtitleDocument.importTranscript([{text:'баня',originalText:'баня',start:0,end:1000,appearance:{role:'speech'}}],'preserved');window.originalDoc=SubtitleDocument.getSnapshot();
 });
 await p.evaluate(async()=>{config.python='';try{await subtitleTranscription.start('/voice.wav');}catch(e){window.startError=e.message;}});
 assert.match(await p.evaluate(()=>startError),/Python/);assert.equal(await p.evaluate(()=>processCalls.length),0);assert.equal(await p.evaluate(()=>localStorage.getItem('artem.subtitle-studio.transcription.v1')),null);checks.push('blank configuration prevents process/job creation and identifies missing Python');
 await p.evaluate(async()=>{config.python='/python';window.launchFails=true;try{await subtitleTranscription.start('/voice.wav');}catch(e){window.startError=e.message;}});
 const failed=await p.evaluate(()=>({job:JSON.parse(localStorage.getItem('artem.subtitle-studio.transcription.v1')),doc:SubtitleDocument.getSnapshot(),original:originalDoc,busy:subtitleTranscription.busy}));assert.equal(failed.job.phase,'error');assert.equal(failed.busy,false);assert.deepEqual(failed.doc,failed.original);checks.push('failed process launch persists an error job, releases UI and preserves current document');
 const reopened=await runtime.browser.newPage();await reopened.goto(runtime.url);await reopened.evaluate(job=>localStorage.setItem('artem.subtitle-studio.transcription.v1',JSON.stringify(job)),failed.job);
 await reopened.addInitScript(()=>{window.reads=[];window.__adobe_cep__={getSystemPath:kind=>kind==='extension'?'/plugin':'/userdata'};window.cep={fs:{readFile(file){reads.push(file);return {err:1};}}};});await reopened.reload();await reopened.waitForTimeout(750);
 assert.equal(await reopened.evaluate(()=>subtitleTranscription.busy),false);assert.equal(await reopened.evaluate(()=>reads.some(file=>file.endsWith('/status.json'))),false);await reopened.close();checks.push('reopened error job never resumes phantom recognition polling');

 await p.evaluate(async()=>{window.launchFails=false;await subtitleTranscription.start('/voice.wav');});assert.equal(await p.evaluate(()=>subtitleTranscription.busy),true);assert.equal(await p.evaluate(()=>processCalls.length),2);await p.evaluate(()=>SubtitleDesign.select('source'));await p.locator('#transcription-cancel').click();assert.ok(await p.evaluate(()=>Object.keys(files).some(path=>path.endsWith('/cancel'))));checks.push('retry starts a fresh recognition job and cancellation remains available');await p.close();
 const t=await runtime.browser.newPage();await t.goto(runtime.url);await t.evaluate(()=>{window.processCalls=[];window.__adobe_cep__={getSystemPath:()=>'/plugin'};window.cep={fs:{readFile:()=>({err:0,data:JSON.stringify({python:'',llama:'',topicsModel:'',llamaSha256:''})}),stat:()=>({err:0})},process:{createProcess(...args){processCalls.push(args);return {err:0};}}};window.fetch=async()=>{throw Error('offline');};});
 const topicError=await t.evaluate(async()=>{try{await subtitleLocalAI.ensure();return '';}catch(e){return e.message;}});assert.match(topicError,/Python/);assert.equal(await t.evaluate(()=>processCalls.length),0);checks.push('offline topic model with unconfigured paths fails before launching or long polling');
 await t.evaluate(()=>{window.fetch=async()=>({ok:true,json:async()=>({data:[{id:'unrelated-model'}]})});});const conflict=await t.evaluate(async()=>{try{await subtitleLocalAI.ensure();return '';}catch(e){return e.message;}});assert.match(conflict,/занят/);assert.equal(await t.evaluate(()=>processCalls.length),0);checks.push('occupied topic API port does not start another model');
 await t.evaluate(()=>{window.fetch=async()=>({ok:true,json:async()=>({data:[{id:'Qwen3-4B-Instruct-2507'}]})});});await t.evaluate(()=>subtitleLocalAI.ensure());assert.equal(await t.evaluate(()=>processCalls.length),0);checks.push('already healthy expected model works without local config/startup');
 await t.close();
 }finally{await runtime.close();}
 fs.writeFileSync(root+'/premiere-subtitles-cep/engine-startup-tests.json',JSON.stringify({status:'browser-CEP-contract-tested; native engines not started',passed:checks.length,checks},null,2)+'\n');console.log({passed:checks.length,checks});
})().catch(e=>{console.error(e);process.exitCode=1;});
