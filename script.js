// Service Worker Registration
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

// Sidebar Controls
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const menuToggleBtn = document.getElementById("menuToggleBtn");
const closeSidebarBtn = document.getElementById("closeSidebarBtn");

function openSidebar() {
  sidebar.classList.add("open");
  sidebarOverlay.classList.add("active");
}

function closeSidebar() {
  sidebar.classList.remove("open");
  sidebarOverlay.classList.remove("active");
}

menuToggleBtn.addEventListener("click", openSidebar);
closeSidebarBtn.addEventListener("click", closeSidebar);
sidebarOverlay.addEventListener("click", closeSidebar);

// Toast Notification (Auto-dismiss in 3.5s)
const toastEl = document.getElementById("toast");
let toastTimer = null;

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 3500);
}

// Mode Switching
const panels = {
  scientific: document.getElementById("scientificPanel"),
  graphing: document.getElementById("graphingPanel"),
  equation: document.getElementById("equationPanel"),
  matrix: document.getElementById("matrixPanel"),
  statistics: document.getElementById("statisticsPanel"),
  numbers: document.getElementById("numbersPanel")
};

const navItems = document.querySelectorAll(".nav-item[data-mode]");
const workspaceTitle = document.getElementById("workspaceTitle");

navItems.forEach((btn) => {
  btn.addEventListener("click", () => {
    const mode = btn.dataset.mode;
    navItems.forEach((item) => item.classList.remove("active"));
    btn.classList.add("active");

    Object.keys(panels).forEach((key) => {
      panels[key].classList.toggle("hidden", key !== mode);
    });

    const title = btn.textContent.replace(/^[^\w]+/, "").trim();
    workspaceTitle.textContent = title;
    if (mode === "graphing") drawGraph();
    closeSidebar();
    showToast(`${title} active`);
  });
});

// Theme Toggle
const themeToggleBtn = document.getElementById("themeToggleBtn");
themeToggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("light-theme");
  const isLight = document.body.classList.contains("light-theme");
  themeToggleBtn.innerHTML = isLight ? "&#9790;" : "&#9728;";
  if (!panels.graphing.classList.contains("hidden")) drawGraph();
});

// Scientific Calculator & Memory State
const expressionDisplay = document.getElementById("expressionDisplay");
const resultDisplay = document.getElementById("resultDisplay");
const degBtn = document.getElementById("degBtn");
const radBtn = document.getElementById("radBtn");
const copyResultBtn = document.getElementById("copyResultBtn");
const memIndicator = document.getElementById("memIndicator");
const shift2ndBtn = document.getElementById("shift2ndBtn");

let currentExpression = "";
let lastAnswer = 0;
let memoryValue = 0;
let isDegree = true;
let isSecondShift = false;
let history = JSON.parse(localStorage.getItem("mathpro_pro_history") || "[]");

function updateMemBadge() {
  memIndicator.classList.toggle("hidden", memoryValue === 0);
}

shift2ndBtn.addEventListener("click", () => {
  isSecondShift = !isSecondShift;
  shift2ndBtn.classList.toggle("active-2nd", isSecondShift);

  const t1 = document.getElementById("trig1");
  const t2 = document.getElementById("trig2");
  const t3 = document.getElementById("trig3");
  const pk = document.getElementById("powKey");

  if (isSecondShift) {
    t1.textContent = "sinh";
    t1.dataset.val = "sinh(";
    t2.textContent = "cosh";
    t2.dataset.val = "cosh(";
    t3.textContent = "tanh";
    t3.dataset.val = "tanh(";
    pk.textContent = "x³";
    pk.dataset.action = "pow3";
  } else {
    t1.textContent = "sin";
    t1.dataset.val = "sin(";
    t2.textContent = "cos";
    t2.dataset.val = "cos(";
    t3.textContent = "tan";
    t3.dataset.val = "tan(";
    pk.textContent = "x²";
    pk.dataset.action = "pow2";
  }
});

document.querySelector(".mem-strip").addEventListener("click", (e) => {
  const mBtn = e.target.closest(".mem-key[data-mem]");
  if (!mBtn) return;
  const op = mBtn.dataset.mem;
  const currentVal = parseFloat(resultDisplay.textContent) || 0;

  if (op === "MC") {
    memoryValue = 0;
    updateMemBadge();
    showToast("Memory cleared");
  } else if (op === "MR") {
    currentExpression += String(memoryValue);
    updateDisplay();
  } else if (op === "M+") {
    memoryValue += currentVal;
    updateMemBadge();
    showToast(`Added to memory (${memoryValue})`);
  } else if (op === "M-") {
    memoryValue -= currentVal;
    updateMemBadge();
    showToast(`Subtracted from memory (${memoryValue})`);
  }
});

