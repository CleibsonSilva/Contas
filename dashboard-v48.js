// Despesas 4.8 — ajustes de apresentação sobre a base 4.7, sem migração de dados.
'use strict';
(function(){
 const el=id=>document.getElementById(id);
 const budgetMonth=()=> (data.budgetSpends||[]).filter(x=>x.date&&x.date.slice(0,7)===mk(cursor));
 const expenses=()=>monthData(cursor).reduce((s,x)=>s+Number(x.value||0),0)+budgetMonth().reduce((s,x)=>s+Number(x.value||0),0);
 const incomes=()=>incomeEntries(cursor).reduce((s,x)=>s+Number(x.value||0),0);
 function updateSummary(){
   const total=expenses(),left=incomes()-total;
   const amount=el('balanceTotal'),title=el('overviewLabel'),remaining=el('total');
   if(title)title.textContent='Total de dívidas e gastos do mês';
   if(amount){amount.textContent=money(total);amount.className='amount sensitive';amount.style.color='#fff'}
   if(remaining){remaining.textContent=money(left);remaining.style.color=left<0?'#ff8ea8':'#f3f5ff'}
 }
 const originalRender=render;
 render=function(){originalRender();updateSummary()};
 // Reaplica após os controles de navegação da interface legada.
 const oldMove=moveMonth;
 moveMonth=function(n){oldMove(n);updateSummary()};
 const colors=['#a996ff','#5c9dff','#e29ace','#ffc481','#79d1c1','#e7898d','#a5b8ff','#d7a4ff','#85b4a5','#d6b68b'];
 window.v48OpenChart=function(){
   const totals=new Map();
   for(const item of monthData(cursor)){
     const category=item.category||'Outros';totals.set(category,(totals.get(category)||0)+Number(item.value||0));
   }
   for(const item of budgetMonth()){
     const category=item.category||'Outros';totals.set(category,(totals.get(category)||0)+Number(item.value||0));
   }
   const rows=[...totals.entries()].filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);
   const sum=rows.reduce((s,[,v])=>s+v,0);
   const box=el('v48ChartContent');if(!box)return;
   if(sum<=0){box.innerHTML='<p class="subtle">Nenhuma despesa registrada neste mês.</p>';el('v48ChartDialog').showModal();return}
   const r=84,c=2*Math.PI*r;let offset=0;
   const segments=rows.map(([,value],i)=>{const len=value/sum*c;const part=`<circle cx="110" cy="110" r="${r}" fill="none" stroke="${colors[i%colors.length]}" stroke-width="37" stroke-dasharray="${len} ${c-len}" stroke-dashoffset="${-offset}" transform="rotate(-90 110 110)"><title>${(value/sum*100).toFixed(1)}%</title></circle>`;offset+=len;return part}).join('');
   const chart=`<div class="v48-chart-wrap"><svg viewBox="0 0 220 220" role="img" aria-label="Gráfico circular de despesas por categoria"><circle cx="110" cy="110" r="${r}" fill="none" stroke="#2b3553" stroke-width="37"/>${segments}<circle cx="110" cy="110" r="60" fill="#141d34"/><text x="110" y="104" text-anchor="middle" fill="#b7c0dc" font-size="12">Total do mês</text><text x="110" y="126" text-anchor="middle" fill="white" font-size="15" font-weight="bold">${money(sum)}</text></svg></div>`;
   const legend=rows.map(([name,value],i)=>`<div class="v48-legend-row"><span class="dot" style="background:${colors[i%colors.length]}"></span><span>${esc(name)} <span class="muted">(${(100*value/sum).toLocaleString('pt-BR',{maximumFractionDigits:1})}%)</span></span><b>${money(value)}</b></div>`).join('');
   box.innerHTML=`<p class="subtle">${cursor.toLocaleDateString('pt-BR',{month:'long',year:'numeric'})} · inclui parcelas de cartão e gastos registrados em orçamentos.</p>${chart}<div class="v48-legend">${legend}</div>`;
   el('v48ChartDialog').showModal();
 };
 updateSummary();
})();
