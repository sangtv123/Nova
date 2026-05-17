# 📊 Nova Framework - Monorepo Ecosystem Summary

Nova Framework is a robust, production-ready frontend framework structured as a highly cohesive monorepo comprising 10 specialized core packages.

---

## 📦 Detailed Breakdown of 10 Core Packages

### 1. `@nova/signals`
- **Responsibility:** The reactivity engine of the framework. Implements `signal`, `computed`, `effect`, `batch`, and `untrack`.
- **Key Enhancements:** Includes a declarative pipe transformation system (`mask`, `exclaim`).

### 2. `@nova/compiler`
- **Responsibility:** Advanced JSX/TSX compiler. Parses components, hoists static DOM nodes, and generates direct Native DOM mutation code, eliminating Virtual DOM runtime overhead.

### 3. `@nova/runtime`
- **Responsibility:** Ultra-lightweight DOM patching engine (<5kb). Handles native element creation, reconciliation, attribute binding, and standard lifecycle hooks (`onMount`, `onUnmount`, `onHydrated`).

### 4. `@nova/islands`
- **Responsibility:** Partial hydration engine. Extracts interactive Island components into standalone bundles, passing serialized server state and hydrating dynamically based on scroll visibility or network idle state.

### 5. `@nova/router`
- **Responsibility:** Pull-based dynamic router. Handles lazy-loaded ES module pages, automated layout wrapping, route protection guards, and seamless 404 fallbacks.

### 6. `@nova/forms`
- **Responsibility:** Form state and validation manager. Binds directly to DOM inputs via the `n-model` directive and manages real-time validation error tracking.

### 7. `@nova/http`
- **Responsibility:** Reactive networking client. Features automatic retry logic, an in-memory LRU cache, and returns network responses directly wrapped as reactive signals.

### 8. `@nova/server`
- **Responsibility:** Vite-like development server. Integrates real-time Hot Module Replacement (HMR) via WebSockets to instantly hot-swap TypeScript and SCSS changes without state loss.

### 9. `@nova/cli` & `@nova/create-nova`
- **Responsibility:** Comprehensive developer tooling. Scaffolds new projects (`npm create nova`), launches the dev server (`nova dev`), and orchestrates optimized production builds complete with **Bundle Guard** size auditing (`nova build`).

---

## 🚀 Included Example Applications

- **`examples/counter`**: A concise demonstration of signal reactivity and native DOM reconciliation.
- **`examples/todo-app`**: A comprehensive, feature-rich application integrating Islands, Routing, Signal Reactivity, and Form validation.

---

## 🎯 Key Architectural Strengths

- **Unmatched Performance:** Instant initial page loads via server-rendered static HTML, backed by a sub-5KB runtime footprint.
- **AI-Optimized Architecture:** Built with explicit execution paths and zero magic, enabling AI agents (e.g., Gemini, Claude) to parse, understand, and generate flawless code reliably.
- **Superior Developer Experience:** 100% strict TypeScript support, intuitive file-based routing, and instantaneous HMR feedback.
