(function(S) {
'use strict';
var Utils = S.Utils, Store = S.Store, Toast = S.Toast, Confirm = S.Confirm;
var Accounting = {};

/* ===== 状态 ===== */
Accounting.currentDate = Utils.todayStr;

/* ===== 路由 ===== */
Accounting.open = function() {
  S.App.state.page = 'accounting';
  S.App.refresh();
};

/* ===== 主渲染 ===== */
Accounting.render = function(container) {
  var d = Utils.parseDate(Accounting.currentDate);
  var y = d.getFullYear(), m = d.getMonth() + 1;
  var page = Utils.el('div', { className: 'acc-page' });

  Accounting._renderMonthNav(page, y, m);
  Accounting.renderStats(page, y, m);
  Accounting._renderEmptyHint(page);
  Accounting.renderMonthView(page, y, m);

  container.appendChild(page);
};

/* ===== 月份导航 ===== */
Accounting._renderMonthNav = function(parent, y, m) {
  var navRow = Utils.el('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 4px' } });
  navRow.appendChild(Utils.el('button', { className: 'btn btn-icon btn-ghost', dataset: { action: 'acc-prev' }, style: { fontSize: '16px' } }, '◀'));
  navRow.appendChild(Utils.el('span', { style: { fontWeight: 600, fontSize: '16px', color: '#2C3E50' } }, y + '年' + m + '月'));
  navRow.appendChild(Utils.el('button', { className: 'btn btn-icon btn-ghost', dataset: { action: 'acc-next' }, style: { fontSize: '16px' } }, '▶'));
  parent.appendChild(navRow);
};

/* ===== 统计栏 ===== */
Accounting.renderStats = function(parent, y, m) {
  var stats = Store.getMonthStats(y, m);
  var tb = Store.getBalance();
  var grid = Utils.el('div', { className: 'acc-stats' });
  [
    { label: '本月收入', value: '+' + stats.income, cls: 'positive' },
    { label: '本月支出', value: '-' + stats.expense, cls: 'negative' },
    { label: '本月结余', value: (stats.net >= 0 ? '+' : '') + stats.net, cls: stats.net >= 0 ? 'positive' : 'negative' },
    { label: '累计余额', value: (tb >= 0 ? '+' : '') + tb, cls: tb >= 0 ? 'positive' : 'negative' }
  ].forEach(function(item) {
    var div = Utils.el('div', { className: 'acc-stat-item' });
    div.appendChild(Utils.el('div', { className: 'stat-label' }, item.label));
    div.appendChild(Utils.el('div', { className: 'stat-value ' + item.cls }, item.value));
    grid.appendChild(div);
  });
  parent.appendChild(grid);
};

/* ===== 空白提示 ===== */
Accounting._renderEmptyHint = function(parent) {
  if (Store._accounts.length > 0) return;
  var hint = Utils.el('div', { style: { textAlign: 'center', padding: '30px 20px 10px', color: '#A0AAB4', fontSize: '13px' } });
  hint.innerHTML = '💸 还没有记账记录<br>点击日历中的日期开始记账吧 ✏️';
  parent.appendChild(hint);
};

/* ===== 日历视图 ===== */
Accounting.renderMonthView = function(parent, y, m) {
  var grid = Utils.getMonthGrid(y, m);
  var cal = Utils.el('div', { className: 'acc-calendar' });
  var hdr = Utils.el('div', { className: 'acc-c-header' });
  ['一','二','三','四','五','六','日'].forEach(function(d) { hdr.appendChild(Utils.el('div', { className: 'acc-ch-cell' }, d)); });
  cal.appendChild(hdr);

  var cg = Utils.el('div', { className: 'acc-c-grid' });
  grid.forEach(function(cell) {
    var ds = Utils.formatDate(cell.date);
    var net = Store.getDayNet(ds);
    var entries = Store.getDayEntries(ds);
    var cls = 'acc-c-cell' + (!cell.isCurrentMonth ? ' other-month' : '') + (Utils.isToday(ds) ? ' today' : '');
    var div = Utils.el('div', { className: cls, dataset: { date: ds } });
    div.appendChild(Utils.el('div', { className: 'acc-day' }, String(cell.dayNum)));

    if (cell.isCurrentMonth) {
      var ac = net > 0 ? 'pos' : (net < 0 ? 'neg' : 'zero');
      div.appendChild(Utils.el('div', { className: 'acc-amount ' + ac }, (net > 0 ? '+' : '') + (net || '0')));
      if (entries.length > 0) {
        var dw = Utils.el('div', { style: { marginTop: '1px' } });
        entries.forEach(function(e) { dw.appendChild(Utils.el('span', { className: 'acc-dot ' + (e.type === 'income' ? 'income' : 'expense') })); });
        div.appendChild(dw);
      }
      div.addEventListener('click', function() { Accounting._openDayDetail(ds); });
    }
    cg.appendChild(div);
  });
  cal.appendChild(cg);
  parent.appendChild(cal);
};

