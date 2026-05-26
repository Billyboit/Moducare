# ModuCare MS — Local development

Run the frontend and test UI/logic locally using the bundled zero-dependency Node server.

Start the server (requires Node.js installed):

```bash
npm start
# or
node server/static-server.js
```

Open: http://localhost:8080

API endpoints (mock):

- `GET /api/health` — health check
- `GET /api/users` — sample users list
- `POST /api/login` — accepts JSON {name,role} and returns a user object

Notes:

- Server serves static files from project root and falls back to `index.html` for SPA routing.
- This requires only Node.js (no additional packages). The frontend is pure HTML/CSS/JS.
# ModuCare MS

> **A centralized organizational management system** for HR, Operations, Finance, Analytics, Compliance, and beyond — built with a Vanilla Web Stack (HTML5 · CSS3 · ES6 Modules).

---

## 🗂 Project Structure

```
/moducare-ms
│
├── index.html                  # Dashboard App Shell (sidebar + header + router outlet)
├── login.html                  # Authentication — Sign In
├── forgot-password.html        # Authentication — Password Reset
├── README.md                   # This file
│
├── /assets
│   ├── /fonts                  # Self-hosted web fonts (if any)
│   ├── /icons                  # SVG icon sprites
│   └── /images                 # Logos, illustrations
│
├── /css
│   ├── design-system.css       # ★ CSS tokens, reset, typography, shared utilities
│   ├── components.css          # Modals, dropdowns, tabs, alerts, pagination
│   ├── auth.css                # Login & password reset pages
│   └── dashboard.css           # App shell — sidebar, header, layout
│
├── /js
│   ├── auth.js                 # Session management, auth guards, role checking
│   ├── login.js                # Login page controller
│   ├── app.js                  # Dashboard bootstrap (binds UI, calls router)
│   ├── router.js               # Hash-based SPA router with dynamic imports
│   ├── store.js                # Lightweight reactive global state
│   └── utils.js                # Shared helpers — toast, date, CSV export, API fetch
│
└── /features                   # ★ Department-specific modules (isolated)
    ├── /hr-staff               # ✅ Implemented — Staff directory, add/search/export
    ├── /operations-tasks       # ✅ Implemented — Kanban board + task list
    ├── /finance-billing        # ✅ Implemented — Timesheet entry + billing log + rates
    ├── /analytics-reports      # 🔲 Scaffolded
    ├── /scheduling-calendar    # 🔲 Scaffolded
    ├── /communications         # 🔲 Scaffolded
    ├── /document-vault         # 🔲 Scaffolded
    ├── /audit-compliance       # 🔲 Scaffolded
    ├── /client-portal          # 🔲 Scaffolded
    ├── /notifications          # 🔲 Scaffolded
    ├── /integrations           # 🔲 Scaffolded
    └── /system-admin           # 🔲 Scaffolded
```

Each feature folder follows this internal structure:

```
/features/<module-name>/
├── index.js          # Module entry point — exports render(container)
├── <module>.css      # Scoped styles for this module only
├── /components/      # Sub-components (tables, modals, cards)
└── /data/            # Mock data seeds or API binding files
```

---

## 🚀 Getting Started

