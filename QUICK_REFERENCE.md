# ⚡ Nova API Quick Reference & Cheat Sheet

This document provides concise, production-ready code snippets and API usage patterns across the Nova Framework ecosystem.

---

## 1. CLI Commands & Workflow

```bash
# Scaffold a new project
npm create nova@latest my-app

# Development workflow
npm run dev        # Launch dev server with real-time HMR
npm run build      # Build optimized production bundle to /dist
npm run type-check # Perform strict TypeScript verification
```

---

## 2. Reactivity & Signal Pipes (`@nova/signals`)

```tsx
import { signal, computed, effect, batch, untrack } from "@nova/signals";
import { mask, exclaim } from "@nova/signals/pipes";

// 1. Instantiate signal & read/write
const count = signal(0);
count.value = 10;
const current = count.value; // Registers dependency when invoked inside effect/computed

// 2. Computed signal (automatically recalculates when count changes)
const doubled = computed(() => count.value * 2);

// 3. Side-effect subscription
effect(() => {
  console.log(`Counter value: ${count.value}`);
});

// 4. Batch updates (groups multiple mutations into a single DOM update cycle)
batch(() => {
  count.value = 20;
  count.value = 30;
});

// 5. Untrack / Peek (read value without registering reactive subscription)
const val1 = untrack(() => count.value);
const val2 = count.peek();

// 6. Signal Pipes (Declarative data formatting)
const phone = signal("0912345678");
const formattedPhone = computed(() => phone.pipe(mask("####.###.###")).pipe(exclaim()));
```

---

## 3. UI Components & Inline SCSS (`?inline`)

```tsx
import { signal } from "@nova/signals";
import { onMount, onUnmount } from "@nova/runtime";
import styles from "./Box.scss?inline";

export function Box(props: { title: string; children?: any }) {
  const active = signal(false);

  onMount(() => console.log("Component mounted into DOM"));
  onUnmount(() => console.log("Component unmounted from DOM"));

  return (
    <div class={`custom-box ${active.value ? 'active' : ''}`}>
      <style>{styles}</style>
      <h2>{props.title}</h2>
      <button onClick={() => active.value = !active.value}>
        {active.value ? 'Disable' : 'Enable'}
      </button>
      <div class="content">{props.children}</div>
    </div>
  );
}
```

---

## 4. Island Architecture (`@nova/islands`)

```tsx
// 1. Island definition and registration
import { registerIsland } from "@nova/islands";
import { onHydrated } from "@nova/runtime";

export function ChartIsland(props: { data: number[] }) {
  onHydrated(() => {
    // Instantiate heavy charting library once JS is hydrated
    new Chart("#chart-dom", props.data);
  });
  return <div id="chart-dom">Loading interactive chart...</div>;
}

// (Automatically handled by CLI during build)
registerIsland("chart-island", ChartIsland);

// 2. Declaration inside static pages with hydration strategy
// Options: 'visible' (on scroll into view), 'idle' (when main thread is idle), 'eager' (immediate)
<ChartIsland data={[10, 20, 30]} data-nova-strategy="visible" />
```

---

## 5. Dynamic Routing (`@nova/router`)

```typescript
// 1. Register routes in routes.ts
import { registerRoute } from "@nova/router";

registerRoute({
  path: "/dashboard",
  module: () => import("./pages/dashboard"),
  guard: () => localStorage.getItem("token") ? true : "/login"
});
```

```tsx
// 2. Programmatic navigation
import { router } from "@nova/router";

router.navigate("/dashboard");

// Retrieve current matched route details
const match = router.getCurrentMatch(); // Contains params, query, data
```

```tsx
// 3. Declarative link directives
<a n-router="/dashboard">Admin Dashboard</a>
```

---

## 6. Form Validation (`@nova/forms`)

```tsx
import { useForm } from "@nova/forms";

export function LoginForm() {
  const form = useForm({ email: "", password: "" }, {
    email: (v) => v.includes("@") || "Invalid email address format",
    password: (v) => v.length >= 6 || "Password must be at least 6 characters",
  });

  const onSubmit = (e: Event) => {
    e.preventDefault();
    if (form.validate()) {
      console.log("Validated payload:", form.values);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <input n-model={form.values.email} placeholder="Email" />
      <span class="error">{form.errors.email}</span>

      <input type="password" n-model={form.values.password} placeholder="Password" />
      <span class="error">{form.errors.password}</span>

      <button type="submit">Sign In</button>
    </form>
  );
}
```

---

## 7. Global State Store (`@nova/store`)

```typescript
import { defineStore } from "@nova/store";

export const useCartStore = defineStore("cart", {
  state: () => ({ items: [] as string[] }),
  persist: true, // Synchronize automatically with localStorage
  getters: {
    total: (state) => state.items.length,
  },
  actions: {
    addItem(item: string) {
      this.items.push(item);
    },
    clear() {
      this.items = [];
    }
  }
});
```

```tsx
// Usage inside components
const cart = useCartStore();
return <button onClick={() => cart.addItem("Book")}>Add Item (Total: {cart.total})</button>;
```

---

## 8. Reactive HTTP Networking (`@nova/http`)

```tsx
import { useHttp } from "@nova/http";

export function Users() {
  const { data, loading, error, refetch } = useHttp("https://api.example.com/users", { cache: true });

  if (loading.value) return <div class="loading">Loading users...</div>;
  if (error.value) return <div class="error">Error: {error.value.message}</div>;
  return <ul>{data.value.map((u: any) => <li key={u.id}>{u.name}</li>)}</ul>;
}
```

---

## 9. Configuration (`nova.config.ts`)

```typescript
import { defineConfig } from "@nova/cli";

export default defineConfig({
  root: ".",
  entry: "src/main.ts",
  outDir: "dist",
  server: { port: 3000, hmr: true },
  build: { minify: true }
});
```
