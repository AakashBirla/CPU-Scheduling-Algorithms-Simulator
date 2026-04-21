// ─── Scheduling Algorithms ────────────────────────────────────────────────────

export function fcfs(processes) {
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

export function sjf(processes) {
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

export function srtf(processes) {
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

export function prioritySched(processes) {
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

export function roundRobin(processes, quantum) {
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

// ─── NEW: Multilevel Queue Scheduling (Feature 1) ────────────────────────────
export function mlq(processes) {
  const procs = processes.map(p => ({ ...p, remaining: p.burst }));
  const fgProcs = procs.filter(p => p.queue === 'fg');
  const bgProcs = procs.filter(p => p.queue === 'bg');
  const timeline = [];
  let time = 0;
  fgProcs.sort((a, b) => a.arrival - b.arrival);
  bgProcs.sort((a, b) => a.arrival - b.arrival);
  const fgReady = [], bgReady = [];
  const fgArr = new Set(), bgArr = new Set();
  let fgCur = null, fgQU = 0, bgCur = null;
  const maxT = procs.reduce((s, p) => s + p.burst + p.arrival, 0) + 20;

  while (time < maxT) {
    for (const p of fgProcs) { if (p.arrival <= time && !fgArr.has(p.pid) && p.remaining > 0) { fgReady.push(p); fgArr.add(p.pid); } }
    for (const p of bgProcs) { if (p.arrival <= time && !bgArr.has(p.pid) && p.remaining > 0) { bgReady.push(p); bgArr.add(p.pid); } }
    if (procs.every(p => p.remaining <= 0)) break;
    const isFg = (time % 5) < 4;
    let ran = false;

    const tryFG = () => {
      if (!fgCur || fgCur.remaining <= 0 || fgQU >= 2) {
        if (fgCur && fgCur.remaining > 0) fgReady.push(fgCur);
        fgCur = fgReady.length ? fgReady.shift() : null; fgQU = 0;
      }
      if (fgCur && fgCur.remaining > 0) {
        const last = timeline[timeline.length - 1];
        if (last && last.pid === fgCur.pid && last.end === time) last.end++;
        else timeline.push({ pid: fgCur.pid, start: time, end: time + 1, color: fgCur.color, queue: 'fg' });
        fgCur.remaining--; fgQU++; ran = true;
        if (fgCur.remaining <= 0) { fgCur = null; fgQU = 0; }
      }
    };
    const tryBG = () => {
      if (!bgCur || bgCur.remaining <= 0) bgCur = bgReady.length ? bgReady.shift() : null;
      if (bgCur && bgCur.remaining > 0) {
        const last = timeline[timeline.length - 1];
        if (last && last.pid === bgCur.pid && last.end === time) last.end++;
        else timeline.push({ pid: bgCur.pid, start: time, end: time + 1, color: bgCur.color, queue: 'bg' });
        bgCur.remaining--; ran = true;
        if (bgCur.remaining <= 0) bgCur = null;
      }
    };

    if (isFg) { tryFG(); if (!ran) tryBG(); } else { tryBG(); if (!ran) tryFG(); }
    if (!ran && procs.some(p => p.remaining > 0)) {
      const last = timeline[timeline.length - 1];
      if (last && last.pid === 'Idle' && last.end === time) last.end++;
      else timeline.push({ pid: 'Idle', start: time, end: time + 1 });
    }
    time++;
  }
  return mergeTimeline(timeline);
}

// ─── NEW: Priority with Aging (Feature 2) ────────────────────────────────────
export function priorityWithAging(processes) {
  const procs = [...processes].sort((a, b) => a.arrival - b.arrival).map(p => ({ ...p, remaining: p.burst, effectivePriority: p.priority, waitStart: -1, aged: false }));
  const timeline = [];
  let time = 0;
  while (procs.some(p => p.remaining > 0)) {
    const available = procs.filter(p => p.arrival <= time && p.remaining > 0);
    if (!available.length) { time++; continue; }
    for (const p of available) {
      if (p.waitStart === -1) p.waitStart = p.arrival;
      const waited = time - p.waitStart;
      const boosts = Math.floor(waited / 5);
      if (boosts > 0) { p.effectivePriority = Math.max(1, p.priority - boosts); p.aged = true; }
    }
    available.sort((a, b) => a.effectivePriority - b.effectivePriority);
    const cur = available[0];
    timeline.push({ pid: cur.pid, start: time, end: time + cur.remaining, color: cur.color, aged: cur.aged });
    time += cur.remaining;
    cur.remaining = 0;
    cur.waitStart = -1;
  }
  return mergeTimeline(timeline);
}

// ─── NEW: I/O-aware simulation (Feature 15) ──────────────────────────────────
export function simulateWithIO(processes, algoKey, quantum) {
  const procs = processes.map(p => {
    const io = p.ioTime || 0;
    const cpu1 = io > 0 ? Math.ceil(p.burst / 2) : p.burst;
    const cpu2 = io > 0 ? Math.floor(p.burst / 2) : 0;
    return { ...p, cpu1, cpu2, ioWait: io, cpu1Rem: cpu1, cpu2Rem: cpu2, ioRem: io, phase: 'wait', firstRun: -1 };
  });
  const timeline = [], ioSegments = [];
  let time = 0, cur = null, qUsed = 0;
  const rrQ = [];
  const maxT = 500;
  const getRem = (p) => p.phase === 'cpu1' ? p.cpu1Rem : p.phase === 'cpu2' ? p.cpu2Rem : 0;

  while (time < maxT) {
    for (const p of procs) { if (p.phase === 'wait' && p.arrival <= time) { p.phase = 'ready1'; if (algoKey === 'rr') rrQ.push(p); } }
    for (const p of procs) { if (p.phase === 'io' && p.ioRem <= 0) { const seg = ioSegments.find(s => s.pid === p.pid && !s.closed); if (seg) { seg.end = time; seg.closed = true; } if (p.cpu2Rem > 0) { p.phase = 'ready2'; if (algoKey === 'rr') rrQ.push(p); } else p.phase = 'done'; } }
    if (procs.every(p => p.phase === 'done')) break;
    if (procs.every(p => p.phase === 'done' || p.phase === 'wait')) { time++; continue; }

    const ready = procs.filter(p => p.phase === 'ready1' || p.phase === 'ready2');
    if (algoKey === 'rr') {
      if (!cur || getRem(cur) <= 0 || qUsed >= quantum) { if (cur && getRem(cur) > 0) rrQ.push(cur); cur = rrQ.length ? rrQ.shift() : null; qUsed = 0; }
    } else if (algoKey === 'srtf') {
      const best = ready.sort((a, b) => getRem(a) - getRem(b))[0];
      if (best && (!cur || getRem(cur) <= 0 || getRem(best) < getRem(cur))) cur = best;
    } else {
      if (!cur || getRem(cur) <= 0) {
        if (algoKey === 'fcfs') ready.sort((a, b) => a.arrival - b.arrival);
        else if (algoKey === 'sjf') ready.sort((a, b) => getRem(a) - getRem(b));
        else if (algoKey === 'priority') ready.sort((a, b) => (a.effectivePriority || a.priority) - (b.effectivePriority || b.priority));
        cur = ready[0] || null;
      }
    }

    if (cur && getRem(cur) > 0) {
      if (cur.phase === 'ready1') cur.phase = 'cpu1';
      if (cur.phase === 'ready2') cur.phase = 'cpu2';
      if (cur.firstRun === -1) cur.firstRun = time;
      const last = timeline[timeline.length - 1];
      if (last && last.pid === cur.pid && last.end === time) last.end++;
      else timeline.push({ pid: cur.pid, start: time, end: time + 1, color: cur.color });
      if (cur.phase === 'cpu1') { cur.cpu1Rem--; if (cur.cpu1Rem <= 0) { if (cur.ioWait > 0) { cur.phase = 'io'; ioSegments.push({ pid: cur.pid, start: time + 1, color: cur.color, closed: false }); } else if (cur.cpu2Rem > 0) cur.phase = 'ready2'; else cur.phase = 'done'; cur = null; qUsed = 0; } }
      else if (cur.phase === 'cpu2') { cur.cpu2Rem--; if (cur.cpu2Rem <= 0) { cur.phase = 'done'; cur = null; qUsed = 0; } }
      if (algoKey === 'rr') qUsed++;
    } else {
      cur = null;
      const last = timeline[timeline.length - 1];
      if (last && last.pid === 'Idle' && last.end === time) last.end++;
      else timeline.push({ pid: 'Idle', start: time, end: time + 1 });
    }
    for (const p of procs) { if (p.phase === 'io') p.ioRem--; }
    time++;
  }
  for (const s of ioSegments) { if (!s.closed) { s.end = time; s.closed = true; } }
  return { timeline: mergeTimeline(timeline), ioSegments, procs };
}

export function mergeTimeline(tl) {
  if (!tl.length) return tl;
  const merged = [tl[0]];
  for (let i = 1; i < tl.length; i++) {
    const last = merged[merged.length - 1];
    if (last.pid === tl[i].pid && last.end === tl[i].start) last.end = tl[i].end;
    else merged.push(tl[i]);
  }
  return merged;
}

export function calcMetrics(processes, timeline, ioSegments) {
  return processes.map(p => {
    const segments = timeline.filter(t => t.pid === p.pid);
    if (!segments.length) return { ...p, ct: 0, tat: 0, wt: 0, rt: 0, ioWT: 0 };
    const ct = Math.max(...segments.map(s => s.end));
    const tat = ct - p.arrival;
    const wt = tat - p.burst;
    const rt = segments[0].start - p.arrival;
    const ioSeg = ioSegments ? ioSegments.filter(s => s.pid === p.pid) : [];
    const ioWT = ioSeg.reduce((s, seg) => s + (seg.end - seg.start), 0);
    return { ...p, ct, tat, wt, rt, ioWT };
  });
}

// ─── Starvation Detection (Feature 5) ────────────────────────────────────────
export function detectStarvation(processes, timeline) {
  const totalTime = timeline.length ? Math.max(...timeline.map(t => t.end)) : 0;
  const warnings = [];
  for (const p of processes) {
    const segs = timeline.filter(t => t.pid === p.pid);
    if (!segs.length) continue;
    let maxWait = 0, waitStart = p.arrival;
    const events = [];
    for (const s of segs) { events.push({ time: s.start, type: 'start' }); events.push({ time: s.end, type: 'end' }); }
    events.sort((a, b) => a.time - b.time);
    let lastEnd = p.arrival;
    for (const s of segs) {
      const gap = s.start - lastEnd;
      if (gap > maxWait) maxWait = gap;
      lastEnd = s.end;
    }
    if (maxWait > 10) warnings.push({ pid: p.pid, wait: maxWait });
  }
  return warnings;
}

// ─── Build Tick-by-Tick Explanations ─────────────────────────────────────────
export function buildExplanations(timeline, processes, algoKey) {
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
          if (algoKey === "mlq") return "multilevel queue selection";
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
