const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.join(__dirname,'../dist');
const token=process.env.POSTHOG_PROJECT_TOKEN||'',host=process.env.POSTHOG_API_HOST||'';
if(token && (!/^phc_[A-Za-z0-9_-]+$/.test(token)||!['https://us.i.posthog.com','https://eu.i.posthog.com'].includes(host)))throw Error('Invalid analytics configuration');
fs.writeFileSync(path.join(root,'analytics-config.js'),'// Generated from release environment; public write-only token only.\nwindow.quizAnalyticsConfig = Object.freeze('+JSON.stringify({projectToken:token,host})+');\n');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const entry=path.join(root,'index.html');let html=fs.readFileSync(entry,'utf8');
if(!html.includes('name="app-version"'))html=html.replace('<head>','<head><meta name="app-version" content="__RELEASE_VERSION__">');
if(!html.includes('src="update.js'))html=html.replace('</body>','<script src="update.js"></script></body>');
for(const name of ['style.css','data.js','art.js','analytics-config.js','analytics.js','app.js','update.js']){
 const escaped=name.replaceAll('.','\\.');
 html=html.replace(new RegExp(escaped+'(?:\\?v=[a-zA-Z0-9]+)?(?=")','g'),name+'?v='+hash(fs.readFileSync(path.join(root,name))).slice(0,12));
}
html=html.replace(/(<meta name="app-version" content=")[^"]*(">)/,'$1__RELEASE_VERSION__$2');
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name)).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const digest=crypto.createHash('sha256').update(html);
for(const file of files(root)){const name=path.relative(root,file);if(name==='index.html'||name==='version.json')continue;digest.update(name).update(fs.readFileSync(file));}
const version=digest.digest('hex').slice(0,16);
fs.writeFileSync(entry,html.replace('__RELEASE_VERSION__',version));
fs.writeFileSync(path.join(root,'version.json'),JSON.stringify({version})+'\n');
console.log('Prepared release:',version);
