/**
 * ModuCare MS — Global State Store
 * Lightweight reactive store. No frameworks — just pub/sub.
 * Modules read from this, dispatch events to update it.
 */

const _state = {
  currentModule:  'dashboard',
  sidebarCollapsed: false,
  user:           null,
  notifications:  [],
  breadcrumb:     'Dashboard',
};

const _listeners = {};

/**
 * Read a value from the store.
 * @param {string} key
 * @returns {*}
 */
export function get(key) {
  return _state[key];
}

/**
 * Update a value and notify all listeners.
 * @param {string} key
 * @param {*} value
 */
export function set(key, value) {
  _state[key] = value;
  (_listeners[key] || []).forEach(fn => fn(value));
}

/**
 * Subscribe to a key change.
 * @param {string} key
 * @param {Function} fn — called with the new value
 * @returns {Function} unsubscribe
 */
export function subscribe(key, fn) {
  if (!_listeners[key]) _listeners[key] = [];
  _listeners[key].push(fn);
  return () => {
    _listeners[key] = _listeners[key].filter(f => f !== fn);
  };
}

export default { get, set, subscribe };
