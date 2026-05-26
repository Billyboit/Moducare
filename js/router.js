/**
 * ModuCare MS — Client-Side Router  (v2 — dynamic imports)
 * Hash-based SPA routing. Lazily loads each feature module on first visit,
 * caches it, then calls its exported render(container) function.
 */
import { canAccessModule } from './auth.js';
import { set }             from './store.js';
import { showToast }       from './utils.js';

// ── Route Registry ───────────────────────────────────────────
// label  : breadcrumb / page title
// src    : path to the feature module (relative to project root)
const ROUTES = {
  'dashboard':            { label: 'Dashboard',         src: null },
  'hr-staff':             { label: 'HR & Staff',         src: '../features/hr-staff/index.js' },
  'operations-tasks':     { label: 'Operations',         src: '../features/operations-tasks/index.js' },
  'finance-billing':      { label: 'Finance & Billing',  src: '../features/finance-billing/index.js' },
  'analytics-reports':    { label: 'Analytics',          src: '../features/analytics-reports/index.js' },
  'scheduling-calendar':  { label: 'Scheduling',         src: '../features/scheduling-calendar/index.js' },
  'communications':       { label: 'Communications',     src: '../features/communications/index.js' },
  'notifications':        { label: 'Notifications',      src: '../features/notifications/index.js' },
  'document-vault':       { label: 'Document Vault',     src: '../features/document-vault/index.js' },
  'audit-compliance':     { label: 'Audit & Compliance', src: '../features/audit-compliance/index.js' },
  'client-portal':        { label: 'Client Portal',      src: '../features/client-portal/index.js' },
  'integrations':         { label: 'Integrations',       src: '../features/integrations/index.js' },
  'system-admin':         { label: 'System Admin',       src: '../features/system-admin/index.js' },
};

// Module icon map (used in placeholder + activity feed)
export const MODULE_ICONS = {
  'dashboard':            '🏠',
  'hr-staff':             '👥',
  'operations-tasks':     '📋',
  'finance-billing':      '💰',
  'analytics-reports':    '📊',
  'scheduling-calendar':  '📅',
  'communications':       '💬',
  'notifications':        '🔔',
  'document-vault':       '📁',
  'audit-compliance':     '🛡️',
  'client-portal':        '🌐',
  'integrations':         '🔗',
  'system-admin':         '⚙️',
};

// Module cache — avoids re-importing on every navigation
const _moduleCache = {};

// ── Navigate ─────────────────────────────────────────────────
export async function navigate(moduleId, pushState = true) {
  const route = ROUTES[moduleId];
  if (!route) { navigate('dashboard'); return; }

  // Role guard
  if (!canAccessModule(moduleId)) {
    showToast('You don\'t have permission to access that module.', 'error');
    return;
  }

  if (pushState) window.location.hash = moduleId;

  // Active nav highlight
  document.querySelectorAll('.nav-item').forEach(el =>
    el.classList.toggle('active', el.dataset.module === moduleId)
  );

  // Breadcrumb
  const bc = document.getElementById('breadcrumb-current');
  if (bc) bc.textContent = route.label;

  // Page title
  document.title = `${route.label} — ModuCare MS`;

  // Store sync
  set('currentModule', moduleId);
  set('breadcrumb', route.label);

  // Render
  const content = document.getElementById('page-content');
  if (!content) return;

  // Animate out
  content.style.opacity = '0';
  content.style.transform = 'translateY(4px)';

  await new Promise(r => setTimeout(r, 80));

  content.innerHTML = '';
  content.style.transition = '';
  content.style.opacity = '';
  content.style.transform = '';
  content.style.animation = 'none';
  content.offsetHeight;
  content.style.animation = '';

  // Dashboard is built-in
  if (moduleId === 'dashboard') {
    renderDashboard(content);
    return;
  }

  // Show skeleton while module loads
  content.innerHTML = renderSkeleton();

  try {
    // Load & cache feature module
    if (!_moduleCache[moduleId]) {
      _moduleCache[moduleId] = await import(route.src);
    }
    const mod = _moduleCache[moduleId];
    content.innerHTML = '';
    if (typeof mod.render === 'function') {
      mod.render(content);
    } else {
      renderFallback(content, moduleId);
    }
  } catch (err) {
    console.warn(`[Router] Could not load module "${moduleId}":`, err.message);
    content.innerHTML = '';
    renderFallback(content, moduleId);
  }
}

// ── Init ─────────────────────────────────────────────────────
export function initRouter() {
  document.querySelectorAll('.nav-item[data-module]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      navigate(el.dataset.module);
    });
  });
  window.addEventListener('hashchange', () => {
    navigate(window.location.hash.slice(1) || 'dashboard', false);
  });
  navigate(window.location.hash.slice(1) || 'dashboard', false);
}

