import * as u from './utils.js';

export function createCard(title, body){
  const card = u.create('section',{class:'mc-card','role':'region','aria-label':title});
  const h = u.create('h3',{text:title});
  const b = u.create('div',{class:'mc-card-body'});
  if (typeof body === 'string') b.innerHTML = body; else if (body) b.appendChild(body);
  card.appendChild(h); card.appendChild(b);
  return card;
}

export function createButton(text, props={}){
  const btn = u.create('button',Object.assign({class:'mc-btn',type:'button'},props), text);
  return btn;
}

export { u as utils };
