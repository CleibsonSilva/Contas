// Despesas 4.7 — recuperação independente das quatro áreas críticas.
'use strict';
(function(){
const $v=id=>document.getElementById(id);
const safe=(fn)=>{try{fn()}catch(e){console.error('[Despesas 4.7]',e)}};
const date0=()=>parse(today());
function pending(){
 const end=date0();end.setDate(end.getDate()+10);
 const start=new Date(2000,0,1,12);const rows=[];
 for(const d of data.items||[]){
  if(d.archived||d.kind==='spent'||!d.due)continue;
  const base=parse(d.due);if(!Number.isFinite(+base)||base>end)continue;
  const occurrences=datesFor(d,start,end);
  for(const o of occurrences)if(o.remaining>0.005)rows.push(o);
 }
 // Historical installments from registered credit cards.
 for(const p of data.cardPurchases||[]){
  if(!p.firstMonth)continue;
  const first=parse(p.firstMonth+'-01');if(!Number.isFinite(+first))continue;
  for(let i=0;i<Math.min(360,Math.max(0,Number(p.count)||0));i++){
   const m=addMonths(first,i);if(m>end)break;
   const o=cardOccurrences(m).find(x=>x.id===p.id&&x.installment===i+1);
   if(o&&o.remaining>0.005&&o.dueDate<=end)rows.push(o);
  }
 }
 return rows.sort((a,b)=>a.dueDate-b.dueDate);
}
function dues(){const el=$v('dueTenDays');if(!el)return;
 const rows=pending();const now=date0();
 el.innerHTML=rows.length?rows.map(o=>{const late=o.dueDate<now;return '<div class="rowlist between" style="gap:10px;align-items:center"><div style="min-width:0;flex:1"><b>'+esc(o.name)+'</b><small class="subtle" style="display:block">'+o.dueDate.toLocaleDateString('pt-BR')+' · <span style="color:'+(late?'#ff8ea8':'#aabdf4')+'">'+(late?'Vencida':'A vencer')+'</span></small></div><b style="color:'+(late?'#ff8ea8':'#f3f5ff')+'">'+money(o.remaining)+'</b></div>'}).join(''):'<div class="empty">Nenhuma conta vencida pendente ou com vencimento nos próximos 10 dias.</div>';
}
function commitment(){const incomes=incomeEntries(cursor).reduce((s,x)=>s+Number(x.value||0),0);
 const expenses=monthData(cursor).reduce((s,x)=>s+Number(x.value||0),0);
 const ratio=incomes>0?expenses/incomes*100:0;
 const bar=$v('commitBar'),label=$v('commitText');
 if(bar){bar.style.width=Math.min(100,Math.max(0,ratio))+'%';bar.style.background='#7c69ff';bar.style.display='block';bar.style.height='100%'}
 if(label)label.textContent=incomes>0?ratio.toLocaleString('pt-BR',{maximumFractionDigits:1})+'% da renda comprometida':'Cadastre uma renda para calcular o comprometimento';
}
function incomes(){const list=$v('incomeList');if(!list)return;
 const rows=incomeEntries(cursor);
 list.innerHTML=rows.length?rows.map(x=>'<div class="rowlist between" style="gap:8px;flex-wrap:wrap"><div style="flex:1;min-width:125px"><b>'+esc(x.name)+'</b><small class="subtle" style="display:block">'+(x.kind==='monthly'?'Mensal':'Avulsa')+'</small></div><div><b>'+money(x.value)+'</b><div class="actions"><button type="button" class="secondary" onclick="editIncome(\''+esc(x.id)+'\')">✎ Editar</button>'+(x.legacy?'':'<button type="button" class="secondary" onclick="deleteIncome(\''+esc(x.id)+'\')">Excluir</button>')+'</div></div></div>').join(''):'<div class="empty">Nenhuma renda cadastrada para este mês.</div>';
 const panel=$v('incomePanel');if(!panel)return;
 let controls=$v('v47IncomeActions');if(!controls){controls=document.createElement('div');controls.id='v47IncomeActions';panel.appendChild(controls)}
 controls.innerHTML='<button type="button" class="secondary" id="v47ViewIncome">'+(list.classList.contains('v47-open')?'Ocultar rendas':'Ver e editar rendas')+'</button>';
 $v('v47ViewIncome').onclick=()=>{list.classList.toggle('v47-open');$v('v47ViewIncome').textContent=list.classList.contains('v47-open')?'Ocultar rendas':'Ver e editar rendas'};
}
function cards(){const el=$v('cardsList');if(!el)return;
 el.innerHTML=(data.cards||[]).map(c=>'<div class="entry"><div class="between"><b>💳 '+esc(c.name)+'</b><span class="subtle">Fecha '+Number(c.closeDay)+' · Vence '+Number(c.dueDay)+'</span></div><div class="actions"><button type="button" class="secondary" onclick="v46EditCard(\''+esc(c.id)+'\')">✎ Editar cartão</button><button type="button" class="secondary" onclick="deleteCard(\''+esc(c.id)+'\')">Excluir</button></div></div>').join('')||'<div class="empty">Nenhum cartão cadastrado.</div>';
}
function refresh(){safe(commitment);safe(incomes);safe(cards);safe(dues)}
// Listen to UI changes and persistence without depending on the order of legacy render wrappers.
const originalSave=save;
save=function(){const ok=originalSave();if(ok)queueMicrotask(refresh);return ok};
const originalRender=render;
render=function(){try{originalRender()}catch(e){console.error('[Despesas 4.7] Erro na interface antiga',e)}refresh()};
// Keep income visible after navigation; no more hidden-only controls.
const oldMonth=moveMonth;moveMonth=function(n){oldMonth(n);refresh()};
refresh();
})();
