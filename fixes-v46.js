// Despesas 4.6 — correções auditadas. Preserva vertice-v3 e backups anteriores.
'use strict';
(function(){
 const dayOptions=Array.from({length:31},(_,i)=>`<option value="${i+1}">Dia ${i+1}</option>`).join('');
 let editingCardId=null;
 const oldRender=render;
 function allPendingDues(){
  const start=parse(today()),end=new Date(start);end.setDate(end.getDate()+10);
  const rows=[];
  for(const item of data.items){
   if(item.archived||item.kind==='spent'||!item.due)continue;
   const date=parse(item.due);
   if(!Number.isFinite(date.getTime())||date>end)continue;
   for(const occ of datesFor(item,date,end)){
    if(occ.remaining>0.005 && occ.dueDate<=end)rows.push(occ);
   }
  }
  // As parcelas de cartão devem seguir a data de vencimento real da fatura.
  for(const purchase of data.cardPurchases||[]){
   if(!purchase.firstMonth)continue;
   const first=parse(purchase.firstMonth+'-01');
   if(!Number.isFinite(first.getTime()))continue;
   const count=Math.max(0,Math.min(360,Number(purchase.count)||0));
   for(let i=0;i<count;i++){
    const month=addMonths(first,i);
    if(month>end)break;
    const occ=cardOccurrences(month).find(x=>x.id===purchase.id&&x.installment===i+1);
    if(occ&&occ.remaining>0.005&&occ.dueDate<=end)rows.push(occ);
   }
  }
  return rows.sort((a,b)=>a.dueDate-b.dueDate||a.name.localeCompare(b.name,'pt-BR'));
 }
 function renderDues(){
  const el=$('dueTenDays');if(!el)return;
  const todayDate=parse(today()),rows=allPendingDues();
  el.innerHTML=rows.length?rows.map(o=>{
   const delta=Math.round((o.dueDate-todayDate)/86400000);
   const label=delta<0?`Vencida há ${-delta} dia${delta===-1?'':'s'}`:delta===0?'Vence hoje':delta===1?'Vence amanhã':`Vence em ${delta} dias`;
   return `<div class="rowlist between" style="gap:10px;align-items:center"><div style="min-width:0;flex:1"><strong style="display:block;overflow-wrap:anywhere">${esc(o.name)}</strong><small class="subtle">${o.dueDate.toLocaleDateString('pt-BR')} · <span style="color:${delta<0?'#ff8ea8':'#aabdf4'}">${label}</span></small></div><strong class="sensitive" style="color:${delta<0?'#ff8ea8':'#f3f5ff'};white-space:nowrap">${money(o.remaining)}</strong></div>`;
  }).join(''):'<div class="empty">Nenhuma conta vencida pendente ou a vencer nos próximos 10 dias.</div>';
 }
 function renderCommitment(){
  const incomes=incomeEntries(cursor).reduce((s,x)=>s+Number(x.value||0),0);
  const expenses=monthData(cursor).reduce((s,x)=>s+Number(x.value||0),0);
  const ratio=incomes>0?expenses/incomes*100:0;
  const bar=$('commitBar'),text=$('commitText');
  if(bar)bar.style.width=Math.max(0,Math.min(100,ratio))+'%';
  if(text)text.textContent=incomes>0?ratio.toLocaleString('pt-BR',{maximumFractionDigits:1})+'% da renda comprometida':'Cadastre uma renda para calcular o comprometimento';
 }
 // Cartões são renderizados diretamente dos dados persistidos, não do estado da janela.
 renderCards=function(){
  const el=$('cardsList');if(!el)return;
  el.innerHTML=data.cards.map(c=>{
   const rows=cardOccurrences(cursor).filter(x=>x.cardId===c.id);
   const total=rows.reduce((s,x)=>s+x.value,0);
   const paid=!!data.cardPayments?.[c.id]?.[mk(cursor)];
   return `<div class="entry"><div class="between"><b>💳 ${esc(c.name)}</b><b class="sensitive">${money(total)}</b></div><div class="note">Fecha dia ${Number(c.closeDay)} · Vence dia ${Number(c.dueDay)} · ${paid?'Fatura paga':'Fatura pendente'}</div><div class="note">${rows.map(x=>esc(x.name)+' ('+x.installment+'/'+x.count+')').join(' · ')||'Sem compras nesta fatura'}</div><div class="actions"><button type="button" onclick="toggleCardPaid('${c.id}')">${paid?'↶ Desfazer pagamento':'✓ Pagar fatura'}</button><button type="button" onclick="v46EditCard('${c.id}')">✎ Editar</button><button type="button" onclick="deleteCard('${c.id}')">Excluir</button></div></div>`;
  }).join('')||'<div class="empty">Nenhum cartão cadastrado.</div>';
 };
 function showCardForm(id){
  const card=id?data.cards.find(x=>x.id===id):null;
  if(id&&!card){alert('Cartão não encontrado.');return}
  editingCardId=card?.id||null;
  const dialog=$('despesasToolsDialog')||document.createElement('dialog');
  dialog.id='despesasToolsDialog';if(!dialog.isConnected)document.body.appendChild(dialog);
  dialog.innerHTML=`<h3>${card?'Editar cartão':'Adicionar cartão'}</h3><form id="v46CardForm"><div class="v46-field"><label for="v46CardName">Nome do cartão</label><input id="v46CardName" required maxlength="70" value="${esc(card?.name||'')}" placeholder="Ex.: Banco do Brasil"></div><div class="v46-field"><label for="v46Closing">Dia de fechamento</label><select id="v46Closing" required>${dayOptions}</select></div><div class="v46-field"><label for="v46Due">Dia de vencimento</label><select id="v46Due" required>${dayOptions}</select></div><p class="subtle">Os dias se repetem mensalmente; em meses curtos, será usado o último dia.</p><div class="v46-card-actions"><button type="button" class="secondary" id="v46CancelCard">Cancelar</button><button type="submit" class="primary">${card?'Salvar alterações':'Salvar cartão'}</button></div></form>`;
  $('v46Closing').value=String(card?.closeDay||20);
  $('v46Due').value=String(card?.dueDay||27);
  $('v46CancelCard').onclick=()=>dialog.close();
  $('v46CardForm').onsubmit=function(e){e.preventDefault();
   const name=$('v46CardName').value.trim(),closeDay=Number($('v46Closing').value),dueDay=Number($('v46Due').value);
   if(!name||!Number.isInteger(closeDay)||closeDay<1||closeDay>31||!Number.isInteger(dueDay)||dueDay<1||dueDay>31)return alert('Confira os dados do cartão.');
   const old=editingCardId?data.cards.find(x=>x.id===editingCardId):null;
   const entry=old?{...old,name,closeDay,dueDay}:{id:uid(),name,closeDay,dueDay};
   const before=JSON.stringify(data.cards);
   if(old)Object.assign(old,entry);else data.cards.push(entry);
   if(!save()){
    data.cards=JSON.parse(before);return;
   }
   dialog.close();
   render();
   despesasTab('cards');
   if(despesasPendingPurchase&&!old){
    despesasPendingPurchase=false;
    updateCardSelect();
    despesasOldCardPurchaseSafe(entry.id);
   }
  };
  if(!dialog.open)dialog.showModal();
 }
 function despesasOldCardPurchaseSafe(id){
  updateCardSelect();$('cardPurchaseForm').reset();$('purchaseDate').value=today();
  $('cardPurchaseDialog').showModal();$('purchaseCard').value=id;
 }
 window.v46EditCard=showCardForm;
 addCard=function(){despesasPendingPurchase=false;showCardForm(null)};
 openCardPurchase=function(){
  if(!data.cards.length){despesasPendingPurchase=true;showCardForm(null);return}
  despesasOldCardPurchaseSafe(data.cards[0].id);
 };
 // Não permitir que a camada antiga volte a trocar o modal por um formulário de data completa.
 v35CardDates=function(){showCardForm(null)};
 // Aplica as correções após a renderização dos componentes legados.
 render=function(){
  oldRender();
  renderCards();
  renderDues();
  renderCommitment();
  // Respeita a aba selecionada e evita que uma renderização mostre as outras.
  despesasTab(despesasActive);
 };
 // Impede reabertura de seções antigas e corrige as rendas invisíveis por CSS.
 const incomeList=$('incomeList');if(incomeList)incomeList.style.display='none';
 const listButton=$('v40IncomeListButton');if(listButton)listButton.textContent='Ver rendas';
 render();despesasTab(null);
})();
