#!/usr/bin/env node
// Minimal zero-dependency static server with an in-memory mock API
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 8081;
const ROOT = process.cwd();

const mime = {
  '.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json',
  '.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg',
  '.gif':'image/gif','.ico':'image/x-icon','.woff2':'font/woff2','.woff':'font/woff'
};

const usersPath = path.join(ROOT,'src','data','users.json');
const activitiesPath = path.join(ROOT,'src','data','activities.json');

const incidentsPath = path.join(ROOT,'src','data','incidents.json');
const appointmentsPath = path.join(ROOT,'src','data','appointments.json');
const operationsPath = path.join(ROOT,'src','data','operations.json');
const financePath = path.join(ROOT,'src','data','finance.json');
const analyticsPath = path.join(ROOT,'src','data','analytics.json');

function readActivities(){
  try{
    const raw = fs.readFileSync(activitiesPath,'utf8');
    return JSON.parse(raw);
  }catch(e){
    return [];
  }
}

function readUsers(){
  try{ return JSON.parse(fs.readFileSync(usersPath,'utf8')); }catch(e){ return [{id:1,name:'Alice',role:'admin'},{id:2,name:'Bob',role:'staff'}]; }
}

function writeUsers(arr){
  try{ fs.writeFileSync(usersPath, JSON.stringify(arr, null, 2), 'utf8'); return true; }catch(e){ return false; }
}

function readIncidents(){
  try{ return JSON.parse(fs.readFileSync(incidentsPath,'utf8')); }catch(e){ return []; }
}

function readOperations(){
  try{ return JSON.parse(fs.readFileSync(operationsPath,'utf8')); }catch(e){ return []; }
}

function readFinance(){
  try{ return JSON.parse(fs.readFileSync(financePath,'utf8')); }catch(e){ return []; }
}

function readAnalytics(){
  try{ return JSON.parse(fs.readFileSync(analyticsPath,'utf8')); }catch(e){ return []; }
}

function writeIncidents(arr){
  try{ fs.writeFileSync(incidentsPath, JSON.stringify(arr, null, 2), 'utf8'); return true; }catch(e){ return false; }
}

function readAppointments(){
  try{ return JSON.parse(fs.readFileSync(appointmentsPath,'utf8')); }catch(e){ return []; }
}

function sendJSON(res,status,obj){
  const s = JSON.stringify(obj,null,2);
  res.writeHead(status,{'Content-Type':'application/json','Content-Length':Buffer.byteLength(s)});
  res.end(s);
}

function serveFile(filePath,res){
  fs.stat(filePath,(err,stat)=>{
    if (err || !stat.isFile()) return serveIndex(res);
    const ext = path.extname(filePath).toLowerCase();
    const type = mime[ext] || 'application/octet-stream';
    res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-cache'});
    fs.createReadStream(filePath).pipe(res);
  });
}

function serveIndex(res){
  const index = path.join(ROOT,'index.html');
  fs.readFile(index,(err,data)=>{
    if (err) { res.writeHead(500); res.end('index.html not found'); return; }
    res.writeHead(200,{'Content-Type':'text/html'});
    res.end(data);
  });
}

