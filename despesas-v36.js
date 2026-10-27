// Despesas v3.6 — camada de interface não destrutiva sobre os dados existentes.
let despesasActive=null, despesasPendingPurchase=false;
function despesasTab(tab){
 const valid=['cards','budgets','records'];
 despesasActive=valid.includes(tab)?tab:null;
 const groups={cards:'cardsPanel',budgets:'budgetPanel',records:'expensesPanel'};
 const host=$('despesasPanelHost');
 if(host)host.classList.toggle('screen-hidden',!despesasActive);
 ['cardsPanel','budgetPanel','expensesPanel'].forEach(id=>$(id)?.classList.toggle('screen-hidden',groups[despesasActive]!==id));
 document.querySelectorAll('#despesasTabs button').forEach(b=>{
   const active=b.dataset.tab===despesasActive;
   b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active));
 });
 if(despesasActive==='records'){
   if(typeof setFilter==='function')setFilter('all');
 }
 const fab=$('screenFab');if(fab)fab.textContent='＋ Nova despesa';
 host?.setAttribute('aria-label',despesasActive==='cards'?'Cartões':despesasActive==='budgets'?'Orçamentos':despesasActive==='records'?'Despesas':'Nenhuma seção aberta');
}
// Preserve old functions for backups and financial calculations.
const despesasOriginalRender=render;
render=function(){despesasOriginalRender();despesasAfterRender()};
function despesasAfterRender(){
 if(data.settings)data.settings.hide=false;
 $('appMain')?.classList.remove('privacy');
 const due=monthData(cursor).filter(x=>!x.archived&&x.remaining>0).sort((a,b)=>a.dueDate-b.dueDate).slice(0,5);
 const dueBox=$('despesasDue');if(dueBox)dueBox.innerHTML='<div class="section"><h2>Próximos vencimentos</h2></div>'+(due.length?due.map(x=>`<div class="rowlist between"><span>${esc(x.name)}<small class="subtle" style="display:block">${x.dueDate.toLocaleDateString('pt-BR')} · ${status(x)==='overdue'?'🔴 Vencida':'A pagar'}</small></span><b class="sensitive" style="color:${status(x)==='overdue'?'#ff7777':'inherit'}">${money(x.remaining)}</b></div>`).join(''):'<p class="subtle">Nenhuma conta pendente neste mês.</p>');

 // Vencimentos: 10 dias à frente, além dos vencidos nos últimos 10 dias.
 // A lista usa a data real de hoje, independentemente do mês selecionado.
 const dueList=$('dueTenDays');
 if(dueList){
   const start=parse(today()),past=new Date(start),future=new Date(start);
   past.setDate(past.getDate()-10);future.setDate(future.getDate()+10);
   const pendingEntries=data.items.filter(d=>!d.archived&&d.kind!=='spent')
     .flatMap(d=>datesFor(d,past,future))
     .filter(x=>x.remaining>0.005);
   // Inclui faturas de cartão registradas pelo motor existente.
   const cardEntries=[];
   for(let monthOffset=-1;monthOffset<=1;monthOffset++){
     const month=new Date(start.getFullYear(),start.getMonth()+monthOffset,1);
     cardEntries.push(...cardOccurrences(month).filter(x=>x.dueDate>=past&&x.dueDate<=future&&x.remaining>0.005));
   }
   const all=[...pendingEntries,...cardEntries].sort((a,b)=>a.dueDate-b.dueDate);
   dueList.innerHTML=all.length?all.map(x=>{
     const days=Math.round((x.dueDate-start)/86400000);
     const overdue=days<0;
     const when=overdue?`Vencida há ${-days} dia${days===-1?'':'s'}`:days===0?'Vence hoje':days===1?'Vence amanhã':`Em ${days} dias`;
     return `<div class="rowlist between" style="gap:12px;align-items:center">
       <div style="min-width:0"><strong style="display:block;overflow-wrap:anywhere">${esc(x.name)}</strong>
       <small class="subtle">${x.dueDate.toLocaleDateString('pt-BR')} · <span style="color:${overdue?'#ff8ea8':'#aabdf4'}">${when}</span></small></div>
       <b class="sensitive" style="white-space:nowrap;color:${overdue?'#ff8ea8':'#eef2ff'}">${money(x.remaining)}</b>
     </div>`;
   }).join(''):'<div class="empty">Nenhuma conta vencida nos últimos 10 dias ou a vencer nos próximos 10 dias.</div>';
 }
 const inc=incomeEntries(cursor).reduce((s,x)=>s+Number(x.value),0),out=monthData(cursor).reduce((s,x)=>s+x.value,0),sp=data.budgetSpends.filter(x=>x.date.startsWith(mk(cursor))).reduce((s,x)=>s+x.value,0);
 const forecast=$('despesasForecast');if(forecast)forecast.innerHTML=`<div class="between"><b>Previsão do mês</b><b class="sensitive">${money(inc-out-sp)}</b></div><small class="subtle">Estimativa baseada nos registros cadastrados.</small>`;
 // Only one history accordion, collapsed initially after each render.
 const history=$('budgetSpends');if(history&&!history.querySelector('details')){const html=history.innerHTML;history.innerHTML=`<details><summary>Histórico de abatimentos (${data.budgetSpends.filter(x=>x.date.startsWith(mk(cursor))).length})</summary><div>${html}</div></details>`}
 // O motor antigo recalcula os dados; esta camada restabelece o layout 4.0.
 const incomes=incomeEntries(cursor);
 const totalIncome=incomes.reduce((sum,x)=>sum+Number(x.value||0),0);
 const totalSpent=monthData(cursor).reduce((sum,x)=>sum+Number(x.value||0),0);
 const ratio=totalIncome>0?totalSpent/totalIncome*100:0;
 const bar=$('commitBar'),label=$('commitText');
 if(bar)bar.style.width=Math.min(100,Math.max(0,ratio))+'%';
 if(label)label.textContent=totalIncome>0?ratio.toLocaleString('pt-BR',{maximumFractionDigits:1})+'% da renda comprometida': 'Cadastre uma renda para calcular o comprometimento';
 if($('overviewLabel'))$('overviewLabel').textContent='Resumo financeiro do mês';
 if($('balanceTotal'))$('balanceTotal').textContent=money(totalIncome-totalSpent);
 if($('balanceTotal'))$('balanceTotal').className='amount sensitive '+(totalIncome-totalSpent<0?'red':'green');
 const incomePanel=$('incomePanel');if(incomePanel)incomePanel.classList.remove('screen-hidden');
 const incomeArea=$('v40IncomeArea');if(incomeArea)incomeArea.classList.remove('screen-hidden');
 if($('chartPanel'))$('chartPanel').classList.remove('screen-hidden');
 if($('despesasForecast'))$('despesasForecast').classList.remove('screen-hidden');
 despesasTab(despesasActive);
}
// Remove obsolete toolbox without losing its useful tools.
$('v35Extras')?.remove();
v35Nav=function(){};v35NavKeep=function(){};
v35Show=function(title,body){
 let modal=$('despesasToolsDialog');if(!modal){modal=document.createElement('dialog');modal.id='despesasToolsDialog';document.body.append(modal)}
 modal.innerHTML=`<h3>${esc(title)}</h3><div id="v35Content">${body}</div><div class="footactions"><button class="primary" onclick="despesasToolsDialog.close()">Fechar</button></div>`;
 $('settingsDialog')?.close();modal.showModal();
};
v35Savings=function(){return};
const despesasOldCustom=v35CustomApply;
v35CustomApply=function(){try{despesasOldCustom()}catch(e){}};
const despesasOldQuick=screenQuick;
screenQuick=function(){openForm()};
// Automatically assign existing category icon/color; keep hidden inputs for compatibility.
const despesasOldDefaults=syncDefaults;
syncDefaults=function(){despesasOldDefaults();despesasCategoryVisual()};
function despesasCategoryVisual(){
 const sel=$('category');if(!sel)return;
 let display=$('despesasCategoryPreview');if(!display){display=document.createElement('div');display.id='despesasCategoryPreview';display.style.cssText='margin:8px 0;font-size:14px;color:#cbb5f3';sel.insertAdjacentElement('afterend',display)}
 const v=cats[sel.value]||cats.Outros;display.textContent=(v?.[0]||'📌')+' '+sel.value;
 // Display icons within the native option list when supported by the platform.
 [...sel.options].forEach(o=>{const cat=cats[o.value]||cats.Outros;o.textContent=(cat?.[0]||'📌')+' '+o.value});
}
const despesasOldOpenForm=openForm;
openForm=function(){despesasOldOpenForm();despesasCategoryVisual()};
// Card creation resumes interrupted purchase after a new card is saved.
const despesasOldCardPurchase=openCardPurchase;
openCardPurchase=function(){if(!data.cards.length){despesasPendingPurchase=true;addCard();return}despesasOldCardPurchase()};
const despesasOldSaveCard=v35SaveCard;
v35SaveCard=function(name){
 const previous=data.cards.length;despesasOldSaveCard(name);
 if(data.cards.length>previous&&despesasPendingPurchase){despesasPendingPurchase=false;$('despesasToolsDialog')?.close();despesasTab('cards');despesasOldCardPurchase();$('purchaseCard').value=data.cards.at(-1).id}
};
// If user cancels card creation, clear pending purchase.
const despesasOldCardDates=v35CardDates;
v35CardDates=function(){despesasOldCardDates();const dlg=$('despesasToolsDialog');if(dlg)dlg.addEventListener('close',()=>{despesasPendingPurchase=false},{once:true})};
addCard=v35CardDates;
// Budget spends may omit description.
const despesasOldAddSpend=addBudgetSpend;
addBudgetSpend=function(){if(!$('spendName').value.trim())$('spendName').value='Abatimento';despesasOldAddSpend()};
// Make budget actions clearer after render.
const despesasOldBudgetEnhance=v35EnhanceBudgets;
v35EnhanceBudgets=function(){despesasOldBudgetEnhance();document.querySelectorAll('.v35-budget-actions').forEach(row=>{const a=row.querySelector('button:first-child'),b=row.querySelector('button:last-child');if(a){a.className='primary';a.textContent='− Abater valor'}if(b){b.textContent='Excluir';b.title='Excluir orçamento'}})};
// Frequently used tools placed in context.
function despesasContextTools(){
 const records=$('expensesPanel');if(records&&!$('despesasRecordsTools')){const el=document.createElement('div');el.id='despesasRecordsTools';el.className='v35-tools';el.remove()}
 const dialog=$('debtDialog');if(dialog&&!$('despesasFavorites')){const btn=document.createElement('button');btn.id='despesasFavorites';btn.className='secondary';btn.type='button';btn.textContent='⭐ Reutilizar despesa';btn.onclick=()=>v35Favorites();dialog.querySelector('#debtForm')?.prepend(btn)}
 const footer=document.querySelector('.footer');if(footer)footer.classList.remove('screen-hidden');
}
const despesasOldPix=v35Pix;
v35Pix=function(){despesasOldPix()};
// Make the printed/exported report use the current product name.
const despesasOldExportPDF=v35ExportPDF;
v35ExportPDF=function(){despesasOldExportPDF()};
// Ensure the initial screen is consistent with the new navigation.
despesasContextTools();render();despesasCategoryVisual();

// Acesso rápido a rendas, independente das abas.
(function(){
 const area=$('v40IncomeArea'),panel=$('incomePanel');
 if(!area||!panel)return;
 const actions=document.createElement('div');actions.className='v40-income-actions';
 actions.innerHTML='<button class="secondary" type="button" id="v40IncomeListButton">Ver rendas</button><button class="secondary" type="button" id="v40HistoryButton">Histórico de pagamentos</button>';
 panel.appendChild(actions);
 $('v40IncomeListButton').onclick=()=>{
   const list=$('incomeList');if(!list)return;
   const visible=list.style.display==='block';list.style.display=visible?'none':'block';
   $('v40IncomeListButton').textContent=visible?'Ver rendas':'Ocultar rendas';
 };
 $('v40HistoryButton').onclick=()=>{
   const h=$('historyPanel');if(!h)return;
   const visible=h.classList.toggle('v40-show-history');
   $('v40HistoryButton').textContent=visible?'Ocultar histórico':'Histórico de pagamentos';
 };
})();
// O app começa sem nenhuma seção aberta, mesmo após a renderização inicial.
despesasTab(null);
