/**
 * ModuCare MS — HR & Staff Module
 * Features: Staff directory grid/table, search & filter,
 *           add staff modal, role badges, status management
 *
 * Entry point: called by router via render(container)
 */
import { showToast, formatDate, getInitials } from '../../js/utils.js';
import { hasRole } from '../../js/auth.js';

// ── Inject scoped CSS once ───────────────────────────────────
let _cssLoaded = false;
function injectCSS() {
  if (_cssLoaded) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'features/hr-staff/hr-staff.css';
  document.head.appendChild(link);
  _cssLoaded = true;
}

// ── Mock Data ────────────────────────────────────────────────
// Replace with: import { fetchStaff } from './data/staff-api.js'
const MOCK_STAFF = [
  { id:'s001', name:'Jane Doe',       initials:'JD', department:'System Administration', role:'admin',     status:'active',   email:'jane.doe@org.com',          phone:'(555) 201-1000', joined:'2019-03-12', location:'Main Office' },
  { id:'s002', name:'Marcus Rivera',  initials:'MR', department:'Operations',            role:'lead',      status:'active',   email:'m.rivera@org.com',           phone:'(555) 201-1042', joined:'2020-07-08', location:'Branch A' },
  { id:'s003', name:'Sara Okonkwo',   initials:'SO', department:'Finance & Billing',     role:'staff',     status:'active',   email:'sara.o@org.com',             phone:'(555) 201-1087', joined:'2021-01-15', location:'Main Office' },
  { id:'s004', name:'Alex Liu',       initials:'AL', department:'HR',                    role:'lead',      status:'active',   email:'alex.liu@org.com',           phone:'(555) 201-1031', joined:'2020-11-03', location:'Main Office' },
  { id:'s005', name:'Priya Joshi',    initials:'PJ', department:'Audit & Compliance',    role:'supervisor',status:'pending',  email:'p.joshi@org.com',            phone:'(555) 201-1059', joined:'2022-03-28', location:'Remote' },
  { id:'s006', name:'Derek Walsh',    initials:'DW', department:'Operations',            role:'staff',     status:'active',   email:'d.walsh@org.com',            phone:'(555) 201-1065', joined:'2021-09-19', location:'Branch B' },
  { id:'s007', name:'Amara Nwosu',    initials:'AN', department:'Finance & Billing',     role:'staff',     status:'active',   email:'amara.n@org.com',            phone:'(555) 201-1074', joined:'2022-07-11', location:'Main Office' },
  { id:'s008', name:'Tomás Guerrero', initials:'TG', department:'Analytics',             role:'supervisor',status:'active',   email:'t.guerrero@org.com',         phone:'(555) 201-1090', joined:'2019-11-22', location:'Main Office' },
  { id:'s009', name:'Claire Bennett', initials:'CB', department:'HR',                    role:'staff',     status:'inactive', email:'c.bennett@org.com',          phone:'(555) 201-1022', joined:'2018-05-30', location:'Remote' },
  { id:'s010', name:'Jalen Brooks',   initials:'JB', department:'Operations',            role:'staff',     status:'active',   email:'j.brooks@org.com',           phone:'(555) 201-1099', joined:'2023-02-14', location:'Branch A' },
  { id:'s011', name:'Mei Tanaka',     initials:'MT', department:'Document Vault',        role:'staff',     status:'active',   email:'m.tanaka@org.com',           phone:'(555) 201-1033', joined:'2022-10-01', location:'Main Office' },
  { id:'s012', name:'Ray Osei',       initials:'RO', department:'Audit & Compliance',    role:'staff',     status:'pending',  email:'ray.osei@org.com',           phone:'(555) 201-1047', joined:'2023-06-20', location:'Remote' },
];

const DEPT_OPTIONS = [
  'All Departments','System Administration','Operations','Finance & Billing',
  'HR','Audit & Compliance','Analytics','Document Vault',
];

const ROLE_MAP = {
  admin:     { label:'Admin',      badge:'badge-danger',   hex:'#DC2626' },
  director:  { label:'Director',   badge:'badge-primary',  hex:'#1E5799' },
  supervisor:{ label:'Supervisor', badge:'badge-warning',  hex:'#D97706' },
  lead:      { label:'Team Lead',  badge:'badge-accent',   hex:'#0F7A75' },
  staff:     { label:'Staff',      badge:'badge-neutral',  hex:'#5C728A' },
};

const STATUS_MAP = {
  active:   { dot:'status-dot--active',   badge:'badge-success', label:'Active'   },
  pending:  { dot:'status-dot--pending',  badge:'badge-warning', label:'Pending'  },
  inactive: { dot:'status-dot--inactive', badge:'badge-neutral', label:'Inactive' },
};

// ── Module State ─────────────────────────────────────────────
let _state = {
  search: '',
  dept:   'All Departments',
  status: 'all',
  view:   'table',    // 'table' | 'grid'
  page:   1,
  perPage: 8,
};

// ── Public Entry ─────────────────────────────────────────────
export function render(container) {
  injectCSS();
  container.innerHTML = buildShell();
  bindEvents(container);
  renderList(container);
}

// ── Shell HTML ───────────────────────────────────────────────
function buildShell() {
  const canAdd = hasRole('lead');
  return `
  <div class="section-header">
    <div>
      <div class="section-title">HR &amp; Staff Directory</div>
      <div class="section-subtitle">Manage all staff profiles, roles, and employment status across departments.</div>
    </div>
    <div class="flex gap-3">
      ${canAdd ? `<button class="btn btn-primary" id="add-staff-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Staff Member
      </button>` : ''}
      <button class="btn btn-secondary" id="export-btn">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Export CSV
      </button>
    </div>
  </div>

  <!-- Summary Stats -->
  <div class="hr-stats" id="hr-stats"></div>

  <!-- Filter Bar -->
  <div class="filter-bar">
    <div class="filter-search">
      <span class="filter-search__icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      </span>
      <input type="search" id="staff-search" placeholder="Search by name, email, or department…" value="${_state.search}" />
    </div>

    <select class="filter-select" id="dept-filter">
      ${DEPT_OPTIONS.map(d=>`<option value="${d}" ${_state.dept===d?'selected':''}>${d}</option>`).join('')}
    </select>

    <select class="filter-select" id="status-filter">
      <option value="all"      ${_state.status==='all'     ?'selected':''}>All Statuses</option>
      <option value="active"   ${_state.status==='active'  ?'selected':''}>Active</option>
      <option value="pending"  ${_state.status==='pending' ?'selected':''}>Pending</option>
      <option value="inactive" ${_state.status==='inactive'?'selected':''}>Inactive</option>
    </select>

    <div class="flex gap-2 items-center" style="margin-left:auto">
      <button class="btn btn-ghost btn-sm view-toggle ${_state.view==='table'?'active':''}" data-view="table" title="Table view">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>
      </button>
      <button class="btn btn-ghost btn-sm view-toggle ${_state.view==='grid'?'active':''}" data-view="grid" title="Grid view">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
      </button>
    </div>
  </div>

  <!-- List Area -->
  <div id="staff-list"></div>

  <!-- Pagination -->
  <div id="staff-pagination"></div>

  <!-- Add Staff Modal -->
  <div class="modal-overlay hidden" id="add-staff-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <div class="modal modal--lg">
      <div class="modal__header">
        <div>
          <div class="modal__title" id="modal-title">Add New Staff Member</div>
          <div class="modal__subtitle">Fill in the details to create a new staff profile.</div>
        </div>
        <button class="modal__close" id="modal-close" aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="modal__body">
        <form id="add-staff-form" novalidate>
          <div class="form-section">
            <div class="form-section__title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Personal Information
            </div>
            <div class="form-row">
              <div class="input-group">
                <label class="input-label" for="f-first">First Name *</label>
                <input type="text" id="f-first" class="input" placeholder="Jane" required />
              </div>
              <div class="input-group">
                <label class="input-label" for="f-last">Last Name *</label>
                <input type="text" id="f-last" class="input" placeholder="Doe" required />
              </div>
            </div>
            <div class="form-row" style="margin-top:var(--sp-4)">
              <div class="input-group">
                <label class="input-label" for="f-email">Work Email *</label>
                <input type="email" id="f-email" class="input" placeholder="jane.doe@org.com" required />
              </div>
              <div class="input-group">
                <label class="input-label" for="f-phone">Phone Number</label>
                <input type="tel" id="f-phone" class="input" placeholder="(555) 000-0000" />
              </div>
            </div>
          </div>

          <div class="form-section">
            <div class="form-section__title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="2"/></svg>
              Employment Details
            </div>
            <div class="form-row">
              <div class="input-group">
                <label class="input-label" for="f-dept">Department *</label>
                <select id="f-dept" class="input filter-select" style="padding:0.5625rem 0.875rem" required>
                  <option value="">Select department</option>
                  ${DEPT_OPTIONS.slice(1).map(d=>`<option>${d}</option>`).join('')}
                </select>
              </div>
              <div class="input-group">
                <label class="input-label" for="f-role">Role *</label>
                <select id="f-role" class="input filter-select" style="padding:0.5625rem 0.875rem" required>
                  <option value="">Select role</option>
                  ${Object.entries(ROLE_MAP).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="form-row" style="margin-top:var(--sp-4)">
              <div class="input-group">
                <label class="input-label" for="f-start">Start Date *</label>
                <input type="date" id="f-start" class="input" required />
              </div>
              <div class="input-group">
                <label class="input-label" for="f-location">Work Location</label>
                <select id="f-location" class="input filter-select" style="padding:0.5625rem 0.875rem">
                  <option>Main Office</option>
                  <option>Branch A</option>
                  <option>Branch B</option>
                  <option>Remote</option>
                </select>
              </div>
            </div>
          </div>
        </form>
      </div>
      <div class="modal__footer">
        <button class="btn btn-secondary" id="modal-cancel">Cancel</button>
        <button class="btn btn-primary" id="modal-save">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          Save Staff Member
        </button>
      </div>
    </div>
  </div>`;
}

// ── Render List (table or grid) ──────────────────────────────
function renderList(container) {
  const filtered = filterStaff();
  const total    = filtered.length;
  const pages    = Math.ceil(total / _state.perPage);
  const start    = (_state.page - 1) * _state.perPage;
  const slice    = filtered.slice(start, start + _state.perPage);

  // Stats bar
  const statsEl = container.querySelector('#hr-stats');
  if (statsEl) statsEl.innerHTML = buildStatsBar();

  const listEl = container.querySelector('#staff-list');
  if (!listEl) return;

  if (slice.length === 0) {
    listEl.innerHTML = `<div class="empty-state">
      <div class="empty-state__icon">🔍</div>
      <div class="empty-state__title">No staff found</div>
      <div class="empty-state__desc">Try adjusting your search or filter criteria.</div>
    </div>`;
  } else if (_state.view === 'grid') {
    listEl.innerHTML = `<div class="staff-grid">${slice.map(staffCard).join('')}</div>`;
  } else {
    listEl.innerHTML = `
      <div class="table-wrap">
        <table class="table">
          <thead><tr>
            <th>Staff Member</th><th>Department</th><th>Role</th>
            <th>Status</th><th>Location</th><th>Joined</th><th></th>
          </tr></thead>
          <tbody>${slice.map(staffRow).join('')}</tbody>
        </table>
      </div>`;
  }

  // Pagination
  const pagEl = container.querySelector('#staff-pagination');
  if (pagEl) pagEl.innerHTML = pages > 1 ? buildPagination(pages, total) : '';
}

function buildStatsBar() {
  const active   = MOCK_STAFF.filter(s=>s.status==='active').length;
  const pending  = MOCK_STAFF.filter(s=>s.status==='pending').length;
  const inactive = MOCK_STAFF.filter(s=>s.status==='inactive').length;
  return `<div class="hr-stats-row">
    <div class="hr-stat"><span class="hr-stat__val">${MOCK_STAFF.length}</span><span class="hr-stat__lbl">Total Staff</span></div>
    <div class="hr-stat"><span class="hr-stat__val" style="color:var(--clr-success)">${active}</span><span class="hr-stat__lbl">Active</span></div>
    <div class="hr-stat"><span class="hr-stat__val" style="color:var(--clr-warning)">${pending}</span><span class="hr-stat__lbl">Pending</span></div>
    <div class="hr-stat"><span class="hr-stat__val" style="color:var(--clr-neutral-400)">${inactive}</span><span class="hr-stat__lbl">Inactive</span></div>
    <div class="hr-stat"><span class="hr-stat__val">${[...new Set(MOCK_STAFF.map(s=>s.department))].length}</span><span class="hr-stat__lbl">Departments</span></div>
  </div>`;
}

function staffRow(s) {
  const r = ROLE_MAP[s.role]   || ROLE_MAP.staff;
  const st= STATUS_MAP[s.status]|| STATUS_MAP.inactive;
  return `<tr>
    <td><div class="flex items-center gap-3">
      <div class="avatar avatar-md" style="background:var(--clr-primary-100);color:var(--clr-primary-600)">${s.initials}</div>
      <div>
        <div style="font-weight:600;color:var(--text-primary)">${s.name}</div>
        <div style="font-size:0.8125rem;color:var(--text-secondary)">${s.email}</div>
      </div>
    </div></td>
    <td class="text-secondary">${s.department}</td>
    <td><span class="badge ${r.badge}">${r.label}</span></td>
    <td><span class="badge ${st.badge}"><span class="status-dot ${st.dot}"></span>${st.label}</span></td>
    <td class="text-secondary">${s.location}</td>
    <td class="text-secondary text-sm">${formatDate(s.joined)}</td>
    <td>
      <div class="flex gap-1 justify-end">
        <button class="btn btn-ghost btn-sm btn-icon" data-tip="View Profile" onclick="alert('Profile view for ${s.name} — build in /features/hr-staff/components/')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
        <button class="btn btn-ghost btn-sm btn-icon" data-tip="Edit">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
      </div>
    </td>
  </tr>`;
}

function staffCard(s) {
  const r  = ROLE_MAP[s.role]    || ROLE_MAP.staff;
  const st = STATUS_MAP[s.status]|| STATUS_MAP.inactive;
  return `<div class="staff-card">
    <div class="staff-card__top">
      <div class="avatar avatar-xl" style="background:var(--clr-primary-100);color:var(--clr-primary-600);font-size:1.25rem">${s.initials}</div>
      <span class="badge ${st.badge}" style="margin-left:auto"><span class="status-dot ${st.dot}"></span>${st.label}</span>
    </div>
    <div class="staff-card__name">${s.name}</div>
    <div class="staff-card__dept">${s.department}</div>
    <span class="badge ${r.badge}">${r.label}</span>
    <div class="staff-card__meta">
      <span>📍 ${s.location}</span>
      <span>📅 ${formatDate(s.joined)}</span>
    </div>
    <div class="staff-card__email">${s.email}</div>
  </div>`;
}

function buildPagination(pages, total) {
  const start = (_state.page - 1) * _state.perPage + 1;
  const end   = Math.min(_state.page * _state.perPage, total);
  let btns = `<button class="page-btn" ${_state.page===1?'disabled':''} data-page="${_state.page-1}">‹</button>`;
  for (let i=1;i<=pages;i++) {
    btns += `<button class="page-btn ${i===_state.page?'active':''}" data-page="${i}">${i}</button>`;
  }
  btns += `<button class="page-btn" ${_state.page===pages?'disabled':''} data-page="${_state.page+1}">›</button>`;
  return `<div class="pagination">${btns}<span class="pagination__info">${start}–${end} of ${total}</span></div>`;
}

