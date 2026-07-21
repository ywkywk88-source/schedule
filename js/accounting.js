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

/* ===== 日详情弹窗（内联记账表单） ===== */
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

  // 当日净额
  var netEl = Utils.el('div', { className: 'acc-day-net' });
  netEl.innerHTML = '当日净额：<strong>' + (net >= 0 ? '+' : '') + net + '</strong>';
  body.appendChild(netEl);

  // ===== 内联记账表单 =====
  var formWrap = Utils.el('div', { className: 'acc-inline-form' });
  // 类型切换
  var typeToggle = Utils.el('div', { className: 'acc-type-toggle' });
  var btnIncome = Utils.el('button', { className: 'btn-type active', dataset: { type: 'income' } }, '💰 存入');
  var btnExpense = Utils.el('button', { className: 'btn-type', dataset: { type: 'expense' } }, '💸 支出');
  typeToggle.appendChild(btnIncome);
  typeToggle.appendChild(btnExpense);
  formWrap.appendChild(typeToggle);

  var selectedType = 'income';

  // 金额行
  var amtRow = Utils.el('div', { className: 'acc-form-row' });
  var prefixSpan = Utils.el('span', { className: 'acc-amt-prefix income' }, '+');
  var amtInput = Utils.el('input', { className: 'acc-amt-input', type: 'number', step: '0.01', placeholder: '输入金额...' });
  amtRow.appendChild(prefixSpan);
  amtRow.appendChild(amtInput);
  formWrap.appendChild(amtRow);

  // 备注
  var noteInput = Utils.el('input', { className: 'acc-note-input', type: 'text', maxlength: '50', placeholder: '备注（选填）：午饭、工资...' });
  formWrap.appendChild(noteInput);

  // 快捷金额
  var quickRow = Utils.el('div', { className: 'acc-quick-row' });
  formWrap.appendChild(quickRow);

  function updateQuickBtns(type) {
    Utils.clear(quickRow);
    var vals = type === 'income' ? [100, 200, 500, 1000, 3000] : [10, 20, 50, 100, 200];
    vals.forEach(function(qa) {
      quickRow.appendChild(Utils.el('button', { className: 'acc-quick-btn', onclick: function() { amtInput.value = qa; amtInput.focus(); } }, qa));
    });
  }
  updateQuickBtns('income');

  // 类型切换事件
  btnIncome.onclick = function() { selectedType = 'income'; btnIncome.className = 'btn-type active'; btnExpense.className = 'btn-type'; prefixSpan.className = 'acc-amt-prefix income'; prefixSpan.textContent = '+'; amtInput.focus(); updateQuickBtns('income'); };
  btnExpense.onclick = function() { selectedType = 'expense'; btnExpense.className = 'btn-type active'; btnIncome.className = 'btn-type'; prefixSpan.className = 'acc-amt-prefix expense'; prefixSpan.textContent = '-'; amtInput.focus(); updateQuickBtns('expense'); };

  // 确认按钮
  var submitBtn = Utils.el('button', { className: 'acc-submit-btn', onclick: function() {
    var v = parseFloat(amtInput.value);
    if (!v || v <= 0) { amtInput.className = 'acc-amt-input error'; return; }
    Store.addAccountEntry(selectedType, v, noteInput.value.trim(), date);
    Accounting._checkMilestone();
    Toast.success(selectedType === 'income' ? '💰 已存入 ' + v + ' 元' : '💸 已支出 ' + v + ' 元');
    // 刷新弹窗
    var oldOverlay = overlay;
    overlay.remove();
    Accounting._openDayDetail(date);
  } }, '✓ 确定');
  formWrap.appendChild(submitBtn);
  body.appendChild(formWrap);

  // ===== 收支分隔线 =====
  body.appendChild(Utils.el('div', { className: 'acc-divider' }));

  // ===== 当日记录列表 =====
  var listTitle = Utils.el('div', { className: 'acc-list-title' }, '明细');
  body.appendChild(listTitle);

  if (entries.length === 0) {
    body.appendChild(Utils.el('div', { style: { textAlign: 'center', padding: '20px 0', color: '#A0AAB4', fontSize: '13px' } }, '还没有记录，在上面记账吧 ✏️'));
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

  modal.appendChild(body); overlay.appendChild(modal);
  document.getElementById('modal-root').appendChild(overlay);
  // 自动聚焦金额输入
  setTimeout(function() { amtInput.focus(); }, 150);
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
