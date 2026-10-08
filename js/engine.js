/* ============================================================
 * 《问道长生》引擎 v2
 * 状态 / 渲染 / 存档 / 奇遇 / 好感度 / 轮回图鉴 / 水墨动画
 * ============================================================ */

const SAVE_KEY = 'wendao_save_v2';
const META_KEY = 'wendao_meta';

function freshState() {
  return {
    node: 'start',
    xiuwei: 0,
    xinjing: 50,
    shouyuan: 64,
    age: 16,
    realm: '炼气',
    flags: {},
    aff: {},
    log: [],
    eventUsed: []
  };
}

let S = freshState();

/* ---------- 存档 ---------- */
function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {}
}
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) { S = Object.assign(freshState(), JSON.parse(raw)); return true; }
  } catch (e) {}
  return false;
}
function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }

/* ---------- 轮回图鉴（跨轮回元数据） ---------- */
function getMeta() {
  try { return Object.assign({ endings: {}, runs: 0 }, JSON.parse(localStorage.getItem(META_KEY) || '{}')); }
  catch (e) { return { endings: {}, runs: 0 }; }
}
function recordEnding(rank) {
  try {
    const meta = getMeta();
    meta.endings[rank] = (meta.endings[rank] || 0) + 1;
    meta.runs += 1;
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch (e) {}
}
function yinjiCount() { return Object.keys(getMeta().endings).length; }

/* ---------- 工具 ---------- */
const $ = sel => document.querySelector(sel);

function clampStats() {
  S.xinjing = Math.max(0, Math.min(100, S.xinjing));
  S.xiuwei = Math.max(0, S.xiuwei);
}

function checkFates() {
  const node = STORY[S.node] || {};
  if (node.ending) return;
  if (S.shouyuan <= 0) { S.node = 'end_shouyuan'; }
  else if (S.xinjing <= 0) { S.node = 'end_heartdevil'; }
}

/* ---------- 渲染 ---------- */
function paraText(p) {
  return typeof p === 'function' ? p(S) : p;
}

function renderStats() {
  $('#st-realm').textContent = S.realm;
  $('#st-xiuwei').textContent = S.xiuwei;
  $('#st-shouyuan').textContent = S.shouyuan;
  $('#st-age').textContent = S.age;
  $('#mind-bar').style.width = S.xinjing + '%';
  $('#mind-num').textContent = S.xinjing;
}

function notify(msg) {
  const box = $('#notify');
  const el = document.createElement('div');
  el.className = 'note';
  el.textContent = msg;
  box.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 600);
  }, 2600);
}

function render() {
  clampStats();
  const node = STORY[S.node];
  if (!node) { console.error('missing node', S.node); return; }

  const story = $('#story');
  story.innerHTML = '';

  if (node.chapter) {
    const ch = document.createElement('div');
    ch.className = 'chapter';
    ch.textContent = node.chapter;
    story.appendChild(ch);
  }

  const h = document.createElement('h2');
  h.className = 'scene-title' + (node.ending ? ' ending-title' : '');
  h.textContent = node.title;
  story.appendChild(h);

  // 正文逐段浮现（空段落跳过）
  const paras = node.text.map(paraText).filter(t => t && String(t).trim());
  paras.forEach((t, i) => {
    const el = document.createElement('p');
    el.className = 'para';
    el.innerHTML = String(t).replace(/\n/g, '<br>');
    el.style.transitionDelay = (i * 90) + 'ms';
    story.appendChild(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));
  });

  const choiceBox = document.createElement('div');
  choiceBox.className = 'choices';
  story.appendChild(choiceBox);

  const delay = paras.length * 90 + 250;
  const visible = (node.choices || []).filter(c => !c.show || c.show(S));

  visible.forEach((c, i) => {
    const btn = document.createElement('button');
    btn.className = 'choice';
    btn.innerHTML = '<span class="choice-dot"></span>' + c.text;
    const ok = !c.can || c.can(S);
    if (!ok) { btn.classList.add('disabled'); btn.disabled = true; }
    btn.style.transitionDelay = (delay + i * 120) + 'ms';
    choiceBox.appendChild(btn);
    requestAnimationFrame(() => requestAnimationFrame(() => btn.classList.add('show')));
    if (ok) btn.addEventListener('click', () => choose(c));
  });

  renderStats();
  save();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function choose(c) {
  if (c.restart) {
    clearSave();
    S = freshState();
    render();
    return;
  }
  const node = STORY[S.node];
  if (c.fx) c.fx(S);
  S.log.push({ chapter: node.chapter || '', text: c.text.replace(/（[^）]*）/g, '') });
  S.node = typeof c.next === 'function' ? c.next(S) : c.next;
  const n2 = STORY[S.node];
  if (n2 && n2.onEnter) n2.onEnter(S);
  checkFates();
  clampStats();
  render();
  const nn = STORY[S.node];
  if (nn && nn.ending) {
    recordEnding(nn.ending);
    notify('结局 · 「' + nn.ending + '」 —— ' + nn.title + ' · 已计入轮回图鉴');
    return;
  }
  // 随机奇遇：进入特定节点时概率触发
  maybeEvent(S.node);
}