// ── Filter Logic ─────────────────────────────────────────────
function filterStaff() {
  return MOCK_STAFF.filter(s => {
    const q = _state.search.toLowerCase();
    const matchSearch = !q ||
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.department.toLowerCase().includes(q);
    const matchDept   = _state.dept === 'All Departments' || s.department === _state.dept;
    const matchStatus = _state.status === 'all' || s.status === _state.status;
    return matchSearch && matchDept && matchStatus;
  });
}

// ── Event Binding ────────────────────────────────────────────
function bindEvents(container) {
  // Search
  const search = container.querySelector('#staff-search');
  let debounce;
  search?.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      _state.search = search.value;
      _state.page = 1;
      renderList(container);
    }, 280);
  });

  // Dept filter
  container.querySelector('#dept-filter')?.addEventListener('change', e => {
    _state.dept = e.target.value; _state.page = 1; renderList(container);
  });

  // Status filter
  container.querySelector('#status-filter')?.addEventListener('change', e => {
    _state.status = e.target.value; _state.page = 1; renderList(container);
  });

  // View toggle
  container.querySelectorAll('.view-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      _state.view = btn.dataset.view;
      container.querySelectorAll('.view-toggle').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      renderList(container);
    });
  });

  // Pagination (delegated)
  container.querySelector('#staff-pagination')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-page]');
    if (!btn || btn.disabled) return;
    _state.page = parseInt(btn.dataset.page);
    renderList(container);
  });

  // Add Staff Modal
  const modal      = container.querySelector('#add-staff-modal');
  const addBtn     = container.querySelector('#add-staff-btn');
  const closeBtn   = container.querySelector('#modal-close');
  const cancelBtn  = container.querySelector('#modal-cancel');
  const saveBtn    = container.querySelector('#modal-save');

  const openModal  = () => modal?.classList.remove('hidden');
  const closeModal = () => modal?.classList.add('hidden');

  addBtn?.addEventListener('click', openModal);
  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);
  modal?.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  saveBtn?.addEventListener('click', () => {
    const first = container.querySelector('#f-first')?.value.trim();
    const last  = container.querySelector('#f-last')?.value.trim();
    const email = container.querySelector('#f-email')?.value.trim();
    const dept  = container.querySelector('#f-dept')?.value;
    const role  = container.querySelector('#f-role')?.value;
    if (!first||!last||!email||!dept||!role) {
      showToast('Please fill in all required fields.', 'warning'); return;
    }
    const newMember = {
      id: 's' + Date.now(), name: `${first} ${last}`,
      initials: (first[0]+last[0]).toUpperCase(),
      department: dept, role, status:'pending', email,
      phone: container.querySelector('#f-phone')?.value||'—',
      joined: new Date().toISOString().split('T')[0],
      location: container.querySelector('#f-location')?.value||'Main Office',
    };
    MOCK_STAFF.unshift(newMember);
    closeModal();
    _state.page = 1;
    renderList(container);
    showToast(`${newMember.name} added successfully.`, 'success');
    container.querySelector('#add-staff-form')?.reset();
  });

  // Export CSV
  container.querySelector('#export-btn')?.addEventListener('click', () => {
    import('../../js/utils.js').then(({ exportCSV }) => {
      const rows = [
        ['Name','Department','Role','Status','Email','Phone','Location','Joined'],
        ...MOCK_STAFF.map(s=>[s.name,s.department,ROLE_MAP[s.role]?.label,s.status,s.email,s.phone,s.location,s.joined])
      ];
      exportCSV(rows, 'moducare-staff-directory.csv');
      showToast('Staff directory exported as CSV.', 'success');
    });
  });
}
