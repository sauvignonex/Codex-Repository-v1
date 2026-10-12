const { chromium } = require('C:/Users/Artem/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const path = require('node:path');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:760,height:1000},colorScheme:'dark'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('file:///'+path.resolve('work/subtitle-panel-preview.html').replaceAll('\\','/'),{waitUntil:'domcontentloaded'});
 const panel=page.frameLocator('iframe');
 await panel.locator('#ss-text').waitFor();
 await page.waitForTimeout(1200);
 console.log('Initial errors',errors);
 await panel.locator('[data-sample="long"]').click();
 if((await panel.locator('#ss-current-font').textContent())!=='Cera Pro Medium'){console.log('Errors',errors);await browser.close();throw Error('Long phrase font did not change');}
 await panel.locator('#ss-role').selectOption('accent');
 if((await panel.locator('#ss-current-font').textContent())!=='Chrostopher')throw Error('Role did not change');
 await panel.locator('#ss-role').selectOption('auto');
 await panel.locator('[data-sample="short"]').click();
 await panel.locator('#ss-safe-toggle').uncheck();
 if(await panel.locator('#ss-safe-overlay').isVisible())throw Error('Safe overlay did not hide');
 await panel.locator('#ss-safe-toggle').check();
 await panel.locator('#ss-apply').click();
 await panel.locator('#subtitle-studio-preview').screenshot({path:'work/ui-desktop.png'});
 await page.setViewportSize({width:340,height:1500});
 const overflow=await panel.locator('#subtitle-studio-preview').evaluate(el=>el.scrollWidth>el.clientWidth+1);
 if(overflow)throw Error('Mobile overflow');
 await panel.locator('#subtitle-studio-preview').screenshot({path:'work/ui-mobile.png'});
 console.log(JSON.stringify({errors,overflow,status:await panel.locator('#ss-status').textContent()}));
 await browser.close();if(errors.length)process.exitCode=1;
})();
