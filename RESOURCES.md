# 🔗 Nova Framework - Complete Resource Index

This index serves as the master directory for all documentation files, monorepo packages, and example applications in the Nova Framework repository.

---

## 🧭 Navigation Guide by Need

### 1. Newcomer Onboarding
- 🏁 [GETTING_STARTED.md](./docs/GETTING_STARTED.md): Step-by-step installation and first application guide.
- ⚡ [QUICK_REFERENCE.md](./QUICK_REFERENCE.md): Rapid copy-paste code cheatsheet.
- 🚀 [START_HERE.md](./START_HERE.md): High-level repository orientation guide.

### 2. Core Developers & AI Agents
- 📖 [README.md](./README.md): Comprehensive architectural and module reference.
- ⚙️ [EVENTS.md](./EVENTS.md): Complete lifecycle, signal trigger, and HMR event reference.
- 📊 [SUMMARY.md](./SUMMARY.md): Monorepo ecosystem breakdown across 10 core packages.

### 3. Build & Audit Reports
- 🏆 [COMPLETE.md](./COMPLETE.md): Technical acceptance report validating all framework requirements.
- 📦 [BUILD_REPORT.md](./BUILD_REPORT.md): Production build metrics and Bundle Guard size audits.

---

## 📦 Monorepo Package Directory

```
d:\framework\packages\
├── signals/     → Fine-grained Reactivity Engine & Signal Pipes
├── compiler/    → JSX-to-Native DOM Compiler & Optimization Engine
├── runtime/     → Lightweight DOM Reconciliation (<5kb) & Lifecycles
├── islands/     → Partial Hydration & Component Extraction Engine
├── router/      → Lazy-loaded ES Module Router & Route Guards
├── store/       → Pinia-like Centralized Global State Store
├── forms/       → Two-way Form Binding & Real-time Validation
├── http/        → Reactive HTTP Client with LRU In-memory Caching
├── server/      → Vite-like Dev Server & WebSocket HMR Engine
└── cli/         → Tooling CLI (dev, build) & Scaffolding (create-nova)
```

---

## 💻 Included Example Applications

### 1. Signal Counter Demo (`examples/counter`)
- **Location:** `examples/counter/`
- **Objective:** Demonstrates fundamental signal reactivity and instantaneous native DOM reconciliation.

### 2. Full Todo Application (`examples/todo-app`)
- **Location:** `examples/todo-app/`
- **Objective:** Production-grade application integrating Islands, Dynamic Routing, Global State Store, and Form validation.
