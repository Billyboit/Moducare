import { doSomething } from './logic.js';

export async function init(mount, State){
  // mount is the element that contains the template for this feature
  const btn = mount.querySelector('#example-action');
  if (btn) btn.addEventListener('click', ()=> doSomething(mount));

  // react to state changes (RBAC example)
  const unsub = State.subscribe(s=>{
    const out = mount.querySelector('#example-output');
    if (out) out.textContent = s.user ? `Signed in as ${s.user.name} (${s.user.role})` : 'Not signed in';
  });

  // cleanup hook (optional)
  return { destroy(){ unsub(); } };
}
