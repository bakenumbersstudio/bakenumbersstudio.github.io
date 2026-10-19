// BakeNumbers Cake Quote - pure math (shared by app and tests)
(function(root){
const UNITS={g:['w',1],kg:['w',1000],oz:['w',28.349523125],lb:['w',453.59237],
 ml:['v',1],l:['v',1000],tsp:['v',4.92892159375],tbsp:['v',14.78676478125],cup:['v',236.5882365],floz:['v',29.5735295625],
 each:['e',1]};
function convert(qty,from,to){const a=UNITS[from],b=UNITS[to];if(!a||!b)throw new Error('Unknown unit');
 if(a[0]!==b[0])return null; return qty*a[1]/b[1];}
function unitCost(item){return item.pkgPrice/item.pkgSize;} // $ per item.pkgUnit
function lineCost(line,item){const q=convert(line.qty,line.unit,item.pkgUnit);if(q===null)return null;return q*unitCost(item);}
function recipeCost(recipe,pantry){let total=0,bad=[];for(const ln of recipe.lines){const it=pantry.find(p=>p.id===ln.itemId);
 const c=it?lineCost(ln,it):null;if(c===null){bad.push(ln);continue;}total+=c;}
 return {batch:total,perServing:recipe.servings>0?total/recipe.servings:0,problems:bad};}
function quote(o){ // o: ingredients, extras, hours, rate, overheadPct, miles, perMile, method, value, depositPct
 const labor=o.hours*o.rate;const base=o.ingredients+o.extras;const overhead=base*o.overheadPct/100;const delivery=o.miles*o.perMile;
 const cost=base+labor+overhead+delivery;let price;
 if(o.method==='margin'){const m=Math.min(Math.max(o.value,0),90)/100;price=cost/(1-m);}
 else if(o.method==='markup'){price=cost*(1+Math.max(o.value,0)/100);}
 else price=Math.max(o.value,0);
 const r=x=>Math.round(x*100)/100;
 return {labor:r(labor),overhead:r(overhead),delivery:r(delivery),cost:r(cost),price:r(price),profit:r(price-cost),deposit:r(price*o.depositPct/100),balance:r(price-r(price*o.depositPct/100))};}
// Servings estimate: wedding slice 1x2 in (2 sq in), party slice 2x2 in (4 sq in), for a standard ~4 in tall cake
function servings(shape,a,b){const area=shape==='round'?Math.PI*(a/2)**2:a*b;return {wedding:Math.floor(area/2),party:Math.floor(area/4)};}
const api={UNITS,convert,unitCost,lineCost,recipeCost,quote,servings};
if(typeof module!=='undefined')module.exports=api;else root.Calc=api;
})(this);
