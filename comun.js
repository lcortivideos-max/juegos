// Base común de los juegos: Telegram, sonido, anuncios con recompensa, ranking y pantallas.
(function () {
  'use strict';
  const CFG = window.ARCADE || { adsgramBlockId: '', potTotal: 252 };
  const GAME_IDS = ['ruta', 'pila', 'abismo', 'fruta', 'orbita', 'hotel', 'mordisco', 'asteroides', 'torre', 'invasores', 'charca', 'ladrillos', 'serpiente', 'glaciar'];

  // ---------- Telegram ----------
  const tg = window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData ? window.Telegram.WebApp : null;
  function tgInit(color, keepSwipes) {
    if (!tg) return;
    try { tg.ready(); tg.expand(); tg.setHeaderColor(color); tg.setBackgroundColor(color); if (!keepSwipes && tg.disableVerticalSwipes) tg.disableVerticalSwipes(); } catch (e) {}
  }
  const tgUser = tg && tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user : null;

  // ---------- Guardado ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  function weekKey() {
    const d = new Date();
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - day);
    const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return t.getUTCFullYear() + '-' + Math.ceil(((t - y0) / 864e5 + 1) / 7);
  }
  const WEEK = weekKey();
  function loadSave(id) {
    const s = store.get('arcade_' + id, null);
    return s && s.week === WEEK ? s : { week: WEEK, best: 0, coins: 0, runs: 0 };
  }
  function writeSave(id, s) { store.set('arcade_' + id, s); }

  // ---------- Ranking y bote de ejemplo ----------
  const POT = Math.round(CFG.potTotal / GAME_IDS.length * 100) / 100;
  const SHARES = [20, 13, 10, 8, 7, 6, 5, 4, 4, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2];
  const NAMES = ['NovaKid', 'Lucía_R', 'pixelmono', 'DaniFast', 'Kaori', 'elTiburón', 'MarAzul', 'zeta99', 'Ruff', 'Inés.G', 'B0lt', 'Carmen77', 'Gatete', 'Hugo_GG', 'nerea', 'Vortex', 'PacoRun', 'Aitana', 'L3o', 'Saúl', 'Moxie', 'Irene_S', 'rayo', 'Teo', 'Valkiria', 'JuanMa', 'Neko', 'Olivia', 'turbo_t', 'Alba'];
  function seeded(seed) { let s = seed; return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; }
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; }
  function rivals(id, top) {
    const r = seeded(hash(id + WEEK)), names = NAMES.slice().sort(() => r() - 0.5);
    const step = top >= 1000 ? 10 : 1;
    return SHARES.map((_, i) => ({ name: names[i], pts: Math.max(step, Math.round(top * Math.exp(-i * 0.12) / step) * step) }));
  }
  const fmtEUR = (v) => v.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  const fmt = (v) => Math.floor(v).toLocaleString('es-ES');
  function standing(list, best) {
    if (!best) return null;
    const pos = list.filter((r) => r.pts > best).length + 1;
    return { pos, prize: pos <= SHARES.length ? POT * SHARES[pos - 1] / 100 : 0 };
  }
  function standingText(list, best) {
    const s = standing(list, best);
    if (!s) return 'Juega una partida para entrar en el ranking.';
    if (s.prize > 0) return `Tu mejor: ${fmt(best)} · puesto ${s.pos} · premio ahora: ${fmtEUR(s.prize)}`;
    return `Tu mejor: ${fmt(best)} · puesto ${s.pos}. Te faltan ${fmt(list[SHARES.length - 1].pts - best + 1)} para entrar en premios.`;
  }

  // ---------- Sonido y vibración ----------
  let actx = null, muted = store.get('arcade_mute', false);
  function audio() {
    if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { actx = null; } }
    if (actx && actx.state === 'suspended') actx.resume();
    return actx;
  }
  function tone(f0, f1, dur, type, vol, delay) {
    if (muted) return; const a = audio(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain(), t = a.currentTime + (delay || 0);
    o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol == null ? 0.08 : vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol, freq) {
    if (muted) return; const a = audio(); if (!a) return;
    const n = Math.floor(a.sampleRate * dur), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = a.createBufferSource(), g = a.createGain(), f = a.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = freq || 900; g.gain.value = vol == null ? 0.3 : vol;
    s.buffer = b; s.connect(f).connect(g).connect(a.destination); s.start();
  }
  function haptic(kind) {
    try {
      if (tg && tg.HapticFeedback) {
        if (kind === 'error' || kind === 'success') tg.HapticFeedback.notificationOccurred(kind);
        else tg.HapticFeedback.impactOccurred(kind || 'light');
        return;
      }
      if (navigator.vibrate) navigator.vibrate(kind === 'error' ? 180 : kind === 'heavy' ? 60 : 15);
    } catch (e) {}
  }

  // ---------- Anuncios con recompensa ----------
  let adController = null;
  try { if (CFG.adsgramBlockId && window.Adsgram) adController = window.Adsgram.init({ blockId: CFG.adsgramBlockId }); } catch (e) { adController = null; }
  const adFailMsg = (why) => why === 'error' ? 'Ahora mismo no hay anuncios disponibles. Prueba en un rato.' : 'Tienes que ver el anuncio entero para conseguir la recompensa.';

  // ---------- Estilos comunes ----------
  const CSS = `
  html, body { height: 100%; margin: 0; }
  [hidden] { display: none !important; }
  body { background: var(--bg); color: var(--ink); font-family: var(--body); overflow: hidden; -webkit-user-select: none; user-select: none; -webkit-tap-highlight-color: transparent; touch-action: none; }
  #app { position: relative; width: 100%; height: 100%; overflow: hidden; }
  #app > canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
  .sh-hud { position: absolute; left: 0; right: 0; top: 0; display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; padding: calc(env(safe-area-inset-top, 0px) + 12px) max(14px, env(safe-area-inset-right, 0px)) 0 max(14px, env(safe-area-inset-left, 0px)); pointer-events: none; z-index: 5; }
  .sh-stat { display: flex; flex-direction: column; gap: 2px; }
  .sh-stat .k { font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); }
  .sh-stat .v { font-family: var(--display); font-size: 26px; line-height: 1; font-variant-numeric: tabular-nums; color: var(--ink); text-shadow: 0 2px 10px var(--shadow); }
  .sh-coins { align-items: flex-end; }
  .sh-coins .v { color: var(--gold); text-align: right; }
  .sh-coins .v.bump { animation: shbump .18s ease-out; }
  @keyframes shbump { 50% { transform: scale(1.18); } }
  .sh-right { display: flex; gap: 10px; align-items: flex-start; }
  .sh-badges { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; max-width: 40%; }
  .sh-badge { font-size: 12px; font-weight: 700; letter-spacing: .06em; padding: 4px 8px; border-radius: 999px; border: 1px solid currentColor; background: var(--panel); color: var(--gold); }
  .sh-pause { pointer-events: auto; width: 40px; height: 40px; border-radius: 12px; border: 1px solid var(--line); background: var(--panel); color: var(--ink); font-size: 15px; font-weight: 700; cursor: pointer; }
  .sh-screen { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 10; padding: calc(env(safe-area-inset-top, 0px) + 16px) max(16px, env(safe-area-inset-right, 0px)) calc(env(safe-area-inset-bottom, 0px) + 16px) max(16px, env(safe-area-inset-left, 0px)); background: var(--veil); overflow-y: auto; }
  .sh-card { width: min(420px, 100%); display: flex; flex-direction: column; gap: 14px; background: var(--panel); border: 1px solid var(--line); border-radius: 20px; padding: 22px 20px; box-shadow: 0 20px 60px rgba(0,0,0,.35); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); margin: auto; }
  .sh-logo { font-family: var(--display); font-weight: 400; font-size: clamp(40px, 13vw, 56px); line-height: .95; text-align: center; margin: 4px 0 0; }
  .sh-logo .a { display: block; color: var(--ink); }
  .sh-logo .b { display: block; color: var(--accent); }
  .sh-tag { text-align: center; color: var(--muted); margin: 0; font-size: 15px; }
  .sh-h2 { font-family: var(--display); font-weight: 400; font-size: 26px; margin: 0; text-align: center; text-wrap: balance; }
  .sh-pot { display: grid; grid-template-columns: 1fr auto; gap: 4px 12px; align-items: baseline; border: 1px solid var(--goldline); border-radius: 14px; padding: 12px 14px; background: var(--goldtint); }
  .sh-pot .lbl { font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); }
  .sh-pot .amt { font-family: var(--display); font-size: 26px; color: var(--gold); text-align: right; font-variant-numeric: tabular-nums; }
  .sh-pot .sub { grid-column: 1 / -1; font-size: 13px; color: var(--muted); }
  .sh-btn { appearance: none; border: 0; cursor: pointer; font-family: var(--display); font-size: 20px; padding: 15px 16px; border-radius: 14px; color: var(--onaccent); background: var(--accent); box-shadow: 0 8px 24px var(--shadow); transition: transform .08s ease; }
  .sh-btn:active { transform: scale(.97); }
  .sh-btn.ad { background: var(--gold); color: var(--ongold); font-size: 16px; display: flex; flex-direction: column; align-items: center; gap: 2px; }
  .sh-btn.ad small { font-family: var(--body); font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; opacity: .75; }
  .sh-ghost { appearance: none; cursor: pointer; background: transparent; color: var(--ink); border: 1px solid var(--line); border-radius: 14px; padding: 12px 14px; font-family: var(--body); font-weight: 700; font-size: 15px; text-decoration: none; text-align: center; }
  .sh-btn:focus-visible, .sh-ghost:focus-visible, .sh-pause:focus-visible { outline: 3px solid var(--ink); outline-offset: 2px; }
  .sh-row { display: flex; gap: 10px; }
  .sh-row > * { flex: 1; min-width: 0; }
  .sh-hint { font-size: 14px; color: var(--muted); text-align: center; margin: 0; line-height: 1.5; }
  .sh-hint b { color: var(--ink); }
  .sh-note { font-size: 11.5px; color: var(--muted); text-align: center; margin: 0; opacity: .85; }
  .sh-results { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .sh-res { border: 1px solid var(--line); border-radius: 12px; padding: 10px 6px; text-align: center; min-width: 0; }
  .sh-res .k { font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); }
  .sh-res .v { font-family: var(--display); font-size: 21px; font-variant-numeric: tabular-nums; margin-top: 2px; overflow-wrap: anywhere; }
  .sh-res.gold .v { color: var(--gold); }
  .sh-standing { text-align: center; font-size: 15px; margin: 0; }
  .sh-standing b { color: var(--gold); }
  .sh-newbest { text-align: center; font-family: var(--display); color: var(--accent); font-size: 16px; margin: 0; }
  .sh-rank { list-style: none; margin: 0; padding: 0; max-height: 46vh; overflow-y: auto; border: 1px solid var(--line); border-radius: 12px; }
  .sh-rank li { display: grid; grid-template-columns: 34px 1fr auto auto; gap: 10px; align-items: center; padding: 8px 12px; border-bottom: 1px solid var(--line); font-variant-numeric: tabular-nums; font-size: 14px; }
  .sh-rank li:last-child { border-bottom: 0; }
  .sh-rank .pos { font-family: var(--display); color: var(--muted); }
  .sh-rank .nm { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .sh-rank .pts { color: var(--muted); }
  .sh-rank .prz { color: var(--gold); font-weight: 700; min-width: 56px; text-align: right; }
  .sh-rank li.me { background: var(--goldtint); }
  .sh-rank li.me .pos, .sh-rank li.me .nm { color: var(--accent); font-weight: 700; }
  .sh-ad { position: absolute; inset: 0; z-index: 20; background: #05030f; color: #f4efff; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; padding: 24px max(16px, env(safe-area-inset-right, 0px)) 24px max(16px, env(safe-area-inset-left, 0px)); }
  .sh-adtag { position: absolute; top: calc(env(safe-area-inset-top, 0px) + 14px); left: max(16px, env(safe-area-inset-left, 0px)); font-size: 11px; letter-spacing: .16em; text-transform: uppercase; color: #b3a8d9; border: 1px solid rgba(160,140,255,.3); padding: 4px 8px; border-radius: 6px; }
  .sh-adbox { width: min(340px, 100%); aspect-ratio: 3 / 4; max-width: 100%; border-radius: 18px; border: 1px dashed rgba(255,255,255,.25); display: flex; align-items: center; justify-content: center; text-align: center; padding: 20px; color: #b3a8d9; font-size: 15px; line-height: 1.5; box-sizing: border-box; background: repeating-linear-gradient(135deg, rgba(255,255,255,.03) 0 14px, transparent 14px 28px); }
  .sh-adcount { font-family: var(--display); font-size: 40px; color: #ffc93c; font-variant-numeric: tabular-nums; }
  .sh-adreward { font-weight: 700; }
  .sh-count { position: absolute; inset: 0; z-index: 8; display: flex; align-items: center; justify-content: center; pointer-events: none; font-family: var(--display); font-size: 96px; color: var(--ink); text-shadow: 0 4px 30px var(--shadow); }
  .sh-toast { position: absolute; z-index: 30; left: 50%; bottom: calc(env(safe-area-inset-bottom, 0px) + 70px); transform: translateX(-50%); background: var(--panel); border: 1px solid var(--line); padding: 10px 14px; border-radius: 12px; font-size: 14px; max-width: calc(100% - 32px); text-align: center; color: var(--ink); }
  .sh-flash { position: absolute; inset: 0; z-index: 6; background: #fff; opacity: 0; pointer-events: none; }
  .sh-mute { position: absolute; z-index: 11; right: max(14px, env(safe-area-inset-right, 0px)); bottom: calc(env(safe-area-inset-bottom, 0px) + 14px); padding: 8px 12px; font-size: 13px; background: var(--panel); }
  .sh-home { position: absolute; z-index: 11; left: max(14px, env(safe-area-inset-left, 0px)); bottom: calc(env(safe-area-inset-bottom, 0px) + 14px); padding: 8px 12px; font-size: 13px; background: var(--panel); }
  @media (prefers-reduced-motion: reduce) { .sh-coins .v.bump { animation: none; } .sh-btn { transition: none; } }
  `;

  function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }

  // ---------- Shell de un juego ----------
  function create(cfg) {
    // cfg: id, title:[a,b], tagline, how:[html lines], coinValue, rivalTop, bg, countdown, revives,
    //      onStart(x2), onRevive(), onPause(), onResume(), badges() -> [text]
    tgInit(cfg.bg || '#000000');
    const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
    const app = document.getElementById('app');
    const coinValue = cfg.coinValue == null ? 5 : cfg.coinValue;
    const maxRevives = cfg.revives == null ? 3 : cfg.revives;
    const list = rivals(cfg.id, cfg.rivalTop || 1000);
    let save = loadSave(cfg.id);

    app.insertAdjacentHTML('beforeend', `
      <div class="sh-hud" id="shHud" hidden>
        <div class="sh-stat"><span class="k">Puntos</span><span class="v" id="shPts">0</span></div>
        <div class="sh-badges" id="shBadges"></div>
        <div class="sh-right">
          <div class="sh-stat sh-coins"><span class="k">${cfg.coinLabel || 'Monedas'}</span><span class="v" id="shCoins">0</span></div>
          <button class="sh-pause" id="shPauseBtn" aria-label="Pausa">II</button>
        </div>
      </div>
      <div class="sh-flash" id="shFlash"></div>
      <div class="sh-count" id="shCount" hidden></div>
      <div class="sh-screen" id="shMenu">
        <div class="sh-card">
          <h1 class="sh-logo"><span class="a">${cfg.title[0]}</span><span class="b">${cfg.title[1]}</span></h1>
          <p class="sh-tag">${cfg.tagline}</p>
          <div class="sh-pot"><span class="lbl">Bote de este juego</span><span class="amt">${fmtEUR(POT)}</span><span class="sub" id="shMenuStanding"></span></div>
          <button class="sh-btn" id="shPlay">Jugar</button>
          <button class="sh-btn ad" id="shPlayX2">Jugar con ${(cfg.coinLabel || 'monedas').toLowerCase()} x2<small>Ver un anuncio</small></button>
          <div class="sh-row"><button class="sh-ghost" id="shRankBtn">Ranking</button><button class="sh-ghost" id="shHowBtn">Cómo se juega</button></div>
          <p class="sh-note">Prototipo: el bote y los rivales son de ejemplo.</p>
        </div>
      </div>
      <div class="sh-screen" id="shHow" hidden>
        <div class="sh-card">
          <h2 class="sh-h2">Cómo se juega</h2>
          ${cfg.how.map((h) => `<p class="sh-hint">${h}</p>`).join('')}
          <p class="sh-hint">Cada ${(cfg.coinSingular || 'moneda')} suma ${coinValue} puntos. Tu mejor partida de la semana cuenta para el ranking, y los 20 primeros se reparten el bote el domingo.</p>
          <button class="sh-btn" id="shHowBack">Entendido</button>
        </div>
      </div>
      <div class="sh-screen" id="shRanking" hidden>
        <div class="sh-card">
          <h2 class="sh-h2">Ranking semanal</h2>
          <p class="sh-hint">Bote: ${fmtEUR(POT)}. Cuenta tu mejor partida de la semana; se reparte el domingo entre los 20 primeros.</p>
          <ol class="sh-rank" id="shRankList"></ol>
          <p class="sh-note">Rivales y bote de ejemplo hasta conectar el servidor.</p>
          <button class="sh-btn" id="shRankBack">Volver</button>
        </div>
      </div>
      <div class="sh-screen" id="shCrashed" hidden>
        <div class="sh-card">
          <h2 class="sh-h2">${cfg.crashTitle || '¡Has perdido!'}</h2>
          <p class="sh-standing" id="shCrashPts"></p>
          <button class="sh-btn ad" id="shRevive">${cfg.reviveLabel || 'Seguir jugando'}<small id="shReviveLeft"></small></button>
          <button class="sh-ghost" id="shEnd">Terminar partida</button>
        </div>
      </div>
      <div class="sh-screen" id="shOver" hidden>
        <div class="sh-card">
          <h2 class="sh-h2">Fin de la partida</h2>
          <p class="sh-newbest" id="shNewBest" hidden>Nuevo récord de la semana</p>
          <div class="sh-results">
            <div class="sh-res"><div class="k">Puntos</div><div class="v" id="shRPts">0</div></div>
            <div class="sh-res gold"><div class="k">${cfg.coinLabel || 'Monedas'}</div><div class="v" id="shRCoins">0</div></div>
            <div class="sh-res"><div class="k">${cfg.statLabel || 'Récord'}</div><div class="v" id="shRStat">0</div></div>
          </div>
          <p class="sh-standing" id="shRStanding"></p>
          <button class="sh-btn" id="shAgain">Otra partida</button>
          <button class="sh-btn ad" id="shAgainX2">Otra con ${(cfg.coinLabel || 'monedas').toLowerCase()} x2<small>Ver un anuncio</small></button>
          <div class="sh-row"><button class="sh-ghost" id="shOverRank">Ranking</button><button class="sh-ghost" id="shOverMenu">Menú</button></div>
        </div>
      </div>
      <div class="sh-screen" id="shPaused" hidden>
        <div class="sh-card">
          <h2 class="sh-h2">Pausa</h2>
          <button class="sh-btn" id="shResume">Seguir</button>
          <button class="sh-ghost" id="shQuit">Terminar partida</button>
        </div>
      </div>
      <div class="sh-ad" id="shAd" hidden>
        <span class="sh-adtag">Anuncio de prueba</span>
        <div class="sh-adbox">Aquí se mostrará el anuncio con recompensa de la red publicitaria.</div>
        <div class="sh-adcount" id="shAdCount">5</div>
        <div class="sh-adreward" id="shAdReward"></div>
      </div>
      <div class="sh-toast" id="shToast" hidden></div>
      <a class="sh-ghost sh-home" id="shHome" href="index.html">← Juegos</a>
      <button class="sh-ghost sh-mute" id="shMute">Sonido: sí</button>
    `);
    const $ = (id) => document.getElementById(id);
    const screens = ['shMenu', 'shHow', 'shRanking', 'shCrashed', 'shOver', 'shPaused'];
    const S = {
      state: 'menu', base: 0, coins: 0, mult: 1, revivesLeft: maxRevives, stat: 0,
      get points() { return Math.floor(this.base) + this.coins * this.mult * coinValue; }
    };
    function syncChrome() {
      const onScreen = screens.some((s) => !$(s).hidden);
      $('shMute').hidden = !onScreen; $('shHome').hidden = !(onScreen && !$('shMenu').hidden);
    }
    function show(id) { screens.forEach((s) => ($(s).hidden = s !== id)); syncChrome(); }
    let toastT = null;
    function toast(msg) { const t = $('shToast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 2600); }

    function refreshMenu() { $('shMenuStanding').textContent = standingText(list, save.best); }
    function renderRanking() {
      const rows = list.map((r) => ({ ...r }));
      if (save.best) rows.push({ name: tgUser && tgUser.first_name ? tgUser.first_name + ' (tú)' : 'Tú', pts: save.best, me: true });
      rows.sort((a, b) => b.pts - a.pts);
      const ol = $('shRankList'); ol.innerHTML = '';
      rows.forEach((r, i) => {
        const li = document.createElement('li'); if (r.me) li.className = 'me';
        li.innerHTML = `<span class="pos">${i + 1}</span><span class="nm"></span><span class="pts">${fmt(r.pts)}</span><span class="prz">${i < SHARES.length ? fmtEUR(POT * SHARES[i] / 100) : ''}</span>`;
        li.querySelector('.nm').textContent = r.name; ol.appendChild(li);
      });
      const me = ol.querySelector('.me'); if (me) setTimeout(() => me.scrollIntoView({ block: 'center' }), 30);
    }
    let rankReturn = 'shMenu';
    function openRanking(from) { rankReturn = from; renderRanking(); show('shRanking'); }

    let adTimer = null;
    function showAd(rewardText, done, fail) {
      audio(); S.state = 'ad';
      if (adController) {
        adController.show().then((r) => { if (r && r.done === false) fail('skip'); else done(); }).catch((r) => fail(r && r.error ? 'error' : 'skip'));
        return;
      }
      let n = 5; $('shAdReward').textContent = 'Recompensa: ' + rewardText; $('shAdCount').textContent = n; $('shAd').hidden = false;
      clearInterval(adTimer);
      adTimer = setInterval(() => {
        n--; if (n > 0) { $('shAdCount').textContent = n; return; }
        clearInterval(adTimer); $('shAdCount').textContent = '✓';
        setTimeout(() => { $('shAd').hidden = true; done(); }, 450);
      }, 1000);
    }

    let countTimer = null;
    function countdown(then) {
      if (!cfg.countdown) { S.state = 'play'; then && then(); return; }
      S.state = 'count'; let n = 3; const c = $('shCount'); c.hidden = false; c.textContent = n;
      clearInterval(countTimer);
      countTimer = setInterval(() => {
        n--; if (n > 0) { c.textContent = n; tone(520, 520, 0.08, 'square', 0.04); return; }
        if (n === 0) { c.textContent = '¡Ya!'; tone(880, 880, 0.12, 'square', 0.05); return; }
        clearInterval(countTimer); c.hidden = true; S.state = 'play'; then && then();
      }, 600);
    }

    function startRun(x2) {
      S.base = 0; S.coins = 0; S.mult = x2 ? 2 : 1; S.revivesLeft = maxRevives; S.stat = 0;
      show(null); $('shHud').hidden = false; S.state = 'starting';
      cfg.onStart(!!x2); paintHud(true);
      countdown(cfg.onGo);
    }
    function finish() {
      S.state = 'over'; $('shHud').hidden = true; $('shCount').hidden = true; clearInterval(countTimer);
      const pts = S.points, earned = S.coins * S.mult, isBest = pts > save.best;
      save = loadSave(cfg.id);
      save.best = Math.max(save.best, pts); save.coins += earned; save.runs++; writeSave(cfg.id, save);
      $('shRPts').textContent = fmt(pts); $('shRCoins').textContent = fmt(earned); $('shRStat').textContent = cfg.statFormat ? cfg.statFormat(S.stat) : fmt(S.stat);
      $('shNewBest').hidden = !isBest;
      const st = standing(list, save.best), box = $('shRStanding');
      if (st && st.prize > 0) box.innerHTML = `Si la semana acabara ahora: puesto <b>${st.pos}</b> y <b>${fmtEUR(st.prize)}</b> de premio.`;
      else box.textContent = standingText(list, save.best);
      if (cfg.onEnd) cfg.onEnd();
      show('shOver');
    }
    function crash() {
      if (S.state !== 'play') return;
      S.state = 'dying'; haptic('error');
      const f = $('shFlash'); f.style.transition = 'none'; f.style.opacity = '0.5';
      requestAnimationFrame(() => { f.style.transition = 'opacity .35s ease-out'; f.style.opacity = '0'; });
      setTimeout(() => {
        if (S.revivesLeft <= 0) { finish(); return; }
        S.state = 'crashed';
        $('shCrashPts').textContent = `${fmt(S.points)} puntos en esta partida`;
        $('shReviveLeft').textContent = `Ver un anuncio · quedan ${S.revivesLeft}`;
        show('shCrashed');
      }, cfg.crashDelay == null ? 750 : cfg.crashDelay);
    }
    function revive() {
      show(null);
      showAd(cfg.reviveReward || 'seguir jugando', () => {
        S.revivesLeft--; cfg.onRevive(); countdown(cfg.onGo);
      }, (why) => { S.state = 'crashed'; toast(adFailMsg(why)); show('shCrashed'); });
    }
    function pause() {
      if (S.state !== 'play' && S.state !== 'count') return;
      clearInterval(countTimer); $('shCount').hidden = true;
      S.state = 'paused'; if (cfg.onPause) cfg.onPause(); show('shPaused');
    }
    function resume() { show(null); countdown(cfg.onGo); }

    let lastPts = -1, lastCoins = -1, lastBadges = '';
    function paintHud(force) {
      const p = S.points, c = S.coins * S.mult;
      if (force || p !== lastPts) { $('shPts').textContent = fmt(p); lastPts = p; }
      if (force || c !== lastCoins) {
        const v = $('shCoins'); v.textContent = fmt(c);
        if (!force && c > lastCoins) { v.classList.remove('bump'); void v.offsetWidth; v.classList.add('bump'); }
        lastCoins = c;
      }
      const b = [];
      if (S.mult > 1) b.push(`${cfg.coinLabel || 'Monedas'} x2`);
      if (cfg.badges) b.push(...cfg.badges());
      const html = b.map((t) => `<span class="sh-badge">${t}</span>`).join('');
      if (html !== lastBadges) { $('shBadges').innerHTML = html; lastBadges = html; }
    }

    $('shPlay').onclick = () => { audio(); startRun(false); };
    $('shPlayX2').onclick = () => { show(null); showAd(`${(cfg.coinLabel || 'monedas').toLowerCase()} x2`, () => startRun(true), (w) => { S.state = 'menu'; toast(adFailMsg(w)); show('shMenu'); }); };
    $('shAgain').onclick = () => startRun(false);
    $('shAgainX2').onclick = () => { show(null); showAd(`${(cfg.coinLabel || 'monedas').toLowerCase()} x2`, () => startRun(true), (w) => { S.state = 'over'; toast(adFailMsg(w)); show('shOver'); }); };
    $('shRankBtn').onclick = () => openRanking('shMenu');
    $('shOverRank').onclick = () => openRanking('shOver');
    $('shRankBack').onclick = () => { refreshMenu(); show(rankReturn); };
    $('shHowBtn').onclick = () => show('shHow');
    $('shHowBack').onclick = () => show('shMenu');
    $('shOverMenu').onclick = () => { refreshMenu(); S.state = 'menu'; if (cfg.onMenu) cfg.onMenu(); show('shMenu'); };
    $('shRevive').onclick = revive;
    $('shEnd').onclick = finish;
    $('shPauseBtn').onclick = pause;
    $('shResume').onclick = resume;
    $('shQuit').onclick = finish;
    const paintMute = () => ($('shMute').textContent = muted ? 'Sonido: no' : 'Sonido: sí');
    $('shMute').onclick = () => { muted = !muted; store.set('arcade_mute', muted); paintMute(); if (!muted) audio(); };
    paintMute();
    document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') { if (S.state === 'paused') resume(); else pause(); } });

    refreshMenu(); show('shMenu');

    S.setBase = (n) => { S.base = n; };
    S.addBase = (n) => { S.base += n; };
    S.coin = (n) => { S.coins += n == null ? 1 : n; };
    S.crash = crash; S.finish = finish; S.paintHud = paintHud; S.toast = toast;
    S.playing = () => S.state === 'play';
    S.tone = tone; S.noise = noise; S.haptic = haptic;
    S.start = startRun; // para pruebas
    return S;
  }

  window.Arcade = {
    create, tgInit, loadSave, rivals, standing, fmt, fmtEUR, POT, SHARES, GAME_IDS, tgUser, audio, tone,
    get muted() { return muted; }
  };
})();
