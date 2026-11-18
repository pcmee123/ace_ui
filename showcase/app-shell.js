(() => {
  const app = document.querySelector('[data-app]');
  const title = app.querySelector('[data-view-title]');

  function showView(id = app.dataset.defaultView) {
    const views = [...app.querySelectorAll('[data-app-view]')];
    const view = views.find(item => item.dataset.appView === id) || views[0];
    views.forEach(item => { item.hidden = item !== view; });
    title.textContent = view.dataset.viewName;
    app.querySelectorAll('[data-app-nav]').forEach(link => {
      if (link.hash === '#' + view.dataset.appView) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  window.addEventListener('hashchange', () => {
    if (location.hash !== '#app-main') showView(location.hash.slice(1));
  });
  showView(location.hash.slice(1));

  function navigate(id) {
    if (location.hash !== '#' + id) location.hash = id;
    showView(id);
  }

  const frame = app.querySelector('.ace-app-frame');
  if (frame) {
    const reopen = app.querySelector('[data-window-reopen]');
    const minimize = frame.querySelector('[data-window-action="minimize"]');
    const maximize = frame.querySelector('[data-window-action="maximize"]');
    let previousState = 'normal';

    function setWindowState(state) {
      frame.dataset.windowState = state;
      frame.hidden = state === 'closed';
      reopen.hidden = state !== 'closed';
      minimize.setAttribute('aria-label', state === 'minimized' ? '还原窗口预览' : '最小化窗口预览');
      maximize.setAttribute('aria-label', state === 'maximized' ? '还原窗口尺寸' : '最大化窗口预览');
      minimize.title = minimize.getAttribute('aria-label');
      maximize.title = maximize.getAttribute('aria-label');
      minimize.querySelector('[data-window-min-glyph]').textContent = state === 'minimized' ? '▣' : '−';
    }

    app.addEventListener('click', event => {
      const button = event.target.closest('[data-window-action]');
      if (!button) return;
      const state = frame.dataset.windowState;
      switch (button.dataset.windowAction) {
        case 'maximize':
          setWindowState(state === 'maximized' ? 'normal' : 'maximized');
          break;
        case 'minimize':
          if (state !== 'minimized') previousState = state;
          setWindowState(state === 'minimized' ? previousState : 'minimized');
          break;
        case 'close':
          setWindowState('closed');
          reopen.querySelector('button').focus();
          break;
        case 'reopen':
          setWindowState('normal');
          minimize.focus();
          break;
      }
    });
  }

  function load(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  }

  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch { /* The preview can still run when storage is unavailable. */ }
  }

  window.AceApp = { app, navigate, load, save };
})();
