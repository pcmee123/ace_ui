/* Local presentation examples only. Replace demo effects with business APIs. */
(function(){
  'use strict';
  let tablePage=1;const pageSize=4;
  function filterTable(){
    const search=document.querySelector('[data-demo-search]');if(!search)return;
    const query=search.value.trim().toLowerCase();const state=document.querySelector('[data-demo-filter] [aria-pressed=true]')?.dataset.filter||'';
    const rows=[...document.querySelectorAll('[data-demo-table] tbody tr')];
    const matching=rows.filter(row=>row.dataset.search.toLowerCase().includes(query)&&(!state||row.dataset.search.includes(state)));
    const pageCount=Math.max(1,Math.ceil(matching.length/pageSize));tablePage=Math.min(tablePage,pageCount);
    rows.forEach(row=>row.hidden=true);matching.slice((tablePage-1)*pageSize,tablePage*pageSize).forEach(row=>row.hidden=false);
    document.querySelector('[data-demo-no-results]').hidden=matching.length>0;
    document.querySelector('[data-demo-result-count]').textContent=`共 ${matching.length} 个资源 · 第 ${tablePage} / ${pageCount} 页`;
    document.querySelectorAll('[data-table-page]').forEach(b=>{const p=b.dataset.tablePage;if(p==='prev')b.disabled=tablePage===1;else if(p==='next')b.disabled=tablePage===pageCount;else {b.hidden=Number(p)>pageCount;if(Number(p)===tablePage)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');}});
  }
  document.addEventListener('submit',e=>{
    const form=e.target;
    if(form.matches('[data-demo-form]')){e.preventDefault();AceUI.toast(form.dataset.demoForm);form.closest('dialog')?.close();}
    if(form.matches('[data-demo-chat]')){e.preventDefault();const input=form.elements.message;const value=input.value.trim();if(!value)return;
      const target=form.dataset.demoChatTarget?document.getElementById(form.dataset.demoChatTarget):form.parentElement.querySelector('.demo-chat-output');
      if(target){const item=document.createElement('div');item.className='ace-message ace-message--user';const avatar=document.createElement('span');avatar.className='ace-avatar';avatar.textContent='你';const bubble=document.createElement('div');bubble.className='ace-message__body';bubble.textContent=value;item.append(avatar,bubble);target.append(item);const reply=document.createElement('div');reply.className='ace-message';const ra=document.createElement('span');ra.className='ace-avatar';ra.textContent='A';const rb=document.createElement('div');rb.className='ace-message__body';rb.textContent='消息已添加到当前页面。这是本地对话布局演示；接入你的 AI 服务后，在这里展示真实回答。';reply.append(ra,rb);target.append(reply);}
      input.value='';input.focus();
    }
  });
  document.addEventListener('input',e=>{
    if(e.target.matches('[data-demo-range]'))document.getElementById(e.target.dataset.demoRange).textContent=e.target.value;
    if(e.target.matches('[data-demo-search]')){tablePage=1;filterTable();}
  });
  document.addEventListener('change',e=>{
    if(e.target.matches('[data-demo-file]')){const file=e.target.files[0];const out=e.target.closest('.ace-upload').querySelector('[data-demo-file-output]');if(!file){out.textContent='尚未选择文件';return;}if(!file.name.toLowerCase().endsWith('.json')||file.size>2*1024*1024){out.textContent='请选择 2 MB 以内的 JSON 文件';e.target.value='';return;}out.textContent=`已选择 ${file.name}（${Math.max(1,Math.round(file.size/1024))} KB），未上传`;}
  });
  document.addEventListener('click',e=>{
    const resource=e.target.closest('[data-demo-resource]');if(resource){document.getElementById('drawer-resource').textContent=resource.dataset.demoResource;const dialog=document.getElementById('example-drawer');const row=resource.closest('tr');if(row){const cells=row.cells;dialog.querySelector('.ace-dialog__body .ace-badge').outerHTML=cells[1].innerHTML;const values=dialog.querySelectorAll('dd');values[0].textContent=cells[0].querySelector('small')?.textContent||'服务';values[1].textContent=cells[3].textContent;}dialog.showModal();}
    const filter=e.target.closest('[data-demo-filter] button');if(filter){filter.parentElement.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===filter)));tablePage=1;filterTable();}
    if(e.target.closest('[data-demo-clear]')){document.querySelector('[data-demo-search]').value='';document.querySelectorAll('[data-demo-filter] button').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===0)));tablePage=1;filterTable();}
    const pag=e.target.closest('[data-table-page]');if(pag){tablePage=pag.dataset.tablePage==='next'?tablePage+1:pag.dataset.tablePage==='prev'?tablePage-1:Number(pag.dataset.tablePage);filterTable();}
    const page=e.target.closest('[data-demo-pagination] [data-page]');if(page){const nav=page.closest('[data-demo-pagination]');const old=Number(nav.querySelector('[aria-current]')?.dataset.page||1);const value=page.dataset.page;const n=value==='next'?Math.min(3,old+1):value==='prev'?Math.max(1,old-1):Number(value);nav.querySelectorAll('[data-page]').forEach(b=>{if(b.dataset.page===String(n))b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');if(b.dataset.page==='prev')b.disabled=n===1;if(b.dataset.page==='next')b.disabled=n===3;});nav.parentElement.querySelector('.pagination-status').textContent=`第 ${n} 页，共 3 页 · 分页交互示例`;}
    const seg=e.target.closest('[data-demo-segment] button');if(seg){seg.parentElement.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===seg)));seg.parentElement.parentElement.querySelector('.segment-status').textContent='当前周期：'+seg.textContent;}
    const prompt=e.target.closest('[data-demo-prompt]');if(prompt){const input=document.getElementById('chat-input');input.value=prompt.dataset.demoPrompt;input.focus();}
    const menu=e.target.closest('.ace-menu button');if(menu)menu.closest('details').open=false;
  });
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',filterTable);else filterTable();
})();
