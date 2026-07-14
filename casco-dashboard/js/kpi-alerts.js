// ─── KPI CARDS ────────────────────────────────────────
function renderKPIs(rows) {
  const st = App.state;
  const total = rows.length;
  const complete = rows.filter(r => r.status === 'complete').length;
  const inprog = rows.filter(r => r.status === 'in progress').length;
  const delayed = rows.filter(r => r.status === 'delayed').length;
  const pending = rows.filter(r => r.status === 'pending').length;
  const overdue = rows.filter(r => r.endDate && r.endDate < new Date() && r.status !== 'complete').length;
  const openRisks = getBaseRisks().filter(r => !/closed|mitigated|resolved/i.test(r.status || '')).length;
  const openIssues = getBaseIssues().filter(r => !r.closeDate).length;

  const cards = [
    { cls: 'cb', ico: '📋', lbl: 'Total Tasks', val: total, sub: st.allData.length + ' project' + (st.allData.length !== 1 ? 's' : ''), vCls: 'vb', filter: '' },
    { cls: 'cg', ico: '✅', lbl: 'Completed', val: complete, sub: (total ? Math.round(complete / total * 100) : 0) + '% of total', vCls: 'vg', filter: 'complete' },
    { cls: 'cb', ico: '⚙️', lbl: 'In Progress', val: inprog, sub: 'Active tasks', vCls: 'vc', filter: 'in progress' },
    { cls: 'ca', ico: '🕐', lbl: 'Pending', val: pending, sub: 'Not started', vCls: 'va', filter: 'pending' },
    { cls: 'cr', ico: '⚠️', lbl: 'Delayed', val: delayed, sub: 'Need attention', vCls: 'vr', filter: 'delayed' },
    { cls: 'cp', ico: '🔔', lbl: 'Overdue', val: overdue, sub: 'Past due date', vCls: 'vp', filter: '' },
    { cls: 'cr', ico: '🛑', lbl: 'Open Risks', val: openRisks, sub: 'From Risks sheet', vCls: 'vr', filter: '', scroll: 'riSec' },
    { cls: 'ca', ico: '🧯', lbl: 'Open Issues', val: openIssues, sub: 'From Issues sheet', vCls: 'va', filter: '', scroll: 'riSec' }
  ];
  const grid = document.getElementById('kpiGrid');
  grid.innerHTML = '';
  cards.forEach(c => {
    const card = document.createElement('div');
    card.className = 'kpi-card ' + c.cls;
    card.innerHTML = '<div class="kpi-lbl">' + c.lbl + '</div><div class="kpi-val ' + c.vCls + '">' + c.val + '</div><div class="kpi-sub">' + c.sub + '</div><div class="kpi-ico">' + c.ico + '</div>' + (c.filter || c.scroll ? '<div class="kpi-card-hint">' + (c.filter ? 'Click to filter ↗' : 'Click to view ↗') + '</div>' : '');
    if (c.filter) { card.title = 'Click to filter by this status'; card.style.cursor = 'pointer'; card.addEventListener('click', ((f) => () => filterByStatus(f))(c.filter)); }
    else if (c.scroll) { card.style.cursor = 'pointer'; card.addEventListener('click', () => document.getElementById(c.scroll)?.scrollIntoView({ behavior: 'smooth', block: 'start' })); }
    grid.appendChild(card);
  });
}

// ─── ALERTS WITH "VIEW TASKS" BUTTON ─────────────────
function renderAlerts(rows) {
  const alerts = buildAlerts(rows);
  const sec = document.getElementById('alertsSec');
  if (!alerts.length) { sec.style.display = 'none'; return; }
  sec.style.display = 'block';
  App.state._alertTaskStore = alerts.map(a => a.tasks || []);
  const list = document.getElementById('alertsList');
  list.innerHTML = '';
  alerts.forEach((a, idx) => {
    const div = document.createElement('div');
    div.className = 'alert alert-' + a.type;
    const titleRow = document.createElement('div');
    titleRow.className = 'alert-title';
    titleRow.textContent = a.title;
    if (a.tasks && a.tasks.length) {
      const btn = document.createElement('button');
      btn.className = 'alert-view-btn';
      btn.style.cssText = 'border-color:currentColor;color:inherit;';
      btn.textContent = 'View ' + a.tasks.length + ' task' + (a.tasks.length > 1 ? 's' : '') + ' →';
      btn.addEventListener('click', ((i, t) => () => showStatusDetail(App.state._alertTaskStore[i], t))(idx, a.title));
      titleRow.appendChild(document.createTextNode(' '));
      titleRow.appendChild(btn);
    }
    const msgDiv = document.createElement('div');
    msgDiv.className = 'alert-msg';
    msgDiv.textContent = a.msg;
    div.innerHTML = '<div class="alert-icon">' + a.icon + '</div>';
    const body = document.createElement('div');
    body.style.flex = '1';
    body.appendChild(titleRow);
    body.appendChild(msgDiv);
    div.appendChild(body);
    list.appendChild(div);
  });
}

