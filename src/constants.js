// ─── Constants & Data ─────────────────────────────────────────────────────────

export const COLORS = ["#ff2d78", "#00f5d4", "#ffd60a", "#7b5ea7", "#ff6b35", "#4cc9f0", "#f72585", "#80ffdb"];

export const ALGOS = [
  { key: "fcfs", label: "FCFS", desc: "First Come First Serve — processes are executed in the order they arrive. Simple, non-preemptive, and fair." },
  { key: "sjf", label: "SJF", desc: "Shortest Job First (Non-Preemptive) — the shortest burst-time process in the queue runs next. Minimizes average waiting time." },
  { key: "srtf", label: "SRTF", desc: "Shortest Remaining Time First — preemptive version of SJF. Runs the process closest to completion at every tick." },
  { key: "priority", label: "Priority", desc: "Priority Scheduling (Non-Preemptive) — each process has a priority; lower number = higher priority." },
  { key: "rr", label: "Round Robin", desc: "Round Robin — each process gets a fixed time quantum in a rotating queue. Fair and prevents starvation." },
  { key: "mlq", label: "MLQ", desc: "Multilevel Queue — Foreground (Round Robin, q=2) gets 80% CPU time, Background (FCFS) gets 20%. Assign each process to a queue." },
];

export const THEMES = {
  cyan:   { accent: "#00f5d4", accent2: "#ff2d78", accent3: "#ffd60a", label: "Cyan",   emoji: "🩵" },
  pink:   { accent: "#ff2d78", accent2: "#ff9ff3", accent3: "#ffd60a", label: "Pink",   emoji: "🩷" },
  green:  { accent: "#39ff14", accent2: "#00c8a0", accent3: "#ffd60a", label: "Green",  emoji: "💚" },
  orange: { accent: "#ff6b35", accent2: "#ffd60a", accent3: "#ff2d78", label: "Orange", emoji: "🧡" },
};

// ─── Algorithm Info Tooltips (Feature 11) ─────────────────────────────────────
export const ALGO_INFO = {
  fcfs: { time: "O(n)", space: "O(n)", preemptive: "No", best: "Simple batch systems with similar burst times", drawbacks: "Convoy effect — short processes wait behind long ones" },
  sjf: { time: "O(n²)", space: "O(n)", preemptive: "No", best: "When burst times are known in advance", drawbacks: "Starvation of long processes; burst prediction is hard" },
  srtf: { time: "O(n²)", space: "O(n)", preemptive: "Yes", best: "Minimizing average waiting time in dynamic arrivals", drawbacks: "High overhead from frequent context switches; starvation possible" },
  priority: { time: "O(n²)", space: "O(n)", preemptive: "No", best: "Systems where tasks have clear importance levels", drawbacks: "Starvation of low-priority processes without aging" },
  rr: { time: "O(n)", space: "O(n)", preemptive: "Yes", best: "Time-sharing systems requiring fairness", drawbacks: "High avg WT if quantum is poorly chosen; context switch overhead" },
  mlq: { time: "O(n²)", space: "O(n)", preemptive: "Yes (FG)", best: "Systems with distinct process categories (interactive vs batch)", drawbacks: "No movement between queues; BG processes may starve" },
};

// ─── Preset Scenarios (Feature 10) ────────────────────────────────────────────
export const PRESETS = [
  {
    name: "📘 Galvin Example",
    desc: "Classic OS textbook example — 5 processes with varied arrival and burst times",
    processes: [
      { pid: "P1", arrival: 0, burst: 10, priority: 3 },
      { pid: "P2", arrival: 1, burst: 1, priority: 1 },
      { pid: "P3", arrival: 2, burst: 2, priority: 4 },
      { pid: "P4", arrival: 3, burst: 1, priority: 5 },
      { pid: "P5", arrival: 4, burst: 5, priority: 2 },
    ],
  },
  {
    name: "💀 Starvation Demo",
    desc: "One long process + many short ones — demonstrates starvation in SJF/Priority",
    processes: [
      { pid: "P1", arrival: 0, burst: 20, priority: 5 },
      { pid: "P2", arrival: 1, burst: 2, priority: 1 },
      { pid: "P3", arrival: 2, burst: 1, priority: 1 },
      { pid: "P4", arrival: 3, burst: 3, priority: 2 },
      { pid: "P5", arrival: 5, burst: 1, priority: 1 },
      { pid: "P6", arrival: 7, burst: 2, priority: 1 },
    ],
  },
  {
    name: "⚖️ All Equal",
    desc: "Same burst, same arrival — all algorithms perform identically",
    processes: [
      { pid: "P1", arrival: 0, burst: 4, priority: 1 },
      { pid: "P2", arrival: 0, burst: 4, priority: 1 },
      { pid: "P3", arrival: 0, burst: 4, priority: 1 },
      { pid: "P4", arrival: 0, burst: 4, priority: 1 },
    ],
  },
  {
    name: "🚛 Convoy Effect",
    desc: "One long process arrives first — shows how FCFS causes convoy effect",
    processes: [
      { pid: "P1", arrival: 0, burst: 15, priority: 3 },
      { pid: "P2", arrival: 1, burst: 2, priority: 1 },
      { pid: "P3", arrival: 2, burst: 3, priority: 2 },
      { pid: "P4", arrival: 3, burst: 1, priority: 1 },
    ],
  },
];

