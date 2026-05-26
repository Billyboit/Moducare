// Secret-login: security-by-obscurity route for admin access.
// Configure a secret token here (kept in frontend only; use proper server auth for production).
const SECRET_TOKEN = 'let-me-in-admin-2026';

export async function init(mount, State){
  const form = mount.querySelector('#secret-form');
  if (!form) return;
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const key = form.secret.value.trim();
    const name = form.username.value.trim() || 'Administrator';
    if (key === SECRET_TOKEN){
      State.setUser({ name, role: 'admin' });
      history.pushState({},'', '/admin');
      window.dispatchEvent(new PopStateEvent('popstate'));
    } else {
      const err = mount.querySelector('.mc-error') || document.createElement('div');
      err.className = 'mc-error'; err.textContent = 'Invalid secret key';
      mount.appendChild(err);
      setTimeout(()=> err.remove(),2500);
    }
  });
}
