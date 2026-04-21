import { useState, useEffect, useRef } from "react";
import { COLORS, ALGO_INFO, QUIZ_BANK } from "./constants.js";

// ─── Stars Background ─────────────────────────────────────────────────────────
export function Stars() {
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
export function Confetti({ trigger }) {
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
      x: Math.random() * canvas.width, y: -20,
      vx: (Math.random() - 0.5) * 4, vy: Math.random() * 4 + 2,
      rot: Math.random() * 360, rotV: (Math.random() - 0.5) * 6,
      w: Math.random() * 8 + 4, h: Math.random() * 4 + 2,
      color: colors[Math.floor(Math.random() * colors.length)], life: 1,
    }));
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of particlesRef.current) {
        p.x += p.vx; p.y += p.vy; p.rot += p.rotV; p.vy += 0.08; p.life -= 0.008;
        if (p.life <= 0 || p.y > canvas.height) continue;
        alive = true;
        ctx.save(); ctx.globalAlpha = p.life; ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180); ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
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
export function AnimCount({ target, decimals = 2, suffix = "" }) {
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
  }, [target]); // eslint-disable-line

  return <span>{display}</span>;
}

// ─── Add Process Modal ────────────────────────────────────────────────────────
export function AddModal({ onAdd, onClose, nextId, needsPriority, needsQueue, needsIO }) {
  const [form, setForm] = useState({ arrival: 0, burst: 5, priority: 1, queue: 'fg', ioTime: 0 });
  const set = (k, v) => setForm(f => ({ ...f, [k]: typeof v === 'string' && k !== 'queue' ? Number(v) : v }));
  const submit = () => {
    if (!form.burst || form.burst < 1) return;
    onAdd({ arrival: form.arrival, burst: form.burst, priority: form.priority, queue: form.queue, ioTime: form.ioTime });
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
          <div className="input-group" style={{ marginBottom: 12 }}>
            <div className="label">Priority (lower = higher)</div>
            <input type="number" min="1" value={form.priority} onChange={e => set("priority", e.target.value)} />
          </div>
        )}
        {needsQueue && (
          <div className="input-group" style={{ marginBottom: 12 }}>
            <div className="label">Queue</div>
            <div className="select-wrap">
              <select value={form.queue} onChange={e => set("queue", e.target.value)}>
                <option value="fg">Foreground (RR)</option>
                <option value="bg">Background (FCFS)</option>
              </select>
              <div className="select-arrow">▾</div>
            </div>
          </div>
        )}
        {needsIO && (
          <div className="input-group" style={{ marginBottom: 12 }}>
            <div className="label">I/O Time (0 = no I/O)</div>
            <input type="number" min="0" value={form.ioTime} onChange={e => set("ioTime", e.target.value)} />
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

// ─── CSV Import Modal (Feature 8) ─────────────────────────────────────────────
export function CSVImportModal({ onImport, onClose }) {
  const [error, setError] = useState("");
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const lines = ev.target.result.trim().split("\n").filter(l => l.trim());
        const procs = [];
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.toLowerCase().startsWith("pid")) continue; // skip header
          const parts = line.split(",").map(s => s.trim());
          if (parts.length < 3) throw new Error(`Line ${i + 1}: need at least pid,arrival,burst`);
          const pid = parts[0], arrival = parseInt(parts[1]), burst = parseInt(parts[2]);
          const priority = parts[3] ? parseInt(parts[3]) : 1;
          if (isNaN(arrival) || isNaN(burst) || burst < 1) throw new Error(`Line ${i + 1}: invalid numbers`);
          procs.push({ pid, arrival, burst, priority });
        }
        if (!procs.length) throw new Error("No valid processes found");
        onImport(procs);
        onClose();
      } catch (err) { setError(err.message); }
    };
    reader.readAsText(file);
  };
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">📂 IMPORT CSV</div>
        <div className="csv-help">
          Expected format:<br />
          pid,arrival,burst,priority<br />
          P1,0,8,2<br />
          P2,2,4,1<br />
          P3,4,6,3<br />
          <br />Priority column is optional.
        </div>
        <input type="file" accept=".csv,.txt" onChange={handleFile} style={{ marginBottom: 12, fontSize: 12, color: "var(--text2)" }} />
        {error && <div style={{ color: "#ff4060", fontSize: 11, marginBottom: 10 }}>❌ {error}</div>}
        <button className="btn btn-sm" onClick={onClose} style={{ width: "100%" }}>Cancel</button>
      </div>
    </div>
  );
}

