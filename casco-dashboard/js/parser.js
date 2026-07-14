// ─── FILE HANDLING ────────────────────────────────────
function handleFile(e) { Array.from(e.target.files).forEach(readFile); e.target.value = ''; }
function dragOver(e) { e.preventDefault(); document.getElementById('uploadZone').classList.add('drag-over'); }
function dragLeave(e) { document.getElementById('uploadZone').classList.remove('drag-over'); }
function dropFile(e) { e.preventDefault(); document.getElementById('uploadZone').classList.remove('drag-over'); Array.from(e.dataTransfer.files).forEach(readFile); }

// Picks a sheet name matching `pattern`; falls back to the first sheet
// in the workbook if `fallbackFirst` is true and nothing matches.
function pickSheet(wb, pattern, fallbackFirst) {
  const match = wb.SheetNames.find(n => pattern.test(n));
  if (match) return match;
  return fallbackFirst ? wb.SheetNames[0] : null;
}

function sheetRows(wb, name) {
  if (!name) return [];
  return XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: '' });
}

function readFile(file) {
  const reader = new FileReader();
  reader.onload = (ev) => {
    const wb = XLSX.read(ev.target.result, { type: 'binary', cellDates: true });

    // Task data: prefer a sheet literally named like "Task_Tracker",
    // otherwise fall back to the first sheet (keeps old files working).
    const taskSheet = pickSheet(wb, /task/i, true);
    const riskSheet = pickSheet(wb, /risk/i, false);
    const issueSheet = pickSheet(wb, /issue/i, false);

    const rawTasks = sheetRows(wb, taskSheet);
    if (rawTasks.length < 2) { alert('No task data found in "' + file.name + '".'); return; }

    const name = file.name.replace(/\.[^.]+$/, '').trim() || 'Unnamed Project';
    const tasks = parseRows(rawTasks);
    if (!tasks.length) { alert('No data found in "' + name + '". Ensure the sheet has a header row.'); return; }

    const risks = riskSheet ? parseRisks(sheetRows(wb, riskSheet)) : [];
    const issues = issueSheet ? parseIssues(sheetRows(wb, issueSheet)) : [];

    const st = App.state;
    const ei = st.allData.findIndex(p => p.name === name);
    if (ei >= 0) st.allData[ei] = { name, tasks, risks, issues };
    else st.allData.push({ name, tasks, risks, issues });
    rebuildUI();
  };
  reader.readAsBinaryString(file);
}

// ─── ROW PARSERS ──────────────────────────────────────
function parseRows(raw) {
  const headers = raw[0].map(h => String(h));
  const ci = {};
  for (const [f, al] of Object.entries(App.COL_MAP)) ci[f] = findCol(headers, al);
  const tasks = [];
  for (let i = 1; i < raw.length; i++) {
    const row = raw[i];
    if (row.every(c => c === '' || c == null)) continue;
    const get = (f, fb = '') => { const idx = ci[f]; return idx >= 0 ? (row[idx] ?? fb) : fb; };
    tasks.push({
      task: String(get('task') || 'Task ' + i).trim(),
      status: normStatus(String(get('status', 'pending'))),
      priority: normPriority(String(get('priority', 'medium'))),
      assignee: String(get('assignee', 'Unassigned')).trim() || 'Unassigned',
      phase: String(get('phase', 'General')).trim() || 'General',
      completion: parseComp(get('completion', 0)),
      startDate: parseDate(get('startDate')),
      endDate: parseDate(get('endDate')),
      comments: String(get('comments', '')).trim()
    });
  }
  return tasks;
}

