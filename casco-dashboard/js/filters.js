// ─── FILTERS ─────────────────────────────────────────
function getBaseRows() {
  const st = App.state;
  if (st.selProj === '__all__') return st.allData.flatMap(p => p.tasks.map(t => ({ ...t, _proj: p.name })));
  const p = st.allData.find(p => p.name === st.selProj);
  return p ? p.tasks.map(t => ({ ...t, _proj: p.name })) : [];
}

function populateFilters() {
  const rows = getBaseRows();
  const asgns = [...new Set(rows.map(r => r.assignee))].sort();
  const phases = [...new Set(rows.map(r => r.phase))].sort();
  const aEl = document.getElementById('fAssignee'), pEl = document.getElementById('fPhase');
  const ac = aEl.value, pc = pEl.value;
  aEl.innerHTML = '<option value="">All Assignees</option>' + asgns.map(a => `<option value="${eA(a)}"${a === ac ? ' selected' : ''}>${eH(a)}</option>`).join('');
  pEl.innerHTML = '<option value="">All Phases</option>' + phases.map(p => `<option value="${eA(p)}"${p === pc ? ' selected' : ''}>${eH(p)}</option>`).join('');
}

function applyFilters() {
  const st = App.state;
  const stv = document.getElementById('fStatus').value.toLowerCase();
  const pr = document.getElementById('fPriority').value.toLowerCase();
  const as = document.getElementById('fAssignee').value.toLowerCase();
  const ph = document.getElementById('fPhase').value.toLowerCase();
  const q = document.getElementById('searchInput').value.toLowerCase().trim();
  let rows = getBaseRows();
  if (stv) rows = rows.filter(r => r.status === stv);
  if (pr) rows = rows.filter(r => r.priority === pr);
  if (as) rows = rows.filter(r => r.assignee.toLowerCase() === as);
  if (ph) rows = rows.filter(r => r.phase.toLowerCase() === ph);
  if (q) rows = rows.filter(r => [r.task, r.assignee, r.phase, r.status, r.comments].some(v => String(v).toLowerCase().includes(q)));
  st.filteredRows = rows;
  updateChips({ st: stv, pr, as, ph, q });
  st.curPage = 1;
  renderAll(rows);
}

function updateChips(f) {
  const el = document.getElementById('activeChips');
  const chips = [];
  if (f.st) chips.push('Status: ' + f.st);
  if (f.pr) chips.push('Priority: ' + f.pr);
  if (f.as) chips.push('Assignee: ' + f.as);
  if (f.ph) chips.push('Phase: ' + f.ph);
  if (f.q) chips.push('Search: "' + f.q + '"');
  el.innerHTML = chips.map(c => `<span class="fchip">${eH(c)} <span onclick="clearFilters()">✕</span></span>`).join('');
}

function clearFilters(reapply = true) {
  ['fStatus', 'fPriority', 'fAssignee', 'fPhase'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('searchInput').value = '';
  if (reapply) applyFilters();
}

// Quick-filter by status from KPI card
function filterByStatus(s) {
  document.getElementById('fStatus').value = s;
  applyFilters();
}
