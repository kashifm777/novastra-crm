# Novastra CRM

A complete, self-contained CRM web app for managing customers, sales representatives, deals, tasks, revenue reports and notifications.

Built with **React 19 + TypeScript + Vite**. All data is stored client-side in `localStorage`, so the app runs entirely in the browser — no backend or database needed. Every visitor gets the seeded sample data in their own browser and can CRUD everything from the UI.

## Features

- **Dashboard** — KPI cards (customers, open pipeline, revenue won + win rate, follow-ups), a 6/12-month revenue line chart with reporting-period selector, pipeline summary with weighted values, recent activity.
- **Customers** — searchable, sortable, filterable directory; full CRUD with confirmation dialogs; profile pages with deals, tasks, notes and activity history.
- **Sales team** — add/edit/deactivate reps; per-rep detail with book of business, tasks and performance.
- **Pipeline** — six-stage kanban (New Lead → Contacted → Qualified → Proposal → Negotiation → Closed). Arrow controls move deals; closing requires an explicit **Won/Lost** outcome, shown as a badge everywhere.
- **Deals** — searchable table with stage/rep/customer/outcome/close-date filters, sortable columns, probability tracking.
- **Tasks** — grouped by All / Overdue / Today / Upcoming / Completed; owner, priority and due-date filters; one-click completion; overdue flagging.
- **Reports** — date-range and rep filters; won revenue by month, revenue by rep, deals by stage, win rate and average won deal value. Won revenue is always reported separately from open/weighted pipeline.
- **Notifications & activity** — auto-generated notifications (task assigned/overdue, deal assigned/stage changed/won/lost) with unread badges, mark-read controls and deep links; activity history on customers and deals.

## Run locally

```bash
npm install
npm run dev        # → http://localhost:5173
```

Production build:

```bash
npm run build      # type-checks and outputs dist/ (site-root base)
npm run preview
```

## Deploy to GitHub Pages (as a project site)

The included workflow (`.github/workflows/deploy.yml`) builds and deploys on every push to `main`, and derives the base path from the repository name automatically.

1. Create an empty GitHub repository (e.g. `CRM`).
2. Add its **Settings → Pages → Source: GitHub Actions**.
3. Push:

```bash
git init -b main
git add .
git commit -m "Novastra CRM"
git remote add origin git@github.com:kashifm777/CRM.git
git push -u origin main
```

The app goes live at `https://kashifm777.github.io/CRM`. Pages builds fail-closed: also verify the *first* Actions run has permission to create the Pages environment if prompted.

To re-base manually from a terminal, pass the path:

```bash
DEPLOY_PATH_NAME=CRM npm run build:pages   # emits dist/ for /CRM/
```

To deploy instead as a sub-folder of your user site (`kashifm777.github.io` repo), copy the contents of `dist/` into e.g. a `crm/` folder there and commit — the hash-based router needs no extra configuration.

## Project layout

```
src/
  lib/          types, date/format utils, persisted store (localStorage), seed data, hash router, toasts
  components/   design system (modals, badges, forms), layout, SVG charts, entity form dialogs, activity feed
  pages/        Dashboard, Customers(+detail), Deals(+detail), Pipeline, Tasks, Reports, Team(+detail), Notifications
  styles.css    design tokens and full styling (responsive, accessible)
```
