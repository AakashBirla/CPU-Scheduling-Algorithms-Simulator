import { useState, useEffect, useRef, useCallback } from "react";

// ─── Scheduling Algorithms ────────────────────────────────────────────────────

function fcfs(processes) {
  const procs = [...processes].sort((a, b) => a.arrival - b.arrival);
  const timeline = [];
  let time = 0;
  for (const p of procs) {
    if (time < p.arrival) { timeline.push({ pid: "Idle", start: time, end: p.arrival }); time = p.arrival; }
    timeline.push({ pid: p.pid, start: time, end: time + p.burst, color: p.color });
    time += p.burst;
  }
  return timeline;
}

function sjf(processes) {
  const procs = processes.map(p => ({ ...p, remaining: p.burst }));
  const timeline = [];
  let time = 0, done = 0;
  while (done < procs.length) {
    const available = procs.filter(p => p.arrival <= time && p.remaining > 0);
    if (!available.length) { time++; continue; }
    available.sort((a, b) => a.burst - b.burst);
    const cur = available[0];
    const start = time;
    time += cur.remaining;
    cur.remaining = 0;
    done++;
    timeline.push({ pid: cur.pid, start, end: time, color: cur.color });
  }
  return mergeTimeline(timeline);
}

function srtf(processes) {
  const procs = processes.map(p => ({ ...p, remaining: p.burst }));
  const timeline = [];
  let time = 0, done = 0;
  while (done < procs.length) {
    const available = procs.filter(p => p.arrival <= time && p.remaining > 0);
    if (!available.length) { time++; continue; }
    available.sort((a, b) => a.remaining - b.remaining);
    const cur = available[0];
    const last = timeline[timeline.length - 1];
    if (last && last.pid === cur.pid) { last.end++; }
    else { timeline.push({ pid: cur.pid, start: time, end: time + 1, color: cur.color }); }
    cur.remaining--;
    if (cur.remaining === 0) done++;
    time++;
  }
  return mergeTimeline(timeline);
}

function prioritySched(processes) {
  const procs = [...processes].sort((a, b) => a.arrival - b.arrival || a.priority - b.priority);
  const timeline = [];
  let time = 0, remaining = procs.map(p => ({ ...p }));
  while (remaining.some(p => p.burst > 0)) {
    const available = remaining.filter(p => p.arrival <= time && p.burst > 0);
    if (!available.length) { time++; continue; }
    available.sort((a, b) => a.priority - b.priority);
    const cur = available[0];
    const found = remaining.find(p => p.pid === cur.pid);
    timeline.push({ pid: cur.pid, start: time, end: time + found.burst, color: cur.color });
    time += found.burst;
    found.burst = 0;
  }
  return mergeTimeline(timeline);
}

function roundRobin(processes, quantum) {
  const procs = processes.map(p => ({ ...p, remaining: p.burst }));
  const timeline = [];
  let time = 0;
  const queue = [];
  const arrived = new Set();
  procs.sort((a, b) => a.arrival - b.arrival);
  let i = 0;
  if (procs[0]) { queue.push(procs[0]); arrived.add(procs[0].pid); i = 1; }
  while (queue.length) {
    const cur = queue.shift();
    if (time < cur.arrival) time = cur.arrival;
    const exec = Math.min(quantum, cur.remaining);
    timeline.push({ pid: cur.pid, start: time, end: time + exec, color: cur.color });
    time += exec;
    cur.remaining -= exec;
    while (i < procs.length && procs[i].arrival <= time) { if (!arrived.has(procs[i].pid)) { queue.push(procs[i]); arrived.add(procs[i].pid); } i++; }
    if (cur.remaining > 0) queue.push(cur);
  }
  return mergeTimeline(timeline);
}

function mergeTimeline(tl) {
  if (!tl.length) return tl;
  const merged = [tl[0]];
  for (let i = 1; i < tl.length; i++) {
    const last = merged[merged.length - 1];
    if (last.pid === tl[i].pid && last.end === tl[i].start) last.end = tl[i].end;
    else merged.push(tl[i]);
  }
  return merged;
}

function calcMetrics(processes, timeline) {
  return processes.map(p => {
    const segments = timeline.filter(t => t.pid === p.pid);
    if (!segments.length) return { ...p, ct: 0, tat: 0, wt: 0 };
    const ct = Math.max(...segments.map(s => s.end));
    const tat = ct - p.arrival;
    const wt = tat - p.burst;
    return { ...p, ct, tat, wt };
  });
}

