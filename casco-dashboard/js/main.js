// ─── REBUILD UI (after data changes) ─────────────────
function rebuildUI() {
  document.getElementById('uploadZone').style.display = 'none';
  document.getElementById('dashboard').style.display = 'flex';
  renderSidebar();
  populateFilters();
  applyFilters();
  renderRisksIssues();
}

// ─── RENDER ALL (after filter changes) ───────────────
function renderAll(rows) {
  renderKPIs(rows);
  renderAlerts(rows);
  renderCharts(rows);
  renderTimeline(rows);
  renderTable();
}

// ─── BOOTSTRAP ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initSidebarState();
  initColWidths();
  initModalBindings();
});
