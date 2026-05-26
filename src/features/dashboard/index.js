import State from '../../js/state.js';

// fetch activity data from API; fall back to embedded sample if fetch fails
async function fetchActivities(){
  try{
    const res = await fetch('/api/activities');
    if (!res.ok) throw new Error('fetch failed');
    const data = await res.json();
    return data;
  }catch(e){
    // fallback embedded sample
    const now = new Date();
    const days = (n)=> new Date(now.getFullYear(), now.getMonth(), now.getDate()-n, 9, 0,0).toISOString();
    return [
      {id:1,time:days(0),user:'Alice',action:'Updated record',details:'Patient #4321',priority:'high',due:days(-1),status:'open'},
      {id:2,time:days(0),user:'Scheduler',action:'Created shift',details:'Ops Team',priority:'medium',due:days(2),status:'open'},
      {id:3,time:days(1),user:'Bob',action:'Approved invoice',details:'Invoice #9873',priority:'low',due:days(-3),status:'done'},
      {id:4,time:days(3),user:'Eve',action:'New referral',details:'Patient #4328',priority:'high',due:days(0),status:'open'},
      {id:5,time:days(6),user:'Finance',action:'Posted payment',details:'Client #110',priority:'low',due:days(6),status:'open'},
    ];
  }
}

export async function init(mount, State){
  const tbody = mount.querySelector('#recent-body');
  let items = [];
  async function loadAndRender(){
    items = await fetchActivities();
    renderActivity(items);
  }

  function renderActivity(list){
    if (!list || list.length===0){ tbody.innerHTML = `<tr><td colspan="4">No results</td></tr>`; return; }
    tbody.innerHTML = list.map(i=>{
      const t = new Date(i.time).toLocaleString();
      return `<tr><td>${t}</td><td>${i.user}</td><td>${i.action}</td><td>${i.details} ${i.priority?'<span class="badge">'+i.priority+'</span>':''}</td></tr>`;
    }).join('');
  }
  // initial load
  loadAndRender();

  // keyboard focus for KPIs
  const kpis = mount.querySelectorAll('.kpi');
  kpis.forEach(k=> k.addEventListener('keydown', e=>{ if (e.key==='Enter') k.classList.toggle('active'); }));

  // Example: react to sign-in status
  const unsub = State.subscribe(s=>{
    const title = mount.querySelector('#dashboard-title');
    if (s.user) title.textContent = `Dashboard — ${s.user.name}`; else title.textContent = 'Dashboard';
  });

  // Left-panel interactions: tabs and quick filters
  const tabs = mount.querySelectorAll('.tab-btn');
  const quickFilters = mount.querySelectorAll('.quick-filters .mc-btn');

  function activateTab(name){
    tabs.forEach(t=>{
      const is = t.getAttribute('data-tab')===name;
      t.setAttribute('aria-selected', is ? 'true':'false');
    });
    // for now, update mini-calendar text based on tab
    const mini = mount.querySelector('#mini-calendar');
    if (mini) mini.textContent = name === 'overview' ? 'Overview · 12 events' : `${name.charAt(0).toUpperCase()+name.slice(1)} · 0 items`;
  }

  tabs.forEach(t=> t.addEventListener('click', ()=> activateTab(t.getAttribute('data-tab'))));
  // keyboard support
  tabs.forEach(t=> t.addEventListener('keydown', (e)=>{ if (e.key==='ArrowDown'){ const next = t.nextElementSibling || tabs[0]; next.focus(); } else if (e.key==='ArrowUp'){ const prev = t.previousElementSibling || tabs[tabs.length-1]; prev.focus(); } }));

  quickFilters.forEach(b=> b.addEventListener('click', ()=>{
    const f = b.getAttribute('data-filter');
    quickFilters.forEach(x=> x.classList.remove('active'));
    b.classList.add('active');
    // perform filtering on loaded items
    const now = new Date();
    let out = (items || []).slice();
    if (f === 'today'){
      out = out.filter(i=>{
        const d = new Date(i.time);
        return d.toDateString() === now.toDateString();
      });
    } else if (f === 'week'){
      const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate()-7);
      out = out.filter(i=> new Date(i.time) >= weekAgo);
    } else if (f === 'overdue'){
      out = out.filter(i=> new Date(i.due) < now && i.status !== 'done');
    } else if (f === 'high'){
      out = out.filter(i=> i.priority === 'high');
    }
    renderActivity(out);
  }));

  // default
  activateTab('overview');

  // Search within recent activity
  const searchInput = mount.querySelector('#activity-search');
  if (searchInput) searchInput.addEventListener('input', (e)=>{
    const q = e.target.value.toLowerCase();
    const filtered = (items||[]).filter(i=> JSON.stringify(i).toLowerCase().includes(q));
    renderActivity(filtered);
  });

  // Sorting
  let sortDesc = true;
  const sortBtn = mount.querySelector('#sort-time');
  if (sortBtn) sortBtn.addEventListener('click', ()=>{
    sortDesc = !sortDesc;
    const sorted = (items||[]).slice().sort((a,b)=> sortDesc ? new Date(b.time)-new Date(a.time) : new Date(a.time)-new Date(b.time));
    renderActivity(sorted);
  });

  // Export CSV
  const exportBtn = mount.querySelector('#export-csv');
  if (exportBtn) exportBtn.addEventListener('click', ()=>{
    const rows = (items||[]).map(i=> [i.id, i.time, i.user, i.action, '"'+(i.details||'')+'"', i.priority, i.status].join(','));
    const csv = ['id,time,user,action,details,priority,status', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'activities.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  });

  // Load appointments
  async function loadAppointments(){
    try{
      const res = await fetch('/api/appointments');
      if (!res.ok) throw new Error('no appts');
      const appts = await res.json();
      renderAppointments(appts);
    }catch(e){ renderAppointments([]); }
  }
  function renderAppointments(list){
    const ul = mount.querySelector('#appointments-list');
    if (!ul) return;
    if (!list || list.length===0){ ul.innerHTML = '<li>No upcoming appointments</li>'; return; }
    ul.innerHTML = list.map(a=>{
      const t = new Date(a.time).toLocaleString();
      return `<li><div><strong>${a.patient}</strong><div class="mc-muted">${a.type} · ${t}</div></div><div class="appt-status">${a.status}</div></li>`;
    }).join('');
  }
  loadAppointments();

  // Incident form submission -> POST /api/incidents
  const incForm = mount.querySelector('#incident-form');
  if (incForm){
    incForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const payload = {
        title: incForm.querySelector('#inc-title').value.trim(),
        description: incForm.querySelector('#inc-desc').value.trim(),
        severity: incForm.querySelector('#inc-severity').value,
        patient: incForm.querySelector('#inc-patient').value.trim()
      };
      try{
        const res = await fetch('/api/incidents',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
        const data = await res.json();
        if (res.status === 201 && data.ok){
          // push to items (recent activity) for visibility
          items.unshift({ id: data.incident.id, time: data.incident.created, user: data.incident.patient || 'Reporter', action: 'Reported incident: '+data.incident.title, details: data.incident.description, priority: data.incident.severity, status: 'open' });
          renderActivity(items);
          incForm.reset();
          const msg = document.createElement('div'); msg.className='mc-muted'; msg.textContent='Incident submitted'; incForm.appendChild(msg); setTimeout(()=>msg.remove(),2000);
        }else{
          const err = incForm.querySelector('.mc-error') || document.createElement('div'); err.className='mc-error'; err.textContent = data && data.error ? data.error : 'Submit failed'; incForm.appendChild(err); setTimeout(()=>err.remove(),3000);
        }
      }catch(err){ const e = incForm.querySelector('.mc-error') || document.createElement('div'); e.className='mc-error'; e.textContent = 'Network error'; incForm.appendChild(e); setTimeout(()=>e.remove(),3000); }
    });
  }

  // collapse toggle state persisted
  const collapseBtn = mount.querySelector('#left-collapse');
  const left = mount.querySelector('.dashboard-left');
  const key = 'mc:dashboard:left:collapsed';
  function applyCollapsed(v){
    if (!left) return;
    if (v) left.classList.add('collapsed'); else left.classList.remove('collapsed');
  }
  const persisted = localStorage.getItem(key);
  applyCollapsed(persisted === '1');
  if (collapseBtn){
    collapseBtn.addEventListener('click', ()=>{
      const collapsed = left.classList.toggle('collapsed');
      localStorage.setItem(key, collapsed ? '1':'0');
      // update button arrow
      collapseBtn.textContent = collapsed ? '▶' : '◀';
    });
  }

  return { destroy(){ unsub(); } };
}
