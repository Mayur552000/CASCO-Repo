// ─── SIDEBAR: PROJECT LIST ────────────────────────────
function renderSidebar() {
  const st = App.state;
  const list = document.getElementById('projList');
  list.innerHTML = '';

  // "All Projects" item
  const allCnt = st.allData.reduce((s, p) => s + p.tasks.length, 0);
  const allItem = document.createElement('div');
  allItem.className = 'proj-item all-item' + (st.selProj === '__all__' ? ' active' : '');
  allItem.title = 'All Projects';
  allItem.innerHTML = '<div class="proj-dot" style="background:var(--blue)"></div><span class="proj-nm">All Projects</span><span class="proj-cnt">' + allCnt + '</span>';
  allItem.addEventListener('click', () => selectProj('__all__'));
  list.appendChild(allItem);

  // Per-project items
  st.allData.forEach((p, i) => {
    const col = App.PC[i % App.PC.length];
    const item = document.createElement('div');
    item.className = 'proj-item' + (st.selProj === p.name ? ' active' : '');
    item.title = p.name;

    const dot = document.createElement('div');
    dot.className = 'proj-dot';
    dot.style.background = col;

    const nm = document.createElement('span');
    nm.className = 'proj-nm';
    nm.textContent = p.name;

    const cnt = document.createElement('span');
    cnt.className = 'proj-cnt';
    cnt.textContent = p.tasks.length;

    const del = document.createElement('button');
    del.className = 'proj-del';
    del.title = 'Remove project';
    del.textContent = '✕';
    del.addEventListener('click', (e) => { e.stopPropagation(); askDelete(p.name); });

    item.appendChild(dot);
    item.appendChild(nm);
    item.appendChild(cnt);
    item.appendChild(del);
    item.addEventListener('click', () => selectProj(p.name));
    list.appendChild(item);
  });
}

function selectProj(name) {
  const st = App.state;
  st.selProj = name;
  document.getElementById('pgTitle').textContent = name === '__all__' ? 'IT Project Tracker' : name;
  st.curPage = 1;
  clearFilters(false);
  populateFilters();
  applyFilters();
  renderSidebar();
  renderRisksIssues();
}

// ─── DELETE PROJECT ───────────────────────────────────
function askDelete(name) {
  const st = App.state;
  st.pendingDel = name;
  const cnt = st.allData.find(p => p.name === name)?.tasks.length || 0;
  document.getElementById('confirmMsg').textContent = 'Remove project "' + name + '" and its ' + cnt + ' tasks from the dashboard?';
  openModal('confirmModal');
}
function confirmDelete() {
  const st = App.state;
  if (!st.pendingDel) return;
  st.allData = st.allData.filter(p => p.name !== st.pendingDel);
  if (st.selProj === st.pendingDel) st.selProj = '__all__';
  st.pendingDel = null;
  closeModal('confirmModal');
  if (!st.allData.length) { document.getElementById('dashboard').style.display = 'none'; document.getElementById('uploadZone').style.display = ''; return; }
  rebuildUI();
}

// ─── SIDEBAR COLLAPSE (minimize side layout) ──────────
function toggleSidebar() {
  const st = App.state;
  st.sidebarCollapsed = !st.sidebarCollapsed;
  applySidebarState();
  try { localStorage.setItem('casco_sidebar_collapsed', st.sidebarCollapsed ? '1' : '0'); } catch (e) {}
  // Charts often need a resize nudge after the layout width changes
  setTimeout(() => { if (App.state.filteredRows) renderCharts(App.state.filteredRows); }, 260);
}
function applySidebarState() {
  const collapsed = App.state.sidebarCollapsed;
  document.body.classList.toggle('sidebar-collapsed', collapsed);
  const btn = document.getElementById('sbToggle');
  // Distinct icons per state: hamburger to open the fully-hidden sidebar,
  // an X to close/minimize it back down to zero width.
  if (btn) { btn.textContent = collapsed ? '☰' : '✕'; btn.title = collapsed ? 'Show sidebar' : 'Hide sidebar'; }
}
function initSidebarState() {
  try {
    if (localStorage.getItem('casco_sidebar_collapsed') === '1') App.state.sidebarCollapsed = true;
  } catch (e) {}
  applySidebarState();
}
