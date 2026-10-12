((root)=>{
 const sat=x=>Math.max(0,Math.min(1,x)),out=x=>1-Math.pow(1-sat(x),3),smooth=x=>{x=sat(x);return x*x*(3-2*x);};
 function sample(time,duration,motion,role,hand=false,wordLength=null){
  duration=Math.max(.034,Math.min(6,duration));const speech=role==='speech',letters=Math.max(1,Number.isFinite(wordLength)?wordLength:hand||speech?5:8),delay=role==='title'&&hand&&motion!=='none'?Math.min(.075+.005*Math.min(14,letters),duration*.12):0;
  const speed=speech?.095+.005*Math.min(14,letters):hand&&motion==='write'?.30+.02*Math.min(14,letters):.16+.0075*Math.min(18,letters);
  const intro=Math.min(speed,duration*.32),outro=Math.min(speech?.07:.10,duration*.16),u=sat((time-delay)/intro),leave=sat((time-(duration-outro))/outro);
  // Speech is stationary in every mode. A sub-three-frame cue stays visible.
  if(speech)return {opacity:motion==='none'||duration<=.1?1:Math.min(out(time/Math.min(.035,duration*.12)),1-smooth(leave)),scale:1,x:0,y:0,blur:0,reveal:1};
  let scale=1;if(motion==='pop')scale=speech?.985+.015*out(u):u<.72?.955+.057*out(u/.72):1.012-.012*smooth((u-.72)/.28);
  const fade=Math.min(speech?.035:.055,duration*.12),opacity=motion==='none'?1:Math.min(out((time-delay)/fade),1-smooth(leave));
  const y=motion==='none'?0:(speech?8:motion==='pop'?16:22)*(1-out(u))-(speech?4:8)*smooth(leave),x=hand&&motion==='write'?-8*(1-smooth(u)):0;
  // Browser approximation only: real exported templates use AE shutter motion blur.
  const blur=motion==='none'?0:Math.max(0,(speech?2:4)*(1-out(u))+2*leave);
  return {opacity,scale,x,y,blur,reveal:motion==='write'&&role!=='speech'?(hand?smooth(u):out(u)):1};
 }
 root.SubtitleMotion={sample};if(typeof module!=='undefined')module.exports=root.SubtitleMotion;
})(typeof window==='undefined'?globalThis:window);
