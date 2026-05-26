// Simple observable global state for RBAC and user info
const State = (() => {
  const state = { user: null };
  const listeners = new Set();

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function notify() {
    for (const l of listeners) l(state);
  }

  function setUser(user) {
    state.user = user;
    notify();
  }

  function getUser() { return state.user; }

  return { subscribe, setUser, getUser };
})();

export default State;
