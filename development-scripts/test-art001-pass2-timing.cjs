const assert=require('node:assert/strict'),vm=require('node:vm');
const {timing,expressionPrefix}=require('./art001-pass2-motion.cjs');
const rows=[];
for(const family of ['A','B','C'])for(const [label,text,second] of [['short','Дар','Леса'],['long','Приобщение','Природная\nмудрость']])for(const duration of [.25,.5,1.2,3]){
 const t=timing(family,text,second,duration);
 const env={time:0,thisComp:{layer:name=>name==='Настройки'?{effect:()=>()=>duration}:{text:{sourceText:name==='Ведущая строка'?text:second}}}};
 const nativePlan=vm.runInNewContext(expressionPrefix(family,false)+'({first,delay,last,outro,immediate,read,full})',env);
 assert.equal(nativePlan.immediate,t.immediate);assert.equal(nativePlan.read,t.read);
 if(!t.immediate){assert.equal(nativePlan.first,t.intro);assert.equal(nativePlan.delay,t.delay);assert.equal(nativePlan.last,t.secondIntro);assert(t.hold>=t.read);assert(t.intro<=duration*.32);}
 else assert.equal(t.hold,duration);
 rows.push({family,label,duration,...t});
}
for(const family of ['A','B','C'])assert(timing(family,'Приобщение','Природная мудрость',3).intro>timing(family,'Дар','Леса',3).intro,'Length must affect timing');
console.log(JSON.stringify({samples:rows.length,source:'VM/source contract; not Adobe',rows},null,2));
