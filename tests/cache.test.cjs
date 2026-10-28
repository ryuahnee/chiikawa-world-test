const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const path=require('node:path');const source=fs.readFileSync(path.join(__dirname,'../dist/update.js'),'utf8');
async function setup({version='bbbbbbbbbbbbbbbb',screen='home',offline=false,previous=null,href='https://example.com/quiz/?from=friend#result/s'}={}){
 const events={},calls=[],navigations=[];let observer,currentScreen=screen;
 const app={querySelector:()=>['home','result'].includes(currentScreen)?{}:null};
 const document={visibilityState:'visible',querySelector:()=>({content:'aaaaaaaaaaaaaaaa'}),getElementById:()=>app,addEventListener:(name,fn)=>events[name]=fn};
 const canonicalChanges=[];const location={href,replace:url=>navigations.push(url)};
 const storage=new Map(previous?[['release-refresh',JSON.stringify(previous)]]:[]);
 vm.runInNewContext(source,{document,location,URL,Date,history:{replaceState:(_state,_title,url)=>canonicalChanges.push(url)},sessionStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},window:{addEventListener:(name,fn)=>events[name]=fn},MutationObserver:class{constructor(fn){observer=fn;}observe(){}},fetch:async(url,options)=>{calls.push({url,options});if(offline)throw Error('offline');return{ok:true,json:async()=>({version})};}});
 await new Promise(resolve=>setImmediate(resolve));
 return {events,calls,navigations,canonicalChanges,completeQuiz(){currentScreen='result';observer();}};
}
(async()=>{
 let s=await setup({version:'aaaaaaaaaaaaaaaa'});assert.equal(s.navigations.length,0);
 s=await setup({version:'aaaaaaaaaaaaaaaa',href:'https://example.com/quiz/'});assert.equal(s.navigations.length,0);assert.equal(s.calls.length,1);
 s=await setup({version:'aaaaaaaaaaaaaaaa',href:'https://example.com/quiz/?v=old&_refresh=123&from=friend#result/s'});assert.equal(s.canonicalChanges[0],'https://example.com/quiz/?from=friend#result/s');
 s=await setup();assert.equal(s.navigations.length,1);const url=new URL(s.navigations[0]);assert.equal(url.hash,'#result/s');assert.equal(url.searchParams.get('from'),'friend');assert.equal(url.searchParams.get('v'),'bbbbbbbbbbbbbbbb');assert.equal(s.calls[0].options.cache,'no-store');assert(new URL(s.calls[0].url).searchParams.has('_check'));
 s=await setup({screen:'quiz'});assert.equal(s.navigations.length,0);s.completeQuiz();assert.equal(s.navigations.length,1);
 s=await setup({offline:true});assert.equal(s.navigations.length,0);
 s=await setup({version:'invalid'});assert.equal(s.navigations.length,0);
 s=await setup({previous:{version:'bbbbbbbbbbbbbbbb',time:Date.now()}});assert.equal(s.navigations.length,0);
 assert.equal(typeof s.events.pageshow,'function');assert.equal(typeof s.events.visibilitychange,'function');
 console.log('PASS: release refresh, cache bypass, preserved result URL, deferred quiz refresh, offline and loop protection');
})().catch(error=>{console.error(error);process.exitCode=1;});
