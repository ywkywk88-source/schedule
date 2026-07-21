(function(S) {
'use strict';
var Utils = S.Utils, Store = S.Store, Calendar = S.Calendar, Filter = S.Filter;
var DragDrop = S.DragDrop, TaskModal = S.TaskModal, DataManager = S.DataManager;
var App = {};

/* ===== 状态 ===== */
App.state = {
  tasks: [], viewMode: 'week', currentDate: Utils.todayStr,
  filterPriority: null, filterStatus: null,
  page: 'home'
};

/* ===== 初始化 ===== */
App.init = function() {
  try {
    var vm = localStorage.getItem(Store.VIEW_KEY); if (vm === 'week' || vm === 'month') App.state.viewMode = vm;
    var dt = localStorage.getItem(Store.DATE_KEY); if (dt) App.state.currentDate = dt;
    var p = localStorage.getItem('schedule_page');
    if (p === 'schedule' || p === 'accounting') { App.state.page = p; App.state.viewMode = 'week'; }
  } catch(e) {}
  App.state.tasks = Store.getAll();
  App._bindEvents();
  App.refresh();
  App._setupPWA();
};

App.setState = function(partial) {
  for (var k in partial) App.state[k] = partial[k];
  try { localStorage.setItem(Store.VIEW_KEY, App.state.viewMode); localStorage.setItem(Store.DATE_KEY, App.state.currentDate); } catch(e) {}
  App.refresh();
};

/* ===== 路由 ===== */
App.refresh = function() {
  App.state.tasks = Store.getAll();
  var content = document.getElementById('app-content');
  var header = document.querySelector('#app-header h1');
  var nav = document.getElementById('app-nav');
  var filter = document.getElementById('app-filter');

  Utils.clear(content);

  // 首页
  if (App.state.page === 'home') {
    header.textContent = '';
    nav.style.display = 'none';
    filter.style.display = 'none';
    document.getElementById('app-header').classList.add('home-center');
    document.querySelector('.header-right').style.display = 'none';
    document.querySelector('.header-left .logo').style.display = 'none';
    App._removeHomeBtn();
    App.renderHome(content);
    // 打字动画
    var title = '祁琼的懒人工具百宝箱 🧰', ti = 0;
    (function typeNext() {
      if (ti < title.length) { header.textContent += title[ti]; ti++; setTimeout(typeNext, 70 + Math.random() * 40); }
    })();
    try { localStorage.setItem('schedule_page', 'home'); } catch(e) {}
    return;
  }

  // 非首页：还原 header
  document.getElementById('app-header').classList.remove('home-center', 'acc-center');
  document.querySelector('.header-right').style.display = '';
  var logo = document.querySelector('.header-left .logo');
  if (logo) logo.style.display = 'none';
  App._ensureHomeBtn();

  // 记账页
  if (App.state.page === 'accounting') {
    header.textContent = '';
    nav.style.display = 'none';
    filter.style.display = 'none';
    document.getElementById('app-header').classList.add('acc-center');
    S.Accounting.render(content);
    // 打字动画
    var accTitle = '灿灿的小金库', ai = 0;
    (function accType() {
      if (ai < accTitle.length) { header.textContent += accTitle[ai]; ai++; setTimeout(accType, 60 + Math.random() * 30); }
    })();
    try { localStorage.setItem('schedule_page', 'accounting'); } catch(e) {}
    return;
  }

  // 计划页
  header.textContent = '📋 工作表';
  nav.style.display = '';
  filter.style.display = '';
  document.getElementById('nav-title').textContent = Calendar.getLabel(App.state);
  document.querySelectorAll('.view-tab').forEach(function(tab) {
    var mode = tab.dataset.action === 'view-week' ? 'week' : 'month';
    tab.classList.toggle('active', mode === App.state.viewMode);
  });
  if (App.state.viewMode === 'week') App._renderWeekView(content);
  else App._renderMonthView(content);
  App._renderFilterBar();
  try { localStorage.setItem('schedule_page', 'schedule'); } catch(e) {}
};

/* ===== 首页渲染 ===== */
App.renderHome = function(container) {
  var hp = Utils.el('div', { className: 'home-page' });
  var sc = Utils.el('div', { className: 'home-card card-schedule', dataset: { action: 'go-schedule' } });
  sc.appendChild(Utils.el('div', { className: 'hc-icon' }, '📋'));
  sc.appendChild(Utils.el('div', { className: 'hc-title' }, '祁老师暑假工作表'));
  var scD = Utils.el('div', { className: 'hc-desc' }); scD.innerHTML = '不怕同桌是学霸<br>就怕学霸过暑假 📚'; sc.appendChild(scD);
  hp.appendChild(sc);

  var ac = Utils.el('div', { className: 'home-card card-accounting', dataset: { action: 'go-accounting' } });
  ac.appendChild(Utils.el('div', { className: 'hc-icon' }, '💰'));
  ac.appendChild(Utils.el('div', { className: 'hc-title' }, '灿灿的小金库'));
  var acD = Utils.el('div', { className: 'hc-desc' }); acD.innerHTML = '存进去的是碎银<br>攒下来的是底气 ✨'; ac.appendChild(acD);
  hp.appendChild(ac);
  container.appendChild(hp);
};

/* ===== 返回按钮 ===== */
App._ensureHomeBtn = function() {
  var hdr = document.querySelector('#app-header .header-left');
  var existing = hdr.querySelector('.back-btn');
  if (existing) return;
  var back = Utils.el('button', { className: 'back-btn', style: { background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer', padding: '0 4px 0 0', lineHeight: '1' }, dataset: { action: 'go-home' } }, '◀');
  hdr.insertBefore(back, hdr.firstChild);
};
App._removeHomeBtn = function() {
  var btn = document.querySelector('#app-header .header-left .back-btn');
  if (btn) btn.remove();
};

/* ===== 周视图 ===== */
App._renderWeekView = function(container) {
  var weekDays = Utils.getWeekDays(Utils.parseDate(App.state.currentDate));
  var dateStrs = weekDays.map(function(dd) { return Utils.formatDate(dd); });
  var tasks = Filter.apply(App.state.tasks, App.state.filterPriority, App.state.filterStatus);
  var taskMap = {};
  tasks.forEach(function(t) {
    var key = t.date + ':' + t.slot; if (!taskMap[key]) taskMap[key] = [];
    taskMap[key].push(t);
  });

  var wk = Utils.el('div', { className: 'week-view' });
  var header = Utils.el('div', { className: 'week-header' });
  header.appendChild(Utils.el('div', { className: 'wh-cell' }));
  var wdn = ['一','二','三','四','五','六','日'];
  weekDays.forEach(function(dd, i) {
    var ds = Utils.formatDate(dd);
    var hc = Utils.el('div', { className: 'wh-cell' + (Utils.isToday(ds) ? ' today' : '') });
    hc.appendChild(document.createTextNode(wdn[i]));
    hc.appendChild(Utils.el('span', { className: 'wh-date' }, dd.getMonth()+1 + '/' + dd.getDate()));
    header.appendChild(hc);
  });
  wk.appendChild(header);

  var body = Utils.el('div', { className: 'week-body' });
  Utils.SLOTS.forEach(function(slot) {
    var row = Utils.el('div', { className: 'week-row' });
    var lbl = Utils.el('div', { className: 'slot-label' });
    lbl.appendChild(document.createTextNode(Utils.SLOT_LABELS[slot]));
    lbl.appendChild(Utils.el('span', { className: 'slot-sub' }, Utils.SLOT_HOURS[slot]));
    row.appendChild(lbl);

    weekDays.forEach(function(dd) {
      var ds = Utils.formatDate(dd);
      var cell = Utils.el('div', { className: 'slot-cell' + (Utils.isToday(ds) ? ' today-col' : ''), dataset: { date: ds, slot: slot } });
      var key = ds + ':' + slot;
      (taskMap[key] || []).forEach(function(task) { cell.appendChild(App._createTaskCard(task)); });
      if (!taskMap[key] && App.state.tasks.length > 0) {
        cell.appendChild(Utils.el('div', { style: { color: '#D0D8E0', fontSize: '10px', paddingTop: '4px' } }, '—'));
      }
      cell.appendChild(Utils.el('button', { className: 'add-btn', dataset: { action: 'create-task', date: ds, slot: slot }, title: '新建' }, '+'));
      row.appendChild(cell);
    });
    body.appendChild(row);
  });
  wk.appendChild(body);
  container.appendChild(wk);

  DragDrop.destroy(); DragDrop.init(wk);
  wk.querySelectorAll('.task-card').forEach(function(card) { card.draggable = true; });
};

/* ===== 月视图 ===== */
App._renderMonthView = function(container) {
  var d = Utils.parseDate(App.state.currentDate);
  var y = d.getFullYear(), m = d.getMonth() + 1;
  var grid = Utils.getMonthGrid(y, m);
  var tasks = Filter.apply(App.state.tasks, App.state.filterPriority, App.state.filterStatus);
  var cm = {}, pm = {};
  tasks.forEach(function(t) {
    if (!cm[t.date]) { cm[t.date] = 0; pm[t.date] = []; }
    cm[t.date]++; pm[t.date].push(t.priority + (t.completed ? '-done' : ''));
  });
  for (var dt in pm) { if (pm[dt].length > 5) pm[dt] = pm[dt].slice(0,5); }

  var mv = Utils.el('div', { className: 'month-view' });
  var mh = Utils.el('div', { className: 'month-header' });
  ['周一','周二','周三','周四','周五','周六','周日'].forEach(function(day) { mh.appendChild(Utils.el('div', { className: 'mh-cell' }, day)); });
  mv.appendChild(mh);
  var mg = Utils.el('div', { className: 'month-grid' });
  grid.forEach(function(cell) {
    var ds = Utils.formatDate(cell.date);
    var cls = 'month-cell' + (!cell.isCurrentMonth ? ' other-month' : '') + (Utils.isToday(ds) ? ' today' : '');
    var div = Utils.el('div', { className: cls, dataset: { date: ds } });
    div.appendChild(Utils.el('span', { className: 'mc-day' }, String(cell.dayNum)));
    if (cm[ds]) {
      var dots = Utils.el('div', { className: 'mc-dots' });
      (pm[ds] || []).forEach(function(p) {
        var dot = Utils.el('span', { className: 'mc-dot ' + p.replace('-done','') });
        if (p.indexOf('done') !== -1) dot.className += ' done';
        dots.appendChild(dot);
      });
      if (cell.isCurrentMonth) div.appendChild(Utils.el('span', { className: 'mc-count' }, cm[ds] + '项'));
      div.appendChild(dots);
    }
    if (cell.isCurrentMonth) {
      div.addEventListener('dblclick', function() { TaskModal.open(ds, 'morning'); });
    }
    mg.appendChild(div);
  });
  mv.appendChild(mg); container.appendChild(mv);
};

/* ===== 任务卡片 ===== */
App._createTaskCard = function(task) {
  var cls = 'task-card p-' + task.priority;
  if (task.completed) cls += ' completed';
  if (task.reminderEnabled) cls += ' has-alarm';
  var card = Utils.el('div', { className: cls, dataset: { taskId: task.id, date: task.date, slot: task.slot, action: 'edit-task' }, draggable: 'true' });
  var hdr = Utils.el('div', { className: 'task-header' });
  var cb = Utils.el('input', { type: 'checkbox', className: 'task-cb', checked: task.completed, dataset: { action: 'toggle-task', taskId: task.id }, onclick: function(e) { e.stopPropagation(); } });
  hdr.appendChild(cb);
  hdr.appendChild(Utils.el('div', { className: 'task-title' }, task.title));
  card.appendChild(hdr);
  var ft = Utils.el('div', { className: 'task-footer' });
  ft.appendChild(Utils.el('span', { className: 'task-priority ' + task.priority }, S.Utils.PRIORITY[task.priority].label));
  if (task.startTime) {
    var ts = task.startTime; if (task.endTime) ts += ' - ' + task.endTime;
    ft.appendChild(Utils.el('span', { className: 'task-time' }, ts));
  }
  if (task.reminderEnabled) ft.appendChild(Utils.el('span', { className: 'task-alarm-icon' }, '🔔'));
  card.appendChild(ft);
  return card;
};

/* ===== 筛选栏 ===== */
App._renderFilterBar = function() {
  var el = document.getElementById('app-filter'); Utils.clear(el);
  var left = Utils.el('div', { className: 'filter-group' });
  left.appendChild(Utils.el('span', { className: 'filter-label' }, '优先级：'));
  [{k:null,l:'全部'},{k:'high',l:'高'},{k:'medium',l:'中'},{k:'low',l:'低'}].forEach(function(f) {
    left.appendChild(Utils.el('button', { className: 'filter-btn' + (App.state.filterPriority === f.k ? ' active' : '') + (f.k ? ' p-' + f.k : ''), dataset: { action: 'filter-priority', filter: f.k || 'all' } }, f.l));
  });
  left.appendChild(Utils.el('span', { className: 'filter-label', style: { marginLeft: '8px' } }, '状态：'));
  [{k:null,l:'全部'},{k:'active',l:'进行'},{k:'completed',l:'完成'}].forEach(function(f) {
    left.appendChild(Utils.el('button', { className: 'filter-btn' + (App.state.filterStatus === f.k ? ' active' : ''), dataset: { action: 'filter-status', filter: f.k || 'all' } }, f.l));
  });
  el.appendChild(left);
  var stats = Store.computeStats();
  var right = Utils.el('div', { className: 'stats' });
  right.appendChild(Utils.el('span', { className: 'stat-item' }, '📋' + stats.total));
  if (stats.active > 0) right.appendChild(Utils.el('span', { className: 'stat-item' }, '⏳' + stats.active));
  if (stats.completed > 0) right.appendChild(Utils.el('span', { className: 'stat-item' }, '✅' + stats.completed));
  el.appendChild(right);
};

/* ===== 事件绑定 ===== */
App._bindEvents = function() {
  document.getElementById('app').addEventListener('click', function(e) {
    var target = e.target.closest('[data-action]'); if (!target) return;
    switch (target.dataset.action) {
      case 'go-home': App.state.page = 'home'; App.refresh(); break;
      case 'go-schedule': App.state.page = 'schedule'; App.refresh(); break;
      case 'go-accounting': S.Accounting.open(); break;
      case 'acc-prev': {
        var ad = Utils.parseDate(S.Accounting.currentDate);
        S.Accounting.currentDate = Utils.formatDate(new Date(ad.getFullYear(), ad.getMonth() - 1, 1));
        App.refresh(); break;
      }
      case 'acc-next': {
        var ad = Utils.parseDate(S.Accounting.currentDate);
        S.Accounting.currentDate = Utils.formatDate(new Date(ad.getFullYear(), ad.getMonth() + 1, 1));
        App.refresh(); break;
      }
      case 'prev': App.setState(Calendar.prev(App.state)); break;
      case 'next': App.setState(Calendar.next(App.state)); break;
      case 'today': App.setState(Calendar.today()); break;
      case 'view-week': App.setState({ viewMode: 'week' }); break;
      case 'view-month': App.setState({ viewMode: 'month' }); break;
      case 'create-task': TaskModal.open(target.dataset.date, target.dataset.slot); break;
      case 'edit-task': TaskModal.openById(target.dataset.taskId); break;
      case 'toggle-task': Store.toggleComplete(target.dataset.taskId); App.refresh(); break;
      case 'filter-priority': App.setState({ filterPriority: target.dataset.filter === 'all' ? null : target.dataset.filter }); break;
      case 'filter-status': App.setState({ filterStatus: target.dataset.filter === 'all' ? null : target.dataset.filter }); break;
      case 'template': S.TemplateManager.open(); break;
      case 'ical': DataManager.exportICS(); break;
      case 'clear': DataManager.clearData(); break;
      case 'import': DataManager.importJSON(); break;
    }
  });
};

/* ===== PWA ===== */
App._setupPWA = function() {
  var banner = document.getElementById('install-banner');
  var closeBtn = document.getElementById('install-close');
  var installBtn = document.getElementById('install-btn');
  var deferredPrompt = null;

  if (localStorage.getItem('pwa_dismissed')) { banner.style.display = 'none'; return; }

  window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault(); deferredPrompt = e;
    banner.style.display = 'flex';
  });

  installBtn.addEventListener('click', function() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function(result) {
        if (result.outcome === 'accepted') { banner.style.display = 'none'; }
        deferredPrompt = null;
      });
    } else {
      S.Toast.info('请在浏览器菜单中选择「添加到主屏幕」');
    }
  });

  closeBtn.addEventListener('click', function() {
    banner.style.display = 'none';
    localStorage.setItem('pwa_dismissed', '1');
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(function() {});
  }
};

S.App = App;
})(window.Schedule);
