(function(global) {
  'use strict';
  if(global.AceUI) return;
  const themes = ['dark','light','sage','eye'];
  const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function setTheme(theme) {
    if(!themes.includes(theme)) return false;
    document.documentElement.dataset.aceTheme=theme;
    try {localStorage.setItem('ace-ui.theme',theme);} catch {}
    document.querySelectorAll('[data-ace-set-theme]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.aceSetTheme===theme)));
    document.querySelectorAll('[data-ace-theme-select]').forEach(s=>s.value=theme);
    document.dispatchEvent(new CustomEvent('ace:theme',{detail:{theme}}));
    return true;
  }
  function toast(message, options={}) {
    let host=document.querySelector('.ace-toasts');
    if(!host) {host=document.createElement('div');host.className='ace-toasts';host.setAttribute('aria-live','polite');host.setAttribute('aria-relevant','additions');document.body.append(host);}
    const node=document.createElement('div');node.className='ace-toast';
    node.innerHTML=(global.AceIcons?.svg('check')||'')+`<span>${esc(message)}</span><button class="ace-btn ace-btn--ghost ace-btn--sm" aria-label="关闭通知">×</button>`;
    node.querySelector('button').onclick=()=>node.remove();host.append(node);
    while(host.children.length>3)host.firstElementChild.remove();
    let timer;const schedule=()=>{timer=setTimeout(()=>node.remove(),options.duration||5000);};
    node.addEventListener('mouseenter',()=>clearTimeout(timer));node.addEventListener('mouseleave',schedule);node.addEventListener('focusin',()=>clearTimeout(timer));node.addEventListener('focusout',schedule);schedule();
    return node;
  }
  async function copy(text) {
    try {if(!navigator.clipboard?.writeText)throw new Error('fallback');await navigator.clipboard.writeText(text);}
    catch {const focused=document.activeElement;const area=document.createElement('textarea');area.value=text;area.style.cssText='position:fixed;left:-9999px';document.body.append(area);area.select();const ok=document.execCommand('copy');area.remove();focused?.focus();if(!ok){toast('复制不可用，请选中文字手动复制');return false;}}
    toast('已复制到剪贴板');return true;
  }
  function selectTab(tab) {
    const group=tab.closest('[role=tablist]');if(!group)return;
    group.querySelectorAll('[role=tab]').forEach(t=>{const on=t===tab;t.setAttribute('aria-selected',String(on));t.tabIndex=on?0:-1;const panel=document.getElementById(t.getAttribute('aria-controls'));if(panel)panel.hidden=!on;});
  }
  function syncNav() {
    const mobile=matchMedia('(max-width:760px)').matches;
    document.querySelectorAll('.ace-shell').forEach(shell=>{const side=shell.querySelector('.ace-sidebar');if(side)side.inert=mobile&&!shell.hasAttribute('data-nav-open');});
  }
  matchMedia('(max-width:760px)').addEventListener('change',syncNav);
  function init(root=document) {
    global.AceIcons?.mount(root);
    root.querySelectorAll('[role=tablist]').forEach(g=>{const tab=g.querySelector('[aria-selected=true]')||g.querySelector('[role=tab]');if(tab)selectTab(tab);});
    const theme=document.documentElement.dataset.aceTheme||'dark';
    root.querySelectorAll('[data-ace-set-theme]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.aceSetTheme===theme)));
    root.querySelectorAll('[data-ace-theme-select]').forEach(s=>s.value=theme);
    syncNav();
  }
  function closeNav(shell){shell?.removeAttribute('data-nav-open');const button=shell?.querySelector('[data-ace-nav-toggle]');button?.setAttribute('aria-expanded','false');syncNav();}
  document.addEventListener('click',e=>{
    const button=e.target.closest('[data-ace-set-theme],[data-ace-open],[data-ace-close],[data-ace-toast],[data-ace-copy],[data-ace-nav-toggle],[data-ace-nav-close],[role=tab]');
    if(button && !button.disabled){
      if(button.hasAttribute('data-ace-set-theme'))setTheme(button.dataset.aceSetTheme);
      if(button.hasAttribute('data-ace-toast'))toast(button.dataset.aceToast);
      if(button.hasAttribute('data-ace-copy')){const selector=button.dataset.aceCopy;copy(document.querySelector(selector)?.textContent||'');}
      if(button.hasAttribute('data-ace-open')){const dialog=document.getElementById(button.dataset.aceOpen);if(dialog&&!dialog.open)dialog.showModal();}
      if(button.hasAttribute('data-ace-close'))button.closest('dialog')?.close();
      if(button.hasAttribute('data-ace-nav-toggle')){const shell=button.closest('.ace-shell');const open=shell.toggleAttribute('data-nav-open');button.setAttribute('aria-expanded',String(open));syncNav();if(open)shell.querySelector('.ace-sidebar a')?.focus();}
      if(button.hasAttribute('data-ace-nav-close')){const shell=button.closest('.ace-shell');closeNav(shell);shell?.querySelector('[data-ace-nav-toggle]')?.focus();}
      if(button.getAttribute('role')==='tab')selectTab(button);
    }
    document.querySelectorAll('.ace-dropdown[open]').forEach(d=>{if(!d.contains(e.target))d.open=false;});
    if(e.target.tagName==='DIALOG'){const b=e.target.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)e.target.close();}
    if(e.target.closest('.ace-nav a'))closeNav(e.target.closest('.ace-shell'));
  });
  document.addEventListener('change',e=>{if(e.target.matches('[data-ace-theme-select]'))setTheme(e.target.value);});
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){document.querySelectorAll('.ace-dropdown[open]').forEach(d=>{d.open=false;d.querySelector('summary')?.focus();});document.querySelectorAll('.ace-shell[data-nav-open]').forEach(s=>{closeNav(s);s.querySelector('[data-ace-nav-toggle]')?.focus();});}
    const tab=e.target.closest('[role=tab]');
    if(tab&&['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const tabs=[...tab.closest('[role=tablist]').querySelectorAll('[role=tab]')];let index=tabs.indexOf(tab);index=e.key==='Home'?0:e.key==='End'?tabs.length-1:(index+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;selectTab(tabs[index]);tabs[index].focus();}
    if(e.key==='Tab'){const s=document.querySelector('.ace-shell[data-nav-open]');if(s&&matchMedia('(max-width:760px)').matches){const items=[...s.querySelectorAll('.ace-sidebar a,.ace-sidebar button,.ace-sidebar select')].filter(n=>!n.disabled&&n.getClientRects().length);const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}}
  });
  global.AceUI={init,setTheme,getTheme:()=>document.documentElement.dataset.aceTheme||'dark',toast,copy,selectTab,version:'1.0.0'};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>init());else init();
})(window);
