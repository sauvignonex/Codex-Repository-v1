const assert=require('node:assert/strict'),vm=require('node:vm');
const {prefix,compile}=require('./art001-pass4-a.cjs');
for(const duration of [.25,.5,1.2,89/30])for(const text of ['Дар','Приобщение']){
 const second='Природная мудрость';
 function sample(time){return vm.runInNewContext(prefix(true)+'({q,immediate,delay,last,full,read})',{time,thisComp:{layer:name=>name==='Настройки'?{effect:index=>()=>index===1?duration:.36}:{text:{sourceText:name==='Ведущая строка'?text:second}}}});}
 const p=sample(0);
 if(duration===.25)assert.equal(p.q,1,'Very short clip must be immediately visible');
 if(!p.immediate){assert(p.delay<=duration*.30);assert(duration-p.full>=p.read);assert.equal(sample(p.delay+p.last*.4).q,sample(p.delay+p.last*.55).q,'First-word pause must hold its measured boundary');assert.equal(sample(p.full+.001).q,1);}
}
const s=compile()[0];assert.equal(s.layers[1].tracking,-84);assert.equal(s.layers[0].tracking,-24);assert(s.layers[1].scale.includes('[s*100,s*100]'));
console.log(JSON.stringify({cases:8,source:'VM only; not Adobe',word_boundary_pause:true,short_visibility:true,uniform_scale:true,tracking_pinned:true}));
