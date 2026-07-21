(function(S) {
'use strict';
var Toast = {}, container = document.getElementById('toast-container');
Toast.show = function(message, type, duration) {
  type = type || 'info'; duration = duration || 2800;
  var icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  var el = document.createElement('div');
  el.className = 'toast toast-' + type;
  el.innerHTML = '<span>' + (icons[type] || 'ℹ️') + ' ' + message + '</span>';
  container.appendChild(el);
  setTimeout(function() {
    el.style.animation = 'slideOut .25s var(--easing) forwards';
    setTimeout(function() { el.remove(); }, 250);
  }, duration);
};
Toast.success = function(m) { Toast.show(m, 'success'); };
Toast.error = function(m) { Toast.show(m, 'error'); };
Toast.info = function(m) { Toast.show(m, 'info'); };
Toast.warning = function(m) { Toast.show(m, 'warning'); };
S.Toast = Toast;
})(window.Schedule);

(function(S) {
'use strict';
var Confirm = {}, overlay = null;
Confirm.show = function(title, message, callback) {
  Confirm.hide();
  var o = document.createElement('div'); o.className = 'confirm-overlay';
  var box = document.createElement('div'); box.className = 'confirm-box';
  box.innerHTML = '<div class="confirm-title">' + title + '</div><div class="confirm-msg">' + message + '</div>';
  var actions = document.createElement('div'); actions.className = 'confirm-actions';
  var cancelBtn = document.createElement('button'); cancelBtn.className = 'btn'; cancelBtn.textContent = '取消';
  cancelBtn.onclick = function() { Confirm.hide(); callback(false); };
  var okBtn = document.createElement('button'); okBtn.className = 'btn btn-primary'; okBtn.textContent = '确定';
  okBtn.onclick = function() { Confirm.hide(); callback(true); };
  actions.appendChild(cancelBtn); actions.appendChild(okBtn); box.appendChild(actions);
  o.appendChild(box); document.body.appendChild(o); overlay = o;
  setTimeout(function() { okBtn.focus(); }, 50);
};
Confirm.hide = function() { if (overlay) { overlay.remove(); overlay = null; } };
S.Confirm = Confirm;
})(window.Schedule);
