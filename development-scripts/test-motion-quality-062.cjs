const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../premiere-subtitles-cep'),motion=require(root+'/motion.js'),checks=[];
for(const d of [.1,.233,.4,.8,1.2,6])for(const role of ['speech','title','accent'])for(const mode of ['soft','pop','write','none'])for(const hand of role==='title'?[false,true]:[role==='accent']){
 let last=null;
 for(let i=0;i<=1200;i++){
  const m=motion.sample(d*i/1200,d,mode,role,hand);
  for(const value of Object.values(m))assert.ok(Number.isFinite(value));
  assert.ok(m.scale>=.955&&m.scale<=1.012001);
  if(mode==='none')assert.deepEqual(m,{opacity:1,scale:1,x:0,y:0,blur:0,reveal:1});
  if(i>=600&&i<960){assert.ok(m.opacity>.999);assert.ok(m.reveal>.999);assert.ok(m.blur<.001);assert.ok(Math.abs(m.scale-1)<.001);}
  if(last){assert.ok(Math.abs(last.scale-m.scale)<.02);assert.ok(Math.abs(last.y-m.y)<2);if(i<960)assert.ok(m.reveal>=last.reveal);}
  last=m;
 }
}
checks.push('all roles and modes: stable readable hold, bounded overshoot, continuous movement, full reveal even for 100ms cues');
for(const t of [.05,.1,.2,.4])assert.equal(motion.sample(t,1,'soft','speech').scale,1);
checks.push('ordinary speech does not pulse or shrink on entry and exit in soft mode');
const first=motion.sample(.06,1.2,'write','title',false),second=motion.sample(.06,1.2,'write','title',true);
assert.ok(first.opacity>.95);assert.equal(second.opacity,0);
checks.push('main title precedes handwritten line');
for(const role of ['title','accent'])assert.equal(motion.sample(.6,1.2,'pop',role,role==='accent').scale,1);
checks.push('highlight scale settles exactly to approved proportions');
for(const role of ['speech','title','accent']){const hand=role==='accent';const short=motion.sample(.08,1.8,'write',role,hand,3),long=motion.sample(.08,1.8,'write',role,hand,13);assert.ok(long.y>short.y);if(hand)assert.ok(long.reveal<short.reveal);}
checks.push('long words move and reveal more slowly than short words');
for(const count of [1,5,30])for(const role of ['speech','title','accent']){const m=motion.sample(.05,.1,'write',role,role==='accent',count);assert.ok(m.opacity>.999);assert.ok(m.reveal>.999);}
checks.push('word length never consumes readable hold in a 100ms cue');
fs.writeFileSync(root+'/motion-quality-tests-0.6.2.json',JSON.stringify({passed:checks.length,checks},null,2));console.log({passed:checks.length,checks});
