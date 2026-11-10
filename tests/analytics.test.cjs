const {readFileSync}=require('node:fs');
const vm=require('node:vm'),assert=require('node:assert/strict');
const source=readFileSync('dist/analytics.js','utf8');
function boot(config, fail=false){
 const calls=[];const context={window:{quizAnalyticsConfig:config},crypto:{randomUUID:()=> 'temporary-visit'},document:{querySelector:()=>({content:'release'})},fetch:(url,options)=>{if(fail)throw Error('offline');calls.push({url,...options,body:JSON.parse(options.body)});return Promise.resolve({});}};
 vm.runInNewContext(source,context);return {calls,api:context.window.quizAnalytics};
}
assert.equal(boot({}).calls.length,0);
assert.equal(boot({projectToken:'phc_public',host:'https://untrusted.example'}).calls.length,0);
const config={projectToken:'phc_public',host:'https://us.i.posthog.com'};
const {calls,api}=boot(config);
api.capture('quiz_started');api.capture('quiz_completed','s');api.capture('anything');api.capture('quiz_completed','invalid');
assert.equal(calls.length,3);
for(const call of calls){
 assert.equal(call.referrerPolicy,'no-referrer');assert.equal(call.credentials,'omit');
 assert.deepEqual(Object.keys(call.body).sort(),['api_key','distinct_id','event','properties']);
 assert.equal(call.body.properties.$process_person_profile,false);
 assert.equal(call.body.properties.$geoip_disable,true);assert.equal(call.body.properties.$ip,null);
 assert.deepEqual(Object.keys(call.body.properties).sort(),(call.body.event==='quiz_completed'?['$process_person_profile','$geoip_disable','$ip','release','character_id']:['$process_person_profile','$geoip_disable','$ip','release']).sort());
}
assert.doesNotThrow(()=>boot(config,true));
function bootGa(config){
 const scripts=[],calls=[];const context={window:{quizAnalyticsConfig:config},crypto:{randomUUID:()=> 'temporary-visit'},document:{querySelector:()=>({content:'release'}),createElement:()=>({}),head:{appendChild:s=>scripts.push(s)}},fetch:(url,options)=>{calls.push(url);return Promise.resolve({});}};
 vm.runInNewContext(source,context);return {scripts,calls,api:context.window.quizAnalytics,layer:()=>JSON.parse(JSON.stringify((context.window.dataLayer||[]).map(a=>[...a])))};
}
let ga=bootGa({gaMeasurementId:'G-INVALID!'});assert.equal(ga.scripts.length,0);assert.equal(ga.api.gaEnabled,false);
ga=bootGa({gaMeasurementId:'G-TEST123'});
assert.equal(ga.api.gaEnabled,true);assert.equal(ga.api.enabled,false);assert.equal(ga.calls.length,0);
assert.equal(ga.scripts.length,1);assert.equal(ga.scripts[0].src,'https://www.googletagmanager.com/gtag/js?id=G-TEST123');assert.equal(ga.scripts[0].async,true);
assert.deepEqual(ga.layer().find(a=>a[0]==='config'),['config','G-TEST123',{allow_google_signals:false,allow_ad_personalization_signals:false}]);
ga.api.capture('quiz_started');ga.api.capture('quiz_completed','s');ga.api.capture('quiz_completed','invalid');ga.api.capture('anything');
assert.deepEqual(ga.layer().filter(a=>a[0]==='event'),[['event','quiz_started',{}],['event','quiz_completed',{character_id:'s'}]]);
const app=readFileSync('dist/app.js','utf8');
assert.match(app,/calculateResult\(answers\);window\.quizAnalytics\?\.capture\('quiz_completed',result\)/);
assert.equal((app.match(/capture\('quiz_completed'/g)||[]).length,1);
console.log('Analytics privacy and failure checks passed');
