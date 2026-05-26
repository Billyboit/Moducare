import * as AR from '../analytics-reports/index.js';
export async function init(mount, State){
  if (typeof AR.init === 'function') return AR.init(mount, State);
  if (typeof AR.render === 'function') { AR.render(mount); return { destroy(){} }; }
  return { destroy(){} };
}