function parseRisks(raw) {
  if (raw.length < 2) return [];
  const headers = raw[0].map(h => String(h));
  const ci = {};
  for (const [f, al] of Object.entries(App.RISK_COL_MAP)) ci[f] = findCol(headers, al);
  const out = [];
  for (let i = 1; i < raw.length; i++) {
    const row = raw[i];
    if (row.every(c => c === '' || c == null)) continue;
    const get = (f, fb = '') => { const idx = ci[f]; return idx >= 0 ? (row[idx] ?? fb) : fb; };
    out.push({
      id: String(get('id', 'R-' + i)).trim(),
      description: String(get('description', 'Untitled risk')).trim(),
      probability: String(get('probability', '')).trim(),
      impact: String(get('impact', '')).trim(),
      level: String(get('level', '')).trim(),
      mitigation: String(get('mitigation', '')).trim(),
      owner: String(get('owner', '')).trim(),
      status: String(get('status', '')).trim()
    });
  }
  return out;
}

function parseIssues(raw) {
  if (raw.length < 2) return [];
  const headers = raw[0].map(h => String(h));
  const ci = {};
  for (const [f, al] of Object.entries(App.ISSUE_COL_MAP)) ci[f] = findCol(headers, al);
  const out = [];
  for (let i = 1; i < raw.length; i++) {
    const row = raw[i];
    if (row.every(c => c === '' || c == null)) continue;
    const get = (f, fb = '') => { const idx = ci[f]; return idx >= 0 ? (row[idx] ?? fb) : fb; };
    out.push({
      id: String(get('id', i)).trim(),
      description: String(get('description', 'Untitled issue')).trim(),
      created: parseDate(get('created')),
      priority: String(get('priority', '')).trim(),
      impact: String(get('impact', '')).trim(),
      owner: String(get('owner', '')).trim(),
      assignee: String(get('assignee', 'Unassigned')).trim() || 'Unassigned',
      dueDate: parseDate(get('dueDate')),
      closeDate: parseDate(get('closeDate')),
      update: String(get('update', '')).trim()
    });
  }
  return out;
}

// ─── NORMALIZERS ──────────────────────────────────────
function normStatus(s) {
  s = s.toLowerCase().trim();
  if (['done', 'complete', 'completed', 'finished', 'closed', '100%'].some(k => s.includes(k))) return 'complete';
  if (['in progress', 'inprogress', 'in-progress', 'wip', 'active', 'ongoing', 'started'].some(k => s.includes(k))) return 'in progress';
  if (['pending', 'not started', 'todo', 'to-do', 'to do', 'open', 'new'].some(k => s.includes(k))) return 'pending';
  if (['delay', 'delayed', 'overdue', 'late', 'behind'].some(k => s.includes(k))) return 'delayed';
  if (['cancel', 'cancelled', 'canceled', 'dropped'].some(k => s.includes(k))) return 'cancelled';
  return s || 'pending';
}
function normPriority(s) {
  s = s.toLowerCase().trim();
  if (['high', 'h', 'critical', 'urgent', '1', 'p1'].some(k => s === k || s.includes(k))) return 'high';
  if (['med', 'medium', 'm', 'moderate', 'normal', '2', 'p2'].some(k => s === k || s.includes(k))) return 'medium';
  if (['low', 'l', 'minor', '3', 'p3'].some(k => s === k || s.includes(k))) return 'low';
  return 'medium';
}
function parseComp(v) {
  if (v === '' || v == null) return 0;
  const n = parseFloat(String(v).replace('%', ''));
  if (isNaN(n)) return 0;
  return n > 1 ? Math.min(100, n) : Math.min(100, n * 100);
}
function parseDate(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  const d = new Date(v); return isNaN(d.getTime()) ? null : d;
}

// ─── SAMPLE DATA ─────────────────────────────────────
function loadSample() {
  App.state.allData = [
    { name: 'Brazil Printer Integration', tasks: makeSample(22), risks: makeSampleRisks(4), issues: makeSampleIssues(3) },
    { name: 'ERP Migration Q3', tasks: makeSample(18), risks: makeSampleRisks(2), issues: makeSampleIssues(1) },
    { name: 'Security Compliance 2026', tasks: makeSample(15), risks: [], issues: [] }
  ];
  rebuildUI();
}

