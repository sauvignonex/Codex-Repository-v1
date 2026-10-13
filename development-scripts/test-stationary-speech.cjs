// Portable checks of browser layout and extracted AE expressions. This is not native AE QA.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),motion=require('../premiere-subtitles-cep/motion.js');
const checks=[];
function expressions(version){
 const code=fs.readFileSync(path.join(__dirname,`build-vertical-template-${version}.jsx`),'utf8'),layers={};
 const property=()=>({value:{},setValue(){},addToMotionGraphicsTemplateAs(){},addProperty(){return property();},property(){return property();}});
 const comp={name:'test',layers:{addNull:property,addText(){const p=property();p.transform={anchorPoint:{},scale:{},position:{},opacity:{}};Object.defineProperty(p,'name',{set(n){layers[n]=p;},get(){return Object.keys(layers).find(n=>layers[n]===p);}});return p;}},saveFrameToPng(){},exportAsMotionGraphicsTemplate(){return true;}};
 function File(){return {parent:{parent:{fsName:root}},open(){},writeln(){},close(){}};}function Folder(){return {exists:true,fsName:root};}
 vm.runInNewContext(code,{File,Folder,$:{fileName:'builder.jsx'},app:{project:{numItems:0,items:{addComp(){return comp;}},save(){}},beginSuppressDialogs(){},endSuppressDialogs(){}},FontCapsOption:{FONT_NORMAL_CAPS:0},ParagraphJustification:{CENTER_JUSTIFY:0},MaskMode:{ADD:0}});
 assert.equal(Object.keys(layers).length,3);return layers;
}
const old=expressions('062'),next=expressions('063');
function evaluate(layers,name,prop,{role=2,mode=1,time=0,duration=1,position=50,rect={left:-90,top:-150,width:180,height:190},letters=5}={}){
 const values={1:role,2:50,3:position,4:mode,6:50,7:duration};const ctl={effect(i){return ()=>values[i];}};
 const context={time,text:{sourceText:'я'.repeat(letters)},thisLayer:{name,sourceRectAtTime(){return rect;}},thisComp:{layer(){return ctl;}},transform:{scale:[27.5,27.5]}};
 return vm.runInNewContext(layers[name].transform[prop].expression,context);
}
const rects=[{left:0,top:-142,width:53,height:143},{left:-7,top:-148,width:315,height:190},{left:5,top:-180,width:580,height:225},{left:-11,top:-146,width:1850,height:188}];
for(const rect of rects)for(const mode of [0,1,2,3])for(const duration of [.06,.1,Math.fround(.1),.101,.233,1.2,6])for(const time of [0,duration*.05,duration*.5,duration*.99]){
 const options={rect,mode,duration,time};const anchor=evaluate(next,'Текст речи','anchorPoint',options),scale=evaluate(next,'Текст речи','scale',options),pos=evaluate(next,'Текст речи','position',options);
 assert.equal(pos[0]+(rect.left+rect.width-anchor[0])*scale[0]/100,964);
 assert.equal(pos[1]-anchor[1]*scale[1]/100,375);
 const m=motion.sample(time,duration,['none','soft','pop','write'][mode],'speech');
 assert.equal(m.scale,1);assert.equal(m.x,0);assert.equal(m.y,0);assert.equal(m.blur,0);assert.equal(m.reveal,1);
 const opacity=evaluate(next,'Текст речи','opacity',options);assert.ok(Math.abs(opacity/100-m.opacity)<1e-9);if(duration<=.100001)assert.equal(opacity,100);
}
checks.push('AE expression model: fixed ink right and baseline across glyph bounds, modes and durations; preview opacity agrees; 60/100ms including AE float32 slider rounding stay visible');
for(const role of [1,3])for(const name of ['Основной текст','Рукописный акцент'])for(const mode of [0,1,2,3])for(const time of [0,.06,.2,.6,1.19])for(const prop of ['anchorPoint','scale','position','opacity']){
 const options={role,mode,time,duration:1.2};assert.deepEqual(Array.from([evaluate(next,name,prop,options)]).flat(),Array.from([evaluate(old,name,prop,options)]).flat());
}
checks.push('AE expression model: highlight transforms/opacity equal 062');
for(const role of ['title','accent'])for(const mode of ['soft','pop','write','none'])for(const duration of [.06,.1,.233,1.2,6])for(let i=0;i<=120;i++){
 const m=motion.sample(duration*i/120,duration,mode,role,role==='accent',13);Object.values(m).forEach(v=>assert.ok(Number.isFinite(v)));assert.ok(m.scale>=.955&&m.scale<=1.012001);if(i===60){assert.ok(m.opacity>.999);assert.ok(m.reveal>.999);}
}
checks.push('highlights retain readable hold and bounded motion for short/long cues');
(async()=>{
 const {chromium}=require(process.env.SUBTITLE_PLAYWRIGHT_MODULE||'playwright');
 const server=require('http').createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}const type={'.html':'text/html','.js':'text/javascript','.css':'text/css','.ttf':'font/ttf'}[path.extname(file)];if(type)res.setHeader('Content-Type',type);res.end(data);});});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
 const executablePath=process.env.SUBTITLE_CHROMIUM||(process.platform==='linux'&&fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined);
 browser=await chromium.launch({executablePath,headless:true,args:process.platform==='linux'?['--no-sandbox']:[]});
 const page=await browser.newPage({viewport:{width:1100,height:1000}});await page.goto('http://127.0.0.1:'+server.address().port+'/premiere-subtitles-cep/index.html');
 await page.evaluate(async()=>{const font=new FontFace('Cera Pro','url("../recovery-inputs/fonts/CeraPro-Medium.ttf")',{weight:'500'});document.fonts.add(await font.load());SubtitleDesign.select('style');});
 for(const width of [1100,420]){await page.setViewportSize({width,height:1000});
 for(const mode of ['soft','pop','write','none'])for(const word of ['и','лес','баня','мёд','где','скрабирование','пихтового']){
 const layout=await page.evaluate(({word,mode})=>{SubtitlePanel.setText(word,'stationary-test',{role:'speech',size:100,position:50,motion:mode});const c=document.getElementById('ss-caption'),f=document.getElementById('ss-frame'),box=c.getBoundingClientRect(),frame=f.getBoundingClientRect(),ctx=document.createElement('canvas').getContext('2d'),style=getComputedStyle(c);ctx.font=style.fontWeight+' '+style.fontSize+' '+style.fontFamily;const ink=ctx.measureText(word);return {valid:subtitlePreview.getLayout().valid,baseline:(c.querySelector('[data-speech-baseline]').getBoundingClientRect().top-frame.top-f.clientTop)/f.clientHeight*1920,right:(box.right-frame.left-f.clientLeft-ink.width+ink.actualBoundingBoxRight)/f.clientWidth*1080,font:parseFloat(style.fontSize)/f.clientWidth*1080};},{word,mode});
 assert.ok(layout.valid);assert.ok(Math.abs(layout.baseline-375)<.5,JSON.stringify(layout));assert.ok(Math.abs(layout.right-964)<.5,JSON.stringify(layout));assert.ok(Math.abs(layout.font-55)<.5,JSON.stringify(layout));
 if(mode!=='none'){await page.locator('#ss-play').click();const frames=await page.evaluate(()=>document.getElementById('ss-caption').getAnimations()[0].effect.getKeyframes());assert.ok(frames.every(f=>f.transform==='translate(-50%, -50%) translate(0px, 0px) scale(1)'||/translate\(-50%,\s*-50%\) translate\(0px,\s*0px\) scale\(1\)/.test(f.transform)));}
 }
 }
 checks.push('Chromium with repository Cera font: seven words, four modes, wide/narrow panel have fixed visible right/baseline and 55px size');
 for(const position of [28,50,74])for(const size of [70,100,130])for(const text of ['и','мёд','скрабирование','с мёдом','с\nмёдом']){
 const geometry=await page.evaluate(({text,position,size})=>{SubtitlePanel.setText(text,'geometry-test',{role:'speech',size,position,motion:'pop'});const c=document.getElementById('ss-caption'),f=document.getElementById('ss-frame'),box=f.getBoundingClientRect();return {valid:subtitlePreview.getLayout().valid,baseline:(c.querySelector('[data-speech-baseline]').getBoundingClientRect().top-box.top-f.clientTop)/f.clientHeight*1920,expected:subtitleTypography.speechPosition(position).baseline};},{text,position,size});
 assert.ok(geometry.valid);assert.ok(Math.abs(geometry.baseline-geometry.expected)<.5,JSON.stringify(geometry));
 }
 await page.evaluate(()=>SubtitlePanel.setText('КЕДРОВАЯ\nБочка','highlight-test',{role:'title',motion:'write'}));
 assert.equal(await page.locator('[data-speech-baseline]').count(),0);
 await page.locator('#ss-play').click();assert.equal(await page.evaluate(()=>document.getElementById('ss-caption').children.length),2);
 checks.push('font sizes 70–130%, height 28–74%, connectors/multiline retain first baseline; switching to title removes speech marker');

 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
 const report={status:'code-tested; native Adobe verification pending',checks,passed:checks.length};fs.writeFileSync(root+'/premiere-subtitles-cep/stationary-speech-tests.json',JSON.stringify(report,null,2)+'\n');console.log(report);
})().catch(error=>{console.error(error);process.exitCode=1;});
