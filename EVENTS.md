# ⚡ Nova Framework - Events & Lifecycle Guide

This document provides a comprehensive reference for all component lifecycles, reactivity triggers, routing hooks, and WebSocket HMR events in the Nova Framework.

---

## 1. Component Lifecycle Hooks (`@nova/runtime`)

Lifecycle hooks allow developers to orchestrate side effects at precise moments in a DOM node's existence.

```tsx
import { onMount, onUnmount, onCleanup, onHydrated } from "@nova/runtime";

export function LifecycleDemo() {
  onMount(() => {
    console.log("1. Node successfully inserted into native DOM tree.");
    const timer = setInterval(() => console.log("Heartbeat..."), 1000);

    // Register cleanup callback directly within onMount
    onCleanup(() => clearInterval(timer));
  });

  onHydrated(() => {
    console.log("2. (Islands only) JavaScript bundle loaded and hydrated successfully!");
  });

  onUnmount(() => {
    console.log("3. Node preparing for complete removal from DOM.");
  });

  return <div class="box">Content</div>;
}
```

---

## 2. Reactive Signal Triggers

| Trigger | Operational Mechanism |
| :--- | :--- |
| `effect(() => {...})` | Executes automatically whenever any signal tracked inside its execution scope is mutated. |
| `computed(() => {...})` | Evaluates derived state lazily upon read and memoizes the output. |
| `batch(() => {...})` | Groups multiple signal mutations within its block into a single, synchronized DOM reconciliation pass. |
| `untrack(() => {...})` | Reads signal values without establishing reactive subscriptions (prevents cyclic render loops). |

---

## 3. Router & Navigation Hooks (`@nova/router`)

Nova's routing engine listens to browser history state and exposes powerful navigation hooks:

| Hook / Event | Purpose |
| :--- | :--- |
| `guard` (Route Guard) | Verifies authorization state (e.g., tokens) prior to lazy-loading route modules. Returning a path string (e.g., `"/login"`) automatically redirects the user. |
| `window.popstate` | Framework automatically reconciles route state when the user clicks browser Back/Forward buttons. |
| `router.subscribe` | Subscribes to a callback invoked upon every successful route transition. |

---

## 4. Standard DOM Events in JSX

Nova supports all standard HTML DOM events using CamelCase naming conventions:

- **Mouse:** `onClick`, `onDblClick`, `onMouseEnter`, `onMouseLeave`, `onMouseMove`.
- **Keyboard:** `onKeyDown`, `onKeyUp`, `onKeyPress`.
- **Form:** `onInput`, `onChange`, `onSubmit`, `onFocus`, `onBlur`.

*Note:* When utilizing `@nova/forms`, explicit `onInput` bindings can be replaced entirely by the two-way binding directive `n-model={signal}`.

---

## 5. Hot Module Replacement (HMR) Events

When running `nova dev`, the WebSocket server dispatches real-time synchronization messages:
- `hmr:update`: Indicates a modified JS or SCSS module to be patched directly into the active browser DOM without state loss.
- `hmr:reload`: Instructs the browser to perform a full page reload when fundamental structural changes occur.
