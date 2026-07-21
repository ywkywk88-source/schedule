(function(S) {
'use strict';
var Utils = S.Utils, Store = S.Store, TaskModal = {};
TaskModal._overlay = null; TaskModal._editingId = null;

TaskModal.open = function(date, slot) {
  TaskModal._editingId = null;
  TaskModal._render({ date: date, slot: slot, title: '', description: '', priority: 'medium', startTime: '', endTime: '', reminderEnabled: false, reminderMinutes: 15, completed: false });
};
TaskModal.openById = function(id) {
  var task = Store.getById(id); if (!task) { S.Toast.error('任务不存在'); return; }
  TaskModal._editingId = id;
  TaskModal._render({
    date: task.date, slot: task.slot, title: task.title, description: task.description || '',
    priority: task.priority, startTime: task.startTime || '', endTime: task.endTime || '',
    reminderEnabled: task.reminderEnabled, reminderMinutes: task.reminderMinutes || 15, completed: task.completed
  });
};
TaskModal.close = function() {
  if (TaskModal._overlay) { TaskModal._overlay.remove(); TaskModal._overlay = null; TaskModal._editingId = null; }
};

TaskModal._render = function(data) {
  TaskModal.close();
  var isEdit = TaskModal._editingId !== null;
  var overlay = Utils.el('div', { className: 'modal-overlay', onclick: function(e) { if (e.target === overlay) TaskModal.close(); } });
  var modal = Utils.el('div', { className: 'modal' });
  var hdr = Utils.el('div', { className: 'modal-header' }, Utils.el('h2', {}, isEdit ? '编辑任务' : '新建任务'));
  var closeBtn = Utils.el('button', { className: 'modal-close', type: 'button', onclick: TaskModal.close }, '×');
  hdr.appendChild(closeBtn); modal.appendChild(hdr);
  var body = Utils.el('div', { className: 'modal-body' });

  // Title
  var tg = Utils.el('div', { className: 'form-group' });
  tg.appendChild(Utils.el('label', { className: 'form-label' }, '任务标题 <span class="required">*</span>'));
  var titleInput = Utils.el('input', { className: 'form-input', type: 'text', maxlength: '100', placeholder: '输入任务名称', value: data.title });
  tg.appendChild(titleInput); body.appendChild(tg);

  // Description
  var dg = Utils.el('div', { className: 'form-group' });
  dg.appendChild(Utils.el('label', { className: 'form-label' }, '描述'));
  var descInput = Utils.el('textarea', { className: 'form-textarea', maxlength: '500', placeholder: '可选：任务详情、备注...', rows: '3' });
  descInput.textContent = data.description;
  dg.appendChild(descInput); body.appendChild(dg);

  // Row: date + slot
  var r1 = Utils.el('div', { className: 'form-row' });
  var dateG = Utils.el('div', { className: 'form-group' });
  dateG.appendChild(Utils.el('label', { className: 'form-label' }, '日期 <span class="required">*</span>'));
  var dateInput = Utils.el('input', { className: 'form-input', type: 'date', value: data.date });
  dateG.appendChild(dateInput); r1.appendChild(dateG);
  var slotG = Utils.el('div', { className: 'form-group' });
  slotG.appendChild(Utils.el('label', { className: 'form-label' }, '时段 <span class="required">*</span>'));
  var slotSelect = Utils.el('select', { className: 'form-input' });
  Utils.SLOTS.forEach(function(s) {
    var opt = Utils.el('option', { value: s }, Utils.SLOT_LABELS[s] + ' ' + Utils.SLOT_HOURS[s]);
    if (s === data.slot) opt.selected = true;
    slotSelect.appendChild(opt);
  });
  slotG.appendChild(slotSelect); r1.appendChild(slotG); body.appendChild(r1);

  // Priority
  var pg = Utils.el('div', { className: 'form-group' });
  pg.appendChild(Utils.el('label', { className: 'form-label' }, '优先级'));
  var rg = Utils.el('div', { className: 'radio-group' });
  [ {k:'high',l:'🔴 高优先级'}, {k:'medium',l:'🟡 中优先级'}, {k:'low',l:'🟢 低优先级'} ].forEach(function(p) {
    var lbl = Utils.el('label', { className: 'radio-label p-' + p.k + (p.k === data.priority ? ' active' : '') });
    lbl.appendChild(Utils.el('input', { type: 'radio', name: 'priority', value: p.k, checked: p.k === data.priority }));
    lbl.appendChild(document.createTextNode(p.l));
    lbl.addEventListener('click', function() { rg.querySelectorAll('.radio-label').forEach(function(r) { r.className = r.className.replace(/ active/g, ''); }); lbl.className += ' active'; });
    rg.appendChild(lbl);
  });
  pg.appendChild(rg); body.appendChild(pg);

  // Row: time range
  var r2 = Utils.el('div', { className: 'form-row' });
  var stG = Utils.el('div', { className: 'form-group' });
  stG.appendChild(Utils.el('label', { className: 'form-label' }, '开始时间'));
  var stInput = Utils.el('input', { className: 'form-input', type: 'time', value: data.startTime });
  stG.appendChild(stInput); r2.appendChild(stG);
  var etG = Utils.el('div', { className: 'form-group' });
  etG.appendChild(Utils.el('label', { className: 'form-label' }, '结束时间'));
  var etInput = Utils.el('input', { className: 'form-input', type: 'time', value: data.endTime });
  etG.appendChild(etInput); r2.appendChild(etG); body.appendChild(r2);

  // Reminder
  var remG = Utils.el('div', { className: 'form-group' });
  remG.appendChild(Utils.el('label', { className: 'form-label' }, '手机提醒 <span class="form-hint">导出到日历后生效</span>'));
  var remRow = Utils.el('div', { className: 'reminder-group' });
  var toggleWrap = Utils.el('div', { className: 'toggle-wrap' });
  var track = Utils.el('div', { className: 'toggle-track' + (data.reminderEnabled ? ' on' : '') });
  track.appendChild(Utils.el('div', { className: 'toggle-knob' }));
  toggleWrap.appendChild(track);
  toggleWrap.appendChild(Utils.el('span', { className: 'toggle-label' }, data.reminderEnabled ? '开启' : '关闭'));
  toggleWrap.addEventListener('click', function() {
    data.reminderEnabled = !data.reminderEnabled;
    track.className = 'toggle-track' + (data.reminderEnabled ? ' on' : '');
    toggleWrap.querySelector('.toggle-label').textContent = data.reminderEnabled ? '开启' : '关闭';
  });
  remRow.appendChild(toggleWrap);

  var remSelect = Utils.el('select', { className: 'form-select-sm', style: { display: data.reminderEnabled ? 'inline-block' : 'none' } });
  [ {v:5,l:'提前 5 分钟'}, {v:15,l:'提前 15 分钟'}, {v:30,l:'提前 30 分钟'}, {v:60,l:'提前 1 小时'} ].forEach(function(r) {
    var opt = Utils.el('option', { value: r.v }, r.l);
    if (r.v === data.reminderMinutes) opt.selected = true;
    remSelect.appendChild(opt);
  });
  remRow.appendChild(remSelect);
  toggleWrap.addEventListener('click', function() { remSelect.style.display = data.reminderEnabled ? 'inline-block' : 'none'; });
  remG.appendChild(remRow); body.appendChild(remG);

  // Complete checkbox (edit only)
  var cbInput;
  if (isEdit) {
    var cbg = Utils.el('div', { className: 'form-group' });
    var cbl = Utils.el('label', { className: 'checkbox-label', style: { gap: '8px', fontSize: '13px' } });
    cbInput = Utils.el('input', { type: 'checkbox', checked: data.completed });
    cbl.appendChild(cbInput);
    var completedText = data.completed ? '✅ 已完成' : '⏳ 进行中';
    cbl.appendChild(document.createTextNode(completedText));
    cbInput.addEventListener('change', function() {
      cbl.lastChild.textContent = cbInput.checked ? '✅ 已完成' : '⏳ 进行中';
    });
    cbg.appendChild(cbl); body.appendChild(cbg);
  }

  modal.appendChild(body);

  // Footer
  var footer = Utils.el('div', { className: 'modal-footer' });
  var left = Utils.el('div', { className: 'mf-left' });
  if (isEdit) {
    left.appendChild(Utils.el('button', { className: 'btn btn-delete btn-sm', onclick: function() { TaskModal._handleDelete(); } }, '🗑️ 删除'));
  }
  footer.appendChild(left);
  var right = Utils.el('div', { className: 'mf-right' });
  right.appendChild(Utils.el('button', { className: 'btn', onclick: TaskModal.close }, '取消'));
  right.appendChild(Utils.el('button', { className: 'btn btn-primary', onclick: function() { TaskModal._handleSave(); } }, isEdit ? '保存' : '创建'));
  footer.appendChild(right); modal.appendChild(footer); overlay.appendChild(modal);
  document.getElementById('modal-root').appendChild(overlay);
  TaskModal._overlay = overlay;
  TaskModal._titleInput = titleInput; TaskModal._descInput = descInput;
  TaskModal._dateInput = dateInput; TaskModal._slotSelect = slotSelect;
  TaskModal._stInput = stInput; TaskModal._etInput = etInput;
  TaskModal._reminderEnabled = data.reminderEnabled; TaskModal._reminderMinutes = data.reminderMinutes;
  TaskModal._remToggle = toggleWrap; TaskModal._remSelect = remSelect;
  TaskModal._cbInput = cbInput;
  var kh = function(e) { if (e.key === 'Escape') TaskModal.close(); if ((e.ctrlKey||e.metaKey) && e.key === 'Enter') TaskModal._handleSave(); };
  document.addEventListener('keydown', kh); TaskModal._keyHandler = kh;
  setTimeout(function() { titleInput.focus(); }, 100);
};

TaskModal._collectFormData = function() {
  var priority = 'medium';
  TaskModal._overlay.querySelectorAll('input[name="priority"]').forEach(function(r) { if (r.checked) priority = r.value; });
  return {
    title: TaskModal._titleInput.value.trim(), description: TaskModal._descInput.value.trim(),
    date: TaskModal._dateInput.value, slot: TaskModal._slotSelect.value, priority: priority,
    startTime: TaskModal._stInput.value || null, endTime: TaskModal._etInput.value || null,
    reminderEnabled: TaskModal._reminderEnabled,
    reminderMinutes: parseInt(TaskModal._remSelect.value) || 15,
    completed: TaskModal._cbInput ? TaskModal._cbInput.checked : false
  };
};
TaskModal._validate = function(data) {
  var valid = true;
  if (!data.title) { TaskModal._titleInput.className = 'form-input error'; TaskModal._titleInput.focus(); valid = false; }
  else TaskModal._titleInput.className = 'form-input';
  if (!data.date) { TaskModal._dateInput.className = 'form-input error'; valid = false; }
  else TaskModal._dateInput.className = 'form-input';
  return valid;
};
TaskModal._handleSave = function() {
  var data = TaskModal._collectFormData();
  if (!TaskModal._validate(data)) return;
  if (TaskModal._editingId) { Store.update(TaskModal._editingId, data); S.Toast.success('✅ 任务已更新'); }
  else { Store.add(data); S.Toast.success('✅ 任务已创建'); }
  TaskModal.close(); S.App && S.App.refresh();
};
TaskModal._handleDelete = function() {
  S.Confirm.show('删除任务', '确定删除这个任务吗？此操作不可恢复。', function(ok) {
    if (ok) { Store.delete(TaskModal._editingId); TaskModal.close(); S.App && S.App.refresh(); S.Toast.info('已删除'); }
  });
};
S.TaskModal = TaskModal;
})(window.Schedule);

