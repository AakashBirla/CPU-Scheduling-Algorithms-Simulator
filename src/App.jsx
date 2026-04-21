import { useState, useEffect, useRef, useCallback } from "react";
import {
  fcfs, sjf, srtf, prioritySched, roundRobin, mlq,
  priorityWithAging, simulateWithIO, mergeTimeline,
  calcMetrics, detectStarvation, buildExplanations,
} from "./algorithms.js";
import { COLORS, ALGOS, THEMES, ALGO_INFO, PRESETS, QUIZ_BANK } from "./constants.js";
import { CSS } from "./styles.js";
import {
  Stars, Confetti, AnimCount, AddModal, CSVImportModal,
  GanttChart, CompareCharts, ExplanationBox, UtilizationChart,
  ProcessStateDiagram, AlgoInfoTooltip, StarvationAlert,
  QuizPanel, HistoryPanel, exportGanttPNG,
} from "./components.jsx";

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  // ── Existing state ──────────────────────────────────────────────────────────
  const [algo, setAlgo] = useState("fcfs");
  const [quantum, setQuantum] = useState(2);
  const [processes, setProcesses] = useState([
    { pid: "P1", arrival: 0, burst: 8, priority: 2, color: COLORS[0], queue: "fg", ioTime: 0 },
    { pid: "P2", arrival: 2, burst: 4, priority: 1, color: COLORS[1], queue: "fg", ioTime: 0 },
    { pid: "P3", arrival: 4, burst: 6, priority: 3, color: COLORS[2], queue: "fg", ioTime: 0 },
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
  const [toastType, setToastType] = useState(""); // "" or "error"
  const [submitted, setSubmitted] = useState(false);
  const [theme, setTheme] = useState("cyan");
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [bestAlgo, setBestAlgo] = useState(null);
  const [ganttView, setGanttView] = useState("combined");
  const intervalRef = useRef(null);
  const swipeRef = useRef({ x: 0, active: false });
  const totalTime = timeline.length ? Math.max(...timeline.map(t => t.end)) : 0;

  // ── NEW: Feature 2 — Aging toggle ───────────────────────────────────────────
  const [agingEnabled, setAgingEnabled] = useState(false);

  // ── NEW: Feature 5 — Starvation warnings ───────────────────────────────────
  const [starvationWarnings, setStarvationWarnings] = useState([]);

  // ── NEW: Feature 8 — CSV import modal ──────────────────────────────────────
  const [showCSVModal, setShowCSVModal] = useState(false);

  // ── NEW: Feature 12 — Dark/Light mode ──────────────────────────────────────
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("cpu-sim-dark-mode");
    return saved !== null ? saved === "true" : true;
  });

  // ── NEW: Feature 13 — Simulation history ───────────────────────────────────
  const [simHistory, setSimHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cpu-sim-history") || "[]"); }
    catch { return []; }
  });

  // ── NEW: Feature 15 — I/O segments ─────────────────────────────────────────
  const [ioSegments, setIoSegments] = useState([]);

  // ── Theme + Dark mode effects ──────────────────────────────────────────────
  const activeTheme = THEMES[theme];
  const themeStyle = activeTheme
    ? `body { --accent: ${activeTheme.accent}; --accent2: ${activeTheme.accent2}; --accent3: ${activeTheme.accent3}; }`
    : "";

  useEffect(() => {
    document.body.classList.toggle("light-mode", !darkMode);
    localStorage.setItem("cpu-sim-dark-mode", String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("cpu-sim-history", JSON.stringify(simHistory));
  }, [simHistory]);

  const showToast = (msg, type = "") => { setToast(msg); setToastType(type); setTimeout(() => setToast(""), 2500); };

  // ── Run algorithm ──────────────────────────────────────────────────────────
  const runAlgo = useCallback((a, procs, q, aging = false) => {
    if (!procs.length) return { timeline: [], ioSegments: [] };
    // Check if any process has I/O
    const hasIO = procs.some(p => p.ioTime && p.ioTime > 0);
    if (hasIO) {
      const result = simulateWithIO(procs, a, q);
      return { timeline: result.timeline, ioSegments: result.ioSegments };
    }
    let tl;
    if (a === "fcfs") tl = fcfs(procs);
    else if (a === "sjf") tl = sjf(procs);
    else if (a === "srtf") tl = srtf(procs);
    else if (a === "priority" && aging) tl = priorityWithAging(procs);
    else if (a === "priority") tl = prioritySched(procs);
    else if (a === "rr") tl = roundRobin(procs, q);
    else if (a === "mlq") tl = mlq(procs);
    else tl = [];
    return { timeline: tl, ioSegments: [] };
  }, []);

  // ── Handle submit ──────────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!processes.length) { showToast("Add at least one process!", "error"); return; }
    const result = runAlgo(algo, processes, quantum, agingEnabled);
    setTimeline(result.timeline);
    setIoSegments(result.ioSegments || []);
    const m = calcMetrics(processes, result.timeline, result.ioSegments);
    setMetrics(m);
    setTick(0); setPlaying(false);
    setSubmitted(true);
    if (intervalRef.current) clearInterval(intervalRef.current);

    // Feature 5: Detect starvation
    setStarvationWarnings(detectStarvation(processes, result.timeline));

    // Feature 13: Save to history
    const avgWT = m.length ? (m.reduce((s, p) => s + p.wt, 0) / m.length).toFixed(2) : "0";
    const avgTAT = m.length ? (m.reduce((s, p) => s + p.tat, 0) / m.length).toFixed(2) : "0";
    const entry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      algo,
      processCount: processes.length,
      avgWT, avgTAT,
      processes: JSON.parse(JSON.stringify(processes)),
      quantum,
      agingEnabled,
    };
    setSimHistory(h => [entry, ...h].slice(0, 10));
  };

  // ── Handle compare ─────────────────────────────────────────────────────────
  const handleCompare = () => {
    if (!processes.length) { showToast("Add processes first!", "error"); return; }
    const res = {};
    for (const a of ALGOS) {
      const result = runAlgo(a.key, processes, quantum, agingEnabled);
      const m = calcMetrics(processes, result.timeline, result.ioSegments);
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

  // ── Playback ───────────────────────────────────────────────────────────────
  const intervalMs = Math.round(800 * Math.pow(0.78, animSpeed - 1));

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setTick(t => { if (t >= totalTime) { setPlaying(false); clearInterval(intervalRef.current); return t; } return t + 1; });
      }, intervalMs);
    } else { clearInterval(intervalRef.current); }
    return () => clearInterval(intervalRef.current);
  }, [playing, totalTime, intervalMs]);

  const togglePlay = () => { if (tick >= totalTime) { setTick(0); setPlaying(true); } else { setPlaying(p => !p); } };
  const resetAnim = () => { setPlaying(false); setTick(0); };
  const stepForward = () => { setPlaying(false); setTick(t => Math.min(t + 1, totalTime)); };
  const stepBack = () => { setPlaying(false); setTick(t => Math.max(t - 1, 0)); };

  // ── Process management ─────────────────────────────────────────────────────
  const addProcess = ({ arrival, burst, priority, queue = "fg", ioTime = 0 }) => {
    const n = processes.length + 1;
    setProcesses(ps => [...ps, { pid: `P${n}`, arrival, burst, priority, color: COLORS[(n - 1) % COLORS.length], queue, ioTime }]);
    showToast(`Process P${n} added ✓`);
  };
  const removeProcess = (pid) => setProcesses(ps => ps.filter(p => p.pid !== pid));

  // ── NEW: Feature 8 — CSV import handler ────────────────────────────────────
  const handleCSVImport = (importedProcs) => {
    const newProcs = importedProcs.map((p, i) => ({
      ...p,
      color: COLORS[i % COLORS.length],
      queue: "fg",
      ioTime: 0,
    }));
    setProcesses(newProcs);
    showToast(`${newProcs.length} processes imported from CSV ✓`);
  };

  // ── NEW: Feature 9 — Random process generator ─────────────────────────────
  const generateRandom = () => {
    if (processes.length > 0 && !window.confirm("Replace existing processes with random ones?")) return;
    const count = 4 + Math.floor(Math.random() * 3); // 4-6
    const procs = Array.from({ length: count }, (_, i) => ({
      pid: `P${i + 1}`,
      arrival: Math.floor(Math.random() * 11),
      burst: 1 + Math.floor(Math.random() * 12),
      priority: 1 + Math.floor(Math.random() * 5),
      color: COLORS[i % COLORS.length],
      queue: "fg",
      ioTime: 0,
    }));
    setProcesses(procs);
    showToast(`${count} random processes generated ✓`);
  };

  // ── NEW: Feature 10 — Load preset ──────────────────────────────────────────
  const loadPreset = (preset) => {
    const procs = preset.processes.map((p, i) => ({
      ...p,
      color: COLORS[i % COLORS.length],
      queue: "fg",
      ioTime: 0,
    }));
    setProcesses(procs);
    showToast(`Loaded: ${preset.name}`);
  };

  // ── NEW: Feature 13 — Restore from history ────────────────────────────────
  const restoreFromHistory = (entry) => {
    setProcesses(entry.processes);
    setAlgo(entry.algo);
    setQuantum(entry.quantum || 2);
    setAgingEnabled(entry.agingEnabled || false);
    setActiveTab("simulate");
    setSubmitted(false);
    showToast("Simulation restored from history ✓");
  };

  const clearHistory = () => {
    if (window.confirm("Clear all simulation history?")) {
      setSimHistory([]);
      showToast("History cleared");
    }
  };

  // ── Swipe navigation ──────────────────────────────────────────────────────
  const TABS = ["simulate", "compare", "quiz", "history"];
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

  // ── Computed values ────────────────────────────────────────────────────────
  const curAlgo = ALGOS.find(a => a.key === algo);
  const avgWTVal = metrics.length ? (metrics.reduce((s, p) => s + p.wt, 0) / metrics.length).toFixed(2) : "—";
  const avgTATVal = metrics.length ? (metrics.reduce((s, p) => s + p.tat, 0) / metrics.length).toFixed(2) : "—";
  const cpuBusy = timeline.filter(t => t.pid !== "Idle").reduce((s, t) => s + t.end - t.start, 0);
  const cpuUtilVal = totalTime ? ((cpuBusy / totalTime) * 100).toFixed(1) : "—";
  const throughputVal = totalTime ? (processes.length / totalTime).toFixed(3) : "—";
  const hasIO = processes.some(p => p.ioTime && p.ioTime > 0);
  const starvingPids = new Set(starvationWarnings.map(w => w.pid));

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>
      {themeStyle && <style>{themeStyle}</style>}
      <Confetti trigger={confettiTrigger} />
      <Stars />
      <div className="app swipe-container" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="header">
          <div className="title">SCHEDULING SIMULATOR</div>
          <div className="subtitle">CPU PROCESS VISUALIZATION &amp; ANALYTICS</div>
          <div className="header-controls">
            {/* Feature 12: Dark/Light toggle */}
            <button className="mode-toggle" onClick={() => setDarkMode(d => !d)} title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
              {darkMode ? "☀️" : "🌙"}
            </button>
          </div>
        </div>

        {/* ── Tab Bar + Theme Picker ──────────────────────────────────────── */}
        <div className="tab-bar-row">
          <div className="tab-wrap">
            <div className={`tab ${activeTab === "simulate" ? "active" : ""}`} onClick={() => setActiveTab("simulate")}>▶ Simulate</div>
            <div className={`tab ${activeTab === "compare" ? "active" : ""}`} onClick={() => setActiveTab("compare")}>◈ Compare</div>
            <div className={`tab ${activeTab === "quiz" ? "active" : ""}`} onClick={() => setActiveTab("quiz")}>🎓 Quiz</div>
            <div className={`tab ${activeTab === "history" ? "active" : ""}`} onClick={() => setActiveTab("history")}>📜 History</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 9, color: "var(--text2)", letterSpacing: "0.1em" }}>THEME</span>
            <div className="theme-picker">
              {Object.entries(THEMES).map(([key, t]) => (
                <div key={key} className={`theme-swatch ${theme === key ? "active" : ""}`}
                  title={t.label} style={{ background: t.accent }} onClick={() => setTheme(key)} />
              ))}
            </div>
          </div>
        </div>

        {/* ── Main Panels ─────────────────────────────────────────────────── */}
        <div className="main">
          {/* Algorithm Config */}
          <div className="card">
            <div className="card-title">Algorithm</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div className="select-wrap" style={{ flex: 1 }}>
                <select value={algo} onChange={e => setAlgo(e.target.value)}>
                  {ALGOS.map(a => <option key={a.key} value={a.key}>{a.label}</option>)}
                </select>
                <div className="select-arrow">▾</div>
              </div>
              {/* Feature 11: Info tooltip */}
              <AlgoInfoTooltip algoKey={algo} />
            </div>
            <div className="algo-desc">{curAlgo?.desc}</div>

            {algo === "rr" && (
              <>
                <div className="label">Time Quantum</div>
                <input type="number" min="1" value={quantum} onChange={e => setQuantum(Number(e.target.value))} />
              </>
            )}
            {algo === "mlq" && (
              <div className="label" style={{ marginTop: 10, fontSize: 10, lineHeight: 1.5 }}>
                ℹ️ Assign each process to Foreground (RR, q=2) or Background (FCFS). FG gets 80% CPU, BG gets 20%.
              </div>
            )}

            {/* Feature 2: Aging toggle */}
            {algo === "priority" && (
              <label className="aging-toggle">
                <input type="checkbox" checked={agingEnabled} onChange={e => setAgingEnabled(e.target.checked)} />
                Enable Aging (priority improves every 5 units of waiting)
              </label>
            )}

            <button className="btn btn-primary" onClick={handleSubmit}>▶ SUBMIT</button>
            <button className="btn-compare" onClick={handleCompare}>◈ COMPARE ALL ALGORITHMS</button>

            {/* Feature 10: Preset scenarios */}
            <div className="label" style={{ marginTop: 16 }}>PRESET SCENARIOS</div>
            <div className="preset-grid">
              {PRESETS.map((p, i) => (
                <button key={i} className="preset-btn" onClick={() => loadPreset(p)}>
                  <div>{p.name}</div>
                  <div className="preset-desc">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Process List */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 6 }}>
              <div className="card-title" style={{ marginBottom: 0 }}>Processes</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button className="btn btn-sm" onClick={() => setShowModal(true)}>+ Add</button>
                {/* Feature 9: Random generator */}
                <button className="btn btn-sm" onClick={generateRandom} title="Generate random processes">🎲</button>
                {/* Feature 8: CSV import */}
                <button className="btn btn-sm" onClick={() => setShowCSVModal(true)} title="Import CSV">📂</button>
              </div>
            </div>
            {processes.length === 0 && <div className="empty-state">No processes yet. Add one!</div>}
            {processes.map(p => (
              <div key={p.pid} className={`process-item ${starvingPids.has(p.pid) ? "starving" : ""}`}>
                <div className="process-dot" style={{ background: p.color }}>{p.pid}</div>
                <div className="process-info">
                  <div className="process-name">{p.pid} {p.ioTime > 0 && <span style={{ fontSize: 9, color: "var(--accent3)" }}>⚡I/O:{p.ioTime}</span>}</div>
                  <div className="process-meta">
                    AT:{p.arrival} · BT:{p.burst}
                    {(algo === "priority" || algo === "mlq") ? ` · P:${p.priority}` : ""}
                    {algo === "mlq" ? ` · Q:${p.queue === "fg" ? "FG" : "BG"}` : ""}
                  </div>
                </div>
                <button className="remove-btn" onClick={() => removeProcess(p.pid)} aria-label={`Remove ${p.pid}`}>×</button>
              </div>
            ))}

            {/* Feature 5: Starvation alerts */}
            {submitted && <StarvationAlert warnings={starvationWarnings} />}

            {processes.length > 0 && (
              <button className="btn btn-danger" onClick={() => setProcesses([])}>✕ Clear all</button>
            )}
          </div>
        </div>

        {/* ── Simulate Tab ────────────────────────────────────────────────── */}
        {activeTab === "simulate" && submitted && (
          <>
            {/* Print info (only visible in print) */}
            <div className="section">
              <div className="print-info">
                <strong>Algorithm:</strong> {curAlgo?.label} | <strong>Processes:</strong> {processes.length} |
                <strong> Avg WT:</strong> {avgWTVal} | <strong>Avg TAT:</strong> {avgTATVal} |
                <strong> CPU Util:</strong> {cpuUtilVal}%
              </div>
            </div>

            {/* Gantt Chart */}
            <div className="section">
              <div className="gantt-wrap" id="gantt-section">
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                    <div className="gantt-title" style={{ marginBottom: 0 }}>GANTT CHART</div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <div className="view-toggle">
                        <button className={`view-toggle-btn ${ganttView === "combined" ? "active" : ""}`} onClick={() => setGanttView("combined")}>Combined</button>
                        <button className={`view-toggle-btn ${ganttView === "perProcess" ? "active" : ""}`} onClick={() => setGanttView("perProcess")}>Per-Proc</button>
                      </div>
                      {/* Feature 6 & 7: Export buttons */}
                      <div className="export-row">
                        <button className="view-toggle-btn" onClick={() => window.print()} title="Export PDF">📄 PDF</button>
                        <button className="view-toggle-btn" onClick={() => exportGanttPNG(timeline, totalTime)} title="Save as PNG">📷 PNG</button>
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
                  ioSegments={ioSegments}
                />

                <ExplanationBox
                  explanations={buildExplanations(timeline, processes, algo)}
                  tick={tick}
                  totalTime={totalTime}
                />

                {/* Feature 3: CPU Utilization Chart */}
                <UtilizationChart timeline={timeline} tick={tick} totalTime={totalTime} />

                {/* Feature 4: Process State Diagram */}
                <ProcessStateDiagram processes={processes} timeline={timeline} tick={tick} />
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
                        {hasIO && <th>I/O</th>}
                        <th>CT</th>
                        <th>WT</th>
                        <th>TAT</th>
                        {hasIO && <th>I/O WT</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.map(p => (
                        <tr key={p.pid} className={starvingPids.has(p.pid) ? "starving-row" : ""}>
                          <td><span className="badge" style={{ background: p.color, color: "#000" }}>{p.pid}</span>
                            {p.aged && <span className="aged-badge">⬆</span>}
                          </td>
                          <td>{p.arrival}</td>
                          <td>{p.burst}</td>
                          {hasIO && <td>{p.ioTime || 0}</td>}
                          <td>{p.ct}</td>
                          <td style={{ color: p.wt > 0 ? "#ffd60a" : "var(--accent)" }}>{p.wt}</td>
                          <td>{p.tat}</td>
                          {hasIO && <td>{p.ioWT || 0}</td>}
                        </tr>
                      ))}
                      <tr className="total-row">
                        <td colSpan={hasIO ? 5 : 4}><strong>Avg</strong></td>
                        <td>{avgWTVal}</td>
                        <td>{avgTATVal}</td>
                        {hasIO && <td>—</td>}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Compare Tab ─────────────────────────────────────────────────── */}
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
                <div className="compare-summary-grid">
                  {Object.entries(compareResults).map(([a, r]) => (
                    <div key={a} className={a === bestAlgo ? "winner-card" : ""}
                      style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8, padding: 10, textAlign: "center" }}>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 10, color: a === bestAlgo ? "var(--accent)" : "var(--text)", marginBottom: 6 }}>
                        {a === bestAlgo ? "🏆 " : ""}{a.toUpperCase()}
                      </div>
                      <div style={{ fontSize: 9, color: "var(--text2)" }}>Avg WT</div>
                      <div style={{ fontSize: 14, color: darkMode ? "#fff" : "#111" }}>{r.avgWT.toFixed(2)}</div>
                      <div style={{ fontSize: 9, color: "var(--text2)", marginTop: 4 }}>Avg TAT</div>
                      <div style={{ fontSize: 14, color: darkMode ? "#fff" : "#111" }}>{r.avgTAT.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Quiz Tab ────────────────────────────────────────────────────── */}
        {activeTab === "quiz" && (
          <div className="section">
            <QuizPanel />
          </div>
        )}

        {/* ── History Tab (Feature 13) ────────────────────────────────────── */}
        {activeTab === "history" && (
          <div className="section">
            <HistoryPanel history={simHistory} onRestore={restoreFromHistory} onClear={clearHistory} />
          </div>
        )}

        {/* Footer */}
        <div className="footer-text" style={{ textAlign: "center", marginTop: 36, fontSize: 10, color: "var(--text3)", padding: "0 12px" }}>
          CPU SCHEDULING SIMULATOR · MICRO PROJECT · DEPT OF INFORMATION TECHNOLOGY
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      {showModal && (
        <AddModal
          onAdd={addProcess}
          onClose={() => setShowModal(false)}
          nextId={`P${processes.length + 1}`}
          needsPriority={algo === "priority" || algo === "mlq"}
          needsQueue={algo === "mlq"}
          needsIO={true}
        />
      )}
      {showCSVModal && (
        <CSVImportModal onImport={handleCSVImport} onClose={() => setShowCSVModal(false)} />
      )}
      {toast && <div className={`toast ${toastType === "error" ? "error" : ""}`}>{toast}</div>}
    </>
  );
}