degBtn.addEventListener("click", () => {
  isDegree = true;
  degBtn.classList.add("active");
  radBtn.classList.remove("active");
  showToast("Angle mode: DEG");
});

radBtn.addEventListener("click", () => {
  isDegree = false;
  radBtn.classList.add("active");
  degBtn.classList.remove("active");
  showToast("Angle mode: RAD");
});

function updateDisplay() {
  expressionDisplay.textContent = currentExpression || "Ready to calculate";
}

function factorial(n) {
  if (n < 0 || !Number.isInteger(n) || n > 170) return NaN;
  if (n === 0 || n === 1) return 1;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function prepareMathExpression(expr, xVal = null) {
  let s = expr
    .replace(/π/g, `(${Math.PI})`)
    .replace(/\be\b/g, `(${Math.E})`)
    .replace(/\^/g, "**")
    .replace(/%/g, "/100")
    .replace(/sqrt\(/g, "Math.sqrt(")
    .replace(/cbrt\(/g, "Math.cbrt(")
    .replace(/abs\(/g, "Math.abs(")
    .replace(/log\(/g, "Math.log10(")
    .replace(/ln\(/g, "Math.log(")
    .replace(/sinh\(/g, "Math.sinh(")
    .replace(/cosh\(/g, "Math.cosh(")
    .replace(/tanh\(/g, "Math.tanh(");

  if (xVal !== null) s = s.replace(/\bx\b/g, `(${xVal})`);

  const toRad = isDegree ? `*(Math.PI/180)` : "";
  const fromRad = isDegree ? `*(180/Math.PI)` : "";

  s = s
    .replace(/asin\(([^()]+)\)/g, `(Math.asin($1)${fromRad})`)
    .replace(/acos\(([^()]+)\)/g, `(Math.acos($1)${fromRad})`)
    .replace(/atan\(([^()]+)\)/g, `(Math.atan($1)${fromRad})`)
    .replace(/sin\(([^()]+)\)/g, `Math.sin(($1)${toRad})`)
    .replace(/cos\(([^()]+)\)/g, `Math.cos(($1)${toRad})`)
    .replace(/tan\(([^()]+)\)/g, `Math.tan(($1)${toRad})`);

  const openP = (s.match(/\(/g) || []).length;
  const closeP = (s.match(/\)/g) || []).length;
  if (openP > closeP) s += ")".repeat(openP - closeP);
  return s;
}

function evaluateExpression(expr) {
  return new Function(`"use strict"; return (${prepareMathExpression(expr)});`)();
}

function handleAction(action, val = "") {
  if (action === "insert" || action === "fn") {
    currentExpression += val;
    updateDisplay();
  } else if (action === "clear") {
    currentExpression = "";
    resultDisplay.textContent = "0";
    updateDisplay();
  } else if (action === "backspace") {
    currentExpression = currentExpression.slice(0, -1);
    updateDisplay();
  } else if (action === "ans") {
    currentExpression += String(lastAnswer);
    updateDisplay();
  } else if (action === "pow2") {
    currentExpression += "^2";
    updateDisplay();
  } else if (action === "pow3") {
    currentExpression += "^3";
    updateDisplay();
  } else if (action === "inv") {
    if (currentExpression) {
      currentExpression = `1/(${currentExpression})`;
      updateDisplay();
    }
  } else if (action === "fact") {
    try {
      const n = currentExpression ? Number(evaluateExpression(currentExpression)) : lastAnswer;
      const fVal = factorial(n);
      if (Number.isNaN(fVal)) {
        showToast("Enter integer 0–170");
      } else {
        resultDisplay.textContent = fVal;
        lastAnswer = fVal;
        addHistory(`${n}!`, fVal);
        currentExpression = "";
        updateDisplay();
      }
    } catch {
      showToast("Invalid factorial input");
    }
  } else if (action === "calculate") {
    if (!currentExpression) return;
    try {
      const raw = evaluateExpression(currentExpression);
      if (typeof raw !== "number" || !Number.isFinite(raw)) {
        resultDisplay.textContent = "Math Error";
        showToast("Invalid operation");
        return;
      }
      const clean = Number(raw.toPrecision(12));
      resultDisplay.textContent = clean;
      addHistory(currentExpression, clean);
      lastAnswer = clean;
      currentExpression = "";
    } catch {
      resultDisplay.textContent = "Syntax Error";
      showToast("Syntax error");
    }
  }
}

document.querySelector(".keypad").addEventListener("click", (e) => {
  const key = e.target.closest(".key");
  if (!key) return;
  handleAction(key.dataset.action, key.dataset.val);
});

window.addEventListener("keydown", (e) => {
  if (panels.scientific.classList.contains("hidden")) return;
  if (["INPUT", "SELECT"].includes(document.activeElement.tagName)) return;

  if (/^[0-9+\-*/().^%]$/.test(e.key)) handleAction("insert", e.key);
  else if (e.key === "Enter") {
    e.preventDefault();
    handleAction("calculate");
  } else if (e.key === "Backspace") handleAction("backspace");
  else if (e.key === "Escape") handleAction("clear");
});

copyResultBtn.addEventListener("click", () => {
  navigator.clipboard?.writeText(resultDisplay.textContent).catch(() => {});
  showToast(`Copied: ${resultDisplay.textContent}`);
});

// History
const historyPanel = document.getElementById("historyPanel");
const historyList = document.getElementById("historyList");

function saveHistory() {
  localStorage.setItem("mathpro_pro_history", JSON.stringify(history));
}

function addHistory(expr, res) {
  history.unshift({ expr, res });
  if (history.length > 40) history.pop();
  saveHistory();
  renderHistory();
}

function renderHistory() {
  if (!history.length) {
    historyList.innerHTML = `<li class="empty-history">No calculations yet.</li>`;
    return;
  }
  historyList.innerHTML = history
    .map((h) => `<li data-res="${h.res}"><strong>${h.expr}</strong> = ${h.res}</li>`)
    .join("");
}

historyList.addEventListener("click", (e) => {
  const li = e.target.closest("li[data-res]");
  if (!li) return;
  currentExpression += li.dataset.res;
  updateDisplay();
  showToast("Inserted from history");
});

document.getElementById("openHistoryBtn").addEventListener("click", () => {
  historyPanel.classList.remove("hidden");
  closeSidebar();
});
document.getElementById("closeHistoryBtn").addEventListener("click", () => {
  historyPanel.classList.add("hidden");
});

function clearAllHistory() {
  history = [];
  saveHistory();
  renderHistory();
  showToast("History cleared");
}
document.getElementById("clearHistoryBtn").addEventListener("click", clearAllHistory);
document.getElementById("clearAllDataBtn").addEventListener("click", () => {
  clearAllHistory();
  closeSidebar();
});
renderHistory();

// Graphing with Zoom
const graphFuncInput = document.getElementById("graphFuncInput");
const graphCanvas = document.getElementById("graphCanvas");
const ctx = graphCanvas.getContext("2d");
let graphScale = 35;

function drawGraph() {
  const w = graphCanvas.width;
  const h = graphCanvas.height;
  const isLight = document.body.classList.contains("light-theme");
  const ox = w / 2;
  const oy = h / 2;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = isLight ? "#e2e8f0" : "#0b1322";
  ctx.fillRect(0, 0, w, h);

  // Subtle Grid
  ctx.strokeStyle = isLight ? "rgba(100,116,139,0.2)" : "rgba(148,163,184,0.12)";
  ctx.lineWidth = 1;
  for (let gx = ox % graphScale; gx < w; gx += graphScale) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, h);
    ctx.stroke();
  }
  for (let gy = oy % graphScale; gy < h; gy += graphScale) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(w, gy);
    ctx.stroke();
  }

  // Axes
  ctx.strokeStyle = isLight ? "#475569" : "#64748b";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, oy);
  ctx.lineTo(w, oy);
  ctx.moveTo(ox, 0);
  ctx.lineTo(ox, h);
  ctx.stroke();

  try {
    const expr = graphFuncInput.value.trim();
    if (!expr) return;
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    let startNew = true;

    for (let px = 0; px < w; px++) {
      const x = (px - ox) / graphScale;
      const y = new Function(`"use strict"; return (${prepareMathExpression(expr, x)});`)();
      if (typeof y !== "number" || !Number.isFinite(y)) {
        startNew = true;
        continue;
      }
      const py = oy - y * graphScale;
      if (py < -250 || py > h + 250) {
        startNew = true;
        continue;
      }
      if (startNew) {
        ctx.moveTo(px, py);
        startNew = false;
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
  } catch {
    showToast("Invalid function");
  }
}

document.getElementById("plotGraphBtn").addEventListener("click", drawGraph);
document.getElementById("zoomInBtn").addEventListener("click", () => {
  graphScale = Math.min(120, graphScale + 10);
  drawGraph();
});
document.getElementById("zoomOutBtn").addEventListener("click", () => {
  graphScale = Math.max(15, graphScale - 10);
  drawGraph();
});

// Quadratic Solver
document.getElementById("solveQuadBtn").addEventListener("click", () => {
  const a = parseFloat(document.getElementById("coeffA").value);
  const b = parseFloat(document.getElementById("coeffB").value);
  const c = parseFloat(document.getElementById("coeffC").value);
  const out = document.getElementById("quadResult");

  if ([a, b, c].some(Number.isNaN) || a === 0) {
    out.textContent = "Provide valid coefficients with a ≠ 0.";
    return;
  }

  const d = b * b - 4 * a * c;
  if (d > 0) {
    const x1 = Number(((-b + Math.sqrt(d)) / (2 * a)).toFixed(6));
    const x2 = Number(((-b - Math.sqrt(d)) / (2 * a)).toFixed(6));
    out.innerHTML = `Real Roots:<br><strong>x₁ = ${x1}</strong>, <strong>x₂ = ${x2}</strong>`;
  } else if (d === 0) {
    const x = Number((-b / (2 * a)).toFixed(6));
    out.innerHTML = `Repeated Root:<br><strong>x = ${x}</strong>`;
  } else {
    const re = Number((-b / (2 * a)).toFixed(4));
    const im = Number((Math.sqrt(-d) / (2 * a)).toFixed(4));
    out.innerHTML = `Complex Roots:<br><strong>x₁ = ${re} + ${im}i</strong><br><strong>x₂ = ${re} - ${im}i</strong>`;
  }
});

// 2x2 Matrix Calculator
function getMat(prefix) {
  return [
    [parseFloat(document.getElementById(`${prefix}11`).value) || 0, parseFloat(document.getElementById(`${prefix}12`).value) || 0],
    [parseFloat(document.getElementById(`${prefix}21`).value) || 0, parseFloat(document.getElementById(`${prefix}22`).value) || 0]
  ];
}

function fmtMat(m) {
  return `[ ${m[0][0]}, ${m[0][1]} ]<br>[ ${m[1][0]}, ${m[1][1]} ]`;
}

document.getElementById("matAddBtn").addEventListener("click", () => {
  const A = getMat("a"), B = getMat("b");
  document.getElementById("matrixResult").innerHTML = `A + B =<br><strong>${fmtMat([[A[0][0]+B[0][0], A[0][1]+B[0][1]], [A[1][0]+B[1][0], A[1][1]+B[1][1]]])}</strong>`;
});

document.getElementById("matMulBtn").addEventListener("click", () => {
  const A = getMat("a"), B = getMat("b");
  const C = [
    [A[0][0]*B[0][0] + A[0][1]*B[1][0], A[0][0]*B[0][1] + A[0][1]*B[1][1]],
    [A[1][0]*B[0][0] + A[1][1]*B[1][0], A[1][0]*B[0][1] + A[1][1]*B[1][1]]
  ];
  document.getElementById("matrixResult").innerHTML = `A × B =<br><strong>${fmtMat(C)}</strong>`;
});

document.getElementById("matDetBtn").addEventListener("click", () => {
  const A = getMat("a");
  const det = A[0][0]*A[1][1] - A[0][1]*A[1][0];
  document.getElementById("matrixResult").innerHTML = `Determinant det(A) = <strong>${det}</strong>`;
});

// Statistics Calculator
document.getElementById("calcStatsBtn").addEventListener("click", () => {
  const nums = document.getElementById("statsInput").value
    .split(",")
    .map((v) => parseFloat(v.trim()))
    .filter((n) => !Number.isNaN(n));

  const out = document.getElementById("statsResult");
  if (!nums.length) {
    out.textContent = "Enter valid numbers separated by commas.";
    return;
  }

  const count = nums.length;
  const sum = nums.reduce((a, b) => a + b, 0);
  const mean = Number((sum / count).toFixed(6));
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(count / 2);
  const median = count % 2 ? sorted[mid] : Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(6));

  out.innerHTML = `Count: <strong>${count}</strong> | Sum: <strong>${sum}</strong><br>Mean: <strong>${mean}</strong> | Median: <strong>${median}</strong>`;
});

// Base Converter
const baseInput = document.getElementById("baseInput");
const baseFrom = document.getElementById("baseFrom");

function convertBases() {
  const raw = baseInput.value.trim();
  const base = parseInt(baseFrom.value, 10);
  const val = parseInt(raw, base);
  if (!raw || Number.isNaN(val)) {
    showToast("Invalid number for base");
    return;
  }
  document.getElementById("outDec").textContent = val.toString(10);
  document.getElementById("outBin").textContent = val.toString(2);
  document.getElementById("outOct").textContent = val.toString(8);
  document.getElementById("outHex").textContent = val.toString(16).toUpperCase();
}

document.getElementById("convertBaseBtn").addEventListener("click", convertBases);
convertBases();