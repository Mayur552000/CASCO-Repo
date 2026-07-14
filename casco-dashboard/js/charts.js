// ─── CHARTS ──────────────────────────────────────────
function gc() { return document.documentElement.dataset.theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'; }
function tc() { return document.documentElement.dataset.theme === 'dark' ? '#8fa8c4' : '#4a6584'; }
function dc(id) { const ch = App.state.charts; if (ch[id]) { ch[id].destroy(); delete ch[id]; } }

function renderCharts(rows) {
  renderStatusChart(rows);
  renderPriorityChart(rows);
  renderPhaseChart(rows);
  renderAssigneeChart(rows);
  renderTrendChart(rows);
}

function renderStatusChart(rows) {
  dc('status');
  const map = { complete: 0, 'in progress': 0, pending: 0, delayed: 0, cancelled: 0 };
  rows.forEach(r => { if (r.status in map) map[r.status]++; });
  const labels = Object.keys(map).filter(k => map[k] > 0);
  const data = labels.map(k => map[k]);
  const cmap = { complete: App.CL.green, 'in progress': App.CL.blue, pending: App.CL.amber, delayed: App.CL.red, cancelled: '#555' };
  const cols = labels.map(l => cmap[l]);
  document.getElementById('statusLegend').innerHTML = labels.map((l, i) => `<div class="li"><span class="ld" style="background:${cols[i]}"></span>${l.charAt(0).toUpperCase() + l.slice(1)} (${data[i]})</div>`).join('');
  App.state.charts['status'] = new Chart(document.getElementById('statusChart'), { type: 'doughnut', data: { labels, datasets: [{ data, backgroundColor: cols, borderWidth: 0, hoverOffset: 5 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '66%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw} (${rows.length ? Math.round(ctx.raw / rows.length * 100) : 0}%)` } } } } });
}

function renderPriorityChart(rows) {
  dc('priority');
  const map = { high: 0, medium: 0, low: 0 };
  rows.forEach(r => { if (r.priority in map) map[r.priority]++; });
  App.state.charts['priority'] = new Chart(document.getElementById('priorityChart'), {
    type: 'bar',
    data: { labels: ['High', 'Medium', 'Low'], datasets: [{ data: [map.high, map.medium, map.low], backgroundColor: [App.CL.red, App.CL.amber, App.CL.green], borderRadius: 5, borderSkipped: false }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { color: gc() }, ticks: { color: tc() } }, y: { grid: { color: gc() }, ticks: { color: tc(), stepSize: 1 }, beginAtZero: true } } }
  });
}

function renderPhaseChart(rows) {
  dc('phase');
  const pm = {}; rows.forEach(r => { if (!pm[r.phase]) pm[r.phase] = []; pm[r.phase].push(r.completion); });
  const phases = Object.keys(pm).slice(0, 10);
  const avgs = phases.map(p => Math.round(pm[p].reduce((a, b) => a + b, 0) / pm[p].length));
  const h = Math.max(180, phases.length * 38 + 60);
  document.getElementById('phaseWrap').style.height = h + 'px';
  App.state.charts['phase'] = new Chart(document.getElementById('phaseChart'), {
    type: 'bar',
    data: { labels: phases, datasets: [{ data: avgs, backgroundColor: App.CL.cyan + 'bb', borderRadius: 4, borderSkipped: false }] },
    options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.raw}% avg completion` } } }, scales: { x: { min: 0, max: 100, grid: { color: gc() }, ticks: { color: tc(), callback: v => v + '%' } }, y: { grid: { color: gc() }, ticks: { color: tc() } } } }
  });
}

function renderAssigneeChart(rows) {
  dc('assignee');
  const am = {}; rows.forEach(r => { am[r.assignee] = (am[r.assignee] || 0) + 1; });
  const sorted = Object.entries(am).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const labels = sorted.map(e => e[0]), data = sorted.map(e => e[1]);
  const h = Math.max(180, labels.length * 34 + 60);
  document.getElementById('assigneeWrap').style.height = h + 'px';
  App.state.charts['assignee'] = new Chart(document.getElementById('assigneeChart'), {
    type: 'bar',
    data: { labels, datasets: [{ data, backgroundColor: App.CL.purple + 'bb', borderRadius: 4, borderSkipped: false }] },
    options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { grid: { color: gc() }, ticks: { color: tc(), stepSize: 1 } }, y: { grid: { color: gc() }, ticks: { color: tc() } } } }
  });
}

function renderTrendChart(rows) {
  dc('trend');
  const pm = {};
  rows.forEach(r => { const k = r._proj || App.state.selProj; if (!pm[k]) pm[k] = []; pm[k].push(r.completion); });
  const projs = Object.keys(pm);
  if (!projs.length) return;
  const avgs = projs.map(p => Math.round(pm[p].reduce((a, b) => a + b, 0) / pm[p].length));
  const bgCols = projs.map((_, i) => App.PC[i % App.PC.length] + 'bb');
  App.state.charts['trend'] = new Chart(document.getElementById('trendChart'), {
    type: 'bar',
    data: {
      labels: projs.map(p => p.length > 24 ? p.slice(0, 22) + '…' : p),
      datasets: [
        { label: 'Avg Completion %', data: avgs, backgroundColor: bgCols, borderRadius: 6, borderSkipped: false },
        { label: 'Target (100%)', data: projs.map(() => 100), type: 'line', borderColor: 'rgba(255,255,255,0.2)', borderDash: [5, 4], borderWidth: 1.5, pointRadius: 0, fill: false, tension: 0 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ctx.datasetIndex === 0 ? ` ${ctx.raw}% avg completion` : ` Target: 100%` } } },
      scales: {
        x: { grid: { color: gc() }, ticks: { color: tc(), autoSkip: false, maxRotation: 30 } },
        y: { min: 0, max: 100, grid: { color: gc() }, ticks: { color: tc(), callback: v => v + '%' } }
      }
    }
  });
}
