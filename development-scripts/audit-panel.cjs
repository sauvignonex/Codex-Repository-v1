const { chromium }=require('C:/Users/Artem/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});const checks=[],errors=[];
 const page=await browser.newPage({viewport:{width:760,height:1100},colorScheme:'dark'});page.on('pageerror',e=>errors.push(e.message));
 const input=process.argv[2]||'outputs/plugin-ui-v2/panel-preview.html';
 try{
  await page.goto('file:///'+path.resolve(input).replaceAll('\\','/'),{waitUntil:'domcontentloaded'});const f=page.frameLocator('iframe');
  await f.locator('#ss-text').waitFor();await page.waitForTimeout(1000);
  const test=async(name,fn)=>{try{const r=await fn();checks.push({name,passed:r===true,detail:typeof r==='boolean'?undefined:r});}catch(e){checks.push({name,passed:false,detail:e.message});}};
  await test('manual-line-breaks',async()=>{await f.locator('#ss-text').fill('А\nБ');return(await f.locator('#ss-caption').textContent())==='А\nБ';});
  await test('empty-text-blocked',async()=>{await f.locator('#ss-text').fill('   ');return await f.locator('#ss-apply').isDisabled();});
  await test('three-lines-not-silently-merged',async()=>{await f.locator('#ss-text').fill('Первая\nВторая\nТретья');return await f.locator('#ss-apply').isDisabled();});
  await test('real-font-name',async()=>{await f.locator('#ss-text').fill('Марийский десерт');await f.locator('#ss-role').selectOption('title');return(await f.locator('#ss-caption').evaluate(e=>e.style.fontFamily)).includes('Bebas Neue Cyrillic');});
  await test('long-unbroken-text-blocked',async()=>{await f.locator('#ss-text').fill('Щ'.repeat(200));return await f.locator('#ss-apply').isDisabled();});
  await test('invalid-restored-enums',async()=>{await f.locator('#subtitle-studio-preview').evaluate(()=>window.dispatchEvent(new CustomEvent('openai:set_globals',{detail:{globals:{widgetState:{modelContent:{subtitlePanel:{text:'Тест',role:'bad',motion:'bad',source:'bad',size:1e9,position:-1e9,color:'not-a-color'}}}}}})));return await f.locator('#ss-role').inputValue()==='auto'&&await f.locator('#ss-motion').inputValue()==='soft'&&await f.locator('[data-source="srt"]').getAttribute('aria-pressed')==='true';});
  await test('restore-design',async()=>{await f.locator('#subtitle-studio-preview').evaluate(()=>window.dispatchEvent(new CustomEvent('openai:set_globals',{detail:{globals:{widgetState:{privateContent:{design:{radius:7,accent:'#ffcc00'}}}}}})));return(await f.locator('.studio').evaluate(e=>e.style.borderRadius))==='7px';});
  await test('headline-revert',async()=>{await f.locator('#ss-text').fill('Исходная фраза');await f.locator('#ss-headlines').click();await f.locator('#ss-headline-apply').click();const undo=f.locator('#ss-headline-undo');if(!await undo.count())return false;await undo.click();return await f.locator('#ss-text').inputValue()==='Исходная фраза';});
  await test('safe-zone-extreme-layouts',async()=>{await f.locator('details').evaluate(e=>e.open=true);let failures=[];for(const role of ['speech','title','accent'])for(const pos of [28,63,64,74]){await f.locator('#ss-text').fill('ЙЁ марийский десерт');await f.locator('#ss-role').selectOption(role);await f.locator('#ss-position').evaluate((e,v)=>{e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));},pos);await f.locator('#ss-size').evaluate(e=>{e.value=130;e.dispatchEvent(new Event('input',{bubbles:true}));});const r=await f.locator('#ss-caption').evaluate(e=>{if(e.hidden)return{hidden:true};const a=e.getBoundingClientRect(),b=document.getElementById('ss-frame').getBoundingClientRect();return{x:(a.left-b.left)/b.width*1082,y:(a.top-b.top)/b.height*1920,right:(a.right-b.left)/b.width*1082,bottom:(a.bottom-b.top)/b.height*1920};});if(!r.hidden&&(r.x<72||r.y<234||r.right>1018||r.bottom>1600||(r.bottom>1348&&r.right>864)))failures.push({role,pos,r});}return failures.length?failures:true;});
  for(const theme of ['dark','light'])for(const width of [320,520,736])await test(`layout-${theme}-${width}`,async()=>{await page.emulateMedia({colorScheme:theme});await page.setViewportSize({width,height:1300});return await f.locator('#subtitle-studio-preview').evaluate(e=>e.scrollWidth<=e.clientWidth+1);});
  await test('html-is-text',async()=>{await f.locator('#ss-text').fill('<img src=x onerror=alert(1)>');return await f.locator('#ss-caption img').count()===0;});
  await test('no-runtime-errors',async()=>errors.length?errors:true);
  const report={input,checks,passed:checks.filter(x=>x.passed).length,total:checks.length,errors};fs.writeFileSync(process.argv[3]||'work/panel-audit.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close();}
})();
