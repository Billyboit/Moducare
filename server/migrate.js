#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Load environment variables (.env)
require('dotenv').config();

const ROOT = process.cwd();

// 1. Resolve target database path from .env connection URL
let dbPath;
const dbUrl = process.env.DATABASE_URL;

if (dbUrl && dbUrl.startsWith('sqlite://')) {
  const relativeDbPath = dbUrl.replace('sqlite://', '');
  dbPath = path.resolve(ROOT, relativeDbPath);
} else {
  dbPath = path.join(ROOT, 'src', 'data', 'hospital.db');
}

// Ensure the target directory for hospital.db exists (src/data/)
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 2. Direct baseline data parameters
const mockData = {
  users: [
    { id: "1", name: "Alice Admin", email: "alice@acme.org", role: "admin", passwordHash: null },
    { id: "2", name: "Bob Staff", email: "bob@acme.org", role: "staff", passwordHash: null },
    { id: "usr_1779948492660", name: "Daniel Mach Reech", email: "danreech@acme.org", role: "admin", passwordHash: "ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f" },
    { id: "3", name: "korir451", email: "bkipkorir451@gmail.com", role: "staff", passwordHash: null },
    { id: "usr_1779963783364", name: "silvia korir", email: "korirsilvia44@gmail.com", role: "staff", passwordHash: "15e2b0d3c33891ebb0f1ef609ec419420c20e320ce94c65fbcbf6c7c0938b8aa8" }
  ],
  activities: [
    { id: 1, time: "2026-05-26T09:12:00.000Z", user: "Alice", action: "Updated record", details: "Patient #4321", priority: "high", due: "2026-05-25T09:00:00.000Z", status: "open" },
    { id: 2, time: "2026-05-26T08:58:00.000Z", user: "Scheduler", action: "Created shift", details: "Ops Team", priority: "medium", due: "2026-05-28T09:00:00.000Z", status: "open" },
    { id: 3, time: "2026-05-25T08:12:00.000Z", user: "Bob", action: "Approved invoice", details: "Invoice #9873", priority: "low", due: "2026-05-23T09:00:00.000Z", status: "done" },
    { id: 4, time: "2026-05-23T07:30:00.000Z", user: "Eve", action: "New referral", details: "Patient #4328", priority: "high", due: "2026-05-26T09:00:00.000Z", status: "open" },
    { id: 5, time: "2026-05-20T10:00:00.000Z", user: "Finance", action: "System Audited", details: "Q2 Reports", priority: "low", due: null, status: "done" }
  ],
  analytics: [
    { id: 1, metric: "Active Users", value: 123, period: "24h" },
    { id: 2, metric: "Appointments", value: 42, period: "24h" }
  ],
  appointments: [
    { id: 1, time: "2026-05-27T10:00:00.000Z", patient: "John Smith", type: "Consultation", status: "scheduled" },
    { id: 2, time: "2026-05-27T11:30:00.000Z", patient: "Mary Jones", type: "Follow-up", status: "confirmed" },
    { id: 3, time: "2026-05-28T09:00:00.000Z", patient: "Peter Lee", type: "Intake", status: "scheduled" }
  ],
  finance: [
    { id: 1, type: "Invoice", reference: "INV-1001", amount: 1200.00, status: "pending", due: "2026-06-01", date: null },
    { id: 2, type: "Payment", reference: "PAY-2001", amount: 300.00, status: "posted", due: null, date: "2026-05-20" }
  ],
  operations: [
    { id: 1, name: "Daily Rounds", owner: "Ops", status: "ok", scheduled: "2026-05-26T09:00:00Z" },
    { id: 2, name: "Inventory Check", owner: "Logistics", status: "due", scheduled: "2026-05-27T10:00:00Z" }
  ],
  incidents: []
};

// 3. Open connection to SQLite
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) { 
    console.error('Database connection error:', err.message); 
    process.exit(1); 
  }
  console.log(`Connected to SQLite file at: ${dbPath}`);
  runSeeding();
});

function runSeeding() {
  db.serialize(() => {
    // Re-create the tables cleanly
    db.run(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT, email TEXT UNIQUE, role TEXT, passwordHash TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS activities (id INTEGER PRIMARY KEY AUTOINCREMENT, time TEXT, user TEXT, action TEXT, details TEXT, priority TEXT, due TEXT, status TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS analytics (id INTEGER PRIMARY KEY AUTOINCREMENT, metric TEXT, value REAL, period TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS appointments (id INTEGER PRIMARY KEY AUTOINCREMENT, time TEXT, patient TEXT, type TEXT, status TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS finance (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT, reference TEXT, amount REAL, status TEXT, due TEXT, date TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS operations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, owner TEXT, status TEXT, scheduled TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS incidents (id INTEGER PRIMARY KEY AUTOINCREMENT, created TEXT, title TEXT, description TEXT, status TEXT, severity TEXT)`);

    db.serialize(() => {
      console.log('\n--- Initiating structural data populating ---');

      // 1. Populate Users
      const stmtUser = db.prepare("INSERT OR IGNORE INTO users (id, name, email, role, passwordHash) VALUES (?, ?, ?, ?, ?)");
      mockData.users.forEach(u => stmtUser.run([u.id, u.name, u.email, u.role, u.passwordHash]));
      stmtUser.finalize();
      console.log(`✓ Database successfully loaded ${mockData.users.length} user records.`);

      // 2. Populate Activities
      const stmtAct = db.prepare("INSERT OR IGNORE INTO activities (id, time, user, action, details, priority, due, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
      mockData.activities.forEach(a => stmtAct.run([a.id, a.time, a.user, a.action, a.details, a.priority, a.due, a.status]));
      stmtAct.finalize();
      console.log(`✓ Database successfully loaded ${mockData.activities.length} activity entries.`);

      // 3. Populate Analytics
      const stmtAn = db.prepare("INSERT OR IGNORE INTO analytics (id, metric, value, period) VALUES (?, ?, ?, ?)");
      mockData.analytics.forEach(a => stmtAn.run([a.id, a.metric, a.value, a.period]));
      stmtAn.finalize();
      console.log(`✓ Database successfully loaded ${mockData.analytics.length} metric items.`);

      // 4. Populate Appointments
      const stmtApp = db.prepare("INSERT OR IGNORE INTO appointments (id, time, patient, type, status) VALUES (?, ?, ?, ?, ?)");
      mockData.appointments.forEach(a => stmtApp.run([a.id, a.time, a.patient, a.type, a.status]));
      stmtApp.finalize();
      console.log(`✓ Database successfully loaded ${mockData.appointments.length} appointment records.`);

      // 5. Populate Finance
      const stmtFin = db.prepare("INSERT OR IGNORE INTO finance (id, type, reference, amount, status, due, date) VALUES (?, ?, ?, ?, ?, ?, ?)");
      mockData.finance.forEach(f => stmtFin.run([f.id, f.type, f.reference, f.amount, f.status, f.due, f.date]));
      stmtFin.finalize();
      console.log(`✓ Database successfully loaded ${mockData.finance.length} billing entries.`);

      // 6. Populate Operations
      const stmtOp = db.prepare("INSERT OR IGNORE INTO operations (id, name, owner, status, scheduled) VALUES (?, ?, ?, ?, ?)");
      mockData.operations.forEach(o => stmtOp.run([o.id, o.name, o.owner, o.status, o.scheduled]));
      stmtOp.finalize();
      console.log(`✓ Database successfully loaded ${mockData.operations.length} operational rounds.`);
    });
  });

  db.close((err) => {
    if (err) console.error(err.message);
    console.log('\nAll historical records have been cleanly seeded directly into hospital.db!');
  });
}