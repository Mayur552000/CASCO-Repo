// ══════════════════════════════════════════════════════
// APP NAMESPACE — every module attaches to this single
// global object so multiple <script> files never collide.
// ══════════════════════════════════════════════════════
var App = {
  PC: ['#2E86D6', '#1F3660', '#00e676', '#ffab40', '#ff5252', '#8f9fd8', '#26c6da', '#f48fb1', '#ff7043', '#c6ff00'],
  CL: { blue: '#2E86D6', navy: '#1F3660', cyan: '#4fc3f7', green: '#00e676', amber: '#ffab40', red: '#ff5252', purple: '#8f9fd8', teal: '#26c6da' },

  // ── Column alias maps — used to auto-detect spreadsheet headers ──
  COL_MAP: {
    task: ['task', 'task name', 'activity', 'item', 'work item', 'name', 'title'],
    status: ['status', 'state', 'progress status', 'task status'],
    priority: ['priority', 'urgency', 'importance'],
    assignee: ['assignee', 'assigned to', 'owner', 'responsible', 'person', 'resource'],
    phase: ['phase', 'stage', 'sprint', 'milestone', 'category', 'group', 'module'],
    completion: ['completion', '% complete', 'progress', 'done %', 'complete %', 'percent complete', '% done', 'completion %', '% completion'],
    startDate: ['start date', 'start', 'begin date', 'from', 'planned start'],
    endDate: ['end date', 'due date', 'finish', 'deadline', 'target date', 'due', 'end', 'planned end'],
    comments: ['comments', 'notes', 'remarks', 'remark']
  },

  RISK_COL_MAP: {
    id: ['risk-id', 'risk id', 'id', '#'],
    description: ['description', 'risk description', 'risk', 'details'],
    probability: ['probability', 'likelihood', 'chance'],
    impact: ['impact', 'severity'],
    level: ['level', 'risk level', 'rating', 'exposure'],
    mitigation: ['mitigation', 'mitigation plan', 'response', 'action'],
    owner: ['owner', 'assigned to', 'responsible'],
    status: ['status', 'state']
  },

  ISSUE_COL_MAP: {
    id: ['issue id', 'issue-id', 'id', '#'],
    description: ['description', 'issue', 'details'],
    created: ['created', 'date raised', 'raised', 'opened'],
    priority: ['priority', 'severity', 'urgency'],
    impact: ['impact'],
    owner: ['owner'],
    assignee: ['assigned to', 'assignee'],
    dueDate: ['due date', 'target date', 'deadline'],
    closeDate: ['close date', 'closed', 'resolution date', 'resolved'],
    update: ['update', 'comments', 'notes', 'status']
  },

  // Task-detail table columns, with a default pixel width used the
  // first time (before the user drags a column to resize it).
  TCOLS: [
    { key: 'task', lbl: 'Task Name', w: 210 },
    { key: '_proj', lbl: 'Project', w: 140 },
    { key: 'status', lbl: 'Status', w: 110 },
    { key: 'priority', lbl: 'Priority', w: 90 },
    { key: 'phase', lbl: 'Phase', w: 110 },
    { key: 'assignee', lbl: 'Assignee', w: 120 },
    { key: 'completion', lbl: 'Progress', w: 130 },
    { key: 'startDate', lbl: 'Start', w: 100 },
    { key: 'endDate', lbl: 'Due Date', w: 100 },
    { key: 'comments', lbl: 'Comments', w: 170 }
  ],

  // Default pixel widths for the other resizable tables (Timeline,
  // Risks, Issues). Keyed by "namespace" so each table's widths are
  // stored/restored independently in App.state.colWidths[namespace].
  RESIZE_DEFAULTS: {
    timeline: [
      { key: 'task', w: 190 }, { key: 'assignee', w: 120 }, { key: 'phase', w: 100 },
      { key: 'start', w: 90 }, { key: 'due', w: 90 }, { key: 'status', w: 100 }, { key: 'progress', w: 220 }
    ],
    risks: [
      { key: 'id', w: 60 }, { key: 'description', w: 260 }, { key: 'project', w: 130 },
      { key: 'probability', w: 90 }, { key: 'impact', w: 90 }, { key: 'level', w: 90 },
      { key: 'mitigation', w: 220 }, { key: 'owner', w: 110 }
    ],
    issues: [
      { key: 'id', w: 60 }, { key: 'description', w: 260 }, { key: 'project', w: 130 },
      { key: 'priority', w: 90 }, { key: 'impact', w: 90 }, { key: 'owner', w: 110 },
      { key: 'assignee', w: 120 }, { key: 'due', w: 90 }, { key: 'status', w: 90 }
    ]
  },

  // ── Mutable app state (shared across all modules) ──
  state: {
    allData: [],          // [{ name, tasks:[], risks:[], issues:[] }]
    selProj: '__all__',
    filteredRows: [],
    charts: {},
    sortCol: null,
    sortDir: 1,
    curPage: 1,
    pendingDel: null,
    colWidths: { task: {}, timeline: {}, risks: {}, issues: {} }, // { namespace: { colKey: px } } — persisted to localStorage
    sidebarCollapsed: false,
    _alertTaskStore: []
  }
};
