import * as FB from '../finance-billing/index.js';
export async function init(mount, State){
  if (typeof FB.init === 'function') return FB.init(mount, State);
  if (typeof FB.render === 'function') { FB.render(mount); return { destroy(){} }; }
  return { destroy(){} };
}
