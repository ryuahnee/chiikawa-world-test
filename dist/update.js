// Check releases on entry and when a suspended mobile tab returns.
(()=>{
 const current=document.querySelector('meta[name="app-version"]')?.content;
 const app=document.getElementById('app');
 if(!current||!app)return;
 let pending=null,checking=false,lastCheck=0;
 function refreshWhenReady(){
  if(!pending||!app.querySelector('.home, .result'))return;
  const now=Date.now();
  try{
   const previous=JSON.parse(sessionStorage.getItem('release-refresh')||'null');
   if(previous?.version===pending&&now-previous.time<60000)return;
   sessionStorage.setItem('release-refresh',JSON.stringify({version:pending,time:now}));
  }catch{}
  const url=new URL(location.href);
  url.searchParams.set('v',pending);
  url.searchParams.set('_refresh',String(now));
  location.replace(url.href);
 }
 async function check(){
  if(document.visibilityState==='hidden'||checking||Date.now()-lastCheck<5000)return;
  checking=true;lastCheck=Date.now();
  try{
   const url=new URL('version.json',location.href);
   url.searchParams.set('_check',String(lastCheck));
   const response=await fetch(url,{cache:'no-store'});
   if(!response.ok)return;
   const release=await response.json();
   if(release.version===current){
    const canonical=new URL(location.href);
    if(canonical.searchParams.has('v')||canonical.searchParams.has('_refresh')){
     canonical.searchParams.delete('v');canonical.searchParams.delete('_refresh');
     history.replaceState(null,'',canonical.href);
    }
   }
   if(typeof release.version==='string'&&/^[a-f0-9]{16}$/.test(release.version)&&release.version!==current){pending=release.version;refreshWhenReady();}
  }catch{}finally{checking=false;}
 }
 new MutationObserver(refreshWhenReady).observe(app,{childList:true});
 window.addEventListener('pageshow',check);
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')check();});
 check();
})();