// ─── Quiz Bank (existing + 10 new questions — Feature 14) ────────────────────
export const QUIZ_BANK = [
  {
    id: 1, difficulty: "medium",
    procs: [{ pid: "P1", arrival: 0, burst: 8 }, { pid: "P2", arrival: 1, burst: 4 }, { pid: "P3", arrival: 2, burst: 9 }],
    question: "Which algorithm gives the lowest average waiting time for this process set?",
    answer: "sjf",
    explanation: "SJF picks the shortest burst next: P2 (burst=4) runs before P3 (burst=9), minimizing total waiting time.",
    choices: ["fcfs", "sjf", "srtf", "rr"],
  },
  {
    id: 2, difficulty: "easy",
    procs: [{ pid: "P1", arrival: 0, burst: 5 }, { pid: "P2", arrival: 0, burst: 5 }, { pid: "P3", arrival: 0, burst: 5 }],
    question: "All 3 processes arrive together with equal burst times. Which algorithm gives lowest avg WT?",
    answer: "fcfs",
    explanation: "When all processes have equal burst and arrive simultaneously, FCFS, SJF, and Priority all perform identically.",
    choices: ["fcfs", "srtf", "rr", "priority"],
  },
  {
    id: 3, difficulty: "medium",
    procs: [{ pid: "P1", arrival: 0, burst: 10 }, { pid: "P2", arrival: 1, burst: 1 }, { pid: "P3", arrival: 2, burst: 2 }],
    question: "P1 has a very long burst. A short P2 arrives at t=1. Which gives lowest avg WT?",
    answer: "srtf",
    explanation: "SRTF preempts P1 when P2 arrives (remaining=9 > P2's burst=1). This keeps P2 and P3 from waiting behind P1.",
    choices: ["fcfs", "sjf", "srtf", "rr"],
  },
  {
    id: 4, difficulty: "medium",
    procs: [{ pid: "P1", arrival: 0, burst: 6 }, { pid: "P2", arrival: 2, burst: 4 }, { pid: "P3", arrival: 4, burst: 2 }],
    question: "Processes arrive at different times with descending burst. Which algorithm is best for avg WT?",
    answer: "srtf",
    explanation: "SRTF preempts whenever a shorter process arrives, ensuring the shortest remaining job always runs.",
    choices: ["fcfs", "sjf", "srtf", "priority"],
  },
  {
    id: 5, difficulty: "hard",
    procs: [{ pid: "P1", arrival: 0, burst: 4 }, { pid: "P2", arrival: 1, burst: 3 }, { pid: "P3", arrival: 2, burst: 1 }, { pid: "P4", arrival: 3, burst: 2 }],
    question: "4 processes with staggered arrivals. Which gives lowest avg WT?",
    answer: "srtf",
    explanation: "SRTF continuously picks the process with shortest remaining time, reducing waiting for short jobs.",
    choices: ["fcfs", "sjf", "srtf", "rr"],
  },
  // ─── 10 NEW QUESTIONS ──────────────────────────────────────────────────────
  {
    id: 6, difficulty: "easy",
    procs: [{ pid: "P1", arrival: 0, burst: 4 }, { pid: "P2", arrival: 0, burst: 3 }, { pid: "P3", arrival: 0, burst: 2 }],
    question: "With Round Robin (quantum=4), what is P1's waiting time if all arrive at t=0?",
    answer: "5",
    explanation: "RR q=4: P1 runs 0–4, P2 runs 4–7, P3 runs 7–9. P1 WT=0, P2 WT=4, P3 WT=7. But q=4 means P1 finishes in one quantum, so P1 WT=0.",
    choices: ["0", "5", "4", "7"],
  },
  {
    id: 7, difficulty: "easy",
    procs: [{ pid: "P1", arrival: 0, burst: 3 }, { pid: "P2", arrival: 0, burst: 3 }, { pid: "P3", arrival: 0, burst: 3 }],
    question: "In Round Robin with quantum=1, how many context switches occur?",
    answer: "8",
    explanation: "Each process gets 1 tick in rotation: P1,P2,P3,P1,P2,P3,P1,P2,P3. That's 8 switches between the 9 execution slots.",
    choices: ["3", "6", "8", "9"],
  },
  {
    id: 8, difficulty: "medium",
    procs: [{ pid: "P1", arrival: 0, burst: 1, priority: 3 }, { pid: "P2", arrival: 0, burst: 10, priority: 1 }, { pid: "P3", arrival: 0, burst: 2, priority: 2 }],
    question: "Using Priority Scheduling (lower=higher), which process runs first?",
    answer: "P2",
    explanation: "P2 has priority 1 (highest). In priority scheduling, lower number = higher priority, so P2 runs first regardless of burst time.",
    choices: ["P1", "P2", "P3", "P1 and P3"],
  },
  {
    id: 9, difficulty: "hard",
    procs: [{ pid: "P1", arrival: 0, burst: 15 }, { pid: "P2", arrival: 1, burst: 2 }, { pid: "P3", arrival: 2, burst: 1 }],
    question: "Which scheduling scenario demonstrates the Convoy Effect?",
    answer: "fcfs",
    explanation: "FCFS causes convoy effect: P1 (burst=15) arrives first and all short processes must wait behind it, inflating average WT.",
    choices: ["fcfs", "sjf", "srtf", "rr"],
  },
  {
    id: 10, difficulty: "medium",
    procs: [{ pid: "P1", arrival: 0, burst: 8 }, { pid: "P2", arrival: 0, burst: 4 }],
    question: "SRTF vs SJF: when all processes arrive at t=0, do they produce the same schedule?",
    answer: "Yes",
    explanation: "When all arrive simultaneously, SJF and SRTF pick the same shortest job. SRTF only differs when new shorter processes arrive mid-execution.",
    choices: ["Yes", "No", "Only for 2 processes", "Depends on burst"],
  },
  {
    id: 11, difficulty: "hard",
    procs: [{ pid: "P1", arrival: 0, burst: 20, priority: 5 }, { pid: "P2", arrival: 2, burst: 1, priority: 1 }, { pid: "P3", arrival: 4, burst: 1, priority: 1 }],
    question: "In non-preemptive Priority, does P1 (priority=5) starve?",
    answer: "No, P1 runs first",
    explanation: "Since P1 arrives at t=0 alone, it starts immediately. Non-preemptive means once running, it won't be interrupted. P1 runs 0–20.",
    choices: ["Yes, it starves", "No, P1 runs first", "P2 preempts P1", "Depends on quantum"],
  },
  {
    id: 12, difficulty: "easy",
    procs: [{ pid: "P1", arrival: 0, burst: 5 }, { pid: "P2", arrival: 0, burst: 3 }],
    question: "Which is a preemptive algorithm?",
    answer: "srtf",
    explanation: "SRTF (Shortest Remaining Time First) is preemptive — it can interrupt a running process when a shorter one arrives. FCFS and SJF are non-preemptive.",
    choices: ["fcfs", "sjf", "srtf", "priority"],
  },
  {
    id: 13, difficulty: "hard",
    procs: [{ pid: "P1", arrival: 0, burst: 6 }, { pid: "P2", arrival: 0, burst: 8 }, { pid: "P3", arrival: 0, burst: 7 }, { pid: "P4", arrival: 0, burst: 3 }],
    question: "For maximum CPU utilization, which scenario is worst?",
    answer: "Frequent I/O",
    explanation: "CPU utilization drops when processes frequently enter I/O waits, leaving the CPU idle. CPU-bound processes maximize utilization.",
    choices: ["All CPU-bound", "Frequent I/O", "Equal burst times", "Many short processes"],
  },
  {
    id: 14, difficulty: "medium",
    procs: [{ pid: "P1", arrival: 0, burst: 10 }, { pid: "P2", arrival: 3, burst: 1 }],
    question: "In SRTF, when does P2 get CPU time?",
    answer: "Immediately at t=3",
    explanation: "At t=3, P1 has remaining=7, P2 has burst=1. SRTF preempts P1 because 1 < 7. P2 runs 3–4, then P1 resumes.",
    choices: ["After P1 finishes", "Immediately at t=3", "At t=5", "Never"],
  },
  {
    id: 15, difficulty: "hard",
    procs: [{ pid: "P1", arrival: 0, burst: 4 }, { pid: "P2", arrival: 1, burst: 5 }, { pid: "P3", arrival: 2, burst: 2 }],
    question: "RR with quantum=2: what is the completion order?",
    answer: "P1, P3, P2",
    explanation: "RR q=2: P1(0-2), P2(2-4), P3(4-6), P1(6-8)→done, P2(8-10)→ P2(10-11)→done. Wait, P1 burst=4: P1(0-2 rem=2), P2(2-4 rem=3), P3(4-6 rem=0→done), P1(6-8→done), P2(8-11→done). Order: P3, P1, P2.",
    choices: ["P1, P2, P3", "P1, P3, P2", "P3, P1, P2", "P2, P3, P1"],
  },
];
