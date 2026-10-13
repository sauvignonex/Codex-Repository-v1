const fs=require('fs'),path=require('path'),http=require('http');
module.exports=async function(root){
 const {chromium}=require(process.env.SUBTITLE_PLAYWRIGHT_MODULE||'playwright');
 const server=http.createServer((req,res)=>{
  let file;try{file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));}catch(_){res.writeHead(400).end();return;}
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}const type={'.html':'text/html','.js':'text/javascript','.css':'text/css','.ttf':'font/ttf'}[path.extname(file)];if(type)res.setHeader('Content-Type',type);res.end(data);});
 });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;try{browser=await chromium.launch({executablePath:process.env.SUBTITLE_CHROMIUM||(process.platform==='linux'&&fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:process.platform==='linux'?['--no-sandbox']:[]});}catch(error){await new Promise(resolve=>server.close(resolve));throw error;}
 return {browser,url:'http://127.0.0.1:'+server.address().port+'/premiere-subtitles-cep/index.html',close:async()=>{try{await browser.close();}finally{await new Promise(resolve=>server.close(resolve));}}};
};
