// ─── RISKS & ISSUES (from the uploaded workbook's Risks / Issues sheets) ──
function getBaseRisks() {
  const st = App.state;
  if (st.selProj === '__all__') return st.allData.flatMap(p => (p.risks || []).map(r => ({ ...r, _proj: p.name })));
  const p = st.allData.find(p => p.name === st.selProj);
  return p ? (p.risks || []).map(r => ({ ...r, _proj: p.name })) : [];
}
function getBaseIssues() {
  const st = App.state;
  if (st.selProj === '__all__') return st.allData.flatMap(p => (p.issues || []).map(r => ({ ...r, _proj: p.name })));
  const p = st.allData.find(p => p.name === st.selProj);
  return p ? (p.issues || []).map(r => ({ ...r, _proj: p.name })) : [];
}

function renderRisksIssues() {
  const risks = getBaseRisks();
  const issues = getBaseIssues();
  const sec = document.getElementById('riSec');
  if (!sec) return;
  if (!risks.length && !issues.length) { sec.style.display = 'none'; return; }
  sec.style.display = 'flex';

  document.getElementById('risksCount').textContent = risks.length + ' risk' + (risks.length !== 1 ? 's' : '');
  document.getElementById('risksBody').innerHTML = risks.length ? risks.map(r => `
    <tr>
      <td style="font-family:var(--m);font-size:11px;color:var(--t3);white-space:nowrap;">${eH(r.id)}</td>
      <td style="font-weight:500;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${eA(r.description)}">${eH(r.description)}</td>
      <td style="font-size:11px;color:var(--t2);white-space:nowrap;">${eH(r._proj || '')}</td>
      <td class="${levelClass(r.probability)}">${eH(r.probability || '—')}</td>
      <td class="${levelClass(r.impact)}">${eH(r.impact || '—')}</td>
      <td><span class="lvl-badge lvl-${levelClass(r.level) || 'na'}">${eH(r.level || '—')}</span></td>
      <td style="font-size:11px;color:var(--t2);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${eA(r.mitigation || '')}">${r.mitigation ? eH(r.mitigation) : '<span style="color:var(--red);">Not yet defined</span>'}</td>
      <td style="font-size:12px;white-space:nowrap;">${eH(r.owner || 'Unassigned')}</td>
    </tr>`).join('') : `<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--t3);">No risks logged</td></tr>`;

  document.getElementById('issuesCount').textContent = issues.length + ' issue' + (issues.length !== 1 ? 's' : '');
  const today = new Date();
  document.getElementById('issuesBody').innerHTML = issues.length ? issues.map(r => {
    const isOverdue = r.dueDate && new Date(r.dueDate) < today && !r.closeDate;
    const pr = (r.priority || '').toLowerCase();
    const prCls = pr.includes('high') ? 'ph' : pr.includes('low') ? 'pl' : 'pm';
    return `<tr>
      <td style="font-family:var(--m);font-size:11px;color:var(--t3);white-space:nowrap;">${eH(r.id)}</td>
      <td style="font-weight:500;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${eA(r.description)}">${eH(r.description)}</td>
      <td style="font-size:11px;color:var(--t2);white-space:nowrap;">${eH(r._proj || '')}</td>
      <td class="${prCls}">${eH(r.priority || '—')}</td>
      <td style="font-size:11px;color:var(--t2);white-space:nowrap;">${eH(r.impact || '—')}</td>
      <td style="font-size:12px;white-space:nowrap;">${eH(r.owner || '—')}</td>
      <td style="font-size:12px;white-space:nowrap;">${eH(r.assignee || 'Unassigned')}</td>
      <td style="font-size:11px;font-family:var(--m);white-space:nowrap;${isOverdue ? 'color:var(--red)' : ''}">${r.dueDate ? fmtDate(r.dueDate) : '—'}${isOverdue ? '<span class="late-tag">LATE</span>' : ''}</td>
      <td>${r.closeDate ? `<span class="sb s-complete">Closed</span>` : `<span class="sb s-in-progress">Open</span>`}</td>
    </tr>`;
  }).join('') : `<tr><td colspan="9" style="text-align:center;padding:20px;color:var(--t3);">No issues logged</td></tr>`;
}
