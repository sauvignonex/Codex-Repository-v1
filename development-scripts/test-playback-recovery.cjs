// Execute host logic against a contract fixture; native Premiere remains unverified.
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),code=fs.readFileSync(root+'/premiere-subtitles-cep/host.jsx','utf8'),checks=[];
function setup(options={}){
 let renders=0;const marks={i:.5,o:1,wi:.4,wo:1.1},original={...marks},attempts=[];
 const s={sequenceID:'own',name:'[Subtitle Studio] fixture',timebase:options.timebase??'8467200000',
 isWorkAreaEnabled:()=>options.work!==false,getInPointAsTime:()=>({seconds:options.invalidSaved?NaN:marks.i}),getOutPointAsTime:()=>({seconds:marks.o}),getWorkAreaInPointAsTime:()=>({seconds:marks.wi}),getWorkAreaOutPointAsTime:()=>({seconds:marks.wo}),
 videoTracks:{numTracks:1,0:{clips:{numItems:2,0:{start:{seconds:0},end:{seconds:.8},getMGTComponent:()=>({})},1:{start:{seconds:1},end:{seconds:1.8},getMGTComponent:()=>({})}}}}};
 for(const [name,key] of Object.entries({setInPoint:'i',setOutPoint:'o',setWorkAreaInPoint:'wi',setWorkAreaOutPoint:'wo'}))s[name]=value=>{attempts.push({name,value,renders});if(renders&&name===options.restoreFail){if(options.returnFalse)return false;throw Error('restore fixture failure');}if(!renders&&name===options.expandFail)return false;marks[key]=value;};
 const app={project:{activeSequence:s},enableQE(){}};
 const q={renderAll(){renders++;if(options.switchSequence)app.project.activeSequence={sequenceID:'other'};if(options.renderError)throw Error('render fixture error');return options.cancel?false:true;},getGreenBarTimes(){return options.green??[{secs:0},{secs:1.8}];}};
 if(options.noGreenMethod)delete q.getGreenBarTimes;
 const c=vm.createContext({$:{_artemSubtitleStudio:{}},app,qe:{project:{getActiveSequence:()=>q}}});vm.runInContext(code,c);
 return {call:()=>vm.runInContext('$._artemSubtitleStudio.renderPlayback("own")',c),marks,original,attempts,get renders(){return renders;}};
}
function test(name,fn){fn();checks.push(name);}
test('full coverage succeeds and restores four original marks',()=>{const t=setup();assert.match(t.call(),/^ok\|own\|2\|/);assert.deepEqual(t.marks,t.original);});
test('cancellation and render exceptions restore original marks',()=>{for(const opt of [{cancel:true},{renderError:true}]){const t=setup(opt);assert.match(t.call(),/^error\|/);assert.deepEqual(t.marks,t.original);}});
test('one failed restore never hides failure or skips remaining marks',()=>{for(const name of ['setInPoint','setOutPoint','setWorkAreaInPoint','setWorkAreaOutPoint'])for(const returnFalse of [false,true]){const t=setup({restoreFail:name,returnFalse});const raw=t.call();assert.match(raw,/^error\|/);assert.match(decodeURIComponent(raw),/Не удалось восстановить/);assert.equal(t.attempts.filter(a=>a.renders===1).length,4);}});
test('malformed and partial cache ranges cannot report success',()=>{for(const green of [[{secs:0}], [{secs:0},{secs:NaN}], [{secs:-1},{secs:2}], [{secs:1},{secs:0}], [{secs:0},{secs:.7}], []]){const t=setup({green});assert.match(t.call(),/^error\|/);assert.deepEqual(t.marks,t.original);}});
test('invalid timing, saved marks and unavailable cache reader prevent rendering',()=>{for(const opt of [{timebase:'invalid'},{timebase:0},{invalidSaved:true},{noGreenMethod:true}]){const t=setup(opt);assert.match(t.call(),/^error\|/);assert.equal(t.renders,0);assert.deepEqual(t.marks,t.original);}});
test('failed range expansion restores marks and never renders',()=>{const t=setup({expandFail:'setOutPoint'});assert.match(t.call(),/^error\|/);assert.equal(t.renders,0);assert.deepEqual(t.marks,t.original);});
test('sequence switch during rendering never reports cache success',()=>{const t=setup({switchSequence:true});assert.match(t.call(),/^error\|/);assert.deepEqual(t.marks,t.original);});
test('disabled work area stays unchanged',()=>{const t=setup({work:false});assert.match(t.call(),/^ok\|/);assert.deepEqual(t.marks,t.original);assert.equal(t.attempts.some(a=>a.name.startsWith('setWork')),false);});
test('split adjacent ranges merge to cover all clips',()=>{const t=setup({green:[{secs:1},{secs:1.8},{secs:0},{secs:1}]});assert.match(t.call(),/^ok\|own\|2\|/);});
fs.writeFileSync(root+'/premiere-subtitles-cep/playback-recovery-tests.json',JSON.stringify({status:'host-contract-tested; native Premiere verification pending',passed:checks.length,checks},null,2)+'\n');console.log({passed:checks.length,checks});
