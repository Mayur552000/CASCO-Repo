// ─── EXPORT ──────────────────────────────────────────
function openExportModal() { if (!App.state.allData.length) { alert('No data to export.'); return; } openModal('exportModal'); }

async function doExport(fmt) {
  closeModal('exportModal');
  const st = App.state;
  if (fmt === 'pdf' || fmt === 'png') {
    document.getElementById('expMsg').textContent = fmt === 'pdf' ? 'Generating PDF…' : 'Capturing PNG…';
    document.getElementById('expOverlay').classList.add('show');
    await new Promise(r => setTimeout(r, 120));
    try {
      const el = document.getElementById('dashboard');
      const canvas = await html2canvas(el, { scale: 1.6, useCORS: true, backgroundColor: document.documentElement.dataset.theme === 'dark' ? '#0a1524' : '#f2f6fb', logging: false, scrollY: -window.scrollY });
      if (fmt === 'png') {
        const a = document.createElement('a'); a.href = canvas.toDataURL('image/png'); a.download = 'Casco_IT_Dashboard.png'; a.click();
      } else {
        const { jsPDF } = window.jspdf;
        const img = canvas.toDataURL('image/jpeg', 0.92);
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
        pdf.addImage(img, 'JPEG', 0, 0, canvas.width, canvas.height);
        pdf.save('Casco_IT_Dashboard.pdf');
      }
    } catch (err) { alert('Export failed: ' + err.message); }
    document.getElementById('expOverlay').classList.remove('show');
    return;
  }
  const rows = st.filteredRows.length ? st.filteredRows : getBaseRows();
  const hdrs = ['Project', 'Task', 'Status', 'Priority', 'Phase', 'Assignee', 'Completion %', 'Start Date', 'End Date', 'Comments'];
  const data = rows.map(r => [r._proj || st.selProj, r.task, r.status, r.priority, r.phase, r.assignee, Math.round(r.completion), r.startDate ? r.startDate.toLocaleDateString() : '', r.endDate ? r.endDate.toLocaleDateString() : '', r.comments]);

  if (fmt === 'csv') {
    const csv = [hdrs, ...data].map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    dl('Casco_Projects.csv', 'text/csv', csv);
  } else if (fmt === 'xlsx') {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([hdrs, ...data]);
    ws['!cols'] = hdrs.map(() => ({ wch: 18 }));
    XLSX.utils.book_append_sheet(wb, ws, 'Projects');

    const risks = getBaseRisks();
    if (risks.length) {
      const rHdrs = ['Risk ID', 'Project', 'Description', 'Probability', 'Impact', 'Level', 'Mitigation', 'Owner', 'Status'];
      const rData = risks.map(r => [r.id, r._proj, r.description, r.probability, r.impact, r.level, r.mitigation, r.owner, r.status]);
      const rws = XLSX.utils.aoa_to_sheet([rHdrs, ...rData]);
      rws['!cols'] = rHdrs.map(() => ({ wch: 18 }));
      XLSX.utils.book_append_sheet(wb, rws, 'Risks');
    }
    const issues = getBaseIssues();
    if (issues.length) {
      const iHdrs = ['Issue ID', 'Project', 'Description', 'Priority', 'Impact', 'Owner', 'Assigned To', 'Due Date', 'Close Date', 'Update'];
      const iData = issues.map(r => [r.id, r._proj, r.description, r.priority, r.impact, r.owner, r.assignee, r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '', r.closeDate ? new Date(r.closeDate).toLocaleDateString() : '', r.update]);
      const iws = XLSX.utils.aoa_to_sheet([iHdrs, ...iData]);
      iws['!cols'] = iHdrs.map(() => ({ wch: 18 }));
      XLSX.utils.book_append_sheet(wb, iws, 'Issues');
    }
    XLSX.writeFile(wb, 'Casco_Projects.xlsx');
  }
}
function dl(name, type, content) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], { type })); a.download = name; a.click(); }

// ─── THEME ───────────────────────────────────────────
function toggleTheme() {
  const dark = document.documentElement.dataset.theme === 'dark';
  document.documentElement.dataset.theme = dark ? 'light' : 'dark';
  document.getElementById('themeBtn').textContent = dark ? '🌙' : '☀️';
  try { localStorage.setItem('casco_theme', dark ? 'light' : 'dark'); } catch (e) {}
  if (App.state.filteredRows.length) renderCharts(App.state.filteredRows);
}
function initTheme() {
  try {
    const t = localStorage.getItem('casco_theme');
    if (t) { document.documentElement.dataset.theme = t; document.getElementById('themeBtn').textContent = t === 'dark' ? '☀️' : '🌙'; }
  } catch (e) {}
}

// ─── MODALS ──────────────────────────────────────────
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function initModalBindings() {
  document.querySelectorAll('.moverlay').forEach(el => el.addEventListener('click', function (e) { if (e.target === this) this.classList.remove('open'); }));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') document.querySelectorAll('.moverlay.open').forEach(m => m.classList.remove('open')); });
}
