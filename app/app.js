const $=id=>document.getElementById(id);const KEY='bn-cakequote-v1';
const S=Object.assign({pantry:[],recipes:[],orders:[],bakery:'',unlocked:false},JSON.parse(localStorage.getItem(KEY)||'{}'));
const save=()=>localStorage.setItem(KEY,JSON.stringify(S));const money=x=>'$'+(Number(x)||0).toFixed(2);const num=id=>Math.max(0,parseFloat($(id).value)||0);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const LOCKED=['recipes','pantry','servings','orders'];
const needFull=()=>{if(S.unlocked)return false;alert('That is part of the full version. Unlock it under More.');return true;};
// Unlock: compares the SHA-256 of the entered code (trimmed, uppercased) to a stored hash. Runs on the device only.
const CODE_HASH='5d37ea6451e1d7e130a9cd7d64ae48077491de82550c49029deb862bbb2d3f5d';
async function sha256hex(t){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');}
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{document.querySelectorAll('nav button,section').forEach(e=>e.classList.remove('on'));b.classList.add('on');$(b.dataset.t).classList.add('on');render();});
Object.keys(Calc.UNITS).forEach(u=>$('pUnit').add(new Option(u,u)));
$('pAdd').onclick=()=>{if(needFull())return;const n=$('pName').value.trim(),p=num('pPrice'),s=num('pSize');if(!n||!p||!s)return alert('Fill in name, price and size.');
 S.pantry.push({id:Date.now(),name:n,pkgPrice:p,pkgSize:s,pkgUnit:$('pUnit').value});save();['pName','pPrice','pSize'].forEach(i=>$(i).value='');render();};
function delPantry(id){if(S.recipes.some(r=>r.lines.some(l=>l.itemId===id))&&!confirm('A recipe uses this. Delete anyway?'))return;S.pantry=S.pantry.filter(p=>p.id!==id);save();render();}
let editing=null;
$('rAdd').onclick=()=>{if(needFull())return;
 const r={id:Date.now(),name:'New recipe',servings:12,lines:[]};S.recipes.push(r);save();editing=r.id;render();};
