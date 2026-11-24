/* 多协议频道页客户端：只依赖同源 /api/im 接口 */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var state = { sid: null, cursor: 0, timer: null, channel: null, protocols: [] };

  function api(path, opt) {
    opt = opt || {};
    return fetch(path, {
      method: opt.method || 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: opt.body ? JSON.stringify(opt.body) : undefined,
      credentials: 'same-origin'
    }).then(function (r) {
      return r.json().catch(function () { return { ok: false, error: 'HTTP ' + r.status }; });
    });
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- 协议状态 ---------- */
  function renderProtos(list) {
    state.protocols = list || [];
    var box = $('protos');
    box.innerHTML = '';
    (list || []).forEach(function (p) {
      var cls = !p.enabled ? 'off' : (p.connected ? 'ok' : 'warn');
      var el = document.createElement('span');
      el.className = 'chip';
      el.title = p.label + '：' + (p.note || '');
      el.innerHTML = '<i class="dot ' + cls + '"></i>' + esc(p.label) +
        (p.hasCredentials === false && (p.id === 'matrix' || p.id === 'xmpp') ? ' <span style="color:#98a1b3">(只读)</span>' : '');
      box.appendChild(el);
    });
  }

  function loadProtocols() {
    return api('/api/im/protocols').then(function (r) {
      if (r && r.ok) renderProtos(r.protocols);
    }).catch(function () {});
  }

  /* ---------- 频道列表 ---------- */
  function renderChannels(data) {
    var list = $('list'), errs = $('errs');
    errs.innerHTML = '';
    (data.errors || []).forEach(function (e) {
      var d = document.createElement('div');
      d.className = e.soft ? 'err soft' : 'err';
      d.textContent = '[' + (e.protocol || '') + '] ' + (e.error || '不可用');
      errs.appendChild(d);
    });

    var items = data.channels || [];
    if (!items.length) {
      list.innerHTML = '<div class="hint">没有匹配的频道。</div>';
      return;
    }
    var frag = document.createDocumentFragment();
    items.forEach(function (c) {
      var row = document.createElement('div');
      row.className = 'row';
      row.dataset.id = c.id;
      row.innerHTML =
        '<div style="min-width:0"><div class="nm" title="' + esc(c.name) + '">' + esc(c.name) + '</div>' +
        '<div class="tp" title="' + esc(c.topic || c.server || '') + '">' + esc(c.topic || c.server || '') + '</div></div>' +
        '<div class="tg">' + esc(c.protocolLabel || c.protocol) +
          (c.stale ? ' <span class="staleTag" title="本地缓存，' + esc(new Date(c.asOf || 0).toLocaleString()) + '">缓存</span>' : '') + '</div>' +
        '<div class="mb">' + (c.members || 0) + ' 人</div>' +
        '<button class="go">加入</button>';
      row.querySelector('.go').addEventListener('click', function (ev) {
        ev.stopPropagation();
        join(c);
      });
      row.addEventListener('click', function () { join(c); });
      frag.appendChild(row);
    });
    list.innerHTML = '';
    list.appendChild(frag);
  }

  function loadChannels() {
    var q = $('q').value.trim();
    var proto = $('proto').value;
    $('list').innerHTML = '<div class="hint">正在拉取频道列表…</div>';
    return api('/api/im/channels?protocol=' + encodeURIComponent(proto) +
      '&q=' + encodeURIComponent(q) + '&limit=400')
      .then(function (r) {
        if (!r.ok) { renderChannels({ channels: [], errors: [{ error: r.error || '请求失败' }] }); return; }
        renderProtos(r.protocols);
        renderChannels(r);
      })
      .catch(function (e) {
        renderChannels({ channels: [], errors: [{ error: String(e && e.message || e) }] });
      });
  }

  /* ---------- 会话 ---------- */
  function setChatEnabled(on) {
    $('text').disabled = !on;
    $('send').disabled = !on;
    $('leave').disabled = !on;
  }

  function clearMsgs() { $('msgs').innerHTML = ''; }

  function appendMsg(m) {
    var box = $('msgs');
    var el = document.createElement('div');
    el.className = 'msg' + (m.self ? ' self' : '');
    el.innerHTML = '<div class="who">' + esc(m.from || '') + '</div><div>' + esc(m.text) + '</div>';
    box.appendChild(el);
    box.scrollTop = box.scrollHeight;
  }

  function join(ch) {
    if (state.sid) leave();
    $('curName').textContent = '正在加入 ' + ch.name + ' …';
    $('curMeta').textContent = (ch.protocolLabel || ch.protocol) + ' · ' + (ch.members || 0) + ' 人';
    api('/api/im/join', { method: 'POST', body: { channelId: ch.id } })
      .then(function (r) {
        if (!r.ok) {
          $('curName').textContent = '加入失败';
          $('curMeta').textContent = r.error || '';
          clearMsgs();
          var h = document.createElement('div');
          h.className = 'err';
          h.textContent = r.error || '加入失败';
          $('msgs').appendChild(h);
          return;
        }
        state.sid = r.sid; state.cursor = 0; state.channel = ch;
        $('curName').textContent = r.name || ch.name;
        $('curMeta').textContent = (ch.protocolLabel || r.protocol) + ' · ' + (r.server || ch.server || '') + ' · ' + (ch.members || 0) + ' 人';
        clearMsgs();
        setChatEnabled(true);
        $('text').focus();
        poll();
      })
      .catch(function (e) {
        $('curName').textContent = '加入失败';
        $('curMeta').textContent = String(e && e.message || e);
      });
  }

  function poll() {
    if (state.timer) clearTimeout(state.timer);
    if (!state.sid) return;
    api('/api/im/messages?sid=' + encodeURIComponent(state.sid) + '&cursor=' + state.cursor)
      .then(function (r) {
        if (r.ok && r.messages) {
          r.messages.forEach(appendMsg);
          state.cursor = r.cursor;
        } else if (r.code === 'NO_SESSION') {
          setChatEnabled(false);
          return;
        }
        state.timer = setTimeout(poll, 2000);
      })
      .catch(function () { state.timer = setTimeout(poll, 3000); });
  }

  function send() {
    var text = $('text').value.trim();
    if (!text || !state.sid) return;
    $('text').value = '';
    api('/api/im/send', { method: 'POST', body: { sid: state.sid, text: text } })
      .then(function (r) {
        if (!r.ok) appendMsg({ from: '系统', text: '发送失败：' + (r.error || '') });
        poll && api('/api/im/messages?sid=' + encodeURIComponent(state.sid) + '&cursor=' + state.cursor)
          .then(function (x) { if (x.ok) { x.messages.forEach(appendMsg); state.cursor = x.cursor; } });
      });
  }

  function leave() {
    if (!state.sid) return;
    var sid = state.sid;
    state.sid = null;
    if (state.timer) { clearTimeout(state.timer); state.timer = null; }
    setChatEnabled(false);
    $('curName').textContent = '未加入频道';
    $('curMeta').textContent = '从左侧选择一个频道加入';
    clearMsgs();
    api('/api/im/leave', { method: 'POST', body: { sid: sid } }).catch(function () {});
  }

  /* ---------- 事件 ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    loadProtocols();
    loadChannels();
    $('refresh').addEventListener('click', loadChannels);
    $('proto').addEventListener('change', loadChannels);
    var qt = null;
    $('q').addEventListener('input', function () {
      clearTimeout(qt);
      qt = setTimeout(loadChannels, 300);
    });
    $('send').addEventListener('click', send);
    $('leave').addEventListener('click', leave);
    $('text').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    });
  });
})();
