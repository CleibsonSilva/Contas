// Despesas v3.6 — camada de interface não destrutiva sobre os dados existentes.
let despesasActive='records', despesasPendingPurchase=false;
function despesasTab(tab){
 despesasActive=tab;
 const groups={cards:['cardsPanel'],budgets:['budgetPanel'],records:['expensesPanel','incomePanel','historyPanel']};
 ['cardsPanel','budgetPanel','expensesPanel','incomePanel','historyPanel'].forEach(id=>$(id)?.classList.toggle('screen-hidden',!groups[tab].includes(id)));
 document.querySelectorAll('#despesasTabs button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
 $('screenFab').textContent=tab==='cards'?'＋ Nova compra':tab==='budgets'?'＋ Abater valor':'＋ Nova despesa';
 document.querySelectorAll('#despesasTabs button').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===tab)));
 $('despesasPanelHost')?.setAttribute('aria-label',tab==='cards'?'Cartões':tab==='budgets'?'Orçamentos':'Despesas');
}
// Preserve old functions for backups and financial calculations.
const despesasOriginalRender=render;
render=function(){despesasOriginalRender();despesasAfterRender()};
function despesasAfterRender(){
 if(data.settings)data.settings.hide=false;
 $('appMain')?.classList.remove('privacy');
 const due=monthData(cursor).filter(x=>!x.archived&&x.remaining>0).sort((a,b)=>a.dueDate-b.dueDate).slice(0,5);
 const dueBox=$('despesasDue');if(dueBox)dueBox.innerHTML='<div class="section"><h2>Próximos vencimentos</h2></div>'+(due.length?due.map(x=>`<div class="rowlist between"><span>${esc(x.name)}<small class="subtle" style="display:block">${x.dueDate.toLocaleDateString('pt-BR')} · ${status(x)==='overdue'?'🔴 Vencida':'A pagar'}</small></span><b class="sensitive" style="color:${status(x)==='overdue'?'#ff7777':'inherit'}">${money(x.remaining)}</b></div>`).join(''):'<p class="subtle">Nenhuma conta pendente neste mês.</p>');
 const inc=incomeEntries(cursor).reduce((s,x)=>s+Number(x.value),0),out=monthData(cursor).reduce((s,x)=>s+x.value,0),sp=data.budgetSpends.filter(x=>x.date.startsWith(mk(cursor))).reduce((s,x)=>s+x.value,0);
 const forecast=$('despesasForecast');if(forecast)forecast.innerHTML=`<div class="between"><b>Previsão do mês</b><b class="sensitive">${money(inc-out-sp)}</b></div><small class="subtle">Estimativa baseada nos registros cadastrados.</small>`;
 // Only one history accordion, collapsed initially after each render.
 const history=$('budgetSpends');if(history){const html=history.innerHTML;history.innerHTML=`<details><summary>Histórico de abatimentos (${data.budgetSpends.filter(x=>x.date.startsWith(mk(cursor))).length})</summary><div>${html}</div></details>`}
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
screenQuick=function(){if(despesasActive==='cards')return openCardPurchase();if(despesasActive==='budgets')return openBudgetSpend();openForm()};
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
