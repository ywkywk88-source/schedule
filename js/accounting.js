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
    { label: '金库余额', value: (tb >= 0 ? '+' : '') + tb, cls: tb >= 0 ? 'positive' : 'negative' }
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

/* ===== 鼓励/提醒文案 ===== */
Accounting._encourageMsgs = [
  '🎉 余额突破 {n} 元！钱包鼓了，腰板直了！',
  '🏆 已达 {n} 元——当代葛朗台の自我修养 ✨',
  '💰 {n} 元了！距离财务自由还差…亿点点 😎',
  '🌟 恭喜小金库突破 {n} 元，建议奖励自己吃顿好的 🍜',
  '📈 {n} 元打卡——存钱的速度决定了买手机的底气 📱',
  '🎊 {n} 元达成！你就是这条街最会攒钱的仔 🐷',
  '💪 金库已达 {n} 元，再攒攒就能换新手机了！（暗示）🤳',
  '🌸 一日一钱，千日千钱。{n} 元成就已解锁～',
];

Accounting._saveMsgs = [
  '🎉 存了 {n} 块！金钱不是你生命的全部，但手机是 📱',
  '💰 {n} 元已入账——存钱的快乐，花钱的人不懂 😏',
  '🌟 存入 {n} 元，距离买手机又近了一步（疯狂暗示）✨',
  '💪 {n} 元到账！今天的你是闪闪发光的守财奴 ✨',
  '🐷 小金库 +{n}，蓄力换机计划加载中… 📱',
  '🌸 {n} 元已存好，自律的人运气不会太差 🍀',
  '🎯 存入 {n} 元——存的是钱，攒的是底气 🏔️',
  '🧮 +{n} 元，记账使人清醒，存款使人快乐 🥳',
];

Accounting._warnMsgs = [
  '💸 今天花了 {n} 块！再买就剁手 ✂️✋',
  '😱 支出 {n} 元——钱包以肉眼可见的速度瘪了 🥟',
  '⚠️ 今日已花 {n} 元，建议立刻关掉购物软件 📵',
  '📉 一天花了 {n} 块，这速度这个月要吃土了 🌾',
  '💀 {n} 元没了…你的手机离你又远了一步 📱💔',
  '🌊 花钱如流水，{n} 元就这么没了 🚰',
  '🔥 {n} 元支出——再这样下去小金库要饿死了 🏚️',
  '🥲 今日支出 {n} 元，建议默念三遍：我要存钱买手机 🤳',
];

/* ===== 弹出鼓励/提醒 ===== */
Accounting._checkDaily = function(date, type, amount) {
  var entries = Store.getDayEntries(date);
  var totalIncome = 0, totalExpense = 0;
  entries.forEach(function(e) {
    if (e.type === 'income') totalIncome += e.amount;
    else totalExpense += e.amount;
  });
  // 本轮刚存入/支出的也要算上
  if (type === 'income') totalIncome += amount;
  else totalExpense += amount;

  // 单日存入 > 300 鼓励
  if (type === 'income' && totalIncome > 300) {
    var im = Accounting._saveMsgs[Math.floor(Math.random() * Accounting._saveMsgs.length)];
    Toast.show(im.replace('{n}', String(amount)), 'success', 4000);
    return;
  }
  // 单日支出 > 50 提醒
  if (type === 'expense' && totalExpense > 50) {
    var wm = Accounting._warnMsgs[Math.floor(Math.random() * Accounting._warnMsgs.length)];
    Toast.show(wm.replace('{n}', String(amount)), 'warning', 4000);
  }
};

/* ===== 里程碑鼓励 ===== */
Accounting._checkMilestone = function() {
  var bal = Store.getBalance();
  var last = Store.getMilestone();
  var m = Math.floor(bal / 500) * 500;
  if (m > last && m > 0) {
    Store.setMilestone(m);
    var ms = Accounting._encourageMsgs[Math.floor(Math.random() * Accounting._encourageMsgs.length)];
    Toast.show(ms.replace('{n}', String(m)), 'success', 5000);
  }
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

  // 金额行（type=text + inputmode=decimal 兼容性好）
  var amtRow = Utils.el('div', { className: 'acc-form-row' });
  var prefixSpan = Utils.el('span', { className: 'acc-amt-prefix income' }, '+');
  var amtInput = Utils.el('input', { className: 'acc-amt-input', type: 'text', inputmode: 'decimal', placeholder: '输入金额…' });
  amtRow.appendChild(prefixSpan);
  amtRow.appendChild(amtInput);
  formWrap.appendChild(amtRow);

  // 备注
  var noteInput = Utils.el('input', { className: 'acc-note-input', type: 'text', maxlength: '50', placeholder: '备注（选填）' });
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

  // 类型切换
  btnIncome.onclick = function() {
    selectedType = 'income';
    btnIncome.className = 'btn-type active'; btnExpense.className = 'btn-type';
    prefixSpan.className = 'acc-amt-prefix income'; prefixSpan.textContent = '+';
    amtInput.focus();
    updateQuickBtns('income');
  };
  btnExpense.onclick = function() {
    selectedType = 'expense';
    btnExpense.className = 'btn-type active'; btnIncome.className = 'btn-type';
    prefixSpan.className = 'acc-amt-prefix expense'; prefixSpan.textContent = '-';
    amtInput.focus();
    updateQuickBtns('expense');
  };

  // 确认按钮
  var submitBtn = Utils.el('button', { className: 'acc-submit-btn', onclick: function() {
    var raw = amtInput.value.replace(/[^0-9.]/g, '');
    var v = parseFloat(raw);
    if (!v || v <= 0) { amtInput.className = 'acc-amt-input error'; amtInput.focus(); return; }
    Store.addAccountEntry(selectedType, v, noteInput.value.trim(), date);
    // 鼓励 / 提醒
    Accounting._checkDaily(date, selectedType, v);
    Accounting._checkMilestone();
    // 刷新弹窗
    overlay.remove();
    Accounting._openDayDetail(date);
    // 刷新外部统计
    S.App && S.App.refresh();
  } }, '✓ 确定');
  formWrap.appendChild(submitBtn);
  body.appendChild(formWrap);

  // 分隔线
  body.appendChild(Utils.el('div', { className: 'acc-divider' }));

  // 当日记录列表
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
  setTimeout(function() { amtInput.focus(); }, 200);
};

/* ===== 删除记录 ===== */
Accounting._handleDeleteEntry = function(id, overlay) {
  Confirm.show('删除记录', '确定删除这条记录？', function(ok) {
    if (ok) {
      Store.deleteAccountEntry(id);
      overlay.remove();
      S.App && S.App.refresh();
      Toast.info('已删除');
    }
  });
};

S.Accounting = Accounting;
})(window.Schedule);