function recipeEditor(r){const opts=S.pantry.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');const units=Object.keys(Calc.UNITS).map(u=>`<option>${u}</option>`).join('');
 const rc=Calc.recipeCost(r,S.pantry);
 return `<div class="card"><label>Recipe name</label><input value="${esc(r.name)}" onchange="upd(${r.id},'name',this.value)"><label>Servings this batch makes</label><input type="number" min="1" value="${r.servings}" onchange="upd(${r.id},'servings',+this.value)">
 <table>${r.lines.map((l,i)=>{const it=S.pantry.find(p=>p.id===l.itemId);const c=it?Calc.lineCost(l,it):null;return `<tr><td>${it?esc(it.name):'?'}</td><td>${l.qty} ${l.unit}</td><td>${c===null?'<span class="warn">unit mismatch</span>':money(c)}</td><td><button class="x" onclick="delLine(${r.id},${i})">×</button></td></tr>`}).join('')}</table>
 ${S.pantry.length?`<div class="row"><select id="lItem">${opts}</select><input id="lQty" type="number" min="0" step="0.01" placeholder="qty"><select id="lUnit">${units}</select></div><button class="btn alt" onclick="addLine(${r.id})">+ Add ingredient</button>`:'<p class="muted">Add ingredients in Pantry first.</p>'}
 ${rc.problems.length?`<p class="warn">${rc.problems.length} line(s) can't convert (e.g. cups vs grams). Weigh it, or add a pantry item bought by volume.</p>`:''}
 <p><b>Batch cost ${money(rc.batch)}</b> · ${money(rc.perServing)} per serving</p><button class="btn alt" onclick="editing=null;render()">Done</button> <button class="btn alt" onclick="delRecipe(${r.id})">Delete</button></div>`;}
function upd(id,k,v){const r=S.recipes.find(r=>r.id===id);r[k]=v;save();render();}
function addLine(id){const q=num('lQty');if(!q)return;S.recipes.find(r=>r.id===id).lines.push({itemId:+$('lItem').value,qty:q,unit:$('lUnit').value});save();render();}
function delLine(id,i){S.recipes.find(r=>r.id===id).lines.splice(i,1);save();render();}
function delRecipe(id){if(!confirm('Delete this recipe?'))return;S.recipes=S.recipes.filter(r=>r.id!==id);editing=null;save();render();}
function currentQuote(){const rid=+$('qRecipe').value;const r=S.recipes.find(r=>r.id===rid);
 const ing=r?Calc.recipeCost(r,S.pantry).batch*num('qBatches'):num('qIng');
 return {r,q:Calc.quote({ingredients:ing,extras:num('qExtras'),hours:num('qHrs'),rate:num('qRate'),overheadPct:num('qOh'),miles:num('qMiles'),perMile:num('qPerMile'),method:$('qMethod').value,value:num('qVal'),depositPct:Math.min(num('qDep'),100)}),ing};}
function renderQuote(){const {r,q,ing}=currentQuote();$('qValLbl').textContent={margin:'Margin (% of price)',markup:'Markup (% on cost)',fixed:'Price ($)'}[$('qMethod').value];
 $('qIng').disabled=!!r;
 $('qOut').innerHTML=`${S.bakery?`<b>${esc(S.bakery)}</b><br>`:''}${$('qCust').value?`Quote for ${esc($('qCust').value)}<br>`:''}<div class="big">${money(q.price)}</div>
 <table><tr><td>Ingredients${r?' ('+esc(r.name)+')':''}</td><td>${money(ing)}</td></tr><tr><td>Boxes, boards, toppers</td><td>${money(num('qExtras'))}</td></tr><tr><td>Overhead</td><td>${money(q.overhead)}</td></tr><tr><td>Your time</td><td>${money(q.labor)}</td></tr><tr><td>Delivery</td><td>${money(q.delivery)}</td></tr><tr><th>Your cost</th><th>${money(q.cost)}</th></tr><tr><th>Profit</th><th>${money(q.profit)}</th></tr>${S.unlocked?`<tr><td>Deposit due</td><td>${money(q.deposit)}</td></tr><tr><td>Balance at pickup</td><td>${money(q.balance)}</td></tr>`:''}</table>
 ${q.profit<0?'<p class="warn">This price is below your cost.</p>':''}${S.unlocked?'':'<p class="muted">Deposits, quote images and saved orders are in the full version.</p>'}`;
 $('qDep').disabled=$('qRecipe').disabled=!S.unlocked;}
$('qPdf').onclick=()=>{if(!needFull())print();};
$('qPng').onclick=()=>{if(needFull())return;const {r,q}=currentQuote();const c=$('cv'),x=c.getContext('2d');x.fillStyle='#fffaf7';x.fillRect(0,0,1080,1350);x.fillStyle='#c06b52';x.fillRect(0,0,1080,180);
 x.fillStyle='#fff';x.font='bold 60px system-ui';x.fillText(S.bakery||'Cake Quote',60,115);x.fillStyle='#3a2a2a';x.font='40px system-ui';let y=280;
 const line=(a,b,bold)=>{x.font=(bold?'bold ':'')+'42px system-ui';x.fillText(a,60,y);x.textAlign='right';x.fillText(b,1020,y);x.textAlign='left';y+=80;};
 if($('qCust').value){x.fillText('For: '+$('qCust').value,60,y);y+=90;}if(r){x.fillText(r.name+' × '+num('qBatches'),60,y);y+=90;}
 x.font='bold 110px system-ui';x.fillText(money(q.price),60,y+40);y+=170;line('Deposit due',money(q.deposit),true);line('Balance at pickup',money(q.balance));
 x.font='30px system-ui';x.fillStyle='#8a7575';x.fillText('Quote date '+new Date().toLocaleDateString(),60,1200);
 const a=document.createElement('a');a.download='quote.png';a.href=c.toDataURL('image/png');a.click();};
function renderServings(){const sh=$('sShape').value;$('sBWrap').style.display=sh==='sheet'?'block':'none';$('sALbl').textContent=sh==='round'?'Diameter (in)':'Width (in)';
 const s=Calc.servings(sh,num('sA'),num('sB')),p=num('sPrice');$('sOut').innerHTML=`<table><tr><th></th><th>Servings</th><th>Price at ${money(p)}</th></tr><tr><td>Wedding slices</td><td>${s.wedding}</td><td>${money(s.wedding*p)}</td></tr><tr><td>Party slices</td><td>${s.party}</td><td>${money(s.party*p)}</td></tr></table>`;}

// Orders (full version)
let oEdit=null;const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
const r2=x=>Math.round(x*100)/100;const bal=o=>r2(Math.max(0,o.total-o.paid));
function oClear(){['oCust','oDate','oTime','oWhat','oTotal','oPaid'].forEach(i=>$(i).value='');oEdit=null;$('oFormT').textContent='New order';$('oCancel').style.display='none';}
$('oSave').onclick=()=>{if(needFull())return;const c=$('oCust').value.trim(),d=$('oDate').value,t=num('oTotal'),p=num('oPaid');
 if(!c||!d)return alert('Add a customer and a pickup date.');if(p>t)return alert('Deposit paid is more than the order total.');
 const o={customer:c,date:d,time:$('oTime').value,what:$('oWhat').value.trim(),total:r2(t),paid:r2(p)};
 if(oEdit){Object.assign(S.orders.find(x=>x.id===oEdit),o);}else S.orders.push(Object.assign({id:Date.now(),done:false},o));save();oClear();render();};
$('oCancel').onclick=()=>{oClear();render();};
function oEditStart(id){const o=S.orders.find(x=>x.id===id);oEdit=id;$('oCust').value=o.customer;$('oDate').value=o.date;$('oTime').value=o.time||'';$('oWhat').value=o.what||'';$('oTotal').value=o.total;$('oPaid').value=o.paid;$('oFormT').textContent='Edit order';$('oCancel').style.display='inline-block';scrollTo(0,0);}
function oPaidFull(id){const o=S.orders.find(x=>x.id===id);o.paid=o.total;save();render();}
function oDone(id){const o=S.orders.find(x=>x.id===id);o.done=!o.done;save();render();}
function oDel(id){if(!confirm('Delete this order?'))return;S.orders=S.orders.filter(x=>x.id!==id);save();render();}
function renderOrders(){const t=today(),open=S.orders.filter(o=>!o.done);const list=S.orders.filter(o=>$('oShowDone').checked||!o.done).sort((a,b)=>(a.date+(a.time||'')).localeCompare(b.date+(b.time||'')));
 const owed=r2(S.orders.reduce((s,o)=>s+bal(o),0)),wk=new Date();wk.setDate(wk.getDate()+7);const wkS=wk.getFullYear()+'-'+String(wk.getMonth()+1).padStart(2,'0')+'-'+String(wk.getDate()).padStart(2,'0');
 $('oSum').innerHTML=`<b>${open.length}</b> open order(s) · <b>${open.filter(o=>o.date>=t&&o.date<=wkS).length}</b> pickup(s) in the next 7 days · <b>${money(owed)}</b> still owed`;
 $('oList').innerHTML=list.map(o=>{const late=!o.done&&o.date<t;const b=bal(o);return `<div class="card"${o.done?' style="opacity:.55"':''}><b>${esc(o.customer)}</b> <span class="${late?'late':'muted'}">${late?'Pickup date passed · ':''}${new Date(o.date+'T00:00').toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'})}${o.time?' '+o.time:''}</span>
 ${o.what?`<br>${esc(o.what)}`:''}<table><tr><td>Total</td><td>${money(o.total)}</td></tr><tr><td>Deposit paid</td><td>${money(o.paid)}</td></tr><tr><th>Balance due</th><th>${money(b)}</th></tr></table>
 ${b>0?`<button class="btn alt" onclick="oPaidFull(${o.id})">Mark paid in full</button>`:''}<button class="btn alt" onclick="oDone(${o.id})">${o.done?'Not picked up':'Picked up'}</button><button class="btn alt" onclick="oEditStart(${o.id})">Edit</button><button class="x" onclick="oDel(${o.id})">×</button></div>`}).join('')||'<p class="muted">No orders yet.</p>';}
$('oShowDone').onchange=()=>render();
$('qOrder').onclick=()=>{if(needFull())return;const {q}=currentQuote();oClear();$('oCust').value=$('qCust').value;$('oTotal').value=q.price.toFixed(2);$('oPaid').value=q.deposit.toFixed(2);document.querySelector('nav button[data-t=orders]').click();};

function render(){document.querySelectorAll('.lockmsg').forEach(e=>{e.innerHTML=S.unlocked?'':'<div class="lockcard"><b>Full version</b><br>This part is in the full version. Already have an unlock code? Enter it under More.</div>';const s=e.parentElement;[...s.children].forEach(c=>{if(c!==e&&c.tagName!=='P')c.style.display=S.unlocked?'':'none';});});
 renderOrders();$('plan').textContent=S.unlocked?'· Full':'· Free';$('bName').value=S.bakery;
 $('pList').innerHTML=S.pantry.length?`<table>${S.pantry.map(p=>`<tr><td>${esc(p.name)}</td><td>${money(p.pkgPrice)} / ${p.pkgSize} ${p.pkgUnit}</td><td><button class="x" onclick="delPantry(${p.id})">×</button></td></tr>`).join('')}</table>`:'';
 const r=S.recipes.find(r=>r.id===editing);$('rEdit').innerHTML=r?recipeEditor(r):'';
 $('rList').innerHTML=S.recipes.map(r=>{const c=Calc.recipeCost(r,S.pantry);return `<div class="card" onclick="editing=${r.id};render()"><b>${esc(r.name)}</b><br><span class="muted">${money(c.batch)} per batch · ${money(c.perServing)} per serving</span></div>`}).join('')||'<p class="muted">No recipes yet.</p>';
 const sel=$('qRecipe'),cur=sel.value;sel.innerHTML='<option value="">No recipe (type cost)</option>'+S.recipes.map(r=>`<option value="${r.id}">${esc(r.name)}</option>`).join('');sel.value=cur;
 renderQuote();renderServings();}
document.querySelectorAll('#quote input,#quote select,#servings input,#servings select').forEach(e=>e.addEventListener('input',()=>{renderQuote();renderServings();}));
$('bName').onchange=e=>{S.bakery=e.target.value;save();render();};
$('uBtn').onclick=async()=>{const c=$('uCode').value.trim().toUpperCase();if(!c){$('uMsg').textContent='Enter your unlock code.';return;}
 if(!(window.crypto&&crypto.subtle)){$('uMsg').textContent='Open the app from its https link to unlock.';return;}
 if(await sha256hex(c)===CODE_HASH){S.unlocked=true;save();$('uMsg').textContent='Unlocked. Thank you!';render();}else $('uMsg').textContent="That code didn't work. Check it and try again.";};
$('bExport').onclick=()=>{const a=document.createElement('a');a.download='cake-quote-backup.json';a.href='data:application/json,'+encodeURIComponent(JSON.stringify(S));a.click();};
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js');render();
