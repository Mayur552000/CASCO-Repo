// ─── TASK TIMELINE TABLE ──────────────────────────────
function renderTimeline(rows) {
  const today = new Date();
  const sorted = [...rows].sort((a, b) => {
    if (!a.endDate && !b.endDate) return 0;
    if (!a.endDate) return 1; if (!b.endDate) return -1;
    return a.endDate - b.endDate;
  });
  const body = document.getElementById('timelineBody');
  if (!sorted.length) { body.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--t3);">No tasks to display</td></tr>'; return; }
  const dates = sorted.filter(r => r.startDate || r.endDate);
  const minD = dates.reduce((m, r) => { const d = r.startDate || r.endDate; return d < m ? d : m; }, dates[0]?.startDate || today);
  const maxD = dates.reduce((m, r) => { const d = r.endDate || r.startDate; return d > m ? d : m; }, dates[0]?.endDate || today);
  const span = Math.max(1, (maxD - minD));

  body.innerHTML = sorted.slice(0, 60).map(r => {
    const isOverdue = r.endDate && r.endDate < today && r.status !== 'complete';
    let barLeft = 0, barWidth = 100;
    if (r.startDate && r.endDate) {
      barLeft = Math.max(0, Math.round((r.startDate - minD) / span * 100));
      barWidth = Math.max(2, Math.round((r.endDate - r.startDate) / span * 100));
    } else if (r.endDate) {
      barLeft = Math.max(0, Math.round((r.endDate - minD) / span * 100) - 5);
      barWidth = 5;
    }
    const statusCls = r.status.replace(' ', '-');
    const statusColMap = { complete: App.CL.green, 'in progress': App.CL.blue, pending: App.CL.amber, delayed: App.CL.red, cancelled: '#555' };
    const barCol = statusColMap[r.status] || App.CL.blue;
    return `<tr>
      <td style="font-weight:500;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${eA(r.task)}">${eH(r.task)}</td>
      <td style="font-size:11px;color:var(--t2);white-space:nowrap;">${eH(r.assignee)}</td>
      <td style="font-size:11px;color:var(--t2);">${eH(r.phase)}</td>
      <td style="font-size:11px;font-family:var(--m);color:var(--t2);white-space:nowrap;">${fmtDate(r.startDate)}</td>
      <td style="font-size:11px;font-family:var(--m);white-space:nowrap;${isOverdue ? 'color:var(--red)' : ''}">${fmtDate(r.endDate)}${isOverdue ? '<span class="late-tag">LATE</span>' : ''}</td>
      <td><span class="sb s-${statusCls}">${r.status}</span></td>
      <td style="min-width:100px;">
        <div style="position:relative;height:13px;">
          <div style="position:absolute;top:0;left:0;right:0;height:100%;background:var(--bgi);border-radius:4px;"></div>
          <div style="position:absolute;top:0;left:${barLeft}%;width:${Math.min(barWidth, 100 - barLeft)}%;height:100%;background:${barCol}88;border-radius:4px;min-width:3px;"></div>
          <div style="position:absolute;top:0;left:${barLeft}%;width:${Math.min(r.completion / 100 * Math.min(barWidth, 100 - barLeft), 100 - barLeft)}%;height:100%;background:${barCol};border-radius:4px;min-width:2px;"></div>
          <span style="position:absolute;right:4px;top:0;line-height:13px;font-size:9px;font-family:var(--m);color:rgba(8, 7, 7, 0.65);">${Math.round(r.completion)}%</span>
        </div>
      </td>
    </tr>`;
  }).join('');
}

// ─── TASK DETAILS TABLE (with resizable columns) ─────
function currentVisCols() {
  const showProj = App.state.selProj === '__all__';
  return App.TCOLS.filter(c => !(c.key === '_proj' && !showProj));
}

function buildColgroup(cols) {
  return cols.map(c => `<col data-key="${c.key}" style="width:${colWidth('task', c.key, c.w)}px">`).join('');
}

