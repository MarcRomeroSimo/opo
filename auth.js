'use strict';
window.QuadernAuth=(()=>{
 const cfg=window.QUADERN_CONFIG;
 if(location.hash.includes('access_token='))history.replaceState({},'',location.pathname+location.search);
 const sessionKey='quadern-session-v1',deviceKey='quadern-device-v1';
 let session=null,profile=null;
 try{session=JSON.parse(localStorage.getItem(sessionKey)||'null');}catch{}
 let device=localStorage.getItem(deviceKey);
 if(!device){device=Array.from(crypto.getRandomValues(new Uint8Array(32))).map(x=>x.toString(16).padStart(2,'0')).join('');localStorage.setItem(deviceKey,device);}
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function store(s){session=s;if(s)localStorage.setItem(sessionKey,JSON.stringify(s));else localStorage.removeItem(sessionKey);}
 let refreshPromise=null;
 async function refresh(){
  if(!session?.refresh_token)throw Error('Cal iniciar sessió.');
  if(!refreshPromise)refreshPromise=(async()=>{const r=await fetch(cfg.url+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:cfg.key,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:session.refresh_token})});const d=await r.json();if(!r.ok){store(null);throw Error('La sessió ha caducat. Torna a entrar.');}store(d);})().finally(()=>refreshPromise=null);
  return refreshPromise;
 }
 async function call(action,payload={},retry=true){
  if(!cfg||!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(cfg.url))throw Error('Accés privat pendent de configuració.');
  const publicAction=['login','signup'].includes(action);
  if(!publicAction&&session&&session.expires_at*1000<Date.now()+60000)await refresh();
  const r=await fetch(cfg.url+'/functions/v1/quadern',{method:'POST',cache:'no-store',headers:{apikey:cfg.key,'Content-Type':'application/json','x-device-key':device,...(!publicAction&&session?{Authorization:'Bearer '+session.access_token}:{})},body:JSON.stringify({action,...payload})});
  const d=await r.json();if(r.status===401&&!publicAction&&retry&&session?.refresh_token){await refresh();return call(action,payload,false);}if(!r.ok)throw Object.assign(Error(d.error||'No s’ha pogut completar l’operació.'),{status:r.status});return d;
 }
 function shell(message=''){
  document.querySelector('#sidebar').hidden=true;document.querySelector('.local-note').textContent='Accés amb aprovació de Mrs';
  document.querySelector('#main').innerHTML=`<p class="eyebrow">Accés restringit</p><h1>El teu espai d’estudi.</h1><p>Entra amb el compte aprovat per Mrs.</p><div class="notice">Cada compte queda vinculat a una IP i un navegador. Si canvies de xarxa o esborres les dades del navegador, Mrs haurà de desbloquejar-lo. Registrem la IP i l’activitat d’accés per gestionar aquesta restricció.</div><div class="button-row"><button id="login-tab">Entrar</button><button id="signup-tab">Sol·licitar accés</button></div><form id="access-form" class="test-card" style="max-width:500px"><label>Usuari<input name="username" autocomplete="username" required pattern="[A-Za-z0-9_]{3,32}" maxlength="32"></label><label id="email-field" hidden>Correu electrònic<input name="email" type="email" autocomplete="email"></label><label>Contrasenya<input name="password" type="password" autocomplete="current-password" required maxlength="128"></label><p id="access-message" role="status">${esc(message)}</p><button class="primary" type="submit">Entrar</button></form>`;
  let signup=false;const form=document.querySelector('#access-form');
  function tab(value){signup=value;document.querySelector('#email-field').hidden=!value;form.elements.email.required=value;form.elements.password.autocomplete=value?'new-password':'current-password';form.elements.password.minLength=value?12:1;form.querySelector('button[type=submit]').textContent=value?'Sol·licita accés':'Entrar';}
  document.querySelector('#signup-tab').onclick=()=>tab(true);document.querySelector('#login-tab').onclick=()=>tab(false);
  form.onsubmit=async e=>{e.preventDefault();const button=form.querySelector('button[type=submit]');button.disabled=true;const msg=document.querySelector('#access-message');try{const d=await call(signup?'signup':'login',{username:form.elements.username.value,email:form.elements.email.value,password:form.elements.password.value});form.elements.password.value='';if(signup){msg.textContent=d.message;}else{store(d.session);location.reload();}}catch(e){msg.textContent=e.message;}finally{button.disabled=false;}};
 }
 function controls(){
  const bar=document.createElement('div');bar.className='account-bar';bar.innerHTML=`<span>${esc(profile.username)}</span><span id="cloud-status" role="status">Progrés sincronitzat</span><button id="reset-tests">Reinicia tots els tests</button>${profile.role==='admin'?'<button id="admin-panel">Administració</button>':''}<button id="logout">Tanca la sessió</button>`;document.querySelector('.top').after(bar);
  document.querySelector('.local-note').textContent='El teu progrés es desa al teu compte';
  document.querySelector('#logout').onclick=async()=>{try{await fetch(cfg.url+'/auth/v1/logout',{method:'POST',headers:{apikey:cfg.key,Authorization:'Bearer '+session.access_token}});}finally{store(null);location.reload();}};
  document.querySelector('#reset-tests').onclick=async()=>{if(!confirm('Vols esborrar tots els intents i tests en curs? Les marques d’estudi es conservaran.'))return;try{await call('progress.reset',{confirm:true});location.reload();}catch(e){alert(e.message);}};
  if(profile.role==='admin')document.querySelector('#admin-panel').onclick=admin;
 }
 async function admin(){
  let modal=document.querySelector('#admin-dialog');if(!modal){modal=document.createElement('dialog');modal.id='admin-dialog';document.body.append(modal);}
  modal.innerHTML='<p>Carregant usuaris…</p>';modal.showModal();
  try{const d=await call('admin.users');modal.innerHTML=`<div class="section-head"><h2>Administració · Mrs</h2><button id="close-admin">Tanca</button></div><p>Desbloquejar elimina la vinculació: el següent accés aprovat registrarà de nou la IP i el navegador.</p><p id="admin-message" role="status"></p>${d.users.map(u=>`<section class="test-card" style="margin:12px 0"><h3>${esc(u.username)} · ${esc(u.status)}</h3><p>${esc(u.email)}<br>Últim accés: ${esc(u.last_seen||'—')} · IP: ${esc(u.last_ip||'—')}</p>${u.role!=='admin'?`<div class="button-row"><button data-action="status" data-id="${esc(u.id)}" data-status="approved">Aprova</button><button data-action="status" data-id="${esc(u.id)}" data-status="rejected">Rebutja</button><button data-action="status" data-id="${esc(u.id)}" data-status="disabled">Desactiva</button><button data-action="unbind" data-id="${esc(u.id)}">Desbloqueja IP/navegador</button><button data-action="reset" data-id="${esc(u.id)}">Reinicia el progrés</button></div>`:''}</section>`).join('')}<button id="load-access-log">Mostra els darrers accessos</button><pre id="access-log" style="white-space:pre-wrap"></pre>`;
   modal.querySelector('#close-admin').onclick=()=>modal.close();
   modal.querySelectorAll('[data-action]').forEach(b=>b.onclick=async()=>{if(!confirm('Confirma aquesta acció sobre el compte seleccionat.'))return;b.disabled=true;try{await call('admin.'+b.dataset.action,{user_id:b.dataset.id,status:b.dataset.status});modal.close();await admin();}catch(e){modal.querySelector('#admin-message').textContent=e.message;b.disabled=false;}});
   modal.querySelector('#load-access-log').onclick=async()=>{try{const r=await call('admin.logs');modal.querySelector('#access-log').textContent=r.logs.map(l=>`${l.created_at} · ${d.users.find(u=>u.id===l.user_id)?.username||'—'} · ${l.event} · ${l.ip||'—'}`).join('\n');}catch(e){modal.querySelector('#admin-message').textContent=e.message;}};
  }catch(e){modal.textContent=e.message;const close=document.createElement('button');close.textContent='Tanca';close.onclick=()=>modal.close();modal.append(close);}
 }
 const ready=(async()=>{
  if(!session){shell();return false;}
  try{const d=await call('me');profile=d.user;if(profile.status!=='approved'){shell(({pending:'La sol·licitud està pendent d’aprovació de Mrs.',disabled:'El compte està desactivat. Contacta amb Mrs.',rejected:'La sol·licitud ha estat rebutjada per Mrs.'})[profile.status]||'El compte no té accés aprovat.');return false;}controls();return true;}
  catch(e){shell(e.message);return false;}
 })();
 return {ready,call,profile:()=>profile};
})();