// ─── Gantt Chart ──────────────────────────────────────────────────────────────
export function GanttChart({ timeline, processes, playing, tick, totalTime, viewMode, ioSegments }) {
  if (!timeline.length) return <div className="empty-state">Submit processes to see the Gantt Chart.</div>;
  const progress = (tick / totalTime) * 100;
  const procMap = {};
  for (const p of processes) procMap[p.pid] = [];
  for (const seg of timeline) { if (seg.pid !== "Idle" && procMap[seg.pid]) procMap[seg.pid].push(seg); }
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
              {/* I/O segments overlay */}
              {ioSegments && ioSegments.length > 0 && (
                <div style={{ position: "relative", marginTop: 4 }}>
                  <div className="gantt-row" style={{ height: 28, background: "transparent" }}>
                    {ioSegments.map((seg, i) => {
                      const left = (seg.start / totalTime) * 100;
                      const w = ((seg.end - seg.start) / totalTime) * 100;
                      return (
                        <div key={i} className="gantt-bar io-bar" style={{
                          position: "absolute", left: `${left}%`, width: `${w}%`, height: "100%",
                          background: `repeating-linear-gradient(45deg, ${seg.color}33, ${seg.color}33 4px, ${seg.color}11 4px, ${seg.color}11 8px)`,
                          borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 9, color: "var(--text2)"
                        }}>I/O {seg.pid}</div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="gantt-labels">
                {timeline.map((seg, i) => {
                  if (i % labelStep !== 0) return null;
                  return <span key={i} className="gantt-label" style={{ left: `${(seg.start / totalTime) * 100}%` }}>{seg.start}</span>;
                })}
                <span className="gantt-label" style={{ left: "100%" }}>{totalTime}</span>
              </div>
            </div>
          ) : (
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
                    {/* I/O segments for this process */}
                    {ioSegments && ioSegments.filter(s => s.pid === p.pid).map((seg, i) => {
                      const left = (seg.start / totalTime) * 100;
                      const width = ((seg.end - seg.start) / totalTime) * 100;
                      return (
                        <div key={`io-${i}`} className="proc-row-seg io-seg"
                          style={{ left: `${left}%`, width: `${width}%`, background: `repeating-linear-gradient(45deg, ${p.color}33, ${p.color}33 3px, transparent 3px, transparent 6px)` }}>
                          {width > 6 ? "I/O" : ""}
                        </div>
                      );
                    })}
                    {playing || tick > 0 ? (
                      <div className="proc-row-cursor" style={{ left: `${Math.min((tick / totalTime) * 100, 100)}%` }} />
                    ) : null}
                  </div>
                </div>
              ))}
              <div style={{ paddingLeft: 32 }}>
                <div className="gantt-labels" style={{ position: "relative", marginTop: 4 }}>
                  {timeline.map((seg, i) => {
                    if (i % labelStep !== 0) return null;
                    return <span key={i} className="gantt-label" style={{ left: `${(seg.start / totalTime) * 100}%` }}>{seg.start}</span>;
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
export function CompareCharts({ results, bestAlgo }) {
  const ALGO_COLORS = { fcfs: "#ff2d78", sjf: "#ffd60a", srtf: "#7b5ea7", priority: "#ff6b35", rr: "#00f5d4", mlq: "#80ffdb" };
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
              <div className="bar-fill" style={{ width: `${pct}%`, background: ALGO_COLORS[algo] || "#888" }}>
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
export function ExplanationBox({ explanations, tick, totalTime }) {
  const bodyRef = useRef(null);
  const [collapsed, setCollapsed] = useState(false);
  const visible = explanations.slice(0, tick + 1);

  useEffect(() => {
    if (bodyRef.current && !collapsed) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [tick, collapsed]);

  if (!explanations.length) return null;
  return (
    <div className="explain-wrap">
      <div className="explain-header">
        <span className="explain-title">📖 STEP-BY-STEP EXPLANATION</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 9, color: "var(--text2)" }}>t={tick}/{totalTime}</span>
          <button className="view-toggle-btn" onClick={() => setCollapsed(c => !c)}>{collapsed ? "▼ Show" : "▲ Hide"}</button>
        </div>
      </div>
      {!collapsed && (
        <div className="explain-body" ref={bodyRef}>
          {visible.length === 0 && <div className="explain-line"><span style={{ color: "var(--text3)", fontSize: 11 }}>Press Play or step forward to see explanations.</span></div>}
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

// ─── CPU Utilization Chart (Feature 3) ────────────────────────────────────────
export function UtilizationChart({ timeline, tick, totalTime }) {
  if (!timeline.length || totalTime === 0) return null;
  const W = 500, H = 120, padL = 30, padB = 20, padT = 10, padR = 10;
  const chartW = W - padL - padR, chartH = H - padT - padB;
  const points = [];
  let busyCount = 0;
  for (let t = 1; t <= Math.min(tick, totalTime); t++) {
    const seg = timeline.find(s => s.start < t && s.end >= t);
    if (seg && seg.pid !== "Idle") busyCount++;
    const util = (busyCount / t) * 100;
    const x = padL + (t / totalTime) * chartW;
    const y = padT + chartH - (util / 100) * chartH;
    points.push({ x, y, t, util });
  }
  if (!points.length) return null;
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath = linePath + ` L${points[points.length - 1].x.toFixed(1)},${padT + chartH} L${points[0].x.toFixed(1)},${padT + chartH} Z`;

  return (
    <div className="util-chart-wrap">
      <div className="util-chart-title">📊 CPU UTILIZATION TIMELINE</div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
        <defs>
          <linearGradient id="utilGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(v => {
          const y = padT + chartH - (v / 100) * chartH;
          return <g key={v}>
            <line x1={padL} y1={y} x2={padL + chartW} y2={y} stroke="var(--border)" strokeWidth="0.5" />
            <text x={padL - 4} y={y + 3} textAnchor="end" fill="var(--text3)" fontSize="8">{v}%</text>
          </g>;
        })}
        <path d={areaPath} fill="url(#utilGrad)" />
        <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
        {points.length > 0 && <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="3" fill="var(--accent)" />}
        <text x={padL + chartW / 2} y={H - 2} textAnchor="middle" fill="var(--text3)" fontSize="8">Time →</text>
      </svg>
    </div>
  );
}

// ─── Process State Diagram (Feature 4) ────────────────────────────────────────
export function ProcessStateDiagram({ processes, timeline, tick }) {
  const [collapsed, setCollapsed] = useState(true);
  if (!timeline.length) return null;

  const states = ["New", "Ready", "Running", "Terminated"];
  const stateColors = { New: "#4cc9f0", Ready: "#ffd60a", Running: "#39ff14", Terminated: "#555580" };
  const getProcessState = (p) => {
    if (tick < p.arrival) return "New";
    const segs = timeline.filter(s => s.pid === p.pid);
    const isRunning = segs.some(s => s.start <= tick && s.end > tick);
    if (isRunning) return "Running";
    const allDone = segs.length > 0 && segs.every(s => s.end <= tick);
    const lastSeg = segs[segs.length - 1];
    if (allDone && lastSeg) return "Terminated";
    return "Ready";
  };

  const W = 460, H = 80, nodeW = 90, nodeH = 36, gap = 30;
  const startX = (W - (states.length * nodeW + (states.length - 1) * gap)) / 2;

  return (
    <div className="state-diagram-wrap">
      <div className="state-diagram-header" onClick={() => setCollapsed(c => !c)}>
        <span className="state-diagram-title">🔄 PROCESS STATE DIAGRAM</span>
        <button className="view-toggle-btn">{collapsed ? "▼ Show" : "▲ Hide"}</button>
      </div>
      {!collapsed && (
        <div className="state-diagram-body">
          <svg viewBox={`0 0 ${W} ${H + processes.length * 22 + 10}`} style={{ width: "100%", height: "auto", minWidth: 320 }}>
            {/* State nodes */}
            {states.map((st, i) => {
              const x = startX + i * (nodeW + gap);
              const y = 10;
              const activeProcs = processes.filter(p => getProcessState(p) === st);
              return (
                <g key={st}>
                  <rect x={x} y={y} width={nodeW} height={nodeH} rx="8" fill={stateColors[st] + "22"}
                    stroke={stateColors[st]} strokeWidth={activeProcs.length > 0 ? "2" : "1"} opacity={activeProcs.length > 0 ? 1 : 0.4} />
                  <text x={x + nodeW / 2} y={y + nodeH / 2 + 4} textAnchor="middle" fill={stateColors[st]} fontSize="10" fontWeight="bold">{st}</text>
                  {/* Arrows */}
                  {i < states.length - 1 && (
                    <line x1={x + nodeW} y1={y + nodeH / 2} x2={x + nodeW + gap} y2={y + nodeH / 2}
                      stroke="var(--text3)" strokeWidth="1" markerEnd="url(#arrowhead)" />
                  )}
                </g>
              );
            })}
            <defs>
              <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="var(--text3)" />
              </marker>
            </defs>
            {/* Process positions */}
            {processes.map((p, pi) => {
              const st = getProcessState(p);
              const si = states.indexOf(st);
              const x = startX + si * (nodeW + gap) + nodeW / 2;
              const y = nodeH + 26 + pi * 20;
              return (
                <g key={p.pid}>
                  <circle cx={x} cy={y} r="8" fill={p.color} opacity="0.9" />
                  <text x={x} y={y + 3} textAnchor="middle" fontSize="7" fontWeight="bold" fill="#000">{p.pid}</text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
}

// ─── Algorithm Info Tooltip (Feature 11) ───────────────────────────────────────
export function AlgoInfoTooltip({ algoKey }) {
  const [show, setShow] = useState(false);
  const info = ALGO_INFO[algoKey];
  if (!info) return null;
  return (
    <span className="algo-info-btn" onClick={() => setShow(s => !s)} onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      ℹ️
      {show && (
        <div className="algo-tooltip" onClick={e => e.stopPropagation()}>
          <div className="algo-tooltip-row"><span className="algo-tooltip-label">Time Complexity</span><span className="algo-tooltip-value">{info.time}</span></div>
          <div className="algo-tooltip-row"><span className="algo-tooltip-label">Space Complexity</span><span className="algo-tooltip-value">{info.space}</span></div>
          <div className="algo-tooltip-row"><span className="algo-tooltip-label">Preemptive</span><span className="algo-tooltip-value">{info.preemptive}</span></div>
          <div className="algo-tooltip-row"><span className="algo-tooltip-label">Best used when</span><span className="algo-tooltip-value" style={{ textAlign: "right", maxWidth: 160 }}>{info.best}</span></div>
          <div className="algo-tooltip-row"><span className="algo-tooltip-label">Drawbacks</span><span className="algo-tooltip-value" style={{ textAlign: "right", maxWidth: 160 }}>{info.drawbacks}</span></div>
        </div>
      )}
    </span>
  );
}

// ─── Starvation Alert (Feature 5) ─────────────────────────────────────────────
export function StarvationAlert({ warnings }) {
  if (!warnings || !warnings.length) return null;
  return (
    <div className="starvation-alert">
      <div className="starvation-alert-title">⚠️ STARVATION WARNING</div>
      {warnings.map(w => (
        <div key={w.pid} className="starvation-alert-item">
          ⚠️ {w.pid} may be starving! (waiting {w.wait} units continuously)
        </div>
      ))}
    </div>
  );
}

// ─── Quiz Panel (Feature 14 — expanded) ───────────────────────────────────────
export function QuizPanel() {
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
  const next = () => { setSelected(null); setQIndex(i => (i + 1) % QUIZ_BANK.length); };
  const ALGO_LABELS = { fcfs: "FCFS", sjf: "SJF", srtf: "SRTF", priority: "Priority", rr: "Round Robin" };
  const diffColors = { easy: "difficulty-easy", medium: "difficulty-medium", hard: "difficulty-hard" };

  return (
    <div className="quiz-wrap">
      <div className="quiz-header">
        <span className="quiz-title">🎓 ALGORITHM QUIZ</span>
        <span className="quiz-score">Score: {score} / {history.length}</span>
      </div>
      {history.length > 0 && (
        <div className="quiz-streak">
          {history.slice(-10).map((h, i) => <div key={i} className={`quiz-dot ${h ? "hit" : "miss"}`} title={h ? "Correct" : "Wrong"} />)}
        </div>
      )}
      <div className="quiz-question">
        <div style={{ fontSize: 10, color: "var(--text2)", marginBottom: 10, letterSpacing: "0.1em", display: "flex", alignItems: "center" }}>
          QUESTION {qIndex + 1} OF {QUIZ_BANK.length}
          {q.difficulty && <span className={`difficulty-badge ${diffColors[q.difficulty] || ""}`}>{q.difficulty.toUpperCase()}</span>}
        </div>
        <div style={{ marginBottom: 12 }}>{q.question}</div>
        {q.procs && (
          <table className="quiz-proc-table">
            <thead><tr><th>PID</th><th>Arrival</th><th>Burst</th>{q.procs[0]?.priority !== undefined && <th>Priority</th>}</tr></thead>
            <tbody>
              {q.procs.map((p, i) => (
                <tr key={i}>
                  <td><span style={{ color: COLORS[i], fontWeight: "bold" }}>{p.pid}</span></td>
                  <td>{p.arrival}</td><td>{p.burst}</td>
                  {p.priority !== undefined && <td>{p.priority}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
              {ALGO_LABELS[c] || c}
            </button>
          );
        })}
      </div>
      {selected !== null && (
        <div className={`quiz-feedback ${selected === q.answer ? "correct" : "wrong"}`}>
          <strong>{selected === q.answer ? "✅ Correct!" : `❌ Wrong — the answer is ${ALGO_LABELS[q.answer] || q.answer}`}</strong>
          <div style={{ marginTop: 8 }}>{q.explanation}</div>
        </div>
      )}
      <div style={{ display: "flex", gap: 10 }}>
        {selected !== null && (
          <button className="btn btn-primary" style={{ flex: 1, marginTop: 0 }} onClick={next}>
            {qIndex < QUIZ_BANK.length - 1 ? "Next Question →" : "Restart Quiz ↺"}
          </button>
        )}
        <button className="btn btn-sm" style={{ marginTop: 0 }} onClick={() => { setSelected(null); setQIndex(Math.floor(Math.random() * QUIZ_BANK.length)); }}>Shuffle</button>
      </div>
    </div>
  );
}

// ─── History Panel (Feature 13) ───────────────────────────────────────────────
export function HistoryPanel({ history, onRestore, onClear }) {
  if (!history.length) return (
    <div className="history-wrap">
      <div className="card-title">📜 SIMULATION HISTORY</div>
      <div className="empty-state">No simulation history yet. Submit a simulation to see it here.</div>
    </div>
  );
  return (
    <div className="history-wrap">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div className="card-title" style={{ marginBottom: 0 }}>📜 SIMULATION HISTORY ({history.length})</div>
        <button className="btn btn-sm" style={{ fontSize: 10, color: "#ff6060", borderColor: "#3a1a1a" }} onClick={onClear}>Clear</button>
      </div>
      {history.map((entry, i) => (
        <div key={entry.id || i} className="history-item" onClick={() => onRestore(entry)}>
          <div className="history-item-header">
            <span className="history-item-algo">{entry.algo.toUpperCase()}</span>
            <span className="history-item-time">{new Date(entry.timestamp).toLocaleString()}</span>
          </div>
          <div className="history-item-stats">
            <span>Processes: {entry.processCount}</span>
            <span>Avg WT: {entry.avgWT}</span>
            <span>Avg TAT: {entry.avgTAT}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── PNG Export Helper (Feature 7) ────────────────────────────────────────────
export function exportGanttPNG(timeline, totalTime, width = 1200, height = 120) {
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#0d0d1f"; ctx.fillRect(0, 0, width, height);
  const barH = 60, barY = 20, padX = 40;
  const chartW = width - padX * 2;
  for (const seg of timeline) {
    const x = padX + (seg.start / totalTime) * chartW;
    const w = ((seg.end - seg.start) / totalTime) * chartW;
    if (seg.pid === "Idle") {
      ctx.fillStyle = "#11112a"; ctx.fillRect(x, barY, w, barH);
      ctx.strokeStyle = "#2a2a50"; ctx.strokeRect(x, barY, w, barH);
      ctx.fillStyle = "#3a3f70"; ctx.font = "11px monospace"; ctx.textAlign = "center";
      ctx.fillText("Idle", x + w / 2, barY + barH / 2 + 4);
    } else {
      ctx.fillStyle = seg.color || "#00f5d4"; ctx.fillRect(x, barY, w, barH);
      ctx.fillStyle = "#000"; ctx.font = "bold 12px monospace"; ctx.textAlign = "center";
      ctx.fillText(seg.pid, x + w / 2, barY + barH / 2 + 4);
    }
  }
  // Time labels
  ctx.fillStyle = "#7880b0"; ctx.font = "10px monospace"; ctx.textAlign = "center";
  const labelY = barY + barH + 16;
  for (const seg of timeline) {
    const x = padX + (seg.start / totalTime) * chartW;
    ctx.fillText(String(seg.start), x, labelY);
  }
  ctx.fillText(String(totalTime), padX + chartW, labelY);
  // Download
  const link = document.createElement("a");
  link.download = "gantt-chart.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}