const server = http.createServer((req,res)=>{
  const url = decodeURIComponent(req.url.split('?')[0]);

  // Simple mock API under /api/
  if (url.startsWith('/api/')){
    if (req.method === 'GET' && url === '/api/health') return sendJSON(res,200,{ok:true});
    if (req.method === 'GET' && url === '/api/users'){
      const data = readUsers();
      return sendJSON(res,200,data);
    }
    if (req.method === 'GET' && url === '/api/activities'){
      const data = readActivities();
      return sendJSON(res,200,data);
    }
    if (req.method === 'GET' && url === '/api/appointments'){
      const data = readAppointments();
      return sendJSON(res,200,data);
    }
    if (req.method === 'GET' && url === '/api/operations'){
      const data = readOperations();
      return sendJSON(res,200,data);
    }
    if (req.method === 'GET' && url === '/api/finance'){
      const data = readFinance();
      return sendJSON(res,200,data);
    }
    if (req.method === 'GET' && url === '/api/analytics'){
      const data = readAnalytics();
      return sendJSON(res,200,data);
    }
    if (req.method === 'GET' && url === '/api/incidents'){
      const data = readIncidents();
      return sendJSON(res,200,data);
    }
    if (req.method === 'POST' && url === '/api/incidents'){
      let body = '';
      req.on('data', ch=> body += ch);
      req.on('end', ()=>{
        try{
          const payload = JSON.parse(body || '{}');
          const arr = readIncidents();
          const incident = Object.assign({ id: Date.now(), created: new Date().toISOString() }, payload);
          arr.unshift(incident);
          const ok = writeIncidents(arr);
          if (!ok) return sendJSON(res,500,{ok:false,error:'write failed'});
          return sendJSON(res,201,{ok:true,incident});
        }catch(e){ return sendJSON(res,400,{ok:false,error:'invalid json'}); }
      });
    }
    // Login endpoint — validate password against stored hash
    if (req.method === 'POST' && url === '/api/login'){
      let body = '';
      req.on('data',ch=> body+=ch);
      req.on('end',()=>{
        try{
          const payload = JSON.parse(body || '{}');
          const { email, password } = payload;
          if (!email || !password) return sendJSON(res,400,{ok:false,error:'email and password required'});
          const arr = readUsers();
          const user = arr.find(u => u.email && u.email.toLowerCase() === String(email).toLowerCase());
          if (!user) return sendJSON(res,401,{ok:false,error:'invalid credentials'});
          const hash = crypto.createHash('sha256').update(password).digest('hex');
          if (!user.passwordHash || user.passwordHash !== hash) return sendJSON(res,401,{ok:false,error:'invalid credentials'});
          const safe = Object.assign({}, user); delete safe.passwordHash; // don't leak hash
          return sendJSON(res,200,{ok:true,user:safe});
        }catch(e){ console.error(e); return sendJSON(res,400,{ok:false,error:'invalid json'}); }
      });
      return;
    }

    // Register endpoint — persist user with password hash to users.json
    if (req.method === 'POST' && url === '/api/register'){
      let body = '';
      req.on('data', ch=> body += ch);
      req.on('end', ()=>{
        try{
          const payload = JSON.parse(body || '{}');
          const { name, email, role, password } = payload;
          if (!email || !password) return sendJSON(res,400,{ok:false,error:'email and password required'});
          const arr = readUsers();
          const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
          const user = { id: 'usr_' + Date.now(), name: name||email, email: email, role: (role||'staff').toLowerCase(), passwordHash };
          arr.push(user);
          const ok = writeUsers(arr);
          if (!ok) return sendJSON(res,500,{ok:false,error:'write failed'});
          const safe = Object.assign({}, user); delete safe.passwordHash;
          return sendJSON(res,201,{ok:true,user:safe});
        }catch(e){ console.error(e); return sendJSON(res,400,{ok:false,error:'invalid json'}); }
      });
    }

    // Users management: PUT /api/users/:id and DELETE /api/users/:id
    if ((req.method === 'PUT' || req.method === 'DELETE') && url.startsWith('/api/users/')){
      const idPart = url.replace('/api/users/','');
      const arr = readUsers();
      const idx = arr.findIndex(u => String(u.id) === idPart);
      if (idx === -1) return sendJSON(res,404,{ok:false,error:'user not found'});
      if (req.method === 'DELETE'){
        arr.splice(idx,1);
        const ok = writeUsers(arr);
        if (!ok) return sendJSON(res,500,{ok:false,error:'write failed'});
        return sendJSON(res,200,{ok:true});
      }
      // PUT = update fields
      let body = '';
      req.on('data', ch=> body += ch);
      req.on('end', ()=>{
        try{
          const payload = JSON.parse(body || '{}');
          const allowed = ['name','email','role','password'];
          const user = arr[idx];
          if (payload.password){ user.passwordHash = crypto.createHash('sha256').update(payload.password).digest('hex'); }
          for (const k of allowed){ if (k !== 'password' && payload[k] !== undefined) user[k] = payload[k]; }
          const ok = writeUsers(arr);
          if (!ok) return sendJSON(res,500,{ok:false,error:'write failed'});
          const safe = Object.assign({}, user); delete safe.passwordHash;
          return sendJSON(res,200,{ok:true,user:safe});
        }catch(e){ console.error(e); return sendJSON(res,400,{ok:false,error:'invalid json'}); }
      });
    }
    return sendJSON(res,404,{error:'not found'});
  }

  // Serve static files, otherwise fall back to index.html for SPA
  const filePath = path.join(ROOT, url === '/' ? '/index.html' : url);
  serveFile(filePath,res);
});

server.listen(PORT, ()=> console.log(`Static server + mock API running at http://localhost:${PORT}`));