function renderTable() {
  const st = App.state;
  let rows = [...st.filteredRows];
  const visCols = currentVisCols();
  if (st.sortCol !== null) {
    const key = visCols[st.sortCol]?.key;
    rows.sort((a, b) => {
      let av = a[key], bv = b[key];
      if (av instanceof Date && bv instanceof Date) return (av - bv) * st.sortDir;
      av = String(av ?? '').toLowerCase(); bv = String(bv ?? '').toLowerCase();
      return (av < bv ? -1 : av > bv ? 1 : 0) * st.sortDir;
    });
  }
  const perPage = parseInt(document.getElementById('rowsPg').value);
  const totalPages = perPage < 999 ? Math.ceil(rows.length / perPage) : 1;
  st.curPage = Math.min(st.curPage, totalPages || 1);
  const start = (st.curPage - 1) * (perPage < 999 ? perPage : 0);
  const pageRows = perPage < 999 ? rows.slice(start, start + perPage) : rows;
  const today = new Date();

  document.getElementById('taskColgroup').innerHTML = buildColgroup(visCols);
  document.getElementById('tblHead').innerHTML = visCols.map((c, i) =>
    `<th data-key="${c.key}" onclick="setSort(${i})">${eH(c.lbl)}${st.sortCol === i ? (st.sortDir > 0 ? ' ↑' : ' ↓') : ''}<span class="col-resizer" onmousedown="startColResize(event,'${c.key}')" onclick="event.stopPropagation()"></span></th>`
  ).join('');

  document.getElementById('tblBody').innerHTML = pageRows.map(r => {
    const isOverdue = r.endDate && r.endDate < today && r.status !== 'complete';
    const pIdx = st.allData.findIndex(p => p.name === r._proj);
    const projCol = pIdx >= 0 ? App.PC[pIdx % App.PC.length] : App.CL.blue;
    return `<tr>${visCols.map(c => {
      switch (c.key) {
        case 'task': return `<td style="font-weight:500;" title="${eA(r.task)}">${eH(r.task)}</td>`;
        case 'status': return `<td><span class="sb s-${r.status.replace(' ', '-')}">${r.status}</span></td>`;
        case 'priority': return `<td><span class="${r.priority === 'high' ? 'ph' : r.priority === 'medium' ? 'pm' : 'pl'}">${r.priority.toUpperCase()}</span></td>`;
        case 'completion': return `<td><div class="prog-wrap"><div class="prog-bg"><div class="prog-fill" style="width:${r.completion}%;background:${pColor(r.completion)};"></div></div><span class="prog-num">${Math.round(r.completion)}%</span></div></td>`;
        case 'startDate': return `<td style="font-family:var(--m);font-size:11px;color:var(--t2);">${fmtDate(r.startDate)}</td>`;
        case 'endDate': return `<td style="font-family:var(--m);font-size:11px;${isOverdue ? 'color:var(--red)' : ''}">${fmtDate(r.endDate)}${isOverdue ? '<span class="late-tag">LATE</span>' : ''}</td>`;
        case '_proj': return `<td><span style="display:inline-flex;align-items:center;gap:5px;font-size:11px;color:var(--t2);background:var(--bgi);padding:2px 7px;border-radius:10px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"><span style="width:6px;height:6px;border-radius:50%;background:${projCol};flex-shrink:0;"></span>${eH(r._proj || '')}</span></td>`;
        case 'phase': return `<td style="font-size:11px;color:var(--t2);">${eH(r.phase)}</td>`;
        case 'assignee': return `<td style="font-size:12px;">${eH(r.assignee)}</td>`;
        case 'comments': return `<td style="font-size:11px;color:var(--t3);" title="${eA(r.comments || '')}">${eH(r.comments || '—')}</td>`;
        default: return `<td>${eH(String(r[c.key] ?? '—'))}</td>`;
      }
    }).join('')}</tr>`;
  }).join('');

  if (!pageRows.length) document.getElementById('tblBody').innerHTML = `<tr><td colspan="${visCols.length}" style="text-align:center;padding:30px;color:var(--t3);">No tasks match current filters</td></tr>`;
  document.getElementById('tblSub').textContent = `Showing ${pageRows.length} of ${rows.length} task${rows.length !== 1 ? 's' : ''}`;
  renderPagination(totalPages, rows.length);
}

