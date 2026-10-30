'use strict';
window.QuadernPreview=(()=>{
 const topics=window.QUADERN_CATALOG||[];
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let active=false;
 const title=t=>(t.id.startsWith('c')?'Competència ':'Tema ')+t.number;
 const gate=(message,mode='signup')=>window.QuadernAuth.open(message,mode);
 function chrome(){
  document.querySelector('#sidebar').hidden=false;
  document.querySelector('.local-note').textContent='Descobreix el quadern';
  document.querySelector('#export-progress').hidden=true;
  document.querySelector('.import-label').hidden=true;
  document.querySelector('#search').placeholder='Cerca pel nom del tema…';
  document.querySelector('#nav').innerHTML='<a class="nav-link" href="#">▦ &nbsp; Descobreix el quadern</a>'+topics.map(t=>`<a class="nav-link" href="#${t.id}"><span class="nav-num">${t.id.startsWith('c')?'C':''}${String(t.number).padStart(2,'0')}</span><span>${esc(t.title)}</span></a>`).join('');
  if(!document.querySelector('#preview-actions')){
   const bar=document.createElement('div');bar.id='preview-actions';bar.className='account-bar';bar.innerHTML='<span>Explora els temes. Accedeix al contingut amb un compte aprovat.</span><a class="button" href="#entrar">Entra</a><a class="button primary" href="#registre">Sol·licita accés</a>';
   document.querySelector('.top').after(bar);
  }
 }
 function cards(list){return list.map(t=>`<article class="card"><p class="eyebrow">${esc(title(t))} · ${esc(t.category)}</p><h3><a href="#${t.id}">${esc(t.title)}</a></h3><div class="preview-badges"><span>Fonts oficials a cada apartat ↗</span><span>2 tests · 20 preguntes cadascun</span></div><p class="muted">Contingut i correccions amb accés restringit.</p><div class="button-row preview-card-actions"><a href="#${t.id}">Obre el tema →</a><a href="#${t.id}/test/1">Test A</a><a href="#${t.id}/test/2">Test B</a></div></article>`).join('');}
 function catalogue(query=''){
  chrome();const normalize=s=>s.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();const term=normalize(query);
  const found=topics.filter(t=>normalize(t.title+' '+title(t)+' '+t.category).includes(term));
  document.querySelector('#main').innerHTML=`<section class="hero"><div class="hero-top"><p class="eyebrow">Oposicions · Administració parlamentària</p><span class="chip">Descobreix el quadern</span></div><h1>Estudia amb criteri.<br>Comprova cada resposta.</h1><p class="lead">Coneix el temari abans de registrar-te: temes desenvolupats, informació referenciada i tests amb correcció raonada.</p><div class="button-row"><a class="button primary" href="#registre">Sol·licita accés →</a><a href="#fonts">Com està documentat ↗</a></div></section><div class="stats"><div class="stat"><strong>${topics.length}</strong><span>Temes i competències</span></div><div class="stat"><strong>${topics.length*2}</strong><span>Tests de pràctica</span></div><div class="stat"><strong>20</strong><span>Preguntes per test</span></div></div><section class="preview-proof"><p class="eyebrow">Les fonts, sempre a la vista</p><h2>Cada informació, amb la seva referència oficial.</h2><p>Les explicacions inclouen enllaços a les normes i als recursos oficials que les fonamenten. En corregir un test, cada resposta incorpora una justificació i l’enllaç oficial on comprovar-la.</p><div class="preview-badges"><a href="https://www.parlament.cat/" target="_blank" rel="noopener noreferrer">Parlament de Catalunya ↗</a><a href="https://www.boe.es/" target="_blank" rel="noopener noreferrer">BOE ↗</a><a href="https://portaljuridic.gencat.cat/" target="_blank" rel="noopener noreferrer">Portal Jurídic de Catalunya ↗</a><a href="https://formaciooberta.eapc.gencat.cat/" target="_blank" rel="noopener noreferrer">EAPC ↗</a></div><p class="muted">Aquests enllaços permeten conèixer els organismes de referència. Dins de cada tema i correcció trobaràs els enllaços específics.</p></section><div class="notice">Pots consultar aquí els noms dels temes i els tests disponibles. Per llegir les explicacions o fer els tests, crea un compte i espera l’aprovació de Mrs. Les preguntes són de pràctica; no són preguntes oficials del tribunal.</div>${query?`<section><h2>Resultats de «${esc(query)}»</h2><p class="muted">${found.length} temes</p><div class="cards">${cards(found)||'<p>No s’han trobat temes amb aquest nom.</p>'}</div></section>`:['Temari general','Temari competencial'].map((group,i)=>`<section class="preview-group"><div class="section-head"><h2>${group}</h2><span>${i?'8 competències':'27 temes'}</span></div><div class="cards">${cards(topics.filter(t=>t.id.startsWith(i?'c':'t')))}</div></section>`).join('')}`;
 }
 function sources(){chrome();document.querySelector('#main').innerHTML='<a class="backlink" href="#">← Torna al catàleg</a><p class="eyebrow">Fonts i criteris d’estudi</p><h1>Les referències formen part de l’estudi.</h1><section class="lesson"><h2>Al costat de cada explicació</h2><p>El contingut del quadern inclou enllaços als documents i recursos oficials que fonamenten cada informació. Pots contrastar les explicacions amb la norma o el material d’origen.</p></section><section class="lesson"><h2>També en cada resposta dels tests</h2><p>Després de corregir, trobaràs la justificació de cada resposta i un enllaç a la font oficial corresponent. Cada tema té dos tests diferents de vint preguntes.</p></section><section class="lesson"><h2>Una mostra de com apareixen els enllaços</h2><div class="references"><a href="https://www.parlament.cat/" target="_blank" rel="noopener noreferrer">Parlament de Catalunya · web oficial</a><a href="https://portaljuridic.gencat.cat/" target="_blank" rel="noopener noreferrer">Portal Jurídic · web oficial</a></div><p class="muted">Mostra del format dels enllaços. Les referències concretes de cada explicació i pregunta es consulten amb accés al temari.</p></section><div class="button-row"><a class="button primary" href="#registre">Sol·licita accés al quadern</a></div>';}
 function route(){
  if(!active)return;
  const [id]=location.hash.slice(1).split('/');document.querySelector('#sidebar').classList.remove('open');document.querySelector('#menu-toggle').setAttribute('aria-expanded','false');
  if(!id)catalogue();else if(id==='fonts')sources();else if(id==='entrar')gate('Entra amb el teu compte per obrir el temari i els tests.','login');else if(id==='registre')gate('Crea el teu compte per accedir al temari i als tests. Mrs ha d’aprovar-ne l’accés.');else{
   const topic=topics.find(t=>t.id===id);gate(topic?'Per obrir «'+title(topic)+': '+topic.title+'» i els seus tests, registra’t o entra amb un compte aprovat.':'Registra’t o entra amb un compte aprovat per consultar el contingut.');
  }
  window.scrollTo(0,0);
 }
 function start(){if(active)return;active=true;window.addEventListener('hashchange',route);document.querySelector('#search').addEventListener('input',e=>{if(!active)return;catalogue(e.target.value.trim());});route();}
 return {start};
})();
