(function(S) {
'use strict';
var Utils = S.Utils, Store = {};

Store.TASKS_KEY = 'schedule_tasks';
Store.VIEW_KEY = 'schedule_view_mode';
Store.DATE_KEY = 'schedule_date';

Store.loadTasks = function() {
  try { var data = localStorage.getItem(Store.TASKS_KEY); return data ? JSON.parse(data) : []; } catch(e) { return []; }
};
Store.saveTasks = function(tasks) {
  try { localStorage.setItem(Store.TASKS_KEY, JSON.stringify(tasks)); } catch(e) { S.Toast && S.Toast.show('存储空间不足', 'error'); }
};
Store.getAll = function() { return Store._tasks; };
Store.getById = function(id) { return Store._tasks.find(function(t) { return t.id === id; }); };
Store.add = function(data) {
  var now = new Date().toISOString();
  var task = {
    id: Utils.generateId(), title: data.title, description: data.description || '',
    date: data.date, slot: data.slot, priority: data.priority || 'medium',
    completed: false, startTime: data.startTime || null, endTime: data.endTime || null,
    reminderEnabled: !!data.reminderEnabled, reminderMinutes: data.reminderMinutes || 15,
    createdAt: now, updatedAt: now
  };
  Store._tasks.push(task); Store.saveTasks(Store._tasks); return task;
};
Store.update = function(id, changes) {
  changes.updatedAt = new Date().toISOString();
  var idx = Store._tasks.findIndex(function(t) { return t.id === id; });
  if (idx === -1) return null;
  Store._tasks[idx] = Object.assign({}, Store._tasks[idx], changes);
  Store.saveTasks(Store._tasks); return Store._tasks[idx];
};
Store.delete = function(id) {
  Store._tasks = Store._tasks.filter(function(t) { return t.id !== id; });
  Store.saveTasks(Store._tasks);
};
Store.toggleComplete = function(id) {
  var t = Store.getById(id); if (!t) return null;
  t.completed = !t.completed; t.updatedAt = new Date().toISOString();
  Store.saveTasks(Store._tasks); return t;
};
Store.queryByDate = function(date) { return Store._tasks.filter(function(t) { return t.date === date; }); };
Store.queryBySlot = function(date, slot) { return Store._tasks.filter(function(t) { return t.date === date && t.slot === slot; }); };
Store.computeStats = function(tasks) {
  tasks = tasks || Store._tasks;
  var total = tasks.length, completed = 0, high = 0, medium = 0, low = 0;
  tasks.forEach(function(t) {
    if (t.completed) completed++;
    if (t.priority === 'high') high++; else if (t.priority === 'medium') medium++; else low++;
  });
  return { total: total, completed: completed, active: total - completed, high: high, medium: medium, low: low };
};
Store.exportJSON = function() { return JSON.stringify(Store._tasks, null, 2); };
Store.importJSON = function(jsonStr) {
  var data;
  try { data = JSON.parse(jsonStr); } catch(e) { return { ok: false, msg: 'JSON 格式错误' }; }
  if (!Array.isArray(data)) return { ok: false, msg: '数据格式错误' };
  var vs = ['morning','afternoon','evening'], vp = ['high','medium','low'];
  var dr = /^\d{4}-\d{2}-\d{2}$/, tr = /^\d{2}:\d{2}$/;
  for (var i = 0; i < data.length; i++) {
    var it = data[i];
    if (!it || typeof it.id !== 'string' || typeof it.title !== 'string' || !it.title ||
        !dr.test(it.date) || vs.indexOf(it.slot) === -1 || vp.indexOf(it.priority) === -1 ||
        typeof it.completed !== 'boolean')
      return { ok: false, msg: '第 ' + (i+1) + ' 条数据格式错误' };
  }
  Store._tasks = data; Store.saveTasks(Store._tasks); return { ok: true };
};
Store.clearAll = function() { Store._tasks = []; Store.saveTasks(Store._tasks); };
Store.clearWeek = function(dates) {
  var before = Store._tasks.length;
  var dateSet = {}; dates.forEach(function(d) { dateSet[d] = true; });
  Store._tasks = Store._tasks.filter(function(t) { return !dateSet[t.date]; });
  Store.saveTasks(Store._tasks);
  return before - Store._tasks.length;
};

// Templates
Store.TEMPLATES_KEY = 'schedule_templates';
Store.loadTemplates = function() {
  try { var d = localStorage.getItem(Store.TEMPLATES_KEY); return d ? JSON.parse(d) : []; } catch(e) { return []; }
};
Store.saveTemplates = function(t) { try { localStorage.setItem(Store.TEMPLATES_KEY, JSON.stringify(t)); } catch(e) {} };
Store.getTemplates = function() { return Store._templates; };
Store.addTemplate = function(name, weekTasks) {
  var wkMap = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  var tmpl = {
    id: Utils.generateId(), name: name,
    tasks: weekTasks.map(function(t) {
      var d = Utils.parseDate(t.date);
      return {
        weekday: (d.getDay() + 6) % 7,
        slot: t.slot, title: t.title, description: t.description || '',
        priority: t.priority, startTime: t.startTime || null, endTime: t.endTime || null,
        reminderEnabled: t.reminderEnabled, reminderMinutes: t.reminderMinutes || 15
      };
    }),
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  };
  Store._templates.push(tmpl); Store.saveTemplates(Store._templates); return tmpl;
};
Store.deleteTemplate = function(id) {
  Store._templates = Store._templates.filter(function(t) { return t.id !== id; });
  Store.saveTemplates(Store._templates);
};
Store.renameTemplate = function(id, newName) {
  var t = Store._templates.find(function(t) { return t.id === id; });
  if (t) { t.name = newName; t.updatedAt = new Date().toISOString(); Store.saveTemplates(Store._templates); }
};
Store.applyTemplate = function(id, weekDates) {
  var tmpl = Store._templates.find(function(t) { return t.id === id; });
  if (!tmpl) return 0;
  var count = 0;
  tmpl.tasks.forEach(function(tt) {
    var dateStr = weekDates[tt.weekday]; if (!dateStr) return;
    var exists = Store._tasks.some(function(t) { return t.date === dateStr && t.slot === tt.slot && t.title === tt.title; });
    if (!exists) {
      Store.add({ title: tt.title, description: tt.description, date: dateStr, slot: tt.slot,
        priority: tt.priority, startTime: tt.startTime, endTime: tt.endTime,
        reminderEnabled: tt.reminderEnabled, reminderMinutes: tt.reminderMinutes });
      count++;
    }
  });
  return count;
};
Store._templates = Store.loadTemplates();
Store._tasks = Store.loadTasks();

// Accounting data methods
Store.ACCT_KEY = 'schedule_accounts';
Store.MILESTONE_KEY = 'schedule_milestone';
Store.loadAccounts = function() {
  try { var d = localStorage.getItem(Store.ACCT_KEY); return d ? JSON.parse(d) : []; } catch(e) { return []; }
};
Store.saveAccounts = function(a) { try { localStorage.setItem(Store.ACCT_KEY, JSON.stringify(a)); } catch(e) {} };
Store.getAllAccounts = function() { return Store._accounts; };
Store.addAccountEntry = function(type, amount, note, date) {
  var entry = { id: Utils.generateId(), type: type, amount: Math.abs(amount), note: note || '', date: date, createdAt: new Date().toISOString() };
  Store._accounts.push(entry); Store.saveAccounts(Store._accounts); return entry;
};
Store.deleteAccountEntry = function(id) {
  Store._accounts = Store._accounts.filter(function(e) { return e.id !== id; });
  Store.saveAccounts(Store._accounts);
};
Store.getDayEntries = function(date) { return Store._accounts.filter(function(e) { return e.date === date; }); };
Store.getDayNet = function(date) {
  var es = Store.getDayEntries(date);
  return es.reduce(function(s, e) { return s + (e.type === 'income' ? e.amount : -e.amount); }, 0);
};
Store.getMonthAccounts = function(y, m) {
  var prefix = y + '-' + String(m).padStart(2, '0');
  return Store._accounts.filter(function(e) { return e.date.slice(0, 7) === prefix; });
};
Store.getMonthStats = function(y, m) {
  var es = Store.getMonthAccounts(y, m);
  var income = es.filter(function(e) { return e.type === 'income'; }).reduce(function(s, e) { return s + e.amount; }, 0);
  var expense = es.filter(function(e) { return e.type === 'expense'; }).reduce(function(s, e) { return s + e.amount; }, 0);
  return { income: income, expense: expense, net: income - expense };
};
Store.getBalance = function() {
  return Store._accounts.reduce(function(s, e) { return s + (e.type === 'income' ? e.amount : -e.amount); }, 0);
};
Store.getMilestone = function() { return Store._milestone; };
Store.setMilestone = function(v) {
  Store._milestone = v; try { localStorage.setItem(Store.MILESTONE_KEY, String(v)); } catch(e) {}
};
Store._accounts = Store.loadAccounts();
Store._milestone = (function() { try { var v = localStorage.getItem(Store.MILESTONE_KEY); return v ? parseInt(v, 10) : 0; } catch(e) { return 0; } })();
S.Store = Store;
})(window.Schedule);
