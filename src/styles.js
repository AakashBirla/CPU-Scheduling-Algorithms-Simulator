// ─── Complete CSS (existing + all new features) ──────────────────────────────
export const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #060610; --bg2: #0d0d1f; --bg3: #11112a;
    --border: #1e1e3a; --border2: #2a2a50;
    --text: #c8ceff; --text2: #7880b0; --text3: #3a3f70;
    --accent: #00f5d4; --accent2: #ff2d78; --accent3: #ffd60a;
    --font-mono: 'Share Tech Mono', monospace;
    --font-display: 'Orbitron', sans-serif;
    --transition-theme: background 0.4s ease, color 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease;
  }

  /* ── Light Mode (Feature 12) ───────────────────────────────────────────── */
  body.light-mode {
    --bg: #f0f2f8; --bg2: #ffffff; --bg3: #e8eaf2;
    --border: #ccd0e0; --border2: #b8bcd0;
    --text: #1a1a2e; --text2: #555580; --text3: #9999bb;
  }
  body.light-mode .star { opacity: 0 !important; }
  body.light-mode .gantt-bar.idle { background: #e0e0f0 !important; border-color: #ccc !important; color: #888 !important; }

  html { overflow-x: hidden; }
  body { background: var(--bg); color: var(--text); font-family: var(--font-mono); overflow-x: hidden; max-width: 100vw; transition: var(--transition-theme); }
  .stars { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
  .star { position: absolute; width: 2px; height: 2px; background: white; border-radius: 50%; animation: twinkle var(--d, 3s) var(--delay, 0s) infinite alternate; transition: opacity 0.4s; }
  @keyframes twinkle { from { opacity: 0.1; } to { opacity: 0.9; } }
  .app { min-height: 100vh; padding: 0 0 60px; position: relative; z-index: 1; overflow-x: hidden; }

  /* ── Header ─────────────────────────────────────────────────────────────── */
  .header { text-align: center; padding: 20px 12px 16px; }
  .title {
    font-family: var(--font-display); font-weight: 900; letter-spacing: 0.08em;
    font-size: clamp(13px, 4.5vw, 38px);
    background: linear-gradient(90deg, #fff 0%, var(--accent) 40%, var(--accent2) 80%, var(--accent3) 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    line-height: 1.3;
  }
  body.light-mode .title { background: linear-gradient(90deg, #111 0%, var(--accent) 40%, var(--accent2) 80%, var(--accent3) 100%); -webkit-background-clip: text; background-clip: text; }
  .subtitle { color: var(--text2); font-size: 10px; letter-spacing: 0.15em; margin-top: 5px; }
  .header-controls { display: flex; align-items: center; gap: 10px; justify-content: center; margin-top: 10px; }

  /* ── Dark/Light Toggle (Feature 12) ─────────────────────────────────────── */
  .mode-toggle { background: var(--bg3); border: 1px solid var(--border2); color: var(--text); font-size: 18px; padding: 0; border-radius: 50%; cursor: pointer; transition: all 0.3s; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; }
  .mode-toggle:hover { border-color: var(--accent); transform: rotate(30deg); }

  /* ── Layout ──────────────────────────────────────────────────────────────── */
  .main { display: flex; flex-direction: column; gap: 12px; max-width: 1100px; margin: 0 auto; padding: 0 12px; }
  @media(min-width: 768px) {
    .header { padding: 40px 20px 30px; }
    .title { font-size: clamp(18px, 4vw, 38px); }
    .subtitle { font-size: 12px; }
    .main { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 0 20px; }
  }

  .card { background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; padding: 14px; width: 100%; transition: var(--transition-theme); }
  @media(min-width: 768px) { .card { padding: 22px; } }
  .card-title { font-family: var(--font-display); font-size: 10px; letter-spacing: 0.15em; color: var(--text2); margin-bottom: 12px; text-transform: uppercase; }

  /* ── Inputs & Select ─────────────────────────────────────────────────────── */
  select, input[type=number], input[type=text] {
    width: 100%; background: var(--bg3); border: 1px solid var(--border2); color: var(--text);
    font-family: var(--font-mono); font-size: 14px; padding: 12px 14px; border-radius: 8px;
    outline: none; cursor: pointer; appearance: none; -webkit-appearance: none;
    min-height: 48px; transition: var(--transition-theme);
  }
  select:focus, input:focus { border-color: var(--accent); box-shadow: 0 0 0 2px rgba(0,245,212,0.1); }
  .algo-desc { background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; margin-top: 10px;
    font-size: 11px; color: var(--text2); line-height: 1.6; min-height: 56px; transition: var(--transition-theme); }
  .label { font-size: 11px; color: var(--text2); margin-bottom: 6px; margin-top: 12px; letter-spacing: 0.1em; }

  /* ── Buttons ─────────────────────────────────────────────────────────────── */
  .btn { padding: 12px 20px; border-radius: 8px; border: none; cursor: pointer; font-family: var(--font-mono); font-size: 13px; transition: all 0.2s; min-height: 44px; }
  .btn-primary { background: white; color: #000; font-weight: bold; width: 100%; margin-top: 12px; min-height: 48px; }
  body.light-mode .btn-primary { background: #111; color: #fff; }
  .btn-primary:hover { background: var(--accent); }
  .btn-primary:active { transform: scale(0.97); }
  .btn-sm {
    background: var(--bg3); border: 1px solid var(--border2); color: var(--text2);
    font-size: 11px; padding: 10px 16px; min-height: 44px; min-width: 44px;
    border-radius: 8px; cursor: pointer; transition: all 0.2s; font-family: var(--font-mono);
  }
  .btn-sm:hover { border-color: var(--accent); color: var(--accent); }
  .btn-danger { background: var(--bg3); border: 1px solid #3a1a1a; color: #ff6060; font-size: 11px; padding: 12px 16px; width: 100%; margin-top: 8px; border-radius: 8px; cursor: pointer; min-height: 44px; font-family: var(--font-mono); transition: all 0.2s; }
  .btn-danger:hover { border-color: #ff6060; }
  .btn-compare { background: linear-gradient(90deg, var(--accent2), var(--accent)); color: #000; font-family: var(--font-display); font-size: 11px; font-weight: 700; letter-spacing: 0.1em; padding: 12px 20px; border: none; border-radius: 8px; cursor: pointer; width: 100%; margin-top: 10px; min-height: 48px; transition: all 0.2s; }
  .btn-compare:active { transform: scale(0.97); }

  /* ── Process cards ──────────────────────────────────────────────────────── */
  .process-item { display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; margin-bottom: 6px; transition: var(--transition-theme); }
  .process-item.starving { border-color: #ff4060 !important; background: rgba(255,64,96,0.08) !important; }
  .process-dot { width: 28px; height: 28px; border-radius: 6px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; color: #000; }
  .process-info { flex: 1; min-width: 0; }
  .process-name { font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .process-meta { font-size: 10px; color: var(--text2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .remove-btn {
    background: none; border: none; color: var(--text3); cursor: pointer;
    font-size: 20px; line-height: 1;
    padding: 0; min-width: 44px; min-height: 44px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 8px; flex-shrink: 0; transition: color 0.15s;
  }
  .remove-btn:hover { color: var(--accent2); }

  /* ── Section wrapper ─────────────────────────────────────────────────────── */
  .section { max-width: 1100px; margin: 12px auto 0; padding: 0 12px; }
  @media(min-width: 768px) { .section { margin: 24px auto 0; padding: 0 20px; } }

  /* ── Gantt chart ─────────────────────────────────────────────────────────── */
  .gantt-wrap { background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; padding: 14px; transition: var(--transition-theme); }
  @media(min-width: 768px) { .gantt-wrap { padding: 24px; } }
  .gantt-title { font-family: var(--font-display); font-size: 11px; letter-spacing: 0.15em; color: var(--text2); margin-bottom: 10px; }
  .gantt-scroll-outer { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .gantt-scroll-inner { min-width: 480px; }
  .gantt-row { display: flex; align-items: center; height: 52px; position: relative; border-radius: 6px; overflow: visible; }
  .gantt-bar { height: 100%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; color: #000; transition: all 0.3s; position: relative; }
  .gantt-bar.idle { background: var(--bg3); border: 1px solid var(--border2); color: var(--text3); font-size: 10px; }
  .gantt-bar.io-bar { background: repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.15) 4px, rgba(255,255,255,0.15) 8px) !important; border: 2px dashed rgba(255,255,255,0.4); }

  .proc-timeline-wrap { margin-top: 14px; }
  .proc-row { display: flex; align-items: center; margin-bottom: 7px; gap: 6px; }
  .proc-row-label { font-size: 10px; font-weight: bold; color: var(--text); width: 26px; flex-shrink: 0; text-align: right; }
  .proc-row-track { flex: 1; height: 30px; background: var(--bg3); border-radius: 6px; overflow: hidden; position: relative; border: 1px solid var(--border); }
  .proc-row-seg { position: absolute; top: 0; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; color: #000; border-radius: 4px; transition: opacity 0.1s; }
  .proc-row-seg.idle-seg { background: rgba(255,255,255,0.04); border: 1px solid var(--border); color: transparent; }
  .proc-row-seg.io-seg { background: repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.12) 3px, rgba(255,255,255,0.12) 6px) !important; border: 1px dashed rgba(255,255,255,0.3); }
  .proc-row-cursor { position: absolute; top: 0; bottom: 0; width: 2px; background: var(--accent); box-shadow: 0 0 6px var(--accent); pointer-events: none; transition: left 0.05s linear; }

  .gantt-labels { display: flex; position: relative; margin-top: 6px; height: 16px; font-size: 9px; color: var(--text2); }
  .gantt-label { position: absolute; transform: translateX(-50%); white-space: nowrap; }
  .anim-bar { height: 100%; position: absolute; left: 0; background: rgba(0,245,212,0.08); border-right: 2px solid var(--accent); transition: width 0.05s linear; pointer-events: none; }

  /* ── Export buttons (Feature 6, 7) ──────────────────────────────────────── */
  .export-row { display: flex; gap: 6px; flex-wrap: wrap; }

  /* ── Playback controls ───────────────────────────────────────────────────── */
  .play-controls { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; margin-bottom: 10px; }
  .play-btn {
    background: var(--bg3); border: 1px solid var(--border2); color: var(--accent);
    font-size: 20px; padding: 0; border-radius: 10px; cursor: pointer; transition: all 0.15s;
    min-width: 52px; min-height: 52px; display: flex; align-items: center; justify-content: center;
  }
  .play-btn:hover { background: rgba(0,245,212,0.12); border-color: var(--accent); }
  .play-btn:active { transform: scale(0.9); }
  .step-btn {
    background: var(--bg3); border: 1px solid var(--border2); color: var(--text);
    font-size: 18px; padding: 0; border-radius: 10px; cursor: pointer; transition: all 0.15s;
    min-width: 44px; min-height: 44px; display: flex; align-items: center; justify-content: center;
  }
  .step-btn:hover:not(:disabled) { background: rgba(255,255,255,0.06); border-color: var(--accent3); color: var(--accent3); }
  .step-btn:active:not(:disabled) { transform: scale(0.9); }
  .step-btn:disabled { opacity: 0.3; cursor: default; }
  .speed-row { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
  .speed-label { font-size: 9px; color: var(--text2); letter-spacing: 0.06em; white-space: nowrap; }
  .speed-slider { -webkit-appearance: none; appearance: none; flex: 1; height: 6px; border-radius: 3px; background: linear-gradient(90deg, var(--accent) calc(var(--pct,50%) * 1%), var(--border2) calc(var(--pct,50%) * 1%)); outline: none; cursor: pointer; }
  .speed-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 6px var(--accent); cursor: pointer; }
  .speed-slider::-moz-range-thumb { width: 20px; height: 20px; border-radius: 50%; background: var(--accent); border: none; cursor: pointer; }
  .tick-display { font-size: 10px; color: var(--text2); margin-left: auto; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .progress-bar-wrap { height: 3px; background: var(--bg3); border-radius: 2px; margin-bottom: 12px; }
  .progress-bar-fill { height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent2)); border-radius: 2px; transition: width 0.1s linear; }

  /* ── Results table ───────────────────────────────────────────────────────── */
  .table-wrap { background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; margin-top: 12px; transition: var(--transition-theme); }
  .table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; min-width: 420px; }
  th { background: var(--bg3); color: var(--text2); font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase; padding: 10px 10px; text-align: center; border-bottom: 1px solid var(--border); white-space: nowrap; }
  td { padding: 8px 10px; text-align: center; border-bottom: 1px solid var(--border); font-size: 11px; }
  tr:last-child td { border-bottom: none; }
  tr.total-row td { background: var(--bg3); color: var(--accent); font-weight: bold; }
  tr.starving-row td { background: rgba(255,64,96,0.08) !important; }
  @media(min-width: 768px) {
    table { font-size: 13px; }
    th { font-size: 10px; padding: 12px 16px; }
    td { padding: 10px 16px; font-size: 13px; }
  }

  /* ── Stats grid ──────────────────────────────────────────────────────────── */
  .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 12px; }
  @media(min-width: 768px) { .stats-grid { grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 20px; } }
  .stat-card { background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; padding: 12px 10px; text-align: center; transition: border-color 0.3s, var(--transition-theme); }
  @media(min-width: 768px) { .stat-card { padding: 18px; } }
  .stat-card:hover { border-color: var(--accent); }
  .stat-label { font-size: 9px; color: var(--text2); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 6px; }
  .stat-value { font-family: var(--font-display); font-size: 18px; color: #fff; transition: color 0.2s; }
  body.light-mode .stat-value { color: #111; }
  @media(min-width: 768px) { .stat-value { font-size: 22px; } }
  .stat-unit { font-size: 10px; color: var(--text2); margin-top: 4px; }

  /* ── Compare charts ──────────────────────────────────────────────────────── */
  .compare-wrap { background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; padding: 14px; margin-top: 12px; transition: var(--transition-theme); }
  @media(min-width: 768px) { .compare-wrap { padding: 24px; margin-top: 20px; } }
  .compare-title { font-family: var(--font-display); font-size: 11px; letter-spacing: 0.12em; color: var(--text2); margin-bottom: 14px; }
  .compare-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
  @media(min-width: 640px) { .compare-grid { grid-template-columns: 1fr 1fr; } }
  .compare-chart-title { font-size: 10px; color: var(--text2); margin-bottom: 10px; letter-spacing: 0.08em; }
  .bar-group { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  .bar-algo-label { font-size: 10px; color: var(--text); width: 42px; flex-shrink: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .bar-track { flex: 1; height: 24px; background: var(--bg3); border-radius: 4px; overflow: hidden; position: relative; }
  .bar-fill { height: 100%; border-radius: 4px; display: flex; align-items: center; padding-left: 6px; font-size: 10px; color: #000; font-weight: bold; transition: width 0.8s ease; white-space: nowrap; }

  .compare-summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 14px; }
  @media(min-width: 640px) { .compare-summary-grid { grid-template-columns: repeat(3, 1fr); } }
  @media(min-width: 900px) { .compare-summary-grid { grid-template-columns: repeat(5, 1fr); } }

  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; }

  /* ── Modal ───────────────────────────────────────────────────────────────── */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 100; display: flex; align-items: flex-end; justify-content: center; }
  @media(min-width: 480px) { .modal-overlay { align-items: center; padding: 20px; } }
  .modal {
    background: var(--bg2); border: 1px solid var(--border2);
    border-radius: 20px 20px 0 0;
    padding: 28px 20px 36px;
    width: 100%; max-height: 90vh; overflow-y: auto; transition: var(--transition-theme);
  }
  @media(min-width: 480px) {
    .modal { border-radius: 16px; max-width: 420px; padding: 28px; }
  }
  .modal-title { font-family: var(--font-display); font-size: 13px; letter-spacing: 0.1em; color: var(--accent); margin-bottom: 20px; }
  .input-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
  .input-group { }

  /* ── Tab bar ─────────────────────────────────────────────────────────────── */
  .tab-bar-row { max-width: 1100px; margin: 0 auto 10px; padding: 0 12px; display: flex; flex-direction: column; gap: 10px; }
  @media(min-width: 500px) { .tab-bar-row { flex-direction: row; justify-content: space-between; align-items: center; margin-bottom: 14px; padding: 0 20px; } }
  .tab-wrap { display: flex; gap: 6px; flex-wrap: wrap; }
  .tab {
    background: var(--bg3); border: 1px solid var(--border); color: var(--text2);
    font-family: var(--font-mono); font-size: 11px; padding: 10px 14px; border-radius: 8px;
    cursor: pointer; transition: all 0.2s; min-height: 44px; display: flex; align-items: center;
  }
  .tab.active { border-color: var(--accent); color: var(--accent); background: rgba(0,245,212,0.05); }

  /* ── Toast ───────────────────────────────────────────────────────────────── */
  .toast { position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%); background: var(--bg2); border: 1px solid var(--accent); color: var(--accent); padding: 12px 24px; border-radius: 10px; font-size: 12px; z-index: 200; animation: slideIn 0.3s ease; white-space: nowrap; }
  .toast.error { border-color: #ff4060; color: #ff4060; }
  @keyframes slideIn { from { transform: translateX(-50%) translateY(20px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }

  .empty-state { text-align: center; padding: 24px; color: var(--text3); font-size: 12px; }

  .select-wrap { position: relative; }
  .select-arrow { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: var(--text2); pointer-events: none; font-size: 10px; }

  /* ── Theme picker ────────────────────────────────────────────────────────── */
  .theme-picker { display: flex; gap: 8px; }
  .theme-swatch { width: 28px; height: 28px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; transition: all 0.2s; }
  .theme-swatch:hover { transform: scale(1.2); }
  .theme-swatch.active { border-color: white; box-shadow: 0 0 8px rgba(255,255,255,0.4); transform: scale(1.15); }

  /* ── Confetti ────────────────────────────────────────────────────────────── */
  .confetti-canvas { position: fixed; inset: 0; pointer-events: none; z-index: 300; }

  /* ── Winner glow ─────────────────────────────────────────────────────────── */
  @keyframes winnerPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(0,245,212,0.3); } 50% { box-shadow: 0 0 20px 8px rgba(0,245,212,0.15); } }
  .winner-card { animation: winnerPulse 2s infinite; border-color: var(--accent) !important; }

  /* ── Swipeable container ─────────────────────────────────────────────────── */
  .swipe-container { touch-action: pan-y; user-select: none; }

  /* ── Gantt view toggle ───────────────────────────────────────────────────── */
  .view-toggle { display: flex; gap: 6px; flex-wrap: wrap; }
  .view-toggle-btn {
    background: var(--bg3); border: 1px solid var(--border2); color: var(--text2);
    font-size: 10px; padding: 8px 12px; border-radius: 6px; cursor: pointer; transition: all 0.15s;
    min-height: 36px; min-width: 44px; font-family: var(--font-mono);
  }
  .view-toggle-btn.active { border-color: var(--accent); color: var(--accent); background: rgba(0,245,212,0.06); }

  /* ── Explanation box ─────────────────────────────────────────────────────── */
  .explain-wrap { margin-top: 14px; background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; transition: var(--transition-theme); }
  .explain-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-bottom: 1px solid var(--border); gap: 8px; flex-wrap: wrap; }
  .explain-title { font-family: var(--font-display); font-size: 9px; letter-spacing: 0.12em; color: var(--text2); }
  .explain-body { padding: 10px 14px; max-height: 160px; overflow-y: auto; scroll-behavior: smooth; }
  .explain-line { display: flex; gap: 8px; padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.03); font-size: 11px; line-height: 1.5; animation: fadeSlide 0.25s ease; }
  .explain-line:last-child { border-bottom: none; }
  .explain-line.current { color: #fff; background: rgba(0,245,212,0.06); border-radius: 4px; padding: 5px 8px; margin: 0 -8px; }
  body.light-mode .explain-line.current { color: #111; background: rgba(0,245,212,0.12); }
  .explain-tick { color: var(--accent); font-weight: bold; min-width: 34px; flex-shrink: 0; font-size: 10px; }
  .explain-text { color: var(--text2); font-size: 11px; }
  @keyframes fadeSlide { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

  /* ── Quiz panel ──────────────────────────────────────────────────────────── */
  .quiz-wrap { background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; padding: 16px; margin-top: 0; transition: var(--transition-theme); }
  @media(min-width: 768px) { .quiz-wrap { padding: 28px; } }
  .quiz-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 8px; }
  .quiz-title { font-family: var(--font-display); font-size: 12px; letter-spacing: 0.1em; color: var(--text2); }
  .quiz-score { font-family: var(--font-display); font-size: 11px; color: var(--accent); }
  .quiz-question { font-size: 12px; color: var(--text); margin-bottom: 14px; line-height: 1.7; background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; padding: 12px; transition: var(--transition-theme); }
  .quiz-proc-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 14px; }
  .quiz-proc-table th { background: transparent; color: var(--text2); font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; padding: 6px 8px; text-align: center; border-bottom: 1px solid var(--border); }
  .quiz-proc-table td { padding: 6px 8px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.03); }
  .quiz-choices { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; }
  .quiz-choice { background: var(--bg3); border: 1px solid var(--border2); color: var(--text); font-family: var(--font-mono); font-size: 12px; padding: 14px 12px; border-radius: 8px; cursor: pointer; transition: all 0.15s; text-align: left; min-height: 48px; }
  .quiz-choice:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); background: rgba(0,245,212,0.04); }
  .quiz-choice:disabled { cursor: default; }
  .quiz-choice.correct { border-color: #39ff14; color: #39ff14; background: rgba(57,255,20,0.06); }
  .quiz-choice.wrong { border-color: #ff4060; color: #ff4060; background: rgba(255,64,96,0.06); }
  .quiz-choice.reveal { border-color: #39ff14; color: #39ff14; background: rgba(57,255,20,0.04); }
  .quiz-feedback { border-radius: 8px; padding: 12px 14px; margin-bottom: 14px; font-size: 12px; line-height: 1.7; }
  .quiz-feedback.correct { background: rgba(57,255,20,0.07); border: 1px solid rgba(57,255,20,0.3); color: #80ffaa; }
  .quiz-feedback.wrong { background: rgba(255,64,96,0.07); border: 1px solid rgba(255,64,96,0.3); color: #ffaaaa; }
  body.light-mode .quiz-feedback.correct { color: #1a8040; }
  body.light-mode .quiz-feedback.wrong { color: #c03050; }
  .quiz-streak { display: flex; gap: 4px; margin-bottom: 12px; flex-wrap: wrap; }
  .quiz-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--border2); transition: background 0.3s; }
  .quiz-dot.hit { background: var(--accent); }
  .quiz-dot.miss { background: #ff4060; }
  .difficulty-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 9px; font-weight: bold; letter-spacing: 0.08em; margin-left: 8px; }
  .difficulty-easy { background: rgba(57,255,20,0.15); color: #39ff14; }
  .difficulty-medium { background: rgba(255,214,10,0.15); color: #ffd60a; }
  .difficulty-hard { background: rgba(255,45,120,0.15); color: #ff2d78; }

  /* ── Starvation Alert (Feature 5) ────────────────────────────────────────── */
  .starvation-alert { background: rgba(255,64,96,0.08); border: 1px solid rgba(255,64,96,0.3); border-radius: 10px; padding: 12px 14px; margin-top: 10px; }
  .starvation-alert-title { font-family: var(--font-display); font-size: 9px; letter-spacing: 0.1em; color: #ff6060; margin-bottom: 8px; }
  .starvation-alert-item { font-size: 11px; color: #ff8888; padding: 4px 0; }

  /* ── Algorithm Info Tooltip (Feature 11) ──────────────────────────────────── */
  .algo-info-btn { background: none; border: none; color: var(--text2); font-size: 16px; cursor: pointer; padding: 4px 8px; transition: color 0.2s; position: relative; }
  .algo-info-btn:hover { color: var(--accent); }
  .algo-tooltip { position: absolute; top: 100%; left: 0; z-index: 50; background: var(--bg2); border: 1px solid var(--accent); border-radius: 10px; padding: 14px; width: 280px; box-shadow: 0 8px 32px rgba(0,0,0,0.5); animation: fadeSlide 0.2s ease; }
  body.light-mode .algo-tooltip { box-shadow: 0 8px 32px rgba(0,0,0,0.15); }
  .algo-tooltip-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 10px; border-bottom: 1px solid var(--border); }
  .algo-tooltip-row:last-child { border-bottom: none; }
  .algo-tooltip-label { color: var(--text2); }
  .algo-tooltip-value { color: var(--text); font-weight: bold; }

  /* ── Utilization Chart (Feature 3) ───────────────────────────────────────── */
  .util-chart-wrap { margin-top: 14px; background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; padding: 14px; transition: var(--transition-theme); }
  .util-chart-title { font-family: var(--font-display); font-size: 9px; letter-spacing: 0.12em; color: var(--text2); margin-bottom: 10px; }

  /* ── Process State Diagram (Feature 4) ───────────────────────────────────── */
  .state-diagram-wrap { margin-top: 14px; background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; transition: var(--transition-theme); }
  .state-diagram-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-bottom: 1px solid var(--border); cursor: pointer; }
  .state-diagram-title { font-family: var(--font-display); font-size: 9px; letter-spacing: 0.12em; color: var(--text2); }
  .state-diagram-body { padding: 14px; overflow-x: auto; }

  /* ── History Panel (Feature 13) ──────────────────────────────────────────── */
  .history-wrap { background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; padding: 16px; transition: var(--transition-theme); }
  @media(min-width: 768px) { .history-wrap { padding: 28px; } }
  .history-item { background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; padding: 12px; margin-bottom: 8px; cursor: pointer; transition: all 0.2s; }
  .history-item:hover { border-color: var(--accent); }
  .history-item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
  .history-item-algo { font-family: var(--font-display); font-size: 11px; color: var(--accent); }
  .history-item-time { font-size: 9px; color: var(--text3); }
  .history-item-stats { display: flex; gap: 16px; font-size: 10px; color: var(--text2); }

  /* ── CSV Import (Feature 8) ──────────────────────────────────────────────── */
  .csv-help { font-size: 10px; color: var(--text2); background: var(--bg3); border: 1px solid var(--border); border-radius: 6px; padding: 8px 10px; margin: 10px 0; line-height: 1.6; font-family: var(--font-mono); }

  /* ── Preset selector (Feature 10) ────────────────────────────────────────── */
  .preset-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 8px; }
  .preset-btn { background: var(--bg3); border: 1px solid var(--border); color: var(--text); font-family: var(--font-mono); font-size: 10px; padding: 10px 8px; border-radius: 8px; cursor: pointer; transition: all 0.2s; text-align: left; min-height: 44px; }
  .preset-btn:hover { border-color: var(--accent); color: var(--accent); }
  .preset-desc { font-size: 9px; color: var(--text3); margin-top: 3px; line-height: 1.4; }

  /* ── Aging checkbox (Feature 2) ──────────────────────────────────────────── */
  .aging-toggle { display: flex; align-items: center; gap: 8px; margin-top: 10px; font-size: 11px; color: var(--text2); cursor: pointer; }
  .aging-toggle input[type=checkbox] { width: 18px; height: 18px; accent-color: var(--accent); cursor: pointer; min-height: auto; }
  .aged-badge { display: inline-block; font-size: 9px; color: #39ff14; margin-left: 4px; animation: fadeSlide 0.3s; }

  /* ── Print styles (Feature 6) ────────────────────────────────────────────── */
  @media print {
    body { background: white !important; color: #111 !important; }
    body * { color: #111 !important; transition: none !important; animation: none !important; }
    .stars, .confetti-canvas, .tab-bar-row, .play-controls, .speed-row, .mode-toggle,
    .header-controls, .theme-picker, .btn-compare, .btn-primary, .btn-sm, .btn-danger,
    .remove-btn, .view-toggle, .export-row, .explain-wrap, .state-diagram-wrap,
    .util-chart-wrap, .preset-grid, .aging-toggle, .starvation-alert, .process-item,
    .modal-overlay, .toast, .algo-info-btn, .footer-text { display: none !important; }
    .app { padding: 0 !important; }
    .header { padding: 10px 0 !important; }
    .title { font-size: 16px !important; -webkit-text-fill-color: #111 !important; background: none !important; }
    .subtitle { color: #666 !important; }
    .main { display: block !important; padding: 0 !important; }
    .card { border: 1px solid #ddd !important; background: white !important; margin-bottom: 12px !important; page-break-inside: avoid; }
    .section { padding: 0 !important; margin: 12px 0 !important; }
    .gantt-wrap { background: white !important; border: 1px solid #ddd !important; page-break-inside: avoid; }
    .gantt-bar { color: #fff !important; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .gantt-bar.idle { color: #999 !important; background: #eee !important; }
    .table-wrap { background: white !important; border: 1px solid #ddd !important; page-break-inside: avoid; }
    th { background: #f5f5f5 !important; color: #333 !important; }
    td { color: #111 !important; }
    .stat-card { background: white !important; border: 1px solid #ddd !important; }
    .stat-value { color: #111 !important; }
    .stats-grid { page-break-inside: avoid; }
    .print-info { display: block !important; font-size: 11px; color: #666; margin-bottom: 12px; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
    .progress-bar-wrap { display: none !important; }
    .gantt-scroll-inner { min-width: auto !important; }
  }
  .print-info { display: none; }
`;
