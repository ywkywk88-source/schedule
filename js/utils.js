(function(S) {
'use strict';

/* ===== Utils ===== */
var Utils = {};
Utils.generateId = function() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
};
Utils.formatDate = function(d) {
  var y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
};
Utils.parseDate = function(str) {
  var p = str.split('-');
  return new Date(+p[0], +p[1] - 1, +p[2]);
};
Utils.isToday = function(dateStr) { return dateStr === Utils.todayStr; };
Utils.todayStr = Utils.formatDate(new Date());
Utils.addDays = function(date, n) {
  var d = new Date(date); d.setDate(d.getDate() + n); return d;
};
Utils.getWeekNumber = function(date) {
  var d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  var dayNum = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  var firstThursday = d.valueOf();
  d.setUTCMonth(0, 1);
  if (d.getUTCDay() !== 4) d.setUTCMonth(0, 1 + ((4 - d.getUTCDay()) + 7) % 7);
  return 1 + Math.ceil((firstThursday - d.valueOf()) / 604800000);
};
Utils.getWeekLabel = function(date) {
  var y = date.getFullYear();
  var wn = Utils.getWeekNumber(date);
  if (wn === 1 && date.getMonth() === 11) y++;
  if (wn >= 52 && date.getMonth() === 0) y--;
  return y + '年第' + wn + '周';
};
Utils.getWeekDays = function(date) {
  var d = new Date(date);
  var day = d.getDay();
  var diff = day === 0 ? -6 : 1 - day;
  var days = [];
  for (var i = 0; i < 7; i++) {
    var dd = new Date(d);
    dd.setDate(d.getDate() + diff + i);
    days.push(dd);
  }
  return days;
};
Utils.getDaysInMonth = function(y, m) { return new Date(y, m, 0).getDate(); };
Utils.getFirstWeekday = function(y, m) {
  var d = new Date(y, m - 1, 1).getDay();
  return d === 0 ? 6 : d - 1;
};
Utils.getMonthGrid = function(y, m) {
  var dim = Utils.getDaysInMonth(y, m);
  var fw = Utils.getFirstWeekday(y, m);
  var grid = [];
  for (var i = 0; i < 42; i++) {
    var dn = i - fw + 1, cd, isCM;
    if (dn < 1) {
      var pm = new Date(y, m - 1, 0);
      dn = pm.getDate() + dn;
      cd = new Date(y, m - 2, dn); isCM = false;
    } else if (dn > dim) {
      dn = dn - dim;
      cd = new Date(y, m, dn); isCM = false;
    } else {
      cd = new Date(y, m - 1, dn); isCM = true;
    }
    grid.push({ date: cd, dayNum: dn, isCurrentMonth: isCM });
  }
  return grid;
};
Utils.toICSDate = function(d) {
  var y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0');
  return y + m + day;
};
Utils.formatDateCN = function(dateStr) {
  var d = Utils.parseDate(dateStr);
  return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
};
Utils.SLOT_LABELS = { morning: '上午', afternoon: '下午', evening: '晚上' };
Utils.SLOT_HOURS = { morning: '08:00-12:00', afternoon: '13:00-18:00', evening: '19:00-22:00' };
Utils.SLOT_DEFAULT = { morning: '09:00', afternoon: '14:00', evening: '20:00' };
Utils.SLOTS = ['morning', 'afternoon', 'evening'];
Utils.PRIORITY = { high: { label: '高', color: '#E74C3C', bg: '#FDEDEC' }, medium: { label: '中', color: '#F39C12', bg: '#FEF5E7' }, low: { label: '低', color: '#27AE60', bg: '#E9F7EF' } };
Utils.el = function(tag, attrs, children) {
  var el = document.createElement(tag);
  if (attrs) for (var k in attrs) {
    if (k === 'className') el.className = attrs[k];
    else if (k === 'dataset') for (var dk in attrs[k]) el.dataset[dk] = attrs[k][dk];
    else if (k === 'style' && typeof attrs[k] === 'object') for (var sk in attrs[k]) el.style[sk] = attrs[k][sk];
    else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), attrs[k]);
    else el.setAttribute(k, attrs[k]);
  }
  if (children != null) {
    if (typeof children === 'string') el.textContent = children;
    else if (typeof children === 'number') el.textContent = String(children);
    else if (Array.isArray(children)) children.forEach(function(c) { if (c != null) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    else el.appendChild(typeof children === 'string' ? document.createTextNode(children) : children);
  }
  return el;
};
Utils.clear = function(el) { while (el.firstChild) el.removeChild(el.firstChild); };
Utils.qs = function(s, p) { return (p || document).querySelector(s); };
Utils.qsa = function(s, p) { return Array.from((p || document).querySelectorAll(s)); };
S.Utils = Utils;
})(window.Schedule || (window.Schedule = {}));