// ── Skeleton Loader ──────────────────────────────────────────
function renderSkeleton() {
  return `
    <div style="display:flex;flex-direction:column;gap:var(--sp-6)">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div>
          <div class="skeleton" style="height:24px;width:200px;border-radius:6px;margin-bottom:8px"></div>
          <div class="skeleton" style="height:14px;width:300px;border-radius:4px"></div>
        </div>
        <div class="skeleton" style="height:36px;width:120px;border-radius:6px"></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--sp-5)">
        ${Array(4).fill('<div class="skeleton" style="height:110px;border-radius:12px"></div>').join('')}
      </div>
      <div style="display:grid;grid-template-columns:2fr 1fr;gap:var(--sp-6)">
        <div class="skeleton" style="height:340px;border-radius:12px"></div>
        <div class="skeleton" style="height:340px;border-radius:12px"></div>
      </div>
    </div>`;
}

// ── Fallback Placeholder ─────────────────────────────────────
function renderFallback(container, moduleId) {
  const label = ROUTES[moduleId]?.label ?? moduleId;
  const icon  = MODULE_ICONS[moduleId] ?? '📦';
  container.innerHTML = `
    <div class="module-placeholder">
      <div class="module-placeholder__icon">${icon}</div>
      <div class="module-placeholder__title">${label} Module</div>
      <div class="module-placeholder__desc">
        This module is scaffolded and ready for development.<br/>
        Assign a developer to <code style="background:var(--clr-neutral-100);padding:2px 6px;border-radius:4px;font-family:var(--font-mono);font-size:0.8125rem">/features/${moduleId}/</code> to begin.
      </div>
      <div class="module-placeholder__badge">🔲 Pending Development</div>
    </div>`;
}

// ── Built-in Dashboard Renderer ──────────────────────────────
function renderDashboard(container) {
  container.innerHTML = `
    <div class="dashboard-welcome">
      <div class="dashboard-welcome__greeting">
        Good ${tod()}, <span id="welcome-name">there</span> 👋
      </div>
      <div class="dashboard-welcome__meta">
        <span class="dashboard-welcome__date">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          ${fdate()}
        </span>
        <span>·</span>
        <span>Here's what's happening across your organization today.</span>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-row">
      ${stat('Total Staff',       '84',     '+3 this month',      'up',      '👥', '#EEF5FB','#1E5799')}
      ${stat('Active Tasks',      '127',    '12 due today',       'neutral', '📋', '#D4F8F6','#0F7A75')}
      ${stat('Pending Billing',   '$48,320','3 invoices pending',  'neutral', '💰', '#FEF3C7','#D97706')}
      ${stat('Compliance Alerts', '4',      '2 critical',         'down',    '🛡️', '#FEE2E2','#DC2626')}
    </div>

    <!-- Quick Actions -->
    <div class="section-header">
      <div>
        <div class="section-title">Quick Actions</div>
        <div class="section-subtitle">Jump to common tasks</div>
      </div>
    </div>
    <div class="quick-actions">
      ${qa('Add Staff Member',    '👤','#EEF5FB','hr-staff')}
      ${qa('Log Timesheet',       '⏱️','#D4F8F6','finance-billing')}
      ${qa('New Task',            '✅','#FEF3C7','operations-tasks')}
      ${qa('Run Report',          '📊','#E0F2FE','analytics-reports')}
      ${qa('Upload Document',     '📎','#F3E8FF','document-vault')}
      ${qa('Schedule Event',      '📅','#DCFCE7','scheduling-calendar')}
    </div>

    <!-- Two-col -->
    <div class="dashboard-grid">
      <div class="card">
        <div class="section-header" style="margin-bottom:var(--sp-4)">
          <div class="section-title">Recent Activity</div>
          <button class="btn btn-ghost btn-sm">View all</button>
        </div>
        ${act('👤','#EEF5FB','<strong>Marcus Rivera</strong> was promoted to Team Lead in Operations.','2 min ago')}
        ${act('💰','#FEF3C7','Timesheet submitted by <strong>Sara Okonkwo</strong> — 38 h billable.','14 min ago')}
        ${act('🛡️','#FEE2E2','Compliance alert: <strong>2 service plans</strong> expire within 7 days.','1 hr ago')}
        ${act('📋','#D4F8F6','Task <strong>#OPS-214</strong> moved to Active by <strong>Dev Team</strong>.','3 hr ago')}
        ${act('📁','#F3E8FF','New policy document uploaded to <strong>Document Vault</strong>.','Yesterday')}
      </div>

      <div class="card">
        <div class="section-header" style="margin-bottom:var(--sp-4)">
          <div class="section-title">Upcoming</div>
          <button class="btn btn-ghost btn-sm">View calendar</button>
        </div>
        ${ev('15','JAN','Quarterly Staff Review',       'All departments · 9:00 AM')}
        ${ev('18','JAN','Finance Billing Cycle Close',  'Finance & Billing · EOD')}
        ${ev('22','JAN','Compliance Audit Deadline',    'Audit team · 5:00 PM')}
        ${ev('28','JAN','New Employee Orientation',     'HR · 10:00 AM')}
      </div>
    </div>

    <!-- Staff snapshot -->
    <div class="card">
      <div class="section-header" style="margin-bottom:var(--sp-4)">
        <div class="section-title">Staff at a Glance</div>
        <button class="btn btn-primary btn-sm" onclick="window._navigate('hr-staff')">View Full Directory →</button>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>Name</th><th>Department</th><th>Role</th><th>Status</th><th>Last Active</th></tr></thead>
          <tbody>
            ${sr('JD','Jane Doe',     'System Administration','Admin',     'active',  'Just now')}
            ${sr('MR','Marcus Rivera','Operations',           'Team Lead', 'active',  '5 min ago')}
            ${sr('SO','Sara Okonkwo', 'Finance & Billing',   'Staff',     'active',  '12 min ago')}
            ${sr('AL','Alex Liu',     'HR',                  'Lead',      'active',  '1 hr ago')}
            ${sr('PJ','Priya Joshi',  'Audit & Compliance',  'Supervisor','pending', '2 days ago')}
          </tbody>
        </table>
      </div>
    </div>`;

  // Hydrate user name from session
  import('./auth.js').then(({ getSession }) => {
    const s = getSession();
    const el = document.getElementById('welcome-name');
    if (el && s) el.textContent = s.name.split(' ')[0];
  });
}