function setSort(i) { const st = App.state; st.sortCol === i ? st.sortDir *= -1 : (st.sortCol = i, st.sortDir = 1); renderTable(); }
function goPage(p) { App.state.curPage = p; renderTable(); }
function renderPagination(tp, total) {
  const pg = document.getElementById('pagination');
  const cur = App.state.curPage;
  if (tp <= 1) { pg.innerHTML = `<span class="pg-info">${total} total rows</span>`; return; }
  let h = `<span class="pg-info">${total} rows</span>`;
  h += `<button class="pgb" onclick="goPage(${cur - 1})" ${cur <= 1 ? 'disabled' : ''}>‹</button>`;
  const rng = tp <= 7 ? [...Array(tp).keys()].map(i => i + 1) : cur <= 4 ? [1, 2, 3, 4, 5, '…', tp] : cur >= tp - 3 ? [1, '…', tp - 4, tp - 3, tp - 2, tp - 1, tp] : [1, '…', cur - 1, cur, cur + 1, '…', tp];
  rng.forEach(p => p === '…' ? h += `<span style="color:var(--t3);padding:0 3px;">…</span>` : h += `<button class="pgb ${p === cur ? 'active' : ''}" onclick="goPage(${p})">${p}</button>`);
  h += `<button class="pgb" onclick="goPage(${cur + 1})" ${cur >= tp ? 'disabled' : ''}>›</button>`;
  pg.innerHTML = h;
}

// ─── GENERIC COLUMN RESIZE (used by Task Details, Timeline, Risks, Issues) ───
// Every resizable table stores its widths under its own "namespace" in
// App.state.colWidths, e.g. colWidths.task.status = 140.
function colWidth(ns, key, dflt) {
  const stored = App.state.colWidths[ns] && App.state.colWidths[ns][key];
  return stored || dflt || 120;
}

function buildColgroupNS(ns, cols) {
  return cols.map(c => `<col data-key="${c.key}" style="width:${colWidth(ns, c.key, c.w)}px">`).join('');
}

function resizerSpan(ns, key) {
  return `<span class="col-resizer" onmousedown="startColResizeNS(event,'${ns}','${key}')" onclick="event.stopPropagation()"></span>`;
}

// Backwards-compatible wrapper so existing onclick="startColResize(...)" calls
// (Task Details header, rendered dynamically) keep working under the 'task' namespace.
function startColResize(e, key) { startColResizeNS(e, 'task', key); }

function startColResizeNS(e, ns, key) {
  e.preventDefault(); e.stopPropagation();
  const th = e.target.closest('th');
  const table = th.closest('table');
  const startX = e.clientX;
  const startWidth = th.offsetWidth;
  table.classList.add('resizing');

  function onMove(ev) {
    const w = Math.max(50, startWidth + (ev.clientX - startX));
    if (!App.state.colWidths[ns]) App.state.colWidths[ns] = {};
    App.state.colWidths[ns][key] = w;
    const col = table.querySelector(`col[data-key="${key}"]`);
    if (col) col.style.width = w + 'px';
  }
  function onUp() {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    table.classList.remove('resizing');
    try { localStorage.setItem('casco_col_widths', JSON.stringify(App.state.colWidths)); } catch (err) {}
  }
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

function initColWidths() {
  try {
    const v = localStorage.getItem('casco_col_widths');
    if (v) App.state.colWidths = Object.assign({ task: {}, timeline: {}, risks: {}, issues: {} }, JSON.parse(v));
  } catch (e) {}
  // Apply any restored widths to the Timeline / Risks / Issues tables, whose
  // <thead>/<colgroup> are static HTML (only their <tbody> re-renders on filter).
  ['timeline', 'risks', 'issues'].forEach(ns => {
    const cg = document.getElementById(ns + 'Colgroup');
    if (!cg) return;
    App.RESIZE_DEFAULTS[ns].forEach(c => {
      const col = cg.querySelector(`col[data-key="${c.key}"]`);
      if (col) col.style.width = colWidth(ns, c.key, c.w) + 'px';
    });
  });
}