/* ============================================================
 * 随机奇遇
 * ============================================================ */
let activeEvent = null;

function maybeEvent(nodeId) {
  const chance = EVENT_TRIGGERS[nodeId];
  if (!chance) return;
  if (S.flags.devil) return; // 魔道无奇遇，天道弃子
  if (Math.random() >= chance) return;
  const pool = EVENTS.filter(e => !S.eventUsed.includes(e.id));
  if (!pool.length) return;
  const ev = pool[Math.floor(Math.random() * pool.length)];
  S.eventUsed.push(ev.id);
  activeEvent = ev;
  save();
  renderEventModal(ev);
  notify('奇遇 · 「' + ev.title + '」');
}

function renderEventModal(ev, resultText) {
  const modal = $('#event-modal');
  const body = $('#event-body');
  body.innerHTML = '';

  const title = document.createElement('h3');
  title.textContent = '奇遇 · ' + ev.title;
  body.appendChild(title);

  ev.text.forEach(t => {
    const p = document.createElement('p');
    p.className = 'para show';
    p.textContent = t;
    body.appendChild(p);
  });

  if (resultText) {
    const r = document.createElement('p');
    r.className = 'para show event-result';
    r.textContent = resultText;
    body.appendChild(r);
    const cont = document.createElement('button');
    cont.className = 'choice show';
    cont.innerHTML = '<span class="choice-dot"></span>继续赶路';
    cont.addEventListener('click', closeEventModal);
    const box = document.createElement('div');
    box.className = 'choices';
    box.style.marginTop = '28px';
    box.appendChild(cont);
    body.appendChild(box);
  } else {
    const box = document.createElement('div');
    box.className = 'choices';
    box.style.marginTop = '28px';
    ev.choices.forEach(c => {
      if (c.can && !c.can(S)) return;
      const btn = document.createElement('button');
      btn.className = 'choice show';
      btn.innerHTML = '<span class="choice-dot"></span>' + c.text;
      btn.addEventListener('click', () => {
        let result = null;
        if (c.fx) result = c.fx(S);
        clampStats();
        renderStats();
        save();
        renderEventModal(ev, result || '你没有多做停留，继续赶路。');
      });
      box.appendChild(btn);
    });
    body.appendChild(box);
  }

  modal.classList.add('open');
}

function closeEventModal() {
  $('#event-modal').classList.remove('open');
  activeEvent = null;
}

/* ============================================================
 * 命簿面板：前尘 / 善缘 / 图鉴
 * ============================================================ */
function renderLog() {
  const box = $('#log-list');
  box.innerHTML = '';
  if (!S.log.length) {
    box.innerHTML = '<li class="empty-hint">此生尚未做出抉择。</li>';
    return;
  }
  S.log.forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = '<span class="log-ch">' + item.chapter + '</span>' + item.text;
    box.appendChild(li);
  });
}

