export function qs(sel, root=document){ return root.querySelector(sel); }
export function qsa(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }
export function create(tag, props={}, children=[]){ const el = document.createElement(tag); for(const k in props) { if (k==='class') el.className = props[k]; else if (k==='text') el.textContent = props[k]; else el.setAttribute(k, props[k]); } (Array.isArray(children)?children:[children]).forEach(c=>{ if (typeof c==='string') el.appendChild(document.createTextNode(c)); else if (c) el.appendChild(c); }); return el; }
