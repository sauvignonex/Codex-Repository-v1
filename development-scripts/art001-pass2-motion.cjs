// Prototype only: literal expressions compiled outside the Adobe scripting engine.
const timing=(family,text,second,duration)=>{
 const letters=s=>Math.max(1,s.replace(/[^\p{L}\p{N}]/gu,'').length);
 const a=letters(text),b=letters(second),read=Math.min(.8,.16+.012*(a+b));
 const intro=Math.min((family==='B'?.16+.018*a:family==='A'?.08+.006*a:.10+.012*a),duration*.32);
 const delay=Math.min(family==='A'?.50:family==='B'?intro*.85+.16:intro*.75+.10,duration*(family==='A'?.24:.12));
 const secondIntro=Math.min((family==='A'?.16+.012*b:.10+.008*b),duration*.32);
 const outro=Math.min(.10,duration*.12),full=Math.max(intro,delay+secondIntro);
 const immediate=duration-full-outro<read;
 return {intro:immediate?0:intro,delay:immediate?0:delay,secondIntro:immediate?0:secondIntro,outro:immediate?0:outro,read,immediate,full:immediate?0:full,hold:immediate?duration:duration-full-outro};
};
function expressionPrefix(family,secondary){
 return 'var ctl=thisComp.layer("Настройки");var d=Math.max(.034,Math.min(6,ctl.effect(1)(1)));var a=Math.max(1,thisComp.layer("Ведущая строка").text.sourceText.toString().replace(/[^0-9A-Za-zА-Яа-яЁё]/g,"").length);var b=Math.max(1,thisComp.layer("Подстрока").text.sourceText.toString().replace(/[^0-9A-Za-zА-Яа-яЁё]/g,"").length);var read=Math.min(.8,.16+.012*(a+b));var first=Math.min('+ (family==='B'?'.16+.018*a':family==='A'?'.08+.006*a':'.10+.012*a') +',d*.32);var delay=Math.min('+(family==='A'?'.50':family==='B'?'first*.85+.16':'first*.75+.10')+',d*'+(family==='A'?'.24':'.12')+');var last=Math.min('+(family==='A'?'.16+.012*b':'.10+.008*b')+',d*.32);var outro=Math.min(.10,d*.12);var full=Math.max(first,delay+last);var immediate=d-full-outro<read;function sat(x){return Math.max(0,Math.min(1,x));}var u=immediate?1:sat((time-'+(secondary?'delay':'0')+')/Math.max(.001,'+(secondary?'last':'first')+'));var q=1-Math.pow(1-u,3);var leave=immediate?0:sat((time-(d-outro))/outro);';
}
const descriptions=[
 {id:'A',first:'Уяча —',second:'ВКУС МАРИЙЭЛ',firstFont:'CeraPro-Medium',secondFont:'BebasNeueCyrillic',firstSize:55,secondHeight:145,x:120,y:1390,secondX:120,secondY:1440,referenceFrame:88},
 {id:'B',first:'Угощение',second:'для ряженых',firstFont:'Christopher',secondFont:'CeraPro-Medium',firstHeight:130,secondSize:55,x:120,y:1370,secondX:260,secondY:1504,referenceFrame:708},
 {id:'C',first:'ПОЧЕМУ',second:'РЖАНАЯ МУКА?',firstFont:'BebasNeueCyrillic',secondFont:'BebasNeueCyrillic',firstHeight:145,secondHeight:65,x:240,y:1320,secondX:240,secondY:1490,referenceFrame:564}
];
function compile(){return descriptions.map(spec=>({...spec,layers:[false,true].map(secondary=>{
 const font=secondary?spec.secondFont:spec.firstFont,size=secondary?spec.secondSize:spec.firstSize,height=secondary?spec.secondHeight:spec.firstHeight;
 const x=secondary?spec.secondX:spec.x,y=secondary?spec.secondY:spec.y,p=expressionPrefix(spec.id,secondary);
 const color=spec.id==='C'&&!secondary?[1,.08,.08]:[1,1,1];
 const travel=spec.id==='A'?(secondary?22:0):spec.id==='B'?(secondary?12:0):0;
 const direction=spec.id==='C'&&!secondary?30:0;
 return {name:secondary?'Подстрока':'Ведущая строка',text:secondary?spec.second:spec.first,font,
  source:'text.sourceText.style.setFont("'+font+'").setFontSize(200).setAllCaps(false).setSmallCaps(false).setFillColor('+JSON.stringify(color)+').setText(value.toString());',
  anchor:'var r=sourceRectAtTime(0,false);[r.left,r.top];',
  scale:'var r=sourceRectAtTime(0,false);var s=Math.min('+(size?size+'/200':height+'/Math.max(1,r.height)')+','+(864-x-18)+'/Math.max(1,r.width));[s*100,s*100];',
  position:p+(spec.id==='B'?'var caption=thisComp.layer("Подстрока");var cr=caption.sourceRectAtTime(0,false);var extra=Math.max(0,cr.height*caption.transform.scale[1]/100-50);':'var extra=0;')+'['+x+'+'+direction+'*(1-q),'+y+'-extra+'+travel+'*(1-q)];',
  opacity:p+'immediate?100:100*Math.min(sat((time-'+(secondary?'delay':'0')+')/.033),1-leave);',
  mask:p+'var r=sourceRectAtTime(0,false),pad=18,x=r.left-pad,y=r.top-pad,w=r.width+2*pad,h=r.height+2*pad;'+
  (spec.id==='A'&&secondary?'createPath([[x,y+h*(1-q)],[x+w,y+h*(1-q)],[x+w,y+h],[x,y+h]],[],[],true);':'createPath([[x,y],[x+w*q,y],[x+w*q,y+h],[x,y+h]],[],[],true);')};
 })}));}
module.exports={timing,compile,descriptions,expressionPrefix};
if(require.main===module){const fs=require('fs');fs.writeFileSync(process.argv[2],JSON.stringify(compile(),null,2));}
