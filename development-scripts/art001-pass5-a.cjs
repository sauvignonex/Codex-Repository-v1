// Isolated A study. B/C and installed runtime remain the Pass3 baseline.
const base=require('./art001-pass3-motion.cjs');
function prefix(secondary){
 let p=base.expressionPrefix('A',secondary).replace('Math.min(.70,','Math.min(.60,');
 if(secondary)p=p.replace('var q=(u<.5?.42*(u/.5):.42+.58*((u-.5)/.5));',
 'var boundary=Math.max(.01,Math.min(.99,ctl.effect(2)(1)));var q;if(immediate)q=1;else if(u<.35)q=boundary*(u/.35);else if(u<.60)q=boundary;else q=boundary+(1-boundary)*((u-.60)/.40);');
 return p;
}
function compile(){
 const spec=base.compile()[0];
 spec.layers.forEach((l,i)=>{
  const old=base.expressionPrefix('A',Boolean(i)),next=prefix(Boolean(i));
  for(const k of ['position','opacity','mask'])l[k]=l[k].replace(old,next);
  // Pin typography instead of inheriting the current AE user's text defaults.
  l.tracking=i?0:-24;l.position=l.position.replace('[120+','[110+');
 });
 return [spec];
}
module.exports={compile,prefix};
if(require.main===module)require('fs').writeFileSync(process.argv[2],JSON.stringify(compile(),null,2));
