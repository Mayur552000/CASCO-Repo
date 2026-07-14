// ─── SHARED UTILITIES ────────────────────────────────
function eH(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function eA(s) { return String(s).replace(/"/g, '&quot;'); }

function fmtDate(d) {
  if (!d) return '—';
  const dt = d instanceof Date ? d : new Date(d);
  return isNaN(dt) ? '—' : dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

function pColor(v) {
  if (v >= 80) return App.CL.green;
  if (v >= 50) return App.CL.cyan;
  if (v >= 25) return App.CL.amber;
  return App.CL.red;
}

// Finds the index of a header matching one of `keys` (case-insensitive,
// exact or substring match) inside a `headers` array.
function findCol(headers, keys) {
  const clean = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
  const normHeaders = headers.map(clean);
  
  // First pass: look for exact matches after normalization
  for (const k of keys) {
    const nk = clean(k);
    if (!nk) continue;
    const idx = normHeaders.indexOf(nk);
    if (idx >= 0) return idx;
  }
  
  // Second pass: fall back to substring matches
  for (const k of keys) {
    const nk = clean(k);
    if (!nk) continue;
    const idx = normHeaders.findIndex(h => h.includes(nk));
    if (idx >= 0) return idx;
  }
  
  return -1;
}

// Maps a risk/issue "level" style word to a color class (ph/pm/pl).
function levelClass(v) {
  const l = String(v || '').toLowerCase();
  if (l.includes('high') || l.includes('critical')) return 'ph';
  if (l.includes('med')) return 'pm';
  if (l.includes('low')) return 'pl';
  return '';
}