### Prerequisites
- A modern browser (Chrome, Firefox, Edge, Safari)
- A local web server that supports ES6 modules (required — `file://` won't work)

### Recommended: VS Code Live Server
1. Install the **Live Server** extension in VS Code
2. Open the project folder
3. Right-click `index.html` → **Open with Live Server**

### Alternative: Node http-server
```bash
npx http-server . -p 3000 --cors
# Then open: http://localhost:3000/login.html
```

### Alternative: Python
```bash
python3 -m http.server 3000
# Then open: http://localhost:3000/login.html
```

---

## 🔐 Authentication & Roles

The auth system (`/js/auth.js`) uses `sessionStorage` / `localStorage` for JWT session management.

| Role         | Level | Access                                              |
|--------------|-------|-----------------------------------------------------|
| `staff`      | 1     | Dashboard, Operations, Scheduling, Communications, Notifications |
| `lead`       | 2     | + HR, Finance, Document Vault, Client Portal        |
| `supervisor` | 3     | + Analytics, Audit & Compliance                     |
| `director`   | 4     | + Integrations                                      |
| `admin`      | 5     | Full access including System Admin                  |

> **Demo login:** Enter any email + any password (4+ characters) on the login screen. Select your desired role from the role selector.

> **Production:** Replace `loginRequest()` in `/js/auth.js` with a real `fetch('/api/auth/login', ...)` call.

---

## 🧩 Architecture

### App Shell Pattern
`index.html` is a persistent shell — the sidebar, header, and `<main id="page-content">` never reload. Only the content area is replaced on navigation.

### Hash Router
`/js/router.js` intercepts sidebar clicks and `hashchange` events. Each module is dynamically imported on first visit and cached:
```js
import('/features/hr-staff/index.js').then(mod => mod.render(container))
```

### Reactive Store
`/js/store.js` is a tiny pub/sub store. Modules can subscribe to keys:
```js
import { get, set, subscribe } from '../../js/store.js';
subscribe('currentModule', (mod) => console.log('Navigated to:', mod));
```

### Feature Module Contract
Every feature module **must** export a `render(container)` function:
```js
// /features/my-module/index.js
export function render(container) {
  container.innerHTML = `...`;
  // bind events, load data, etc.
}
```

---

## 🎨 Design System

All tokens are in `/css/design-system.css` as CSS custom properties:

```css
/* Colors */   --clr-primary-500, --clr-accent-400, --clr-success, --clr-danger
/* Surfaces */ --surface-card, --surface-page, --surface-sidebar
/* Text */     --text-primary, --text-secondary, --text-tertiary
/* Spacing */  --sp-1 (4px) → --sp-16 (64px)
/* Shadows */  --shadow-xs → --shadow-xl
/* Radii */    --border-radius-sm → --border-radius-xl
```

Shared utility classes: `.card`, `.btn`, `.badge`, `.table`, `.avatar`, `.input`, `.flex`, `.grid-*`, `.stat-card`, and more.

---

## 📦 Implemented Features (v1.0)

### ✅ HR & Staff (`/features/hr-staff`)
- Full staff directory (table + grid views)
- Search by name, email, department
- Filter by department and status
- Add Staff Member modal with full form validation
- Role and status badges
- Export to CSV

### ✅ Operations & Tasks (`/features/operations-tasks`)
- Kanban board view with 4-column pipeline (Referred → Pending → Active → Completed)
- List view with sortable columns
- New task modal with priority, department, assignee, due date
- Priority badges (Urgent / High / Medium / Low)
- Overdue detection
- Filter by status and priority

### ✅ Finance & Billing (`/features/finance-billing`)
- Timesheet entry with live billing preview
- Automatic 15-minute unit conversion
- Billing log table with hours, units, and amounts
- Rate management panel
- Approve/pending status tracking
- Export billing log to CSV

---

## 🔲 Scaffolded Modules (ready to implement)

Each of these has a working module shell (`index.js` + `.css`) that the router loads successfully. Assign to developers:

| Module                | Folder                        | Suggested Priority |
|-----------------------|-------------------------------|-------------------|
| Analytics & Reports   | `/features/analytics-reports` | High              |
| Scheduling & Calendar | `/features/scheduling-calendar`| High             |
| Audit & Compliance    | `/features/audit-compliance`  | High              |
| Notifications         | `/features/notifications`     | Medium            |
| Document Vault        | `/features/document-vault`    | Medium            |
| Communications        | `/features/communications`    | Medium            |
| System Admin          | `/features/system-admin`      | Medium            |
| Client Portal         | `/features/client-portal`     | Low               |
| Integrations          | `/features/integrations`      | Low               |

---

## 🔧 Utility API Reference

```js
import { showToast, formatDate, formatCurrency,
         hoursToBillingUnits, exportCSV, apiFetch } from '../../js/utils.js';

showToast('Saved!', 'success');          // 'info' | 'success' | 'warning' | 'error'
formatDate('2025-01-15');                // → "Jan 15, 2025"
formatCurrency(1234.5);                 // → "$1,234.50"
hoursToBillingUnits(2.5);              // → 10  (15-min units)
exportCSV(rowsArray, 'export.csv');     // triggers browser download
apiFetch('/staff');                     // fetch with auth headers
```

---

## 🤝 Contributing

1. Check out the module you're assigned in `/features/<module-name>/`
2. Open `index.js` — implement `render(container)` and replace scaffold UI
3. Add scoped styles to `<module>.css` — **do not** modify `/css/design-system.css`
4. Add sub-components to `/components/` and mock data to `/data/`
5. Test by running a local server and navigating to your module
6. Submit a PR against `main` with your module folder only

---

## 📋 Conventions

- **No frameworks** — Vanilla HTML5, CSS3, ES6 Modules only
- **Scoped styles** — each module loads its own CSS; never use global selectors
- **Design tokens** — always use CSS variables from `design-system.css`, never raw hex values
- **Module isolation** — a module should not import from another feature module
- **Shared code** — put reusable logic in `/js/utils.js` or `/js/store.js`
- **Data** — mock data lives in `/features/<module>/data/`; replace with `apiFetch()` calls in production

---

*ModuCare MS · Built with Vanilla Web Stack · &copy; 2025*

## Secret admin access (local dev)

- The admin login is intentionally not linked in the UI. To open the secret admin login page, visit `/secret-login` or use the keyboard shortcut:

  - Windows/Linux: Ctrl+Alt+L
  - macOS: Ctrl+Shift+L

  The secret login uses a client-side token for local testing only; replace with real server-side auth for production.
