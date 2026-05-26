export async function init(mount, State){
  const form = mount.querySelector('#login-form');
  if (!form) return;
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const name = form.username.value.trim() || 'Anonymous';
    const role = form.role.value || 'viewer';
    // fake auth: set user in global state and navigate
    State.setUser({ name, role });
    history.pushState({},'', '/dashboard');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
}
