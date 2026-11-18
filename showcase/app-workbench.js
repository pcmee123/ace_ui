(() => {
  const { app, navigate, load, save } = AceApp;
  const storeKey = 'ace-ui.app.workbench.v1';
  const seed = [
    { id: 104, title: '校验发布清单', group: '版本交付', owner: '林晨', status: 'doing', priority: '高', date: '11-18' },
    { id: 103, title: '整理本周客户反馈', group: '产品运营', owner: '许宁', status: 'todo', priority: '中', date: '11-18' },
    { id: 102, title: '更新工作台访问权限', group: '系统管理', owner: '周元', status: 'done', priority: '高', date: '11-17' },
    { id: 101, title: '归档月度报表', group: '产品运营', owner: '林晨', status: 'done', priority: '低', date: '11-16' }
  ];
  const statusInfo = {
    todo: { label: '待处理', tone: '' },
    doing: { label: '进行中', tone: 'ace-badge--warning' },
    done: { label: '已完成', tone: 'ace-badge--success' }
  };
  const stored = load(storeKey, {});
  const tasks = Array.isArray(stored.tasks) ? stored.tasks : seed;
  const activity = Array.isArray(stored.activity) ? stored.activity : [
    { text: '周元完成了「更新工作台访问权限」', time: '11-17 15:40' },
    { text: '许宁创建了「整理本周客户反馈」', time: '11-17 14:20' },
    { text: '林晨开始处理「校验发布清单」', time: '11-17 09:15' }
  ];
  const search = app.querySelector('#app-task-search');
  const filter = app.querySelector('#app-task-filter');
  const detail = app.querySelector('#app-task-detail');
  const createForm = app.querySelector('#app-create-task');
  const timeFormat = new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
  });
  let selectedTask;

  function badge(status) {
    const config = statusInfo[status];
    const node = document.createElement('span');
    node.className = 'ace-badge ' + config.tone;
    node.textContent = config.label;
    return node;
  }

  function taskButton(task, mobile = false) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.taskId = task.id;
    if (mobile) {
      button.className = 'ace-card ace-app-task-item';
      const text = document.createElement('span');
      const title = document.createElement('strong');
      const meta = document.createElement('small');
      title.textContent = task.title;
      meta.textContent = task.group + ' · ' + task.owner;
      text.append(title, meta);
      button.append(text, badge(task.status));
    } else {
      button.className = 'ace-btn ace-btn--ghost ace-btn--sm';
      button.textContent = '查看';
      button.setAttribute('aria-label', '查看 ' + task.title);
    }
    return button;
  }

  function renderTasks() {
    const query = search.value.trim().toLowerCase();
    const filtered = tasks.filter(task =>
      (!filter.value || task.status === filter.value) &&
      [task.title, task.owner, task.group].some(value => value.toLowerCase().includes(query))
    );
    const table = app.querySelector('[data-task-rows]');
    const cards = app.querySelector('[data-task-cards]');
    table.replaceChildren();
    cards.replaceChildren();
    filtered.forEach(task => {
      const row = table.insertRow();
      for (const value of [task.title, task.group, task.owner]) row.insertCell().textContent = value;
      row.insertCell().append(badge(task.status));
      row.insertCell().textContent = task.date;
      row.insertCell().append(taskButton(task));
      cards.append(taskButton(task, true));
    });
    app.querySelector('[data-empty-tasks]').hidden = filtered.length > 0;
    app.querySelector('[data-task-count]').textContent = filtered.length + ' 项任务';
  }

  function renderOverview() {
    const counts = { all: tasks.length, todo: 0, doing: 0, done: 0 };
    tasks.forEach(task => { counts[task.status]++; });
    app.querySelectorAll('[data-task-metric]').forEach(node => {
      node.textContent = counts[node.dataset.taskMetric];
    });
    const percent = tasks.length ? Math.round(counts.done / tasks.length * 100) : 0;
    app.querySelector('[data-work-progress]').value = percent;
    app.querySelector('[data-work-percent]').textContent = percent + '%';
    app.querySelectorAll('[data-activity-list]').forEach(list => {
      const limit = Number(list.dataset.activityList);
      list.replaceChildren();
      activity.slice(0, limit).forEach(entry => {
        const item = document.createElement('li');
        const time = document.createElement('small');
        item.textContent = entry.text;
        time.textContent = entry.time;
        item.append(time);
        list.append(item);
      });
    });
  }

  function record(text) {
    activity.unshift({ text, time: timeFormat.format(new Date()) });
    if (activity.length > 40) activity.length = 40;
    save(storeKey, { tasks, activity });
    renderTasks();
    renderOverview();
  }

  function openDetail(task) {
    selectedTask = task;
    detail.querySelector('#app-detail-title').textContent = task.title;
    detail.querySelector('[data-detail-id]').textContent = '#' + task.id;
    detail.querySelector('[data-detail-group]').textContent = task.group;
    detail.querySelector('[data-detail-owner]').textContent = task.owner;
    detail.querySelector('[data-detail-priority]').textContent = task.priority;
    detail.querySelector('#app-detail-status').value = task.status;
    detail.showModal();
  }

  search.addEventListener('input', renderTasks);
  filter.addEventListener('change', renderTasks);
  app.addEventListener('click', event => {
    const task = event.target.closest('[data-task-id]');
    if (task) openDetail(tasks.find(item => item.id === Number(task.dataset.taskId)));
    if (event.target.closest('[data-reset-task-filter]')) {
      search.value = '';
      filter.value = '';
      renderTasks();
      search.focus();
    }
  });

  createForm.addEventListener('submit', event => {
    event.preventDefault();
    const { title, owner, group, priority } = createForm.elements;
    if (!title.value.trim() || !owner.value.trim()) return;
    const date = new Date();
    const task = {
      id: Math.max(100, ...tasks.map(item => item.id)) + 1,
      title: title.value.trim(),
      owner: owner.value.trim(),
      group: group.value,
      priority: priority.value,
      status: 'todo',
      date: [date.getMonth() + 1, date.getDate()].map(value => String(value).padStart(2, '0')).join('-')
    };
    tasks.unshift(task);
    search.value = '';
    filter.value = '';
    record('创建了「' + task.title + '」');
    createForm.closest('dialog').close();
    createForm.reset();
    navigate('tasks');
    search.focus();
    AceUI.toast('任务已创建');
  });

  detail.querySelector('form').addEventListener('submit', event => {
    event.preventDefault();
    const status = event.currentTarget.elements.status.value;
    if (selectedTask.status !== status) {
      selectedTask.status = status;
      record('将「' + selectedTask.title + '」更新为' + statusInfo[status].label);
      AceUI.toast('任务状态已更新');
    }
    detail.close();
    if (!app.querySelector('[data-app-view="tasks"]').hidden) search.focus();
  });

  renderTasks();
  renderOverview();
})();