function renderAff() {
  const box = $('#aff-list');
  box.innerHTML = '';
  const order = ['daoLv', 'yunShu', 'qingLing', 'duBiWeng', 'laoYu'];
  let any = false;
  order.forEach(key => {
    const v = S.aff[key] || 0;
    const known = v !== 0 || (key === 'daoLv' && S.flags.love === '道侣');
    if (!known && v === 0) return;
    any = true;
    const npc = NPCS[key];
    const row = document.createElement('div');
    row.className = 'aff-row' + (v < 0 ? ' negative' : '');
    row.innerHTML =
      '<div class="aff-head"><span class="aff-name">' + npc.name + '</span>' +
      '<span class="aff-lv">' + (v < 0 ? '仇怨' : affLevel(v)) + ' · ' + v + '</span></div>' +
      '<div class="aff-track"><div class="aff-bar" style="width:' + Math.min(100, Math.max(0, v)) + '%"></div></div>' +
      '<div class="aff-desc">' + npc.desc + '</div>';
    box.appendChild(row);
  });
  if (!any) {
    box.innerHTML = '<li class="empty-hint">此生还未结下任何善缘。</li>';
  }
}

const ENDING_INFO = {
  '仙': { title: '飞升', desc: '不忘来路，功德圆满，踏天门而去' },
  '缘': { title: '散仙', desc: '人间有你，何必上天' },
  '情': { title: '同渡', desc: '青翎替你吞雷，你为它弃了仙籍' },
  '凡': { title: '兵解', desc: '差一线，就是差一世，来世再来' },
  '魔': { title: '入魔', desc: '弑天吞雷，长生也是长夜' },
  '寿': { title: '坐化', desc: '时间是最锋利的刀' },
  '劫': { title: '心魔', desc: '输给了影子里那个自己' }
};

function renderCodex() {
  const box = $('#codex-list');
  box.innerHTML = '';
  const meta = getMeta();
  const yj = document.createElement('div');
  yj.className = 'yinji-box';
  yj.innerHTML = '轮回印记 <b>' + Object.keys(meta.endings).length + '</b> 道' +
    '<span>· 集齐印记可在来世获得修为加持（每道印记 +3 修为 +2 心境）</span>';
  box.appendChild(yj);

  Object.keys(ENDING_INFO).forEach(rank => {
    const info = ENDING_INFO[rank];
    const got = meta.endings[rank] || 0;
    const row = document.createElement('div');
    row.className = 'codex-row' + (got ? ' got' : '');
    row.innerHTML =
      '<span class="codex-rank">' + rank + '</span>' +
      '<span class="codex-title">' + info.title + '</span>' +
      '<span class="codex-desc">' + (got ? info.desc : '？？？') + '</span>' +
      (got > 1 ? '<span class="codex-count">×' + got + '</span>' : '');
    box.appendChild(row);
  });
}

function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('.tab-page').forEach(p => p.classList.toggle('active', p.id === 'tab-' + name));
  if (name === 'log') renderLog();
  if (name === 'aff') renderAff();
  if (name === 'codex') renderCodex();
}

