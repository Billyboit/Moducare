#!/usr/bin/env node
// Simple zero-dep feature scaffolder for ModuCare
const fs = require('fs');
const path = require('path');

function usage(){
  console.log('Usage: node scripts/new-feature.js <feature-name> [--roles=role1,role2]');
}

const argv = process.argv.slice(2);
if (argv.length === 0){ usage(); process.exit(1); }
const name = argv[0].replace(/^\/+|\s+/g,'-');
const rolesArg = argv.find(a=>a.startsWith('--roles='));
const roles = rolesArg ? rolesArg.split('=')[1].split(',').map(s=>s.trim()).filter(Boolean) : ['admin'];

const base = path.join(process.cwd(),'features', name);
if (fs.existsSync(base)){
  console.error('Feature already exists:', base); process.exit(1);
}
fs.mkdirSync(base, { recursive: true });

function write(p, content){ fs.writeFileSync(path.join(base,p), content, 'utf8'); }

write('template.html', `<section class="feature-${name}">\n  <header><h2>${name.replace(/[-_]/g,' ')}</h2></header>\n  <div id="${name}-root"></div>\n</section>\n`);
write('styles.css', `/* Styles for ${name} feature */\n.feature-${name} { padding:12px }\n`);
write('index.js', `import State from '../../js/state.js';\n\nconst ALLOWED_ROLES = ${JSON.stringify(roles)};\n\nexport async function init(mount, State){\n  const user = State.getUser();\n  if (!user || !ALLOWED_ROLES.includes(user.role)) {\n    mount.innerHTML = '<section aria-labelledby="forbidden"><h2 id="forbidden">403 — Forbidden</h2><p>Access denied.</p></section>';\n    return { destroy(){} };\n  }\n  mount.innerHTML = document.querySelector('/src/features/${name}/template.html') ? '' : '';\n  // TODO: implement feature UI and logic here\n  mount.querySelector && console.log('Mounted feature ${name} for', user && user.name);\n  return { destroy(){} };\n}\n`);
write('STRUCTURE.md', `Feature contract\n\n- template.html -> root DOM nodes\n- styles.css -> feature styles\n- index.js -> export init(mount, State)\n\nRBAC:\n- Add allowed roles in ALLOWED_ROLES at top of index.js\n`);
write('README.md', `${name} feature scaffold.\n\nRoles allowed: ${roles.join(', ')}\n`);

console.log('Created feature scaffold at', base);
console.log('Allowed roles:', roles.join(','));