function makeSample(n) {
  const phases = ['Planning', 'Design', 'Development', 'Testing', 'Deployment', 'Review'];
  const assignees = ['Raj Kumar', 'Priya S.', 'Amit D.', 'Sneha M.', 'Ravi T.', 'Mehul P.'];
  const tnames = ['Requirements Gathering', 'Architecture Design', 'API Integration', 'Unit Testing', 'UAT Sign-off', 'Data Migration', 'Performance Testing', 'Documentation', 'Deployment Config', 'Code Review', 'DB Schema Design', 'Security Audit', 'UI Mockups', 'Sprint Planning', 'Load Testing', 'Monitoring Setup', 'Rollback Plan', 'Training Materials', 'Go-Live Prep', 'Post-Go-Live Review', 'Stakeholder Review', 'Compliance Check'];
  const statuses = ['complete', 'in progress', 'pending', 'delayed', 'in progress', 'complete', 'pending', 'in progress'];
  const priorities = ['high', 'medium', 'low', 'high', 'medium', 'low'];
  const base = new Date(2025, 9, 1);
  return Array.from({ length: n }, (_, i) => {
    const status = statuses[i % statuses.length];
    const comp = status === 'complete' ? 100 : status === 'in progress' ? 30 + Math.floor(Math.random() * 55) : status === 'delayed' ? 10 + Math.floor(Math.random() * 40) : 0;
    const s = new Date(base); s.setDate(base.getDate() + (i - 3) * 9);
    const e = new Date(s); e.setDate(s.getDate() + 14 + Math.floor(Math.random() * 28));
    return { task: tnames[i % tnames.length], status, priority: priorities[i % priorities.length], assignee: assignees[i % assignees.length], phase: phases[Math.floor(i / (n / phases.length)) % phases.length], completion: comp, startDate: s, endDate: e, comments: '' };
  });
}

function makeSampleRisks(n) {
  const descs = ['Quantity mismatch between shipper and labels', 'Data mapping errors during cutover', 'Vendor API downtime during peak load', 'Insufficient UAT coverage', 'Key resource unavailability', 'Network latency between sites', 'License renewal delay'];
  const levels = ['High', 'Medium', 'Low'];
  const owners = ['Mayur', 'Priya S.', 'Amit D.', 'Raj Kumar'];
  return Array.from({ length: n }, (_, i) => {
    const prob = levels[i % levels.length], impact = levels[(i + 1) % levels.length];
    const level = (prob === 'High' || impact === 'High') ? 'High' : (prob === 'Medium' || impact === 'Medium') ? 'Medium' : 'Low';
    return { id: 'R-' + (i + 1), description: descs[i % descs.length], probability: prob, impact, level, mitigation: i % 3 === 0 ? '' : 'Weekly review + fallback plan in place', owner: owners[i % owners.length], status: i % 4 === 0 ? 'Open' : 'Monitoring' };
  });
}

function makeSampleIssues(n) {
  const descs = ['Wrong Customer Items maintained in KY for Brazil', 'Duplicate shipper record created', 'Label print queue stuck', 'Incorrect UOM conversion'];
  const owners = ['Mayur', 'Priya S.', 'Amit D.'];
  const assignees = ['Mehdi Khamassi', 'Sneha M.', 'Ravi T.'];
  const base = new Date(2026, 3, 1);
  return Array.from({ length: n }, (_, i) => {
    const due = new Date(base); due.setDate(base.getDate() + i * 5);
    const closed = i % 3 === 0;
    return { id: i + 1, description: descs[i % descs.length], created: base, priority: ['High', 'Medium', 'Low'][i % 3], impact: ['High', 'Medium', 'Low'][(i + 1) % 3], owner: owners[i % owners.length], assignee: assignees[i % assignees.length], dueDate: due, closeDate: closed ? due : null, update: closed ? 'Resolved and verified' : 'In progress' };
  });
}