/* ---------- 水墨环境动画 ---------- */
function startCanvas() {
  const cv = $('#ink');
  const ctx = cv.getContext('2d');
  let W, H, dpr;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  const mists = [];
  for (let i = 0; i < 26; i++) {
    mists.push({
      x: Math.random(), y: Math.random(),
      r: 40 + Math.random() * 90,
      vx: (0.00006 + Math.random() * 0.00012) * (Math.random() < 0.5 ? -1 : 1),
      vy: -0.00003 - Math.random() * 0.00006,
      o: 0.02 + Math.random() * 0.05
    });
  }
  const petals = [];
  for (let i = 0; i < 10; i++) {
    petals.push({
      x: Math.random(), y: Math.random(),
      s: 1 + Math.random() * 2,
      vy: 0.0002 + Math.random() * 0.0004,
      ph: Math.random() * Math.PI * 2,
      o: 0.12 + Math.random() * 0.2
    });
  }

  let t = 0;
  const inkColor = () => getComputedStyle(document.body).getPropertyValue('--ink-rgb').trim() || '10,10,10';

  function draw() {
    t += 0.004;
    ctx.clearRect(0, 0, W, H);
    const ink = inkColor();

    const layers = [
      { base: 0.82, amp: 26, freq: 0.0022, speed: 0.10, alpha: 0.10, lw: 1 },
      { base: 0.87, amp: 34, freq: 0.0016, speed: 0.16, alpha: 0.13, lw: 1 },
      { base: 0.92, amp: 42, freq: 0.0011, speed: 0.24, alpha: 0.16, lw: 1.2 }
    ];
    layers.forEach(L => {
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 4) {
        const y = H * L.base
          + Math.sin(x * L.freq + t * L.speed * 4) * L.amp
          + Math.sin(x * L.freq * 2.7 + t * L.speed * 6.5) * L.amp * 0.4;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fillStyle = 'rgba(' + ink + ',' + L.alpha + ')';
      ctx.fill();
      ctx.strokeStyle = 'rgba(' + ink + ',' + (L.alpha + 0.08) + ')';
      ctx.lineWidth = L.lw;
      ctx.stroke();
    });

    mists.forEach(m => {
      m.x += m.vx; m.y += m.vy;
      if (m.x < -0.2) m.x = 1.2; if (m.x > 1.2) m.x = -0.2;
      if (m.y < -0.2) m.y = 1.2;
      const g = ctx.createRadialGradient(m.x * W, m.y * H, 0, m.x * W, m.y * H, m.r);
      g.addColorStop(0, 'rgba(' + ink + ',' + m.o + ')');
      g.addColorStop(1, 'rgba(' + ink + ',0)');
      ctx.fillStyle = g;
      ctx.fillRect(m.x * W - m.r, m.y * H - m.r, m.r * 2, m.r * 2);
    });

    petals.forEach(p => {
      p.y += p.vy; p.ph += 0.02;
      if (p.y > 1.05) { p.y = -0.05; p.x = Math.random(); }
      const x = p.x * W + Math.sin(p.ph) * 24;
      ctx.beginPath();
      ctx.arc(x, p.y * H, p.s, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + ink + ',' + p.o + ')';
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }
  draw();
}

/* ---------- 夜间模式 ---------- */
function toggleNight() {
  document.body.classList.toggle('night');
  const night = document.body.classList.contains('night');
  try { localStorage.setItem('wendao_night', night ? '1' : '0'); } catch (e) {}
  $('#night-btn').textContent = night ? '昼' : '夜';
}

/* ---------- 启动 ---------- */
window.addEventListener('DOMContentLoaded', () => {
  try { if (localStorage.getItem('wendao_night') === '1') { document.body.classList.add('night'); } } catch (e) {}
  $('#night-btn').textContent = document.body.classList.contains('night') ? '昼' : '夜';
  $('#night-btn').addEventListener('click', toggleNight);

  const hasSave = load();
  if (hasSave && S.node !== 'start') {
    notify('已续上前缘 —— ' + (STORY[S.node] ? STORY[S.node].chapter : ''));
  }

  $('#restart-btn').addEventListener('click', () => {
    if (confirm('斩断此生因果，重新入局？（轮回图鉴与印记将保留）')) {
      clearSave();
      S = freshState();
      render();
    }
  });

  const panel = $('#log-panel');
  $('#log-btn').addEventListener('click', () => {
    switchTab('log');
    panel.classList.add('open');
  });
  $('#log-close').addEventListener('click', () => panel.classList.remove('open'));
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.addEventListener('click', () => switchTab(b.dataset.tab));
  });

  document.addEventListener('keydown', e => {
    if ($('#event-modal').classList.contains('open')) return;
    if (panel.classList.contains('open')) {
      if (e.key === 'Escape') panel.classList.remove('open');
      return;
    }
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 9) {
      const btns = document.querySelectorAll('.choice:not(.disabled)');
      if (btns[n - 1]) btns[n - 1].click();
    }
  });

  startCanvas();
  render();
});
