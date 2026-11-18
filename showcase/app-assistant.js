(() => {
  const { app, navigate, load, save } = AceApp;
  const storeKey = 'ace-ui.app.assistant.v1';
  const initial = {
    id: 'welcome',
    title: '项目启动计划',
    messages: [
      { role: 'user', content: '帮我把本周的项目启动工作拆成三步。' },
      { role: 'assistant', content: '1. 对齐目标和交付范围，明确本周的负责人。\n2. 建立任务清单，先完成影响最大的事项。\n3. 周五回顾进度，记录需要跟进的问题。' }
    ]
  };
  const stored = load(storeKey, {});
  const sessions = Array.isArray(stored.sessions) ? stored.sessions : [initial];
  const model = app.querySelector('#app-model');
  const form = app.querySelector('#app-composer');
  const input = form.elements.message;
  const messages = app.querySelector('#app-messages');
  const thread = app.querySelector('.ace-app-thread');
  const intro = app.querySelector('#app-intro');
  const lists = app.querySelectorAll('[data-session-list]');
  let active = sessions.find(session => session.id === stored.activeId) || null;
  if ([...model.options].some(option => option.value === stored.model)) model.value = stored.model;

  function persist() {
    app.querySelector('[data-current-model]').textContent = model.selectedOptions[0].textContent;
    save(storeKey, { sessions, activeId: active?.id, model: model.value });
  }

  function renderSessions() {
    lists.forEach(list => {
      list.replaceChildren();
      if (!sessions.length) {
        const empty = document.createElement('p');
        empty.className = 'ace-muted';
        empty.textContent = '发送首条消息后，对话会出现在这里。';
        list.append(empty);
      }
      sessions.forEach(session => {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.sessionId = session.id;
        if (session === active) button.setAttribute('aria-current', 'true');
        button.innerHTML = AceIcons.svg('message', 15) + '<span></span>';
        button.lastElementChild.textContent = session.title;
        list.append(button);
      });
    });
  }

  function renderThread() {
    const entries = active?.messages || [];
    intro.hidden = entries.length > 0;
    messages.hidden = entries.length === 0;
    messages.replaceChildren();
    entries.forEach(entry => {
      const item = document.createElement('article');
      item.className = entry.role === 'user' ? 'ace-message ace-message--user' : 'ace-message';
      item.innerHTML = '<span class="ace-avatar" aria-hidden="true"></span><div class="ace-message__body"><small></small><p></p></div>';
      const user = entry.role === 'user';
      item.querySelector('.ace-avatar').textContent = user ? '你' : 'A';
      item.querySelector('small').textContent = user ? '你' : (entry.model || 'ACE 助手') + ' · 演示回复';
      item.querySelector('p').textContent = entry.content;
      messages.append(item);
    });
    thread.scrollTop = thread.scrollHeight;
  }

  function openConversation(session) {
    active = session;
    input.value = '';
    renderSessions();
    navigate('chat');
    renderThread();
    persist();
    input.focus();
  }

  function demoReply(content) {
    if (/计划|拆解/.test(content)) {
      return '1. 先明确目标、交付物与截止时间。\n2. 把工作拆成能独立验收的任务，并安排负责人。\n3. 设置一次进度回顾，记录下一步。';
    }
    if (/周报|提纲/.test(content)) {
      return '本周进展：列出已完成事项，附上可核对的结果。\n风险与阻碍：说明受影响的工作和需要的支持。\n下周安排：写明每项工作的负责人和预计完成时间。';
    }
    if (/邮件/.test(content)) {
      return '主题：本周项目进度与下一步\n\n大家好，本周进度和需要确认的事项已整理如下。请各负责人补充自己负责的交付项，并标出预计完成时间。\n\n谢谢！';
    }
    return '可以先明确目标，再列出关键事实，最后写出可执行的下一步。';
  }

  app.addEventListener('click', event => {
    const session = event.target.closest('[data-session-id]');
    if (event.target.closest('[data-new-session]')) openConversation(null);
    if (session) openConversation(sessions.find(item => item.id === session.dataset.sessionId));
    const prompt = event.target.closest('[data-app-prompt]');
    if (prompt) {
      if (prompt.closest('[data-app-view="tools"]')) openConversation(null);
      input.value = prompt.dataset.appPrompt;
      input.focus();
    }
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    const content = input.value.trim();
    if (!content) return;
    if (!active) {
      active = { id: Date.now().toString(36), title: [...content].slice(0, 28).join(''), messages: [] };
      sessions.unshift(active);
    }
    active.messages.push({ role: 'user', content }, {
      role: 'assistant',
      content: demoReply(content),
      model: model.selectedOptions[0].textContent
    });
    input.value = '';
    renderSessions();
    renderThread();
    persist();
  });

  input.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.isComposing && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  model.addEventListener('change', persist);
  app.querySelector('[data-current-model]').textContent = model.selectedOptions[0].textContent;
  renderSessions();
  renderThread();
})();
