/* ============================================================
 * 《问道长生》引擎
 * 状态 / 渲染 / 存档 / 水墨环境动画
 * ============================================================ */

const SAVE_KEY = 'wendao_save_v1';

function freshState() {
  return {
    node: 'start',
    xiuwei: 0,
    xinjing: 50,
    shouyuan: 64,
    age: 16,
    realm: '炼气',
    flags: {},
    log: []
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

/* ---------- 工具 ---------- */
const $ = sel => document.querySelector(sel);

function clampStats() {
  S.xinjing = Math.max(0, Math.min(100, S.xinjing));
  S.xiuwei = Math.max(0, S.xiuwei);
}

function checkFates() {
  // 寿元耗尽 / 心境归零：中途亦可触发结局
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
  // 心境条
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

function renderLog() {
  const box = $('#log-list');
  box.innerHTML = '';
  S.log.forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = '<span class="log-ch">' + item.chapter + '</span>' + item.text;
    box.appendChild(li);
  });
}

function render() {
  clampStats();
  const node = STORY[S.node];
  if (!node) { console.error('missing node', S.node); return; }

  const story = $('#story');
  story.innerHTML = '';

  // 章节标记
  if (node.chapter) {
    const ch = document.createElement('div');
    ch.className = 'chapter';
    ch.textContent = node.chapter;
    story.appendChild(ch);
  }

  // 标题
  const h = document.createElement('h2');
  h.className = 'scene-title' + (node.ending ? ' ending-title' : '');
  h.textContent = node.title;
  story.appendChild(h);

  // 正文逐段浮现
  node.text.forEach((p, i) => {
    const el = document.createElement('p');
    el.className = 'para';
    el.innerHTML = paraText(p).replace(/\n/g, '<br>');
    el.style.transitionDelay = (i * 90) + 'ms';
    story.appendChild(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));
  });

  // 选项
  const choiceBox = document.createElement('div');
  choiceBox.className = 'choices';
  story.appendChild(choiceBox);

  const delay = node.text.length * 90 + 250;
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
    if (ok) {
      btn.addEventListener('click', () => choose(c));
    }
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
  const next = typeof c.next === 'function' ? c.next(S) : c.next;
  S.node = next;
  const n2 = STORY[S.node];
  if (n2 && n2.onEnter) n2.onEnter(S);
  checkFates();
  clampStats();
  render();
  // 结局播报
  const nn = STORY[S.node];
  if (nn && nn.ending) notify('结局 · 「' + (nn.ending) + '」 —— ' + nn.title);
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

  // 雾气粒子
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
  // 飘落的花瓣/墨点
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

    // 三层远山：正弦山脊线
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

    // 雾
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

    // 花瓣
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
    if (confirm('斩断此生因果，重新入局？')) {
      clearSave();
      S = freshState();
      render();
    }
  });

  const logPanel = $('#log-panel');
  $('#log-btn').addEventListener('click', () => {
    renderLog();
    logPanel.classList.toggle('open');
  });
  $('#log-close').addEventListener('click', () => logPanel.classList.remove('open'));

  // 键盘：1-9 选择
  document.addEventListener('keydown', e => {
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 9) {
      const btns = document.querySelectorAll('.choice:not(.disabled)');
      if (btns[n - 1]) btns[n - 1].click();
    }
  });

  startCanvas();
  render();
});