/* ===== 日详情弹窗 ===== */
Accounting._openDayDetail = function(date) {
  var entries = Store.getDayEntries(date);
  var net = Store.getDayNet(date);
  var overlay = Utils.el('div', { className: 'modal-overlay', onclick: function(e) { if (e.target === overlay) overlay.remove(); } });
  var modal = Utils.el('div', { className: 'modal' });
  var hdr = Utils.el('div', { className: 'modal-header' });
  hdr.appendChild(Utils.el('h2', {}, Utils.formatDateCN(date)));
  hdr.appendChild(Utils.el('button', { className: 'modal-close', onclick: function() { overlay.remove(); } }, '×'));
  modal.appendChild(hdr);

  var body = Utils.el('div', { className: 'modal-body' });
  var netEl = Utils.el('div', { className: 'acc-day-net' });
  netEl.innerHTML = '当日净额：<strong>' + (net >= 0 ? '+' : '') + net + '</strong>';
  body.appendChild(netEl);

  if (entries.length === 0) {
    body.appendChild(Utils.el('div', { style: { textAlign: 'center', padding: '20px 0', color: '#A0AAB4', fontSize: '13px' } }, '暂无记录'));
  } else {
    entries.sort(function(a, b) { return a.createdAt < b.createdAt ? 1 : -1; });
    entries.forEach(function(e) {
      var row = Utils.el('div', { className: 'acc-entry' });
      var left = Utils.el('div', { className: 'ae-left' });
      left.appendChild(Utils.el('div', { className: 'ae-icon ' + e.type }, e.type === 'income' ? '💰' : '💸'));
      var info = Utils.el('div', { className: 'ae-info' });
      info.appendChild(Utils.el('div', { className: 'ae-note' }, e.note || (e.type === 'income' ? '收入' : '支出')));
      info.appendChild(Utils.el('div', { className: 'ae-time' }, e.createdAt ? e.createdAt.slice(11, 16) : ''));
      left.appendChild(info); row.appendChild(left);
      row.appendChild(Utils.el('div', { className: 'ae-amount ' + e.type }, (e.type === 'income' ? '+' : '-') + e.amount));
      var db = Utils.el('button', { className: 'btn btn-icon btn-ghost', style: { color: '#E74C3C', fontSize: '14px', marginLeft: '4px' }, onclick: function(ev) { ev.stopPropagation(); Accounting._handleDeleteEntry(e.id, overlay); } }, '×');
      row.appendChild(db); body.appendChild(row);
    });
  }

  // 存入 / 支出 按钮
  var ab = Utils.el('div', { className: 'acc-add-bar' });
  ab.appendChild(Utils.el('button', { className: 'btn btn-income', onclick: function() { Accounting._showAddForm(date, 'income', overlay); } }, '+ 💰 存入'));
  ab.appendChild(Utils.el('button', { className: 'btn btn-expense', onclick: function() { Accounting._showAddForm(date, 'expense', overlay); } }, '- 💸 支出'));
  body.appendChild(ab);

  modal.appendChild(body); overlay.appendChild(modal);
  document.getElementById('modal-root').appendChild(overlay);
};