function buildAlerts(rows) {
  const alerts = [];
  const today = new Date();

  if (rows.length) {
    const overdue = rows.filter(r => r.endDate && r.endDate < today && r.status !== 'complete');
    const delayed = rows.filter(r => r.status === 'delayed');
    const highPending = rows.filter(r => r.priority === 'high' && r.status === 'pending');
    const complete = rows.filter(r => r.status === 'complete');
    const total = rows.length;
    const avg = Math.round(rows.reduce((s, r) => s + r.completion, 0) / total);

    if (overdue.length) alerts.push({ type: 'danger', icon: '🚨', title: `${overdue.length} task${overdue.length > 1 ? 's' : ''} are past their due date`, msg: 'Immediate action required: ' + overdue.slice(0, 3).map(r => r.task).join(', ') + (overdue.length > 3 ? ` +${overdue.length - 3} more` : ''), tasks: overdue });
    if (delayed.length) alerts.push({ type: 'warning', icon: '⚠️', title: `${delayed.length} task${delayed.length > 1 ? 's' : ''} marked as Delayed`, msg: delayed.slice(0, 3).map(r => r.task).join(', ') + (delayed.length > 3 ? ` +${delayed.length - 3} more` : ''), tasks: delayed });
    if (highPending.length) alerts.push({ type: 'warning', icon: '🔴', title: `${highPending.length} HIGH priority task${highPending.length > 1 ? 's' : ''} not started`, msg: highPending.slice(0, 3).map(r => r.task).join(', ') + (highPending.length > 3 ? ` +${highPending.length - 3} more` : ''), tasks: highPending });

    const byA = {}; rows.forEach(r => { byA[r.assignee] = (byA[r.assignee] || 0) + 1; });
    const counts = Object.values(byA); const max = Math.max(...counts); const avgL = counts.reduce((a, b) => a + b, 0) / counts.length;
    if (max > avgL * 2 && counts.length > 2) { const hvy = Object.entries(byA).sort((a, b) => b[1] - a[1])[0]; alerts.push({ type: 'info', icon: '👤', title: 'Workload imbalance detected', msg: `${hvy[0]} has ${hvy[1]} tasks (avg: ${Math.round(avgL)}). Consider redistributing.`, tasks: [] }); }

    if (complete.length === total) alerts.push({ type: 'success', icon: '🎉', title: 'All tasks completed!', msg: `Congratulations — all ${total} tasks are done.`, tasks: [] });
    else if (avg >= 75) alerts.push({ type: 'success', icon: '📈', title: `Strong progress — ${avg}% average completion`, msg: `${complete.length} of ${total} tasks done. On track!`, tasks: [] });
  }

  // ── Risks & Issues driven alerts ──
  const risks = getBaseRisks();
  const issues = getBaseIssues();
  const highRisks = risks.filter(r => levelClass(r.level || r.impact) === 'ph');
  const unmitigated = risks.filter(r => !r.mitigation && r.description);
  const overdueIssues = issues.filter(r => r.dueDate && new Date(r.dueDate) < today && !r.closeDate);

  if (highRisks.length) alerts.push({ type: 'danger', icon: '🛑', title: `${highRisks.length} high-level risk${highRisks.length > 1 ? 's' : ''} identified`, msg: highRisks.slice(0, 3).map(r => r.description).join('; ') + (highRisks.length > 3 ? ` +${highRisks.length - 3} more` : ''), tasks: [] });
  if (unmitigated.length) alerts.push({ type: 'warning', icon: '🧩', title: `${unmitigated.length} risk${unmitigated.length > 1 ? 's' : ''} without a mitigation plan`, msg: unmitigated.slice(0, 3).map(r => r.description).join('; ') + (unmitigated.length > 3 ? ` +${unmitigated.length - 3} more` : ''), tasks: [] });
  if (overdueIssues.length) alerts.push({ type: 'danger', icon: '🧯', title: `${overdueIssues.length} open issue${overdueIssues.length > 1 ? 's' : ''} past due date`, msg: overdueIssues.slice(0, 3).map(r => r.description).join('; ') + (overdueIssues.length > 3 ? ` +${overdueIssues.length - 3} more` : ''), tasks: [] });

  return alerts.slice(0, 6);
}

// Show status detail modal
function showStatusDetail(tasks, title) {
  document.getElementById('detailTitle').textContent = title;
  const today = new Date();
  const rows = tasks.map(r => {
    const isOverdue = r.endDate && new Date(r.endDate) < today && r.status !== 'complete';
    return `<tr>
      <td style="font-weight:500;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${eH(r.task)}</td>
      <td><span class="sb s-${r.status.replace(' ', '-')}">${r.status}</span></td>
      <td class="${r.priority === 'high' ? 'ph' : r.priority === 'medium' ? 'pm' : 'pl'}">${r.priority.toUpperCase()}</td>
      <td style="font-size:11px;color:var(--t2);">${eH(r.phase)}</td>
      <td style="font-size:11px;">${eH(r.assignee)}</td>
      <td><div class="prog-wrap"><div class="prog-bg"><div class="prog-fill" style="width:${r.completion}%;background:${pColor(r.completion)};"></div></div><span class="prog-num">${Math.round(r.completion)}%</span></div></td>
      <td style="font-size:11px;font-family:var(--m);${isOverdue ? 'color:var(--red)' : ''}">${fmtDate(r.endDate ? new Date(r.endDate) : null)}${isOverdue ? '<span class="late-tag">LATE</span>' : ''}</td>
    </tr>`;
  }).join('');
  document.getElementById('detailBody').innerHTML = `<table>
    <thead><tr><th>Task</th><th>Status</th><th>Priority</th><th>Phase</th><th>Assignee</th><th>Progress</th><th>Due Date</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--t3);">No tasks</td></tr>'}</tbody>
  </table>`;
  openModal('detailModal');
}
