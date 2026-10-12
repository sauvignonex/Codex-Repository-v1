const { chromium }=require('C:/Users/Artem/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:760,height:1100},colorScheme:'dark'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file:///'+path.resolve('outputs/plugin-ui-v2/panel-preview.html').replaceAll('\\','/'),{waitUntil:'domcontentloaded'});
  const f=page.frameLocator('iframe');await f.locator('#ss-text').waitFor();await page.waitForTimeout(1000);
  await f.locator('#ss-headlines').click();
  if(!await f.locator('#ss-ai-review').isVisible())throw Error('Review not visible');
  await f.locator('#ss-headline-draft').fill('');await f.locator('#ss-headline-apply').click();
  if(!await f.locator('#ss-ai-review').isVisible())throw Error('Empty title accepted');
  await f.locator('#ss-headline-draft').fill('Правило нечётного числа');
  await f.locator('#subtitle-studio-preview').screenshot({path:'work/ui-v2-desktop.png'});
  await page.setViewportSize({width:340,height:1600});
  if(await f.locator('#subtitle-studio-preview').evaluate(e=>e.scrollWidth>e.clientWidth+1))throw Error('Mobile overflow');
  await f.locator('#subtitle-studio-preview').screenshot({path:'work/ui-v2-mobile.png'});
  await f.locator('#ss-headline-apply').click();
  if(await f.locator('#ss-text').inputValue()!=='Правило нечётного числа')throw Error('Title not applied');
  if(await f.locator('#ss-role').inputValue()!=='title')throw Error('Wrong role');
  await f.locator('#ss-headlines').click();await f.locator('#ss-headline-draft').fill('Не применять');await f.locator('#ss-headline-cancel').click();
  if(await f.locator('#ss-text').inputValue()!=='Правило нечётного числа')throw Error('Cancel mutated text');
  console.log(JSON.stringify({errors,result:'Open, edit, empty validation, apply, cancel and narrow layout passed'}));
  if(errors.length)throw Error('JavaScript errors');
 }finally{await browser.close();}
})();