/* ===== 记账表单 ===== */
Accounting._showAddForm = function(date, type, parentOverlay) {
  parentOverlay.remove();
  var overlay = Utils.el('div', { className: 'modal-overlay', onclick: function(e) { if (e.target === overlay) overlay.remove(); } });
  var modal = Utils.el('div', { className: 'modal' });
  var hdr = Utils.el('div', { className: 'modal-header' });
  hdr.appendChild(Utils.el('h2', {}, type === 'income' ? '💰 存入' : '💸 支出'));
  hdr.appendChild(Utils.el('button', { className: 'modal-close', onclick: function() { overlay.remove(); } }, '×'));
  modal.appendChild(hdr);

  var body = Utils.el('div', { className: 'modal-body acc-form' });
  body.appendChild(Utils.el('div', { style: { fontSize: '13px', color: '#8A95A5', marginBottom: '12px' } }, Utils.formatDateCN(date)));

  // 金额输入
  var ar = Utils.el('div', { className: 'form-row-amount' });
  ar.appendChild(Utils.el('span', { className: 'amount-prefix ' + type }, type === 'income' ? '+' : '-'));
  var ag = Utils.el('div', { className: 'form-group' });
  ag.appendChild(Utils.el('label', { className: 'form-label' }, '金额'));
  var amt = Utils.el('input', { className: 'form-input', type: 'number', step: '0.01', placeholder: '0.00' });
  ag.appendChild(amt); ar.appendChild(ag); body.appendChild(ar);

  // 备注输入
  var ng = Utils.el('div', { className: 'form-group', style: { marginTop: '12px' } });
  ng.appendChild(Utils.el('label', { className: 'form-label' }, '备注'));
  var note = Utils.el('input', { className: 'form-input', type: 'text', maxlength: '50', placeholder: '例如：午饭、工资...' });
  ng.appendChild(note); body.appendChild(ng);

  // 快捷金额按钮
  var qr = Utils.el('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' } });
  (type === 'income' ? [100,200,500,1000,3000] : [10,20,50,100,200]).forEach(function(qa) {
    qr.appendChild(Utils.el('button', { className: 'btn btn-sm', style: { borderColor: type === 'income' ? '#27AE60' : '#E74C3C', color: type === 'income' ? '#27AE60' : '#E74C3C' }, onclick: function() { amt.value = qa; } }, qa));
  });
  body.appendChild(qr);

  // 确定 / 取消
  var ft = Utils.el('div', { className: 'modal-footer', style: { marginTop: '16px' } });
  var rr = Utils.el('div', { className: 'mf-right' });
  rr.appendChild(Utils.el('button', { className: 'btn', onclick: function() { overlay.remove(); Accounting._openDayDetail(date); } }, '取消'));
  rr.appendChild(Utils.el('button', { className: 'btn btn-primary', onclick: function() {
    var v = parseFloat(amt.value);
    if (!v || v <= 0) { amt.className = 'form-input error'; return; }
    Store.addAccountEntry(type, v, note.value.trim(), date);
    Accounting._checkMilestone();
    Toast.success(type === 'income' ? '💰 已存入 ' + v + ' 元' : '💸 已支出 ' + v + ' 元');
    overlay.remove(); S.App && S.App.refresh();
  } }, '确定'));
  ft.appendChild(rr); modal.appendChild(ft); overlay.appendChild(modal);
  document.getElementById('modal-root').appendChild(overlay);
  setTimeout(function() { amt.focus(); }, 100);
};

/* ===== 删除记录 ===== */
Accounting._handleDeleteEntry = function(id, overlay) {
  Confirm.show('删除记录', '确定删除？', function(ok) {
    if (ok) { Store.deleteAccountEntry(id); overlay.remove(); S.App && S.App.refresh(); Toast.info('已删除'); }
  });
};

/* ===== 里程碑鼓励 ===== */
Accounting._checkMilestone = function() {
  var bal = Store.getBalance();
  var last = Store.getMilestone();
  var m = Math.floor(bal / 500) * 500;
  if (m > last && m > 0) {
    Store.setMilestone(m);
    var msgs = [
      '🎉 太棒了！余额突破 ' + m + ' 元！继续加油 💪',
      '🎯 离目标又近了一步！已达 ' + m + ' 元 👏',
      '🏆 存钱小能手！坚持就是胜利 ✨',
      '💰 已达 ' + m + ' 元，好习惯改变生活 🎊',
    ];
    Toast.show(msgs[Math.floor(Math.random() * msgs.length)], 'success', 4000);
  }
};

S.Accounting = Accounting;
})(window.Schedule);
