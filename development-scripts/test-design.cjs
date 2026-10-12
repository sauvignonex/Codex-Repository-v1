const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require('C:/Users/Artem/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.resolve(__dirname,'../visual-check-0.5.5');fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
 const p=await b.newPage({viewport:{width:960,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('file:///'+path.resolve(__dirname,'../premiere-subtitles-cep/index.html').replaceAll('\\','/'));
 assert.equal(await p.evaluate(()=>SubtitleDesign.stage),'source');await p.screenshot({path:path.join(out,'01-source.png'),fullPage:true});
 await p.locator('#srt-file').setInputFiles({name:'Проверка.srt',mimeType:'text/plain',buffer:Buffer.from('1\n00:00:00,120 --> 00:00:01,950\nТепло кедро и сила ягод\n\n2\n00:00:02,100 --> 00:00:03,990\nаромат пихта помогает коже.\n')});
 await p.waitForFunction(()=>SubtitleDesign.stage==='style');await p.waitForTimeout(200);assert.equal(await p.evaluate(()=>subtitlePreview.getLayout().valid),true);await p.screenshot({path:path.join(out,'02-style.png'),fullPage:true});
 const before=await p.evaluate(()=>SubtitleDocument.getSnapshot());await p.locator('[data-stage="text"]').click();await p.locator('#scenario-open').click();await p.locator('#editorial-reference').fill('Тепло кедра и сила ягод аромат пихты помогает коже.');await p.screenshot({path:path.join(out,'03-scenario.png')});await p.locator('#scenario-check').click();
 assert.equal(await p.evaluate(()=>SubtitleDesign.stage),'text');assert.equal(await p.locator('#editorial-review textarea').count(),2);await p.screenshot({path:path.join(out,'04-review.png'),fullPage:true});
 await p.locator('#workflow-next').click();assert.equal(await p.evaluate(()=>SubtitleDesign.stage),'style');assert.deepEqual((await p.evaluate(()=>SubtitleDocument.getSnapshot())).cues.map(c=>[c.start,c.end]),before.cues.map(c=>[c.start,c.end]));
 await p.setViewportSize({width:360,height:800});await p.waitForTimeout(200);await p.screenshot({path:path.join(out,'05-narrow.png'),fullPage:true});
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await p.locator('button[data-stage="source"]').click();await p.locator('button[data-stage="source"]').press('ArrowRight');assert.equal(await p.evaluate(()=>SubtitleDesign.stage),'text');assert.deepEqual(errors,[]);
 const report={passed:7,checks:['source screen has working import actions','import opens block styling','offscreen preview still measures correctly','scenario modal and review work across stages','apply retains cue times and opens styling','360px layout has no horizontal overflow','keyboard navigation and no browser errors']};fs.writeFileSync(path.join(out,'design-tests.json'),JSON.stringify(report,null,2));console.log(report);
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