// ─── Build Tick-by-Tick Explanations ─────────────────────────────────────────
function buildExplanations(timeline, processes, algoKey) {
  const totalTime = timeline.length ? Math.max(...timeline.map(t => t.end)) : 0;
  const lines = [];
  const arrived = new Set();
  const finished = new Set();
  let runningPid = null;

  for (let t = 0; t <= totalTime; t++) {
    const events = [];
    for (const p of processes) {
      if (p.arrival === t && !arrived.has(p.pid)) {
        arrived.add(p.pid);
        events.push(`${p.pid} arrives (burst=${p.burst})`);
      }
    }
    const curSeg = timeline.find(s => s.pid !== "Idle" && s.start <= t && s.end > t);
    const isIdle = !curSeg;
    const nowRunning = curSeg ? curSeg.pid : "Idle";

    for (const seg of timeline) {
      if (seg.pid !== "Idle" && seg.end === t && !finished.has(seg.pid)) {
        const moreSegs = timeline.filter(s => s.pid === seg.pid && s.start >= t);
        if (!moreSegs.length) {
          finished.add(seg.pid);
          events.push(`${seg.pid} finishes execution`);
        }
      }
    }

    if (nowRunning !== runningPid) {
      if (nowRunning === "Idle") {
        events.push("CPU is idle — no process ready");
      } else {
        const rq = processes.filter(p => arrived.has(p.pid) && !finished.has(p.pid) && p.pid !== nowRunning);
        const rqStr = rq.length ? ` | Ready queue: [${rq.map(p => p.pid).join(", ")}]` : "";
        const reason = (() => {
          if (algoKey === "fcfs") return "arrived first";
          if (algoKey === "sjf" || algoKey === "srtf") return "shortest burst/remaining";
          if (algoKey === "priority") return "highest priority";
          if (algoKey === "rr") return "next in round-robin queue";
          return "scheduled";
        })();
        if (nowRunning !== "Idle") events.push(`${nowRunning} starts running — ${reason}${rqStr}`);
      }
      runningPid = nowRunning;
    } else if (!isIdle) {
      const seg = timeline.find(s => s.pid === nowRunning && s.start <= t && s.end > t);
      if (seg) {
        const rem = seg.end - t;
        if (rem > 1) events.push(`${nowRunning} running — ${rem} units remaining`);
      }
    }

    if (events.length === 0 && !isIdle) {
      const seg = timeline.find(s => s.pid === nowRunning && s.start <= t && s.end > t);
      if (seg) events.push(`${nowRunning} executing (${seg.end - t} left)`);
    }

    lines.push({ t, text: events.length ? events.join(" · ") : `t=${t}: CPU running ${nowRunning}` });
  }
  return lines;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const COLORS = ["#ff2d78", "#00f5d4", "#ffd60a", "#7b5ea7", "#ff6b35", "#4cc9f0", "#f72585", "#80ffdb"];
const ALGOS = [
  { key: "fcfs", label: "FCFS", desc: "First Come First Serve — processes are executed in the order they arrive. Simple, non-preemptive, and fair." },
  { key: "sjf", label: "SJF", desc: "Shortest Job First (Non-Preemptive) — the shortest burst-time process in the queue runs next. Minimizes average waiting time." },
  { key: "srtf", label: "SRTF", desc: "Shortest Remaining Time First — preemptive version of SJF. Runs the process closest to completion at every tick." },
  { key: "priority", label: "Priority", desc: "Priority Scheduling (Non-Preemptive) — each process has a priority; lower number = higher priority." },
  { key: "rr", label: "Round Robin", desc: "Round Robin — each process gets a fixed time quantum in a rotating queue. Fair and prevents starvation." },
];

// ─── Color Themes ─────────────────────────────────────────────────────────────
const THEMES = {
  cyan:   { accent: "#00f5d4", accent2: "#ff2d78", accent3: "#ffd60a", label: "Cyan",   emoji: "🩵" },
  pink:   { accent: "#ff2d78", accent2: "#ff9ff3", accent3: "#ffd60a", label: "Pink",   emoji: "🩷" },
  green:  { accent: "#39ff14", accent2: "#00c8a0", accent3: "#ffd60a", label: "Green",  emoji: "💚" },
  orange: { accent: "#ff6b35", accent2: "#ffd60a", accent3: "#ff2d78", label: "Orange", emoji: "🧡" },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #060610; --bg2: #0d0d1f; --bg3: #11112a;
    --border: #1e1e3a; --border2: #2a2a50;
    --text: #c8ceff; --text2: #7880b0; --text3: #3a3f70;
    --accent: #00f5d4; --accent2: #ff2d78; --accent3: #ffd60a;
    --font-mono: 'Share Tech Mono', monospace;
    --font-display: 'Orbitron', sans-serif;
  }
  html { overflow-x: hidden; }
  body { background: var(--bg); color: var(--text); font-family: var(--font-mono); overflow-x: hidden; max-width: 100vw; }
  .stars { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
  .star { position: absolute; width: 2px; height: 2px; background: white; border-radius: 50%; animation: twinkle var(--d, 3s) var(--delay, 0s) infinite alternate; }
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
  .subtitle { color: var(--text2); font-size: 10px; letter-spacing: 0.15em; margin-top: 5px; }

  /* ── Layout ──────────────────────────────────────────────────────────────── */
  .main { display: flex; flex-direction: column; gap: 12px; max-width: 1100px; margin: 0 auto; padding: 0 12px; }
  @media(min-width: 768px) {
    .header { padding: 40px 20px 30px; }
    .title { font-size: clamp(18px, 4vw, 38px); }
    .subtitle { font-size: 12px; }
    .main { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 0 20px; }
  }

  .card { background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; padding: 14px; width: 100%; }
  @media(min-width: 768px) { .card { padding: 22px; } }
  .card-title { font-family: var(--font-display); font-size: 10px; letter-spacing: 0.15em; color: var(--text2); margin-bottom: 12px; text-transform: uppercase; }

  /* ── Inputs & Select ─────────────────────────────────────────────────────── */
  select, input[type=number] {
    width: 100%; background: var(--bg3); border: 1px solid var(--border2); color: var(--text);
    font-family: var(--font-mono); font-size: 14px; padding: 12px 14px; border-radius: 8px;
    outline: none; cursor: pointer; appearance: none; -webkit-appearance: none;
    min-height: 48px;
  }
  select:focus, input:focus { border-color: var(--accent); box-shadow: 0 0 0 2px rgba(0,245,212,0.1); }
  .algo-desc { background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; margin-top: 10px;
    font-size: 11px; color: var(--text2); line-height: 1.6; min-height: 56px; }
  .label { font-size: 11px; color: var(--text2); margin-bottom: 6px; margin-top: 12px; letter-spacing: 0.1em; }

  /* ── Buttons ─────────────────────────────────────────────────────────────── */
  .btn { padding: 12px 20px; border-radius: 8px; border: none; cursor: pointer; font-family: var(--font-mono); font-size: 13px; transition: all 0.2s; min-height: 44px; }
  .btn-primary { background: white; color: #000; font-weight: bold; width: 100%; margin-top: 12px; min-height: 48px; }
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

  /* ── Process cards (compact for mobile) ──────────────────────────────────── */
  .process-item { display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; margin-bottom: 6px; }
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
  .gantt-wrap { background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; padding: 14px; }
  @media(min-width: 768px) { .gantt-wrap { padding: 24px; } }
  .gantt-title { font-family: var(--font-display); font-size: 11px; letter-spacing: 0.15em; color: var(--text2); margin-bottom: 10px; }
  .gantt-scroll-outer { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .gantt-scroll-inner { min-width: 480px; }

  /* Combined Gantt row */
  .gantt-row { display: flex; align-items: center; height: 52px; position: relative; border-radius: 6px; overflow: visible; }
  .gantt-bar { height: 100%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; color: #000; transition: all 0.3s; position: relative; }
  .gantt-bar.idle { background: var(--bg3); border: 1px solid var(--border2); color: var(--text3); font-size: 10px; }

  /* Per-process timeline rows */
  .proc-timeline-wrap { margin-top: 14px; }
  .proc-row { display: flex; align-items: center; margin-bottom: 7px; gap: 6px; }
  .proc-row-label { font-size: 10px; font-weight: bold; color: var(--text); width: 26px; flex-shrink: 0; text-align: right; }
  .proc-row-track { flex: 1; height: 30px; background: var(--bg3); border-radius: 6px; overflow: hidden; position: relative; border: 1px solid var(--border); }
  .proc-row-seg { position: absolute; top: 0; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; color: #000; border-radius: 4px; transition: opacity 0.1s; }
  .proc-row-seg.idle-seg { background: rgba(255,255,255,0.04); border: 1px solid var(--border); color: transparent; }
  .proc-row-cursor { position: absolute; top: 0; bottom: 0; width: 2px; background: var(--accent); box-shadow: 0 0 6px var(--accent); pointer-events: none; transition: left 0.05s linear; }

  .gantt-labels { display: flex; position: relative; margin-top: 6px; height: 16px; font-size: 9px; color: var(--text2); }
  .gantt-label { position: absolute; transform: translateX(-50%); white-space: nowrap; }
  .anim-bar { height: 100%; position: absolute; left: 0; background: rgba(0,245,212,0.08); border-right: 2px solid var(--accent); transition: width 0.05s linear; pointer-events: none; }

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
  .table-wrap { background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; margin-top: 12px; }
  .table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; min-width: 420px; }
  th { background: var(--bg3); color: var(--text2); font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase; padding: 10px 10px; text-align: center; border-bottom: 1px solid var(--border); white-space: nowrap; }
  td { padding: 8px 10px; text-align: center; border-bottom: 1px solid var(--border); font-size: 11px; }
  tr:last-child td { border-bottom: none; }
  tr.total-row td { background: var(--bg3); color: var(--accent); font-weight: bold; }
  @media(min-width: 768px) {
    table { font-size: 13px; }
    th { font-size: 10px; padding: 12px 16px; }
    td { padding: 10px 16px; font-size: 13px; }
  }

  /* ── Stats grid ──────────────────────────────────────────────────────────── */
  .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 12px; }
  @media(min-width: 768px) { .stats-grid { grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 20px; } }
  .stat-card { background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; padding: 12px 10px; text-align: center; transition: border-color 0.3s; }
  @media(min-width: 768px) { .stat-card { padding: 18px; } }
  .stat-card:hover { border-color: var(--accent); }
  .stat-label { font-size: 9px; color: var(--text2); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 6px; }
  .stat-value { font-family: var(--font-display); font-size: 18px; color: #fff; transition: color 0.2s; }
  @media(min-width: 768px) { .stat-value { font-size: 22px; } }
  .stat-unit { font-size: 10px; color: var(--text2); margin-top: 4px; }

  /* ── Compare charts ──────────────────────────────────────────────────────── */
  .compare-wrap { background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; padding: 14px; margin-top: 12px; }
  @media(min-width: 768px) { .compare-wrap { padding: 24px; margin-top: 20px; } }
  .compare-title { font-family: var(--font-display); font-size: 11px; letter-spacing: 0.12em; color: var(--text2); margin-bottom: 14px; }
  .compare-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
  @media(min-width: 640px) { .compare-grid { grid-template-columns: 1fr 1fr; } }
  .compare-chart-title { font-size: 10px; color: var(--text2); margin-bottom: 10px; letter-spacing: 0.08em; }
  .bar-group { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  .bar-algo-label { font-size: 10px; color: var(--text); width: 42px; flex-shrink: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .bar-track { flex: 1; height: 24px; background: var(--bg3); border-radius: 4px; overflow: hidden; position: relative; }
  .bar-fill { height: 100%; border-radius: 4px; display: flex; align-items: center; padding-left: 6px; font-size: 10px; color: #000; font-weight: bold; transition: width 0.8s ease; white-space: nowrap; }

  /* Compare summary grid: 2 cols mobile, 5 desktop */
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
    width: 100%; max-height: 90vh; overflow-y: auto;
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
  .explain-wrap { margin-top: 14px; background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
  .explain-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-bottom: 1px solid var(--border); gap: 8px; flex-wrap: wrap; }
  .explain-title { font-family: var(--font-display); font-size: 9px; letter-spacing: 0.12em; color: var(--text2); }
  .explain-body { padding: 10px 14px; max-height: 160px; overflow-y: auto; scroll-behavior: smooth; }
  .explain-line { display: flex; gap: 8px; padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.03); font-size: 11px; line-height: 1.5; animation: fadeSlide 0.25s ease; }
  .explain-line:last-child { border-bottom: none; }
  .explain-line.current { color: #fff; background: rgba(0,245,212,0.06); border-radius: 4px; padding: 5px 8px; margin: 0 -8px; }
  .explain-tick { color: var(--accent); font-weight: bold; min-width: 34px; flex-shrink: 0; font-size: 10px; }
  .explain-text { color: var(--text2); font-size: 11px; }
  @keyframes fadeSlide { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

  /* ── Quiz panel ──────────────────────────────────────────────────────────── */
  .quiz-wrap { background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; padding: 16px; margin-top: 0; }
  @media(min-width: 768px) { .quiz-wrap { padding: 28px; } }
  .quiz-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .quiz-title { font-family: var(--font-display); font-size: 12px; letter-spacing: 0.1em; color: var(--text2); }
  .quiz-score { font-family: var(--font-display); font-size: 11px; color: var(--accent); }
  .quiz-question { font-size: 12px; color: var(--text); margin-bottom: 14px; line-height: 1.7; background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; padding: 12px; }
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
  .quiz-streak { display: flex; gap: 4px; margin-bottom: 12px; flex-wrap: wrap; }
  .quiz-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--border2); transition: background 0.3s; }
  .quiz-dot.hit { background: var(--accent); }
  .quiz-dot.miss { background: #ff4060; }
`;

// ─── Stars Background ─────────────────────────────────────────────────────────
function Stars() {
  const stars = Array.from({ length: 80 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    delay: Math.random() * 4, dur: 2 + Math.random() * 3,
  }));
  return (
    <div className="stars">
      {stars.map(s => (
        <div key={s.id} className="star" style={{
          left: `${s.x}%`, top: `${s.y}%`,
          "--d": `${s.dur}s`, "--delay": `${s.delay}s`,
          opacity: Math.random() * 0.5 + 0.1,
        }} />
      ))}
    </div>
  );
}

// ─── Confetti Canvas ──────────────────────────────────────────────────────────
function Confetti({ trigger }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!trigger) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d");
    const colors = ["#ff2d78", "#00f5d4", "#ffd60a", "#7b5ea7", "#ff6b35", "#4cc9f0", "#f72585", "#39ff14"];
    particlesRef.current = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: -20,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 4 + 2,
      rot: Math.random() * 360,
      rotV: (Math.random() - 0.5) * 6,
      w: Math.random() * 8 + 4,
      h: Math.random() * 4 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1,
    }));
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of particlesRef.current) {
        p.x += p.vx; p.y += p.vy; p.rot += p.rotV; p.vy += 0.08; p.life -= 0.008;
        if (p.life <= 0 || p.y > canvas.height) continue;
        alive = true;
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (alive) rafRef.current = requestAnimationFrame(animate);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [trigger]);

  return <canvas ref={canvasRef} className="confetti-canvas" />;
}

// ─── Animated Number ──────────────────────────────────────────────────────────
function AnimCount({ target, decimals = 2, suffix = "" }) {
  const [display, setDisplay] = useState("0");
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const parsed = parseFloat(target);
  const isValid = !isNaN(parsed);

  useEffect(() => {
    if (!isValid) { setDisplay(target); return; }
    cancelAnimationFrame(rafRef.current);
    const duration = 900;
    startRef.current = null;
    const animate = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const t = Math.min((ts - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay((parsed * eased).toFixed(decimals) + suffix);
      if (t < 1) rafRef.current = requestAnimationFrame(animate);
      else setDisplay(parsed.toFixed(decimals) + suffix);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target]);  // eslint-disable-line

  return <span>{display}</span>;
}

// ─── Add Process Modal (full-screen on mobile) ────────────────────────────────
function AddModal({ onAdd, onClose, nextId, needsPriority }) {
  const [form, setForm] = useState({ arrival: 0, burst: 5, priority: 1 });
  const set = (k, v) => setForm(f => ({ ...f, [k]: Number(v) }));
  const submit = () => {
    if (!form.burst || form.burst < 1) return;
    onAdd({ arrival: form.arrival, burst: form.burst, priority: form.priority });
    onClose();
  };
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">ADD PROCESS {nextId}</div>
        <div className="input-row">
          <div className="input-group">
            <div className="label">Arrival Time</div>
            <input type="number" min="0" value={form.arrival} onChange={e => set("arrival", e.target.value)} />
          </div>
          <div className="input-group">
            <div className="label">Burst Time</div>
            <input type="number" min="1" value={form.burst} onChange={e => set("burst", e.target.value)} />
          </div>
        </div>
        {needsPriority && (
          <div className="input-group" style={{ marginBottom: 16 }}>
            <div className="label">Priority (lower = higher)</div>
            <input type="number" min="1" value={form.priority} onChange={e => set("priority", e.target.value)} />
          </div>
        )}
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <button className="btn btn-primary" style={{ flex: 1, marginTop: 0 }} onClick={submit}>Add Process</button>
          <button className="btn btn-sm" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Gantt Chart (horizontally scrollable) ────────────────────────────────────
function GanttChart({ timeline, processes, playing, tick, totalTime, viewMode }) {
  if (!timeline.length) return <div className="empty-state">Submit processes to see the Gantt Chart.</div>;
  const progress = (tick / totalTime) * 100;

  const procMap = {};
  for (const p of processes) procMap[p.pid] = [];
  for (const seg of timeline) {
    if (seg.pid !== "Idle" && procMap[seg.pid]) procMap[seg.pid].push(seg);
  }

  // Decide label density: show every Nth label to avoid overlap on small screens
  const totalLabels = timeline.length + 1;
  const labelStep = totalLabels > 20 ? 4 : totalLabels > 10 ? 2 : 1;

  return (
    <div>
      <div className="progress-bar-wrap">
        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="gantt-scroll-outer">
        <div className="gantt-scroll-inner">
          {viewMode === "combined" ? (
            <div style={{ position: "relative" }}>
              <div className="gantt-row">
                {timeline.map((seg, i) => {
                  const w = ((seg.end - seg.start) / totalTime) * 100;
                  const isIdle = seg.pid === "Idle";
                  return (
                    <div key={i} className={`gantt-bar ${isIdle ? "idle" : ""}`}
                      style={{ width: `${w}%`, background: isIdle ? undefined : seg.color, opacity: playing && seg.end > tick ? 0.25 : 1, transition: "opacity 0.1s" }}>
                      {isIdle ? "Idle" : seg.pid}
                    </div>
                  );
                })}
              </div>
              <div className="gantt-labels">
                {timeline.map((seg, i) => {
                  if (i % labelStep !== 0) return null;
                  return (
                    <span key={i} className="gantt-label" style={{ left: `${(seg.start / totalTime) * 100}%` }}>{seg.start}</span>
                  );
                })}
                <span className="gantt-label" style={{ left: "100%" }}>{totalTime}</span>
              </div>
            </div>
          ) : (
            /* Per-process rows view */
            <div className="proc-timeline-wrap">
              {processes.map(p => (
                <div key={p.pid} className="proc-row">
                  <div className="proc-row-label" style={{ color: p.color }}>{p.pid}</div>
                  <div className="proc-row-track">
                    {procMap[p.pid].map((seg, i) => {
                      const left = (seg.start / totalTime) * 100;
                      const width = ((seg.end - seg.start) / totalTime) * 100;
                      const faded = playing && seg.end > tick;
                      return (
                        <div key={i} className="proc-row-seg"
                          style={{ left: `${left}%`, width: `${width}%`, background: p.color, opacity: faded ? 0.2 : 0.9, border: `1px solid ${p.color}` }}>
                          {width > 8 ? p.pid : ""}
                        </div>
                      );
                    })}
                    {playing || tick > 0 ? (
                      <div className="proc-row-cursor" style={{ left: `${Math.min((tick / totalTime) * 100, 100)}%` }} />
                    ) : null}
                  </div>
                </div>
              ))}
              {/* Shared time axis */}
              <div style={{ paddingLeft: 32 }}>
                <div className="gantt-labels" style={{ position: "relative", marginTop: 4 }}>
                  {timeline.map((seg, i) => {
                    if (i % labelStep !== 0) return null;
                    return (
                      <span key={i} className="gantt-label" style={{ left: `${(seg.start / totalTime) * 100}%` }}>{seg.start}</span>
                    );
                  })}
                  <span className="gantt-label" style={{ left: "100%" }}>{totalTime}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Compare Charts ───────────────────────────────────────────────────────────
function CompareCharts({ results, bestAlgo }) {
  const ALGO_COLORS = { fcfs: "#ff2d78", sjf: "#ffd60a", srtf: "#7b5ea7", priority: "#ff6b35", rr: "#00f5d4" };
  const wtMax = Math.max(...Object.values(results).map(r => r.avgWT), 1);
  const tatMax = Math.max(...Object.values(results).map(r => r.avgTAT), 1);

  const Chart = ({ title, key_, max }) => (
    <div className="compare-chart">
      <div className="compare-chart-title">{title}</div>
      {Object.entries(results).map(([algo, r]) => {
        const val = key_ === "wt" ? r.avgWT : r.avgTAT;
        const pct = (val / max) * 100;
        return (
          <div key={algo} className="bar-group">
            <div className="bar-algo-label" style={{ color: algo === bestAlgo ? "var(--accent)" : undefined }}>{algo.toUpperCase()}</div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${pct}%`, background: ALGO_COLORS[algo] }}>
                {pct > 15 ? val.toFixed(1) : ""}
              </div>
            </div>
            {pct <= 15 && <span style={{ fontSize: 9, color: "var(--text2)", minWidth: 26 }}>{val.toFixed(1)}</span>}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="compare-grid">
      <Chart title="⏱ Avg Waiting Time (lower = better)" key_="wt" max={wtMax} />
      <Chart title="🔄 Avg Turnaround (lower = better)" key_="tat" max={tatMax} />
    </div>
  );
}

// ─── Explanation Box ──────────────────────────────────────────────────────────
function ExplanationBox({ explanations, tick, totalTime }) {
  const bodyRef = useRef(null);
  const [collapsed, setCollapsed] = useState(false);
  const visible = explanations.slice(0, tick + 1);

  useEffect(() => {
    if (bodyRef.current && !collapsed) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [tick, collapsed]);

  if (!explanations.length) return null;

  return (
    <div className="explain-wrap">
      <div className="explain-header">
        <span className="explain-title">📖 STEP-BY-STEP EXPLANATION</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 9, color: "var(--text2)" }}>t={tick}/{totalTime}</span>
          <button className="view-toggle-btn" onClick={() => setCollapsed(c => !c)}>
            {collapsed ? "▼ Show" : "▲ Hide"}
          </button>
        </div>
      </div>
      {!collapsed && (
        <div className="explain-body" ref={bodyRef}>
          {visible.length === 0 && (
            <div className="explain-line"><span style={{ color: "var(--text3)", fontSize: 11 }}>Press Play or step forward to see explanations.</span></div>
          )}
          {visible.map((line, i) => (
            <div key={line.t} className={`explain-line ${i === visible.length - 1 ? "current" : ""}`}>
              <span className="explain-tick">t={line.t}</span>
              <span className="explain-text">{line.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Quiz Panel ───────────────────────────────────────────────────────────────
const QUIZ_BANK = [
  {
    id: 1,
    procs: [
      { pid: "P1", arrival: 0, burst: 8 },
      { pid: "P2", arrival: 1, burst: 4 },
      { pid: "P3", arrival: 2, burst: 9 },
    ],
    question: "Which algorithm gives the lowest average waiting time for this process set?",
    answer: "sjf",
    explanation: "SJF picks the shortest burst next: P2 (burst=4) runs before P3 (burst=9), minimizing total waiting time. FCFS is hurt by P1's long burst.",
    choices: ["fcfs", "sjf", "srtf", "rr"],
  },
  {
    id: 2,
    procs: [
      { pid: "P1", arrival: 0, burst: 5 },
      { pid: "P2", arrival: 0, burst: 5 },
      { pid: "P3", arrival: 0, burst: 5 },
    ],
    question: "All 3 processes arrive together with equal burst times. Which algorithm gives lowest avg WT?",
    answer: "fcfs",
    explanation: "When all processes have equal burst and arrive simultaneously, FCFS, SJF, and Priority all perform identically (no preemption helps). FCFS = SJF here, but FCFS is the simplest correct answer. Round Robin adds overhead.",
    choices: ["fcfs", "srtf", "rr", "priority"],
  },
  {
    id: 3,
    procs: [
      { pid: "P1", arrival: 0, burst: 10 },
      { pid: "P2", arrival: 1, burst: 1 },
      { pid: "P3", arrival: 2, burst: 2 },
    ],
    question: "P1 has a very long burst. A short P2 arrives at t=1. Which gives lowest avg WT?",
    answer: "srtf",
    explanation: "SRTF preempts P1 when P2 arrives (remaining=9 > P2's burst=1). This keeps P2 and P3 from waiting behind P1's long burst, minimising WT dramatically.",
    choices: ["fcfs", "sjf", "srtf", "rr"],
  },
  {
    id: 4,
    procs: [
      { pid: "P1", arrival: 0, burst: 6 },
      { pid: "P2", arrival: 2, burst: 4 },
      { pid: "P3", arrival: 4, burst: 2 },
    ],
    question: "Processes arrive at different times with descending burst. Which algorithm is best for avg WT?",
    answer: "srtf",
    explanation: "SRTF preempts whenever a shorter process arrives, ensuring the shortest remaining job always runs. With these arrival times it outperforms non-preemptive SJF.",
    choices: ["fcfs", "sjf", "srtf", "priority"],
  },
  {
    id: 5,
    procs: [
      { pid: "P1", arrival: 0, burst: 4 },
      { pid: "P2", arrival: 1, burst: 3 },
      { pid: "P3", arrival: 2, burst: 1 },
      { pid: "P4", arrival: 3, burst: 2 },
    ],
    question: "4 processes with staggered arrivals. Which gives lowest avg WT?",
    answer: "srtf",
    explanation: "SRTF continuously picks the process with shortest remaining time, reducing waiting for short jobs that arrive mid-execution of longer ones.",
    choices: ["fcfs", "sjf", "srtf", "rr"],
  },
];

function QuizPanel() {
  const [qIndex, setQIndex] = useState(() => Math.floor(Math.random() * QUIZ_BANK.length));
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [score, setScore] = useState(0);
  const q = QUIZ_BANK[qIndex];

  const pick = (choice) => {
    if (selected !== null) return;
    const correct = choice === q.answer;
    setSelected(choice);
    setHistory(h => [...h, correct]);
    if (correct) setScore(s => s + 1);
  };

  const next = () => {
    setSelected(null);
    setQIndex(i => (i + 1) % QUIZ_BANK.length);
  };

  const ALGO_LABELS = { fcfs: "FCFS", sjf: "SJF", srtf: "SRTF", priority: "Priority", rr: "Round Robin" };

  return (
    <div className="quiz-wrap">
      <div className="quiz-header">
        <span className="quiz-title">🎓 ALGORITHM QUIZ</span>
        <span className="quiz-score">Score: {score} / {history.length}</span>
      </div>

      {history.length > 0 && (
        <div className="quiz-streak">
          {history.slice(-10).map((h, i) => (
            <div key={i} className={`quiz-dot ${h ? "hit" : "miss"}`} title={h ? "Correct" : "Wrong"} />
          ))}
        </div>
      )}

      <div className="quiz-question">
        <div style={{ fontSize: 10, color: "var(--text2)", marginBottom: 10, letterSpacing: "0.1em" }}>QUESTION {qIndex + 1} OF {QUIZ_BANK.length}</div>
        <div style={{ marginBottom: 12 }}>{q.question}</div>
        <table className="quiz-proc-table">
          <thead>
            <tr><th>PID</th><th>Arrival</th><th>Burst</th></tr>
          </thead>
          <tbody>
            {q.procs.map((p, i) => (
              <tr key={i}>
                <td><span style={{ color: COLORS[i], fontWeight: "bold" }}>{p.pid}</span></td>
                <td>{p.arrival}</td>
                <td>{p.burst}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="quiz-choices">
        {q.choices.map(c => {
          let cls = "quiz-choice";
          if (selected !== null) {
            if (c === q.answer) cls += " reveal";
            if (c === selected && c !== q.answer) cls += " wrong";
            if (c === selected && c === q.answer) cls += " correct";
          }
          return (
            <button key={c} className={cls} disabled={selected !== null} onClick={() => pick(c)}>
              {selected !== null && c === q.answer ? "✓ " : selected === c && c !== q.answer ? "✗ " : ""}
              {ALGO_LABELS[c]}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <div className={`quiz-feedback ${selected === q.answer ? "correct" : "wrong"}`}>
          <strong>{selected === q.answer ? "✅ Correct!" : `❌ Wrong — the answer is ${ALGO_LABELS[q.answer]}`}</strong>
          <div style={{ marginTop: 8 }}>{q.explanation}</div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        {selected !== null && (
          <button className="btn btn-primary" style={{ flex: 1, marginTop: 0 }} onClick={next}>
            {qIndex < QUIZ_BANK.length - 1 ? "Next Question →" : "Restart Quiz ↺"}
          </button>
        )}
        <button className="btn btn-sm" style={{ marginTop: 0 }} onClick={() => { setSelected(null); setQIndex(Math.floor(Math.random() * QUIZ_BANK.length)); }}>
          Shuffle
        </button>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [algo, setAlgo] = useState("fcfs");
  const [quantum, setQuantum] = useState(2);
  const [processes, setProcesses] = useState([
    { pid: "P1", arrival: 0, burst: 8, priority: 2, color: COLORS[0] },
    { pid: "P2", arrival: 2, burst: 4, priority: 1, color: COLORS[1] },
    { pid: "P3", arrival: 4, burst: 6, priority: 3, color: COLORS[2] },
  ]);
  const [timeline, setTimeline] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [tick, setTick] = useState(0);
  const [animSpeed, setAnimSpeed] = useState(5);
  const [compareResults, setCompareResults] = useState(null);
  const [activeTab, setActiveTab] = useState("simulate");
  const [toast, setToast] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [theme, setTheme] = useState("cyan");
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [bestAlgo, setBestAlgo] = useState(null);
  const [ganttView, setGanttView] = useState("combined");
  const intervalRef = useRef(null);
  const swipeRef = useRef({ x: 0, active: false });
  const totalTime = timeline.length ? Math.max(...timeline.map(t => t.end)) : 0;

  const activeTheme = THEMES[theme];
  const themeStyle = activeTheme
    ? `body { --accent: ${activeTheme.accent}; --accent2: ${activeTheme.accent2}; --accent3: ${activeTheme.accent3}; }`
    : "";

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const runAlgo = useCallback((a, procs, q) => {
    if (!procs.length) return [];
    if (a === "fcfs") return fcfs(procs);
    if (a === "sjf") return sjf(procs);
    if (a === "srtf") return srtf(procs);
    if (a === "priority") return prioritySched(procs);
    if (a === "rr") return roundRobin(procs, q);
    return [];
  }, []);

  const handleSubmit = () => {
    if (!processes.length) { showToast("Add at least one process!"); return; }
    const tl = runAlgo(algo, processes, quantum);
    setTimeline(tl);
    setMetrics(calcMetrics(processes, tl));
    setTick(0); setPlaying(false);
    setSubmitted(true);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handleCompare = () => {
    if (!processes.length) { showToast("Add processes first!"); return; }
    const res = {};
    for (const a of ALGOS) {
      const tl = runAlgo(a.key, processes, quantum);
      const m = calcMetrics(processes, tl);
      const avgWT = m.reduce((s, p) => s + p.wt, 0) / m.length;
      const avgTAT = m.reduce((s, p) => s + p.tat, 0) / m.length;
      res[a.key] = { avgWT, avgTAT };
    }
    const winner = Object.entries(res).sort((a, b) => a[1].avgWT - b[1].avgWT)[0][0];
    setCompareResults(res);
    setBestAlgo(winner);
    setActiveTab("compare");
    setConfettiTrigger(t => t + 1);
  };

  const intervalMs = Math.round(800 * Math.pow(0.78, animSpeed - 1));

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setTick(t => { if (t >= totalTime) { setPlaying(false); clearInterval(intervalRef.current); return t; } return t + 1; });
      }, intervalMs);
    } else { clearInterval(intervalRef.current); }
    return () => clearInterval(intervalRef.current);
  }, [playing, totalTime, intervalMs]);

  const togglePlay = () => {
    if (tick >= totalTime) { setTick(0); setPlaying(true); } else { setPlaying(p => !p); }
  };
  const resetAnim = () => { setPlaying(false); setTick(0); };
  const stepForward = () => { setPlaying(false); setTick(t => Math.min(t + 1, totalTime)); };
  const stepBack = () => { setPlaying(false); setTick(t => Math.max(t - 1, 0)); };

  const addProcess = ({ arrival, burst, priority }) => {
    const n = processes.length + 1;
    setProcesses(ps => [...ps, { pid: `P${n}`, arrival, burst, priority, color: COLORS[(n - 1) % COLORS.length] }]);
    showToast(`Process P${n} added ✓`);
  };
  const removeProcess = (pid) => setProcesses(ps => ps.filter(p => p.pid !== pid));

  const TABS = ["simulate", "compare", "quiz"];
  const handleTouchStart = (e) => { swipeRef.current = { x: e.touches[0].clientX, active: true }; };
  const handleTouchEnd = (e) => {
    if (!swipeRef.current.active) return;
    const dx = e.changedTouches[0].clientX - swipeRef.current.x;
    swipeRef.current.active = false;
    if (Math.abs(dx) < 50) return;
    const idx = TABS.indexOf(activeTab);
    if (dx < 0 && idx < TABS.length - 1) setActiveTab(TABS[idx + 1]);
    if (dx > 0 && idx > 0) setActiveTab(TABS[idx - 1]);
  };

  const curAlgo = ALGOS.find(a => a.key === algo);
  const avgWTVal = metrics.length ? (metrics.reduce((s, p) => s + p.wt, 0) / metrics.length).toFixed(2) : "—";
  const avgTATVal = metrics.length ? (metrics.reduce((s, p) => s + p.tat, 0) / metrics.length).toFixed(2) : "—";
  const cpuBusy = timeline.filter(t => t.pid !== "Idle").reduce((s, t) => s + t.end - t.start, 0);
  const cpuUtilVal = totalTime ? ((cpuBusy / totalTime) * 100).toFixed(1) : "—";
  const throughputVal = totalTime ? (processes.length / totalTime).toFixed(3) : "—";

  return (
    <>
      <style>{CSS}</style>
      {themeStyle && <style>{themeStyle}</style>}
      <Confetti trigger={confettiTrigger} />
      <Stars />
      <div className="app swipe-container" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>

        {/* Header */}
        <div className="header">
          <div className="title">SCHEDULING SIMULATOR</div>
          <div className="subtitle">CPU PROCESS VISUALIZATION &amp; ANALYTICS</div>
        </div>

        {/* Tab Bar + Theme Picker */}
        <div className="tab-bar-row">
          <div className="tab-wrap">
            <div className={`tab ${activeTab === "simulate" ? "active" : ""}`} onClick={() => setActiveTab("simulate")}>▶ Simulate</div>
            <div className={`tab ${activeTab === "compare" ? "active" : ""}`} onClick={() => setActiveTab("compare")}>◈ Compare</div>
            <div className={`tab ${activeTab === "quiz" ? "active" : ""}`} onClick={() => setActiveTab("quiz")}>🎓 Quiz</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 9, color: "var(--text2)", letterSpacing: "0.1em" }}>THEME</span>
            <div className="theme-picker">
              {Object.entries(THEMES).map(([key, t]) => (
                <div key={key} className={`theme-swatch ${theme === key ? "active" : ""}`}
                  title={t.label}
                  style={{ background: t.accent }}
                  onClick={() => setTheme(key)}>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Panels — always stacked on mobile */}
        <div className="main">
          {/* Algorithm Config */}
          <div className="card">
            <div className="card-title">Algorithm</div>
            <div className="select-wrap">
              <select value={algo} onChange={e => setAlgo(e.target.value)}>
                {ALGOS.map(a => <option key={a.key} value={a.key}>{a.label}</option>)}
              </select>
              <div className="select-arrow">▾</div>
            </div>
            <div className="algo-desc">{curAlgo?.desc}</div>
            {algo === "rr" && (
              <>
                <div className="label">Time Quantum</div>
                <input type="number" min="1" value={quantum} onChange={e => setQuantum(Number(e.target.value))} />
              </>
            )}
            <button className="btn btn-primary" onClick={handleSubmit}>▶ SUBMIT</button>
            <button className="btn-compare" onClick={handleCompare}>◈ COMPARE ALL ALGORITHMS</button>
          </div>

          {/* Process List */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div className="card-title" style={{ marginBottom: 0 }}>Processes</div>
              <button className="btn btn-sm" onClick={() => setShowModal(true)}>+ Add</button>
            </div>
            {processes.length === 0 && <div className="empty-state">No processes yet. Add one!</div>}
            {processes.map(p => (
              <div key={p.pid} className="process-item">
                <div className="process-dot" style={{ background: p.color }}>{p.pid}</div>
                <div className="process-info">
                  <div className="process-name">{p.pid}</div>
                  <div className="process-meta">AT:{p.arrival} · BT:{p.burst}{algo === "priority" ? ` · P:${p.priority}` : ""}</div>
                </div>
                <button className="remove-btn" onClick={() => removeProcess(p.pid)} aria-label={`Remove ${p.pid}`}>×</button>
              </div>
            ))}
            {processes.length > 0 && (
              <button className="btn btn-danger" onClick={() => setProcesses([])}>✕ Clear all</button>
            )}
          </div>
        </div>

        {/* Simulate Tab */}
        {activeTab === "simulate" && submitted && (
          <>
            {/* Gantt Chart */}
            <div className="section">
              <div className="gantt-wrap">
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                    <div className="gantt-title" style={{ marginBottom: 0 }}>GANTT CHART</div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <div className="view-toggle">
                        <button className={`view-toggle-btn ${ganttView === "combined" ? "active" : ""}`} onClick={() => setGanttView("combined")}>Combined</button>
                        <button className={`view-toggle-btn ${ganttView === "perProcess" ? "active" : ""}`} onClick={() => setGanttView("perProcess")}>Per-Proc</button>
                      </div>
                      <span className="tick-display">t={tick}/{totalTime}</span>
                    </div>
                  </div>

                  {/* Playback controls */}
                  <div className="play-controls">
                    <button className="play-btn" title="Reset" onClick={resetAnim}>⏮</button>
                    <button className="step-btn" title="Step back" onClick={stepBack} disabled={tick <= 0}>‹</button>
                    <button className="play-btn" title={playing ? "Pause" : "Play"} onClick={togglePlay}>
                      {playing ? "⏸" : "▶"}
                    </button>
                    <button className="step-btn" title="Step forward" onClick={stepForward} disabled={tick >= totalTime}>›</button>
                    <button className="play-btn" title="Skip to end" onClick={() => { setPlaying(false); setTick(totalTime); }}>⏭</button>
                  </div>

                  {/* Speed slider */}
                  <div className="speed-row">
                    <span className="speed-label">🐢</span>
                    <input type="range" min="1" max="10" step="1" value={animSpeed}
                      className="speed-slider"
                      style={{ "--pct": `${((animSpeed - 1) / 9) * 100}%` }}
                      onChange={e => setAnimSpeed(Number(e.target.value))}
                      title={`Speed: ${animSpeed}/10`} />
                    <span className="speed-label">⚡</span>
                    <span style={{ fontSize: 9, color: "var(--accent)", minWidth: 24, textAlign: "right" }}>{animSpeed}/10</span>
                  </div>
                </div>

                <GanttChart
                  timeline={timeline}
                  processes={processes}
                  playing={playing || tick > 0}
                  tick={tick}
                  totalTime={totalTime}
                  viewMode={ganttView}
                />

                <ExplanationBox
                  explanations={buildExplanations(timeline, processes, algo)}
                  tick={tick}
                  totalTime={totalTime}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="section">
              <div className="stats-grid">
                {[
                  { label: "Avg Wait Time", value: avgWTVal, unit: "units", dec: 2, suf: "" },
                  { label: "Avg Turnaround", value: avgTATVal, unit: "units", dec: 2, suf: "" },
                  { label: "Throughput", value: throughputVal, unit: "proc/unit", dec: 3, suf: "" },
                  { label: "CPU Util", value: cpuUtilVal, unit: "", dec: 1, suf: cpuUtilVal !== "—" ? "%" : "" },
                ].map(s => (
                  <div key={s.label} className="stat-card">
                    <div className="stat-label">{s.label}</div>
                    <div className="stat-value">
                      <AnimCount target={s.value} decimals={s.dec} suffix={s.suf} />
                    </div>
                    {s.unit && <div className="stat-unit">{s.unit}</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Results Table */}
            <div className="section">
              <div className="table-wrap">
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>PID</th>
                        <th>Arrival</th>
                        <th>Burst</th>
                        <th>CT</th>
                        <th>WT</th>
                        <th>TAT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.map(p => (
                        <tr key={p.pid}>
                          <td><span className="badge" style={{ background: p.color, color: "#000" }}>{p.pid}</span></td>
                          <td>{p.arrival}</td>
                          <td>{p.burst}</td>
                          <td>{p.ct}</td>
                          <td style={{ color: p.wt > 0 ? "#ffd60a" : "var(--accent)" }}>{p.wt}</td>
                          <td>{p.tat}</td>
                        </tr>
                      ))}
                      <tr className="total-row">
                        <td colSpan={4}><strong>Avg</strong></td>
                        <td>{avgWTVal}</td>
                        <td>{avgTATVal}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Compare Tab */}
        {activeTab === "compare" && (
          <div className="section">
            {!compareResults ? (
              <div className="gantt-wrap">
                <div className="empty-state">Click "Compare All Algorithms" to see side-by-side analysis.</div>
              </div>
            ) : (
              <div className="compare-wrap">
                <div className="compare-title">ALGORITHM COMPARISON — SAME DATASET</div>
                <CompareCharts results={compareResults} bestAlgo={bestAlgo} />
                {/* Winner banner */}
                <div style={{ marginTop: 20, background: "var(--bg3)", borderRadius: 8, padding: 14, border: "1px solid var(--accent)", boxShadow: "0 0 16px rgba(0,245,212,0.08)" }}>
                  <div style={{ fontSize: 10, color: "var(--text2)", marginBottom: 8, letterSpacing: "0.1em" }}>🏆 BEST PERFORMER</div>
                  {(() => {
                    const best = Object.entries(compareResults).sort((a, b) => a[1].avgWT - b[1].avgWT)[0];
                    return <div style={{ fontSize: 12, color: "var(--accent)" }}>
                      🎉 <strong>{best[0].toUpperCase()}</strong> wins with lowest Avg WT of <strong>{best[1].avgWT.toFixed(2)}</strong> units.
                    </div>;
                  })()}
                </div>
                {/* Summary cards — 2 col on mobile, 3 on tablet, 5 on desktop */}
                <div className="compare-summary-grid">
                  {Object.entries(compareResults).map(([a, r]) => (
                    <div key={a} className={a === bestAlgo ? "winner-card" : ""}
                      style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8, padding: 10, textAlign: "center" }}>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 10, color: a === bestAlgo ? "var(--accent)" : "var(--text)", marginBottom: 6 }}>
                        {a === bestAlgo ? "🏆 " : ""}{a.toUpperCase()}
                      </div>
                      <div style={{ fontSize: 9, color: "var(--text2)" }}>Avg WT</div>
                      <div style={{ fontSize: 14, color: "#fff" }}>{r.avgWT.toFixed(2)}</div>
                      <div style={{ fontSize: 9, color: "var(--text2)", marginTop: 4 }}>Avg TAT</div>
                      <div style={{ fontSize: 14, color: "#fff" }}>{r.avgTAT.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quiz Tab */}
        {activeTab === "quiz" && (
          <div className="section">
            <QuizPanel />
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 36, fontSize: 10, color: "var(--text3)", padding: "0 12px" }}>
          CPU SCHEDULING SIMULATOR · MICRO PROJECT · DEPT OF INFORMATION TECHNOLOGY
        </div>
      </div>

      {showModal && (
        <AddModal onAdd={addProcess} onClose={() => setShowModal(false)} nextId={`P${processes.length + 1}`} needsPriority={algo === "priority"} />
      )}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
