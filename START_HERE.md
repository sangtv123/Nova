# 🚀 Welcome to Nova Framework (Start Here)

Welcome to **Nova Framework** — an ultra-fast, modern web development framework designed for direct Native DOM execution, exceptional developer ergonomics, and flawless AI agent compatibility.

---

## 🗺️ Documentation Roadmap

To navigate the repository efficiently, we recommend exploring the documentation in the following sequence:

### 1. For Newcomers & Onboarding
- 📜 **[README.md](./README.md)**: Comprehensive architectural overview, core design philosophies, and feature highlights.
- 🏁 **[GETTING_STARTED.md](./docs/GETTING_STARTED.md)**: Step-by-step installation guide and first application tutorial.
- ⚡ **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)**: Rapid API cheat sheet covering Signals, Router, Global Store, and Form handling.

### 2. For Core Engineers & Architects
- 🔍 **[SUMMARY.md](./SUMMARY.md)**: Monorepo package ecosystem breakdown detailing all 10 core packages.
- 🏗️ **[BUILD_REPORT.md](./BUILD_REPORT.md)**: Technical audit report on production build metrics and Bundle Guard size constraints.
- 🔗 **[RESOURCES.md](./RESOURCES.md)**: Complete index of repository links, example applications, and external references.

---

## 🌟 The 6 Pillars of Nova Framework

1. **Signals & Pipes (`@nova/signals`):** Fine-grained reactivity without Virtual DOM overhead, supporting automated batching and declarative data transformation pipelines.
2. **VDOM-less Execution (`@nova/compiler` & `@nova/runtime`):** Direct JSX-to-DOM compilation that creates and mutates native DOM nodes instantly.
3. **Island Architecture (`@nova/islands`):** Clean separation of static HTML and interactive client-side JavaScript. JS is loaded only on demand or when idle.
4. **Dynamic Pull Router (`@nova/router`):** Lazy-loaded ES module routing complete with layout wrapping, route protection guards, and robust 404 handling.
5. **Full Enterprise Ecosystem:** Built-in solutions for Global Store (`@nova/store`), Form validation (`@nova/forms`), and Reactive Networking (`@nova/http`).
6. **Component-Scoped SCSS (`?inline`):** Inject SCSS directly into component `<style>` tags with automatic cleanup upon unmounting.

---

## 💻 Included Example Applications

Two fully functional example applications are included in the repository for immediate exploration:

### 1. Signal Counter Demo (`examples/counter`)
An excellent demonstration of signal-based reactivity and direct DOM reconciliation.
```bash
cd examples/counter
npm run dev
```

### 2. Full-Featured Todo App (`examples/todo-app`)
A complete application integrating Islands, Routing, Global State Store, and Form validation.
```bash
cd examples/todo-app
npm run dev
```

---

## 🚀 Scaffold Your Own Application

Easily create a new project with our automated CLI generator:
```bash
npm create nova@latest my-app
```

The scaffolding engine will generate a production-ready application layout, config files, standard favicons, and sample code to kickstart your project.