// ── Tiny template helpers ────────────────────────────────────
const tod = () => { const h=new Date().getHours(); return h<12?'morning':h<17?'afternoon':'evening'; };
const fdate = () => new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'});

function stat(label,value,sub,trend,icon,ibg,iclr){
  const arrow = trend==='up'
    ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 15l-6-6-6 6"/></svg>'
    : trend==='down'
    ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>' : '';
  const cls = trend==='up'?'stat-card__change--up':trend==='down'?'stat-card__change--down':'';
  return `<div class="stat-card">
    <div class="stat-card__icon" style="background:${ibg};color:${iclr}">${icon}</div>
    <div class="stat-card__label">${label}</div>
    <div class="stat-card__value">${value}</div>
    <div class="stat-card__change ${cls}">${arrow} ${sub}</div>
  </div>`;
}
function qa(label,icon,bg,mod){
  return `<div class="quick-action" role="button" tabindex="0"
    onclick="window._navigate('${mod}')"
    onkeydown="if(event.key==='Enter')window._navigate('${mod}')">
    <div class="quick-action__icon" style="background:${bg}">${icon}</div>
    <span class="quick-action__label">${label}</span>
  </div>`;
}
function act(icon,bg,text,time){
  return `<div class="activity-item">
    <div class="activity-item__icon" style="background:${bg}">${icon}</div>
    <div class="activity-item__body">
      <div class="activity-item__text">${text}</div>
      <div class="activity-item__time">${time}</div>
    </div>
  </div>`;
}
function ev(day,mon,title,meta){
  return `<div class="event-item">
    <div class="event-date">
      <span class="event-date__day">${day}</span>
      <span class="event-date__mon">${mon}</span>
    </div>
    <div class="event-info">
      <div class="event-info__title">${title}</div>
      <div class="event-info__meta">${meta}</div>
    </div>
  </div>`;
}
function sr(ini,name,dept,role,status,last){
  const map={active:{dot:'status-dot--active',badge:'badge-success',lbl:'Active'},
             pending:{dot:'status-dot--pending',badge:'badge-warning',lbl:'Pending'},
             inactive:{dot:'status-dot--inactive',badge:'badge-neutral',lbl:'Inactive'}};
  const s=map[status]||map.inactive;
  return `<tr>
    <td><div class="flex items-center gap-2"><div class="avatar avatar-sm">${ini}</div><span style="font-weight:500">${name}</span></div></td>
    <td class="text-secondary">${dept}</td>
    <td><span class="badge badge-primary">${role}</span></td>
    <td><span class="badge ${s.badge}"><span class="status-dot ${s.dot}"></span>${s.lbl}</span></td>
    <td class="text-secondary text-sm">${last}</td>
  </tr>`;
}

// Expose for inline onclick
window._navigate = navigate;
