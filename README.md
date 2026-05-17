# Nova - The Next-Generation Web Framework

> Ultra-fast, signals-based reactivity, direct native DOM reconciliation, Island architecture, and robust ecosystem (<5kb runtime).

![Nova Framework](https://img.shields.io/badge/Nova%20Framework-v0.0.1-brightgreen?style=for-the-badge&logo=javascript)

Nova is a cutting-edge web application framework engineered for peak performance, exceptional developer experience (DX), and zero Virtual DOM overhead. Instead of performing expensive tree diffing, Nova's compiler translates declarative JSX directly into highly optimized native DOM mutations powered by fine-grained reactivity.

---

## 🌟 Key Architectural Features

- **⚡ Fine-Grained Signals:** Extremely efficient reactivity system that tracks precise dependencies and updates only the specific DOM nodes that change, completely eliminating Virtual DOM diffing.
- **🏝️ Island Architecture & Partial Hydration:** Delivers instant initial page loads with static HTML rendered from the server, selectively hydrating interactive components (Islands) on the client based on customizable strategies (`visible`, `idle`, or `eager`).
- **🎯 Zero Virtual DOM:** The compiler transforms TSX/JSX directly into native DOM creation and patching code (`createElement`, `setAttribute`), drastically reducing memory usage.
- **🎨 Component-Scoped Declarative SCSS:** Supports importing SCSS with the `?inline` query parameter, encapsulating styles into the component's lifecycle and automatically cleaning up style tags upon unmounting.
- **🛣️ Pull-Based Dynamic Routing:** Advanced routing engine supporting lazy-loaded modules, automatic layout wrapping, robust route guards, and seamless 404 error handling.
- **🛡️ Full Ecosystem Integration:** Includes production-ready solutions for centralized state management (`@nova/store`), form validation (`@nova/forms`), reactive HTTP networking (`@nova/http`), and Angular-style data transformation pipes (`@nova/signals` pipes).
- **📦 Bundle Guard & SEO Realtime:** Automated bundle auditing during production builds to enforce strict asset size limits, alongside automatic meta tag optimization for superior SEO.

---

## 🚀 Quick Start & Scaffolding

### 1. Create a New Nova Application
To scaffold a brand new Nova project pre-configured with standard icons, TypeScript configs, and sample components:

```bash
npm create nova@latest my-app
```

### 2. Install Dependencies & Start Dev Server
```bash
cd my-app
npm install
npm run dev
```
This launches the development server (defaulting to `http://localhost:3000`) with instant Hot Module Replacement (HMR) for both TypeScript and SCSS without losing application state.

### 3. Build for Production
```bash
npm run build
```
This triggers an optimized production bundle using esbuild/rolldown, performs automatic tree-shaking and island code splitting, validates asset sizes against **Bundle Guard** constraints, and generates an interactive audit report.

---

## 📖 Core Modules Deep Dive

### 1. Reactivity Engine: `@nova/signals`

Signals provide a highly predictable and performant model for managing state:

```tsx
import { signal, computed, effect, batch, untrack } from "@nova/signals";

const count = signal(0);
const doubled = computed(() => count.value * 2);

// Side effects automatically subscribe to dependencies
effect(() => {
  console.log(`Current Count: ${count.value}, Doubled: ${doubled.value}`);
});

// Mutating value triggers scheduled updates
count.value++;

// Batch multiple mutations into a single DOM reconciliation pass
batch(() => {
  count.value = 10;
  count.value = 20;
});

// Read values without registering reactive subscriptions (prevents infinite loops)
const currentValue = untrack(() => count.value);
// Alternatively: count.peek()
```

### 2. Angular-Style Signal Pipes

Nova enables elegant declarative data transformation directly on signals:

```tsx
import { signal } from "@nova/signals";
import { mask, exclaim } from "@nova/signals/pipes";

// Source signal
const phone = signal("0987654321");

// Transformed computed signal using chained pipes
const formattedPhone = computed(() => 
  phone.pipe(mask("####.###.###")).pipe(exclaim())
);
```

### 3. Component Architecture & Inline SCSS (`?inline`)

Components in Nova are standard functions returning JSX. You can inject component-scoped styles directly into the DOM tree:

```tsx
import { signal } from "@nova/signals";
import { onMount, onUnmount } from "@nova/runtime";
import styles from "./Counter.scss?inline";

export function Counter() {
  const count = signal(0);

  onMount(() => console.log("Counter successfully mounted into DOM"));
  onUnmount(() => console.log("Counter unmounted; style tag will be cleaned up automatically"));

  return (
    <div class="counter-box">
      <style>{styles}</style>
      <h3>Counter: {count.value}</h3>
      <button onClick={() => count.value++}>Increment</button>
    </div>
  );
}
```

### 4. Island Architecture & Partial Hydration (`@nova/islands`)

To maximize initial rendering speed, heavy interactive components (e.g., forms, charts, data grids) can be marked as **Islands** for independent client-side hydration.

```tsx
// 1. Register the Island component
import { registerIsland } from "@nova/islands";
import { useForm } from "@nova/forms";
import { onHydrated } from "@nova/runtime";
import styles from "./ContactIsland.scss?inline";

export function ContactIsland() {
  onHydrated(() => {
    console.log("Island successfully hydrated and attached to client DOM!");
  });

  const form = useForm({ email: "" }, {
    email: (v) => v.includes("@") || "Please enter a valid email address"
  });

  return (
    <form class="island-form" onSubmit={form.handleSubmit}>
      <style>{styles}</style>
      <input n-model={form.values.email} placeholder="Enter your email..." />
      <span class="error">{form.errors.email}</span>
      <button type="submit">Submit</button>
    </form>
  );
}
```

In your static page (`pages/index.tsx`), instantiate the Island with an explicit hydration strategy:
```tsx
// Strategy options: 'visible' (on scroll into view), 'idle' (requestIdleCallback), or 'eager' (immediate)
<ContactIsland data-nova-strategy="visible" />
```

### 5. Dynamic Pull-Based Routing (`@nova/router`)

Nova's routing engine handles lazy-loaded page modules, automated layout enforcement, route protection, and seamless 404 fallbacks.

Define routes (`routes.ts`):
```typescript
import { registerRoute } from "@nova/router";

registerRoute({
  path: "/",
  module: () => import("./pages/index"), // Automatically extracts default or named component exports
});

registerRoute({
  path: "/admin",
  module: () => import("./pages/admin"),
  guard: () => {
    const isAdmin = localStorage.getItem("role") === "admin";
    return isAdmin ? true : "/login"; // Redirects unauthorized users
  }
});
```

Render in `App.tsx`:
```tsx
import { signal, effect } from "@nova/signals";
import { router } from "@nova/router";
import { Layout } from "./components/Layout";

export function App() {
  const currentMatch = signal(router.getCurrentMatch());
  const isReady = signal(!!router.getCurrentMatch());

  effect(() => {
    return router.subscribe((match) => {
      currentMatch.value = match;
      isReady.value = true;
    });
  });

  return (
    <Layout>
      {() => {
        if (!isReady.value) return <div class="loading">Loading routes...</div>;
        
        const match = currentMatch.value;
        if (!match || !match.component) {
          return <div class="error-404"><h2>404 - Page Not Found</h2></div>;
        }

        const Page = match.component;
        return <Page data={match.data} />;
      }}
    </Layout>
  );
}
```

### 6. Centralized State Management (`@nova/store`)

Nova offers a Pinia-inspired global store architecture for sharing state seamlessly across your application:

```typescript
import { defineStore } from "@nova/store";

export const useAuthStore = defineStore("auth", {
  state: () => ({ user: null as string | null, token: "" }),
  persist: true, // Automatically synchronizes with localStorage
  getters: {
    isLoggedIn: (state) => !!state.user,
  },
  actions: {
    login(username: string, token: string) {
      this.user = username;
      this.token = token;
    },
    logout() {
      this.user = null;
      this.token = "";
    }
  }
});
```

Usage in component:
```tsx
const auth = useAuthStore();
return <button onClick={auth.logout}>Sign out {auth.user}</button>;
```

### 7. Reactive HTTP Client (`@nova/http`)

An advanced HTTP networking client featuring built-in LRU caching, automatic request retries, and direct signal synchronization:

```tsx
import { useHttp } from "@nova/http";

export function PostList() {
  const { data, loading, error, refetch } = useHttp("https://api.example.com/posts", {
    cache: true,
    ttl: 60000,
    retry: 3,
  });

  return (
    <div class="posts-container">
      {loading.value && <p>Loading data...</p>}
      {error.value && <p class="error">Error: {error.value.message}</p>}
      {data.value && data.value.map((post: any) => <article key={post.id}><h3>{post.title}</h3></article>)}
    </div>
  );
}
```

---

## 🛠️ Project Configuration (`nova.config.ts`)

```typescript
import { defineConfig } from "@nova/cli";

export default defineConfig({
  root: ".",
  entry: "src/main.ts",
  outDir: "dist",
  server: {
    port: 3000,
    hmr: true,
  },
  build: {
    target: "es2022",
    minify: true,
    bundleGuard: {
      maxAssetSizeKB: 4.0, // Triggers warnings/errors if individual chunks exceed 4KB
    }
  }
});
```

---

## 📊 Monorepo Architecture Overview

```
d:\framework\
├── packages/
│   ├── signals/      # Core reactivity engine & Signal Pipes
│   ├── compiler/     # JSX Compiler to Native DOM transformations
│   ├── runtime/      # DOM reconciliation, patching, & Lifecycle hooks
│   ├── router/       # Lazy-loaded Router & Guard verification
│   ├── islands/      # Partial Hydration & Component Isolation
│   ├── store/        # Pinia-like Centralized State
│   ├── forms/        # Form Validation & Two-way Binding Directives
│   ├── http/         # Reactive Networking with LRU Caching
│   ├── server/       # Dev Server with WebSocket HMR
│   ├── cli/          # Tooling CLI (nova dev, nova build)
│   └── create-nova/  # Project Scaffolding CLI (npm create nova)
└── my-app/           # User Applications
```

---

## 🛡️ License

Nova Framework is open-source software licensed under the MIT license.