(function(S) {
'use strict';
var Utils = S.Utils, Store = S.Store, TemplateManager = {};

TemplateManager.open = function() {
  TemplateManager.close();
  var overlay = Utils.el('div', { className: 'modal-overlay', onclick: function(e) { if (e.target === overlay) TemplateManager.close(); } });
  var modal = Utils.el('div', { className: 'modal' });
  var hdr = Utils.el('div', { className: 'modal-header' }, Utils.el('h2', {}, '📋 周模板'));
  var closeBtn = Utils.el('button', { className: 'modal-close', type: 'button', onclick: TemplateManager.close }, '×');
  hdr.appendChild(closeBtn); modal.appendChild(hdr);
  var body = Utils.el('div', { className: 'modal-body' });

  var templates = Store.getTemplates();

  if (templates.length === 0) {
    var empty = Utils.el('div', { style: { textAlign: 'center', padding: '30px 0', color: '#A0AAB4' } });
    empty.innerHTML = '<div style="font-size:36px;margin-bottom:10px;">📋</div><div style="font-size:14px;margin-bottom:4px;">还没有模板</div><div style="font-size:12px;">先排好一周计划，再点「保存本周为模板」</div>';
    body.appendChild(empty);
  } else {
    var list = Utils.el('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } });
    templates.forEach(function(tmpl) {
      var card = Utils.el('div', { style: { border: '1px solid #E5E8EB', borderRadius: '8px', padding: '12px 14px' } });
      var row1 = Utils.el('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } });
      var nameSpan = Utils.el('span', { style: { fontWeight: 600, fontSize: '14px', color: '#2C3E50' } }, tmpl.name);
      row1.appendChild(nameSpan);
      var countSpan = Utils.el('span', { style: { fontSize: '12px', color: '#A0AAB4' } }, tmpl.tasks.length + ' 项');
      row1.appendChild(countSpan);
      card.appendChild(row1);
      var row2 = Utils.el('div', { style: { display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' } });
      row2.appendChild(Utils.el('button', { className: 'btn btn-sm btn-primary', onclick: function() { TemplateManager._handleApply(tmpl.id); } }, '套用到本周'));
      row2.appendChild(Utils.el('button', { className: 'btn btn-sm', onclick: function() { TemplateManager._handleRename(tmpl.id); } }, '重命名'));
      row2.appendChild(Utils.el('button', { className: 'btn btn-sm btn-delete', onclick: function() { TemplateManager._handleDelete(tmpl.id); } }, '删除'));
      card.appendChild(row2);
      list.appendChild(card);
    });
    body.appendChild(list);
  }

  body.appendChild(Utils.el('div', { style: { marginTop: '16px' } },
    Utils.el('button', { className: 'btn btn-primary', style: { width: '100%', justifyContent: 'center' }, onclick: TemplateManager._handleSaveCurrent }, '💾 保存本周为模板')
  ));

  modal.appendChild(body);
  var footer = Utils.el('div', { className: 'modal-footer' });
  var right = Utils.el('div', { className: 'mf-right' });
  right.appendChild(Utils.el('button', { className: 'btn', onclick: TemplateManager.close }, '关闭'));
  footer.appendChild(right); modal.appendChild(footer); overlay.appendChild(modal);
  document.getElementById('modal-root').appendChild(overlay);
  TemplateManager._overlay = overlay;
};

TemplateManager.close = function() { if (TemplateManager._overlay) { TemplateManager._overlay.remove(); TemplateManager._overlay = null; } };

TemplateManager._handleSaveCurrent = function() {
  var weekDays = Utils.getWeekDays(Utils.parseDate(S.App.state.currentDate));
  var dateStrs = weekDays.map(function(d) { return Utils.formatDate(d); });
  var weekTasks = Store._tasks.filter(function(t) { return dateStrs.indexOf(t.date) !== -1 && !t.completed; });
  if (weekTasks.length === 0) { S.Toast.info('本周没有待办任务可以保存'); return; }
  var name = prompt('模板名称：', '周计划');
  if (!name || !name.trim()) return;
  Store.addTemplate(name.trim(), weekTasks);
  S.Toast.success('✅ 模板已保存 (' + weekTasks.length + ' 项)');
  TemplateManager.open();
};

TemplateManager._handleApply = function(id) {
  var weekDays = Utils.getWeekDays(Utils.parseDate(S.App.state.currentDate));
  var dateStrs = weekDays.map(function(d) { return Utils.formatDate(d); });
  var count = Store.applyTemplate(id, dateStrs);
  if (count > 0) {
    S.Toast.success('✅ 已套用 ' + count + ' 项任务');
    TemplateManager.close();
    S.App && S.App.refresh();
  } else {
    S.Toast.info('任务已存在，无新增项');
  }
};

TemplateManager._handleDelete = function(id) {
  S.Confirm.show('删除模板', '确定删除这个模板吗？', function(ok) {
    if (ok) { Store.deleteTemplate(id); S.Toast.info('已删除'); TemplateManager.open(); }
  });
};

TemplateManager._handleRename = function(id) {
  var tmpl = Store.getTemplates().find(function(t) { return t.id === id; });
  if (!tmpl) return;
  var name = prompt('新名称：', tmpl.name);
  if (!name || !name.trim()) return;
  Store.renameTemplate(id, name.trim());
  TemplateManager.open();
};

S.TemplateManager = TemplateManager;
})(window.Schedule);

(function(S) {
'use strict';
var DragDrop = {};
DragDrop.init = function(container) {
  DragDrop._container = container;
  container.addEventListener('dragstart', DragDrop._handleDragStart);
  container.addEventListener('dragover', DragDrop._handleDragOver);
  container.addEventListener('dragenter', DragDrop._handleDragEnter);
  container.addEventListener('dragleave', DragDrop._handleDragLeave);
  container.addEventListener('drop', DragDrop._handleDrop);
  container.addEventListener('dragend', DragDrop._handleDragEnd);
};
DragDrop.destroy = function() {
  if (!DragDrop._container) return;
  ['dragstart','dragover','dragenter','dragleave','drop','dragend'].forEach(function(ev) {
    DragDrop._container.removeEventListener(ev, DragDrop['_handle' + ev[0].toUpperCase() + ev.slice(1)]);
  });
};
DragDrop._handleDragStart = function(e) {
  var card = e.target.closest('.task-card'); if (!card) return;
  var taskId = card.dataset.taskId; if (!taskId) return;
  card.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', JSON.stringify({ taskId: taskId, sourceDate: card.dataset.date, sourceSlot: card.dataset.slot }));
};
DragDrop._handleDragOver = function(e) { var cell = e.target.closest('.slot-cell'); if (cell) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; } };
DragDrop._handleDragEnter = function(e) { var cell = e.target.closest('.slot-cell'); if (cell) cell.classList.add('drop-target'); };
DragDrop._handleDragLeave = function(e) { var cell = e.target.closest('.slot-cell'); if (cell && !cell.contains(e.relatedTarget)) cell.classList.remove('drop-target'); };
DragDrop._handleDrop = function(e) {
  e.preventDefault(); var cell = e.target.closest('.slot-cell'); if (!cell) return;
  cell.classList.remove('drop-target');
  var data; try { data = JSON.parse(e.dataTransfer.getData('text/plain')); } catch(ex) { return; }
  if (!data || !data.taskId) return;
  var td = cell.dataset.date, ts = cell.dataset.slot;
  if (!td || !ts) return;
  var card = DragDrop._container.querySelector('.task-card.dragging'); if (card) card.classList.remove('dragging');
  if (data.sourceDate === td && data.sourceSlot === ts) return;
  Store.update(data.taskId, { date: td, slot: ts }); S.Toast.info('📌 任务已移动'); S.App && S.App.refresh();
};
DragDrop._handleDragEnd = function() {
  if (DragDrop._container) {
    DragDrop._container.querySelectorAll('.task-card.dragging').forEach(function(el) { el.classList.remove('dragging'); });
    DragDrop._container.querySelectorAll('.drop-target').forEach(function(el) { el.classList.remove('drop-target'); });
  }
};
S.DragDrop = DragDrop;
})(window.Schedule);

(function(S) {
'use strict';
var Utils = S.Utils, Calendar = {};
Calendar.prev = function(state) {
  if (state.viewMode === 'month') { var d = Utils.parseDate(state.currentDate); return { currentDate: Utils.formatDate(new Date(d.getFullYear(), d.getMonth() - 1, 1)) }; }
  else { var d = Utils.parseDate(state.currentDate); d.setDate(d.getDate() - 7); return { currentDate: Utils.formatDate(d) }; }
};
Calendar.next = function(state) {
  if (state.viewMode === 'month') { var d = Utils.parseDate(state.currentDate); return { currentDate: Utils.formatDate(new Date(d.getFullYear(), d.getMonth() + 1, 1)) }; }
  else { var d = Utils.parseDate(state.currentDate); d.setDate(d.getDate() + 7); return { currentDate: Utils.formatDate(d) }; }
};
Calendar.today = function() { return { currentDate: Utils.todayStr }; };
Calendar.getLabel = function(state) {
  var d = Utils.parseDate(state.currentDate);
  return state.viewMode === 'month' ? d.getFullYear() + '年' + (d.getMonth()+1) + '月' : Utils.getWeekLabel(d);
};
S.Calendar = Calendar;
})(window.Schedule);

(function(S) {
'use strict';
var Utils = S.Utils, Store = S.Store, Filter = {};
Filter.apply = function(tasks, priority, status) {
  var r = tasks.slice();
  if (priority) r = r.filter(function(t) { return t.priority === priority; });
  if (status === 'active') r = r.filter(function(t) { return !t.completed; });
  else if (status === 'completed') r = r.filter(function(t) { return t.completed; });
  return r;
};
S.Filter = Filter;
})(window.Schedule);

(function(S) {
'use strict';
var Utils = S.Utils, Store = S.Store, DataManager = {};

DataManager.exportJSON = function() {
  var json = Store.exportJSON(); var blob = new Blob([json], { type: 'application/json' });
  var url = URL.createObjectURL(blob); var a = document.createElement('a');
  a.href = url; a.download = '工作计划_' + Utils.todayStr + '.json';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(function() { URL.revokeObjectURL(url); }, 100); S.Toast.success('📥 导出成功');
};

DataManager.importJSON = function() {
  var input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
  input.onchange = function(e) {
    var file = e.target.files[0]; if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
      var result = Store.importJSON(ev.target.result);
      if (result.ok) {
        S.Confirm.show('导入数据', '将替换当前所有 ' + Store._tasks.length + ' 条任务，确定吗？', function(ok) {
          if (ok) { S.App && S.App.refresh(); S.Toast.success('📤 导入成功'); }
          else { Store._tasks = Store.loadTasks(); S.App && S.App.refresh(); }
        });
      } else { S.Toast.error(result.msg); }
    };
    reader.readAsText(file);
  };
  input.click();
};

DataManager.clearData = function() {
  var refDate = S.App && S.App.state ? Utils.parseDate(S.App.state.currentDate) : new Date();
  var weekDates = Utils.getWeekDays(refDate).map(function(d) { return Utils.formatDate(d); });
  var toDelete = Store._tasks.filter(function(t) { return weekDates.indexOf(t.date) !== -1; });
  if (toDelete.length === 0) { S.Toast.info('本周暂无数据'); return; }
  S.Confirm.show('清空本周', '确定删除本周 ' + toDelete.length + ' 条任务？<br>其他周的任务不受影响。', function(ok) {
    if (ok) {
      var deleted = Store.clearWeek(weekDates);
      S.App && S.App.refresh();
      S.Toast.info('🗑️ 已删除本周 ' + deleted + ' 条任务');
    }
  });
};

DataManager.exportICS = function() {
  var refDate = S.App && S.App.state ? Utils.parseDate(S.App.state.currentDate) : new Date();
  var weekDates = {}; Utils.getWeekDays(refDate).forEach(function(d) { weekDates[Utils.formatDate(d)] = true; });
  var tasks = Store.getAll().filter(function(t) { return !t.completed && weekDates[t.date]; });
  if (tasks.length === 0) { S.Toast.info('没有待办任务可导出'); return; }
  var ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Schedule//CN\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\nX-WR-CALNAME:懒人工具百宝箱\r\n';
  tasks.forEach(function(t) {
    var d = Utils.parseDate(t.date);
    var startH = t.startTime ? t.startTime.split(':') : Utils.SLOT_DEFAULT[t.slot].split(':');
    var endH = t.endTime ? t.endTime.split(':') : [String(parseInt(startH[0]) + 1), startH[1]];
    var ds = Utils.toICSDate(d);
    var ss = ds + 'T' + startH[0] + startH[1] + '00';
    var es = ds + 'T' + endH[0] + endH[1] + '00';
    var desc = t.description ? t.description.replace(/\n/g, '\\n') : '';
    ics += 'BEGIN:VEVENT\r\nUID:' + t.id + '@schedule\r\nDTSTART:' + ss + '\r\nDTEND:' + es + '\r\nSUMMARY:' + t.title + '\r\nDESCRIPTION:' + (desc || Utils.SLOT_LABELS[t.slot]) + '\r\n';
    if (t.reminderEnabled) {
      ics += 'BEGIN:VALARM\r\nTRIGGER:-PT' + t.reminderMinutes + 'M\r\nACTION:AUDIO\r\nEND:VALARM\r\n';
    }
    ics += 'END:VEVENT\r\n';
  });
  ics += 'END:VCALENDAR\r\n';
  var blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  var url = URL.createObjectURL(blob); var a = document.createElement('a');
  a.href = url; a.download = '工作计划_' + Utils.todayStr + '.ics';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(function() { URL.revokeObjectURL(url); }, 100);
  var cnt = tasks.filter(function(t) { return t.reminderEnabled; }).length;
  S.Toast.success('🔔 导出 ' + tasks.length + ' 个任务' + (cnt > 0 ? ' (' + cnt + ' 个带提醒)' : ''));
};

S.DataManager = DataManager;
})(window.Schedule);
