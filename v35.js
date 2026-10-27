
// Finanças 3.5 - melhorias incrementais sem migração destrutiva de dados.
const V35_PIX='00020101021126950014br.gov.bcb.pix0136aba8449e-8cca-4102-b789-0920e7c0f39a0233Me ajude a continuar criando apps52040000530398654042.005802BR5919CLEIBSON J DA SILVA6008RIBEIRAO62070503***63048062';
let v35Screen='home',v35Undo=null;
function v35Toast(msg,undo){
 const el=$('v35Toast');el.innerHTML=esc(msg)+(undo?' <button onclick="v35Restore()">Desfazer</button>':'');
 el.style.display='block';clearTimeout(window.v35ToastTimer);window.v35ToastTimer=setTimeout(()=>{el.style.display='none';v35Undo=null},7000);
}
function v35Snapshot(){v35Undo=JSON.stringify(data)}
function v35Restore(){if(!v35Undo)return;data=JSON.parse(v35Undo);v35Undo=null;save();render();v35Toast('Ação desfeita');}
function v35Nav(s){
 v35Screen=s;
 const panels={home:['chartPanel'],records:['expensesPanel','incomePanel','historyPanel'],budgets:['budgetPanel'],more:['cardsPanel','v35Extras']};
 for(const id of ['debtSummaryPanel','chartPanel','budgetPanel','cardsPanel','expensesPanel','incomePanel','historyPanel','v35Extras']){
  $(id)?.classList.toggle('screen-hidden',!panels[s].includes(id));
 }
 $('v35Shortcuts')?.classList.toggle('screen-hidden',s!=='home');
 document.querySelector('.footer')?.classList.toggle('screen-hidden',s!=='more');
 v35CustomApply();
 document.querySelectorAll('.v35-bottom button').forEach(b=>b.classList.toggle('active',b.id==='vnav-'+s));
 $('screenFab').textContent=s==='records'?'＋ Nova despesa':s==='budgets'?'＋ Abater compra':s==='more'?'＋ Nova compra':'＋ Nova despesa';
 window.scrollTo({top:0,behavior:'instant'});
}
const oldApplyScreen=applyScreen;
applyScreen=function(){oldApplyScreen();v35NavKeep()};
function v35NavKeep(){
 const panels={home:['chartPanel'],records:['expensesPanel','incomePanel','historyPanel'],budgets:['budgetPanel'],more:['cardsPanel','v35Extras']};
 for(const id of ['debtSummaryPanel','chartPanel','budgetPanel','cardsPanel','expensesPanel','incomePanel','historyPanel','v35Extras'])$(id)?.classList.toggle('screen-hidden',!panels[v35Screen].includes(id));
 $('v35Shortcuts')?.classList.toggle('screen-hidden',v35Screen!=='home');
 document.querySelector('.footer')?.classList.toggle('screen-hidden',v35Screen!=='more');
}
screenQuick=function(){if(v35Screen==='budgets')return openBudgetSpend();if(v35Screen==='more')return openCardPurchase();openForm()};
function v35Extras(){
 const el=document.createElement('section');el.className='panel';el.id='v35Extras';
 el.innerHTML=`<div class="section"><h2>Ferramentas</h2></div><div class="v35-tools">
 <button class="secondary" onclick="v35Calendar()">📅 Calendário</button><button class="secondary" onclick="v35Search()">🔎 Pesquisar</button>
 <button class="secondary" onclick="v35Forecast()">📈 Previsão</button><button class="secondary" onclick="v35Comparison()">📊 Comparativo</button>
 <button class="secondary" onclick="v35Savings()">🐷 Cofrinho</button><button class="secondary" onclick="v35Favorites()">⭐ Favoritas</button>
 <button class="secondary" onclick="v35ExportCSV()">⬇ CSV</button><button class="secondary" onclick="v35ExportPDF()">⬇ PDF</button>
 <button class="secondary" onclick="v35Subscriptions()">🔁 Assinaturas</button><button class="secondary" onclick="v35Customize()">⚙ Personalizar</button>
 <button class="secondary" onclick="v35Pix()">☕ Pix R$ 2</button><button class="secondary" onclick="openSettings()">🛡 Backup</button></div>
 <div id="v35Content" aria-live="polite"></div>`;
 document.querySelector('.footer').before(el);
}
function v35Show(title,body){v35Nav('more');$('v35Content').innerHTML=`<div class="v35-card"><h3>${esc(title)}</h3>${body}</div>`; $('v35Content').scrollIntoView({behavior:'smooth',block:'start'})}
function v35Calendar(){
 const rows=[...monthData(cursor),...incomeEntries(cursor).map(x=>({...x,due:x.occKey||x.date,name:'↑ '+x.name}))].sort((a,b)=>(a.due||'').localeCompare(b.due||''));
 v35Show('Calendário financeiro',`<input type="month" value="${mk(cursor)}" onchange="cursor=parse(this.value+'-01');render();v35Calendar()"><div>${rows.map(x=>`<div class="rowlist between"><span>${esc(x.due||x.occKey||'')} · ${esc(x.name)}</span><b>${money(x.value)}</b></div>`).join('')||'Sem lançamentos neste mês.'}</div>`);
}
function v35Search(){
 v35Show('Pesquisa global',`<input id="v35Query" placeholder="Buscar por nome ou categoria" oninput="v35SearchResults()"><div id="v35Results"></div>`);v35SearchResults();
}
function v35SearchResults(){
 const q=($('v35Query')?.value||'').toLowerCase().trim();
 const rows=[...data.items.map(x=>({...x,group:'Despesa'})),...data.cardPurchases.map(x=>({...x,group:'Cartão'})),...data.incomes.map(x=>({...x,group:'Renda'})),...data.budgetSpends.map(x=>({...x,group:'Orçamento'}))].filter(x=>(x.name+' '+x.category).toLowerCase().includes(q)).slice(0,100);
 $('v35Results').innerHTML=rows.map(x=>`<div class="rowlist between"><span>${esc(x.group)} · ${esc(x.name)}</span><b>${money(x.value)}</b></div>`).join('')||'Nenhum resultado.';
}
function v35Forecast(){
 const inc=incomeEntries(cursor).reduce((s,x)=>s+x.value,0),deb=monthData(cursor).reduce((s,x)=>s+x.value,0),spent=data.budgetSpends.filter(x=>x.date.startsWith(mk(cursor))).reduce((s,x)=>s+x.value,0);
 v35Show('Previsão do mês',`<p>Receitas previstas: <b>${money(inc)}</b></p><p>Compromissos previstos: <b>${money(deb+spent)}</b></p><h3>Saldo estimado: ${money(inc-deb-spent)}</h3><p class="v35-small">Projeção de lançamentos cadastrados, não saldo bancário real. Compras do cartão já entram nos compromissos.</p>`);
}
function v35Comparison(){
 const rows=Array.from({length:6},(_,i)=>{const d=new Date(cursor.getFullYear(),cursor.getMonth()-5+i,1);return {name:d.toLocaleDateString('pt-BR',{month:'short',year:'numeric'}),income:incomeEntries(d).reduce((s,x)=>s+x.value,0),out:monthData(d).reduce((s,x)=>s+x.value,0)+data.budgetSpends.filter(x=>x.date.startsWith(mk(d))).reduce((s,x)=>s+x.value,0)}});
 v35Show('Comparativo mensal',rows.map(x=>`<div class="rowlist"><b>${esc(x.name)}</b><p class="v35-small">Entradas ${money(x.income)} · Saídas ${money(x.out)}</p></div>`).join(''));
}
function v35Savings(){
 data.savings??=[];const total=data.savings.reduce((s,x)=>s+(x.type==='withdraw'?-x.value:x.value),0);
 v35Show('Cofrinho',`<h2>${money(total)}</h2><p class="v35-small">Dinheiro reservado, não despesa.</p><input id="v35SavingAmount" type="number" min=".01" step=".01" placeholder="Valor"><input id="v35SavingNote" placeholder="Descrição (opcional)"><div class="v35-tools"><button class="primary" onclick="v35SavingAdd('deposit')">Guardar</button><button class="secondary" onclick="v35SavingAdd('withdraw')">Retirar</button></div>${data.savings.slice().reverse().map(x=>`<div class="rowlist between"><span>${esc(x.date)} · ${esc(x.note|| (x.type==='withdraw'?'Retirada':'Depósito'))}</span><b>${x.type==='withdraw'?'-':'+'}${money(x.value)}</b></div>`).join('')}`);
}
function v35SavingAdd(type){
 const value=Number($('v35SavingAmount').value),total=data.savings.reduce((s,x)=>s+(x.type==='withdraw'?-x.value:x.value),0);
 if(!(value>0)||type==='withdraw'&&value>total)return alert('Confira o valor disponível.');
 v35Snapshot();data.savings.push({id:uid(),type,value,date:today(),note:$('v35SavingNote').value});save();v35Savings();v35Toast('Cofrinho atualizado',true);
}
function v35Favorites(){
 const names=[...new Set(data.items.map(x=>x.name))].slice(-20).reverse();
 v35Show('Despesas favoritas',names.map(n=>`<div class="rowlist between"><span>${esc(n)}</span><button class="secondary" onclick="v35UseFavorite('${encodeURIComponent(n)}')">Reutilizar</button></div>`).join('')||'Cadastre uma despesa para começar.');
}
function v35UseFavorite(name){
 const item=data.items.find(x=>x.name===decodeURIComponent(name));if(!item)return;openForm();
 $('name').value=item.name;$('value').value=item.value;$('category').value=item.category;syncDefaults();$('kind').value=item.kind;kindChange();$('due').value=today();
}
function v35Download(content,name,type){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function v35ExportCSV(){
 const rows=[['Tipo','Descrição','Categoria','Valor','Data'],...data.items.map(x=>['Despesa',x.name,x.category,x.value,x.due]),...data.incomes.map(x=>['Renda',x.name,'',x.value,x.date]),...data.cardPurchases.map(x=>['Cartão',x.name,x.category,x.value,x.firstMonth]),...data.budgetSpends.map(x=>['Orçamento',x.name,x.category,x.value,x.date])];
 v35Download('\ufeff'+rows.map(r=>r.map(x=>'"'+String(x??'').replace(/"/g,'""')+'"').join(';')).join('\r\n'),'despesas-'+today()+'.csv','text/csv;charset=utf-8');
}
function v35ExportPDF(){
 v35Comparison();const content=$('v35Content').innerText,w=window.open('','_blank');
 if(!w)return alert('Permita pop-ups para imprimir/salvar como PDF.');
 w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Relatório Finanças</title></head><body><h1>Despesas — Relatório</h1><pre style="white-space:pre-wrap;font:14px Arial">'+esc(content)+'</pre></body></html>');w.document.close();w.print();
}
function v35Subscriptions(){
 const recurring=data.items.filter(x=>['recurring','monthly','custom'].includes(x.kind));
 v35Show('Assinaturas e recorrências',recurring.map(x=>`<div class="rowlist between"><span>${esc(x.name)}</span><b>${money(x.value)}</b></div>`).join('')||'Nenhuma recorrência cadastrada. Use Nova despesa → Recorrente mensal.');
}
function v35Customize(){
 const v=readJSON('financas-v35-custom',{chart:true,history:true});
 v35Show('Personalizar início',`<label><input type="checkbox" ${v.chart?'checked':''} onchange="v35CustomSet('chart',this.checked)"> Mostrar gráfico no início</label><p><label><input type="checkbox" ${v.history?'checked':''} onchange="v35CustomSet('history',this.checked)"> Mostrar histórico na aba Registros</label></p>`);
}
function v35CustomSet(k,value){const v=readJSON('financas-v35-custom',{chart:true,history:true});v[k]=value;localStorage.setItem('financas-v35-custom',JSON.stringify(v));v35CustomApply()}
function v35CustomApply(){const v=readJSON('financas-v35-custom',{chart:true,history:true});if(v35Screen==='home'&&!v.chart)$('chartPanel')?.classList.add('screen-hidden');if(v35Screen==='records'&&!v.history)$('historyPanel')?.classList.add('screen-hidden')}
function v35Pix(){
 v35Show('☕ Me pague um café · R$ 2,00',`<p>Ajude a continuar criando aplicativos.</p><img alt="QR Code Pix" width="220" height="220" style="max-width:100%" src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(V35_PIX)}"><p class="v35-small">CLEIBSON J DA SILVA</p><button class="primary" onclick="v35CopyPix()">Copiar Pix</button><p class="v35-small">O QR Code exige internet; o código Copia e Cola funciona offline.</p>`);
}
function v35CopyPix(){navigator.clipboard?.writeText(V35_PIX).then(()=>v35Toast('Pix copiado')).catch(()=>prompt('Copie o Pix:',V35_PIX))}
function v35MoveExpense(id){
 const d=data.items.find(x=>x.id===id);if(!d||!data.cards.length)return alert('Cadastre um cartão antes.');
 const card=prompt('Cartão de destino:\n'+data.cards.map((c,i)=>`${i+1} - ${c.name}`).join('\n'));
 const target=data.cards[Number(card)-1];if(!target)return;
 if(!['spent','once'].includes(d.kind))return alert('A transferência está disponível para despesas avulsas ou únicas.');
 if(Object.keys(d.transactions||{}).length||Object.values(d.payments||{}).some(Boolean))return alert('Não é possível mover despesas com pagamentos registrados.');
 if(!confirm(`Mover "${d.name}" para ${target.name}?`))return;
 v35Snapshot();const date=d.due||today(),base=parse(date),first=new Date(base.getFullYear(),base.getMonth(),1);
 if(base.getDate()>target.closeDay)first.setMonth(first.getMonth()+1);
 data.cardPurchases.push({id:uid(),name:d.name,value:d.value,count:1,cardId:target.id,category:d.category,firstMonth:mk(first)});
 data.items=data.items.filter(x=>x.id!==id);save();render();v35Toast('Despesa movida para o cartão',true);
}
function v35CardDates(){
 const name=prompt('Nome do novo cartão');if(!name?.trim())return;
 window.v35PendingCardName=name;v35Show('Datas do cartão',`<p><b>${esc(name)}</b></p><label>Fechamento</label><input id="v35Closing" type="date" value="${today()}"><label>Vencimento</label><input id="v35Due" type="date" value="${today()}"><p class="v35-small">O dia escolhido será repetido mensalmente, com ajuste para meses curtos.</p><button class="primary" onclick="v35SaveCard(window.v35PendingCardName)">Salvar cartão</button>`);
}
function v35SaveCard(name){const close=$('v35Closing').value,due=$('v35Due').value;if(!close||!due)return alert('Selecione as datas.');data.cards.push({id:uid(),name,closeDay:Number(close.slice(-2)),dueDay:Number(due.slice(-2))});save();render();updateCardSelect();v35Toast('Cartão criado')}
function v35BudgetDelete(cat){if(!confirm(`Excluir o limite de ${cat}? Os gastos históricos serão preservados.`))return;v35Snapshot();delete data.budgets[cat];save();render();v35Toast('Orçamento excluído',true)}
function v35EnhanceBudgets(){
 document.querySelectorAll('#budgets .budget').forEach((el,i)=>{
 const cat=Object.entries(data.budgets).filter(([,v])=>Number(v)>0)[i]?.[0];if(!cat||el.querySelector('.v35-budget-actions'))return;
 const bar=document.createElement('div');bar.className='v35-tools v35-budget-actions';
 const a=document.createElement('button');a.className='secondary';a.textContent='− Abater compra';a.onclick=()=>{$('spendCategory').value=cat;openBudgetSpend();$('spendCategory').value=cat};
 const b=document.createElement('button');b.className='secondary';b.textContent='⋮ Excluir';b.onclick=()=>v35BudgetDelete(cat);bar.append(a,b);el.appendChild(bar);
 });
}
const v35OldRender=render;
render=function(){v35OldRender();v35EnhanceBudgets();v35CustomApply()};
const v35OldRenderList=renderList;
renderList=function(){v35OldRenderList();document.querySelectorAll('#debts .entry').forEach(el=>{if(el.querySelector('.v35-move'))return;const name=el.querySelector('.entrymain strong')?.textContent;const d=data.items.find(x=>x.name===name&&['once','spent'].includes(x.kind));if(!d)return;const b=document.createElement('button');b.className='secondary v35-move';b.textContent='Mover para cartão';b.onclick=()=>v35MoveExpense(d.id);(el.querySelector('.actions')||el).appendChild(b)});};
const v35OldOpenCoffee=openCoffee;openCoffee=v35Pix;
const v35OldAddCard=addCard;addCard=v35CardDates;
v35Extras();render();v35Nav('home');
