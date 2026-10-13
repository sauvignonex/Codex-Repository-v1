// Prototype only: literal expressions compiled outside the Adobe scripting engine.
const timing=(family,text,second,duration)=>{
 const letters=s=>Math.max(1,s.replace(/[^\p{L}\p{N}]/gu,'').length);
 const a=letters(text),b=letters(second),read=Math.min(.8,.16+.012*(a+b));
 const intro=Math.min((family==='B'?.26+.034*a:family==='A'?.08+.006*a:.10+.012*a),duration*.32);
 const delay=Math.min(family==='A'?.70:family==='B'?intro+.05:intro*.75+.10,duration*(family==='A'?.30:family==='B'?.18:.12));
 const secondIntro=Math.min((family==='A'?.24+.030*b:family==='B'?.18+.018*b:.10+.008*b),duration*.32);
 const outro=Math.min(family==='A'?0:family==='B'?7/30:9/30,duration*.12),full=Math.max(intro,delay+secondIntro);
 const immediate=duration-full-outro<read;
 return {intro:immediate?0:intro,delay:immediate?0:delay,secondIntro:immediate?0:secondIntro,outro:immediate?0:outro,read,immediate,full:immediate?0:full,hold:immediate?duration:duration-full-outro};
};
function expressionPrefix(family,secondary){
 return 'var ctl=thisComp.layer("Настройки");var d=Math.max(.034,Math.min(6,ctl.effect(1)(1)));var a=Math.max(1,thisComp.layer("Ведущая строка").text.sourceText.toString().replace(/[^0-9A-Za-zА-Яа-яЁё]/g,"").length);var b=Math.max(1,thisComp.layer("Подстрока").text.sourceText.toString().replace(/[^0-9A-Za-zА-Яа-яЁё]/g,"").length);var read=Math.min(.8,.16+.012*(a+b));var first=Math.min('+ (family==='B'?'.26+.034*a':family==='A'?'.08+.006*a':'.10+.012*a') +',d*.32);var delay=Math.min('+(family==='A'?'.70':family==='B'?'first+.05':'first*.75+.10')+',d*'+(family==='A'?'.30':family==='B'?'.18':'.12')+');var last=Math.min('+(family==='A'?'.24+.030*b':family==='B'?'.18+.018*b':'.10+.008*b')+',d*.32);var outro=Math.min('+(family==='A'?'0':family==='B'?'7/30':'9/30')+',d*.12);var full=Math.max(first,delay+last);var immediate=d-full-outro<read;function sat(x){return Math.max(0,Math.min(1,x));}var u=immediate?1:sat((time-'+(secondary?'delay':'0')+')/Math.max(.001,'+(secondary?'last':'first')+'));var q='+(family==='B'?'u*u*(3-2*u)':family==='A'&&secondary?'(u<.5?.42*(u/.5):.42+.58*((u-.5)/.5))':'1-Math.pow(1-u,3)')+';var leave=immediate||outro===0?0:sat((time-(d-outro))/outro);';
}
const descriptions=[
 {id:'A',first:'Уяча —',second:'ВКУС МАРИЙЭЛ',firstFont:'CeraPro-Medium',secondFont:'BebasNeueCyrillic',firstSize:55,secondHeight:145,x:120,y:1390,secondX:120,secondY:1440,referenceFrame:88,referenceFrames:89},
 {id:'B',first:'Угощение',second:'для ряженых',firstFont:'Christopher',secondFont:'CeraPro-Medium',firstHeight:155,secondSize:55,x:120,y:1350,secondX:260,secondY:1519,referenceFrame:708,referenceFrames:135},
 {id:'C',first:'ПОЧЕМУ',second:'РЖАНАЯ МУКА?',firstFont:'BebasNeueCyrillic',secondFont:'BebasNeueCyrillic',firstHeight:145,secondHeight:62,x:240,y:1320,secondX:246,secondY:1483,referenceFrame:564,referenceFrames:144}
];
function compile(){return descriptions.map(spec=>({...spec,layers:[false,true].map(secondary=>{
 const font=secondary?spec.secondFont:spec.firstFont,size=secondary?spec.secondSize:spec.firstSize,height=secondary?spec.secondHeight:spec.firstHeight;
 const x=secondary?spec.secondX:spec.x,y=secondary?spec.secondY:spec.y,p=expressionPrefix(spec.id,secondary);
 const color=spec.id==='C'&&!secondary?[1,.08,.08]:[1,1,1];
 const travel=spec.id==='A'?0:spec.id==='B'?(secondary?12:0):0;
 const direction=spec.id==='C'&&!secondary?30:0;
 return {name:secondary?'Подстрока':'Ведущая строка',text:secondary?spec.second:spec.first,font,
  source:'text.sourceText.style.setFont("'+font+'").setFontSize(200).setAllCaps(false).setSmallCaps(false).setFillColor('+JSON.stringify(color)+').setText(value.toString());',
  anchor:'var r=sourceRectAtTime(0,false);[r.left,r.top];',
  scale:'var r=sourceRectAtTime(0,false);var s=Math.min('+(size?size+'/200':height+'/Math.max(1,r.height)')+','+(864-x-18)+'/Math.max(1,r.width));[s*100,s*100];',
  position:p+(spec.id==='B'?'var caption=thisComp.layer("Подстрока");var cr=caption.sourceRectAtTime(0,false);var extra=Math.max(0,cr.height*caption.transform.scale[1]/100-50);':'var extra=0;')+'['+x+'+'+direction+'*(1-q),'+y+'-extra+'+travel+'*(1-q)];',
  opacity:p+'immediate?100:100*Math.min(sat((time-'+(secondary?'delay':'0')+')/.033),1-leave);',
  mask:p+'var r=sourceRectAtTime(0,false),pad=18,x=r.left-pad,y=r.top-pad,w=r.width+2*pad,h=r.height+2*pad;'+
  'createPath([[x,y],[x+w*q,y],[x+w*q,y+h],[x,y+h]],[],[],true);'};
 })}));}
module.exports={timing,compile,descriptions,expressionPrefix};
if(require.main===module){const fs=require('fs');fs.writeFileSync(process.argv[2],JSON.stringify(compile(),null,2));}
