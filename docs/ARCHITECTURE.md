# Nova Architecture

## Overview

Nova is a modern frontend framework built with these core principles:

1. **Minimal Abstraction** - Direct native DOM operations
2. **Predictable** - Explicit dependencies, no magic
3. **Fine-grained** - Only affected signals update
4. **Composable** - Small, focused modules
5. **AI-Friendly** - Easy to generate and understand

## Package Structure

```
packages/
├── signals/     # Reactivity core
├── runtime/     # DOM operations, hydration
├── compiler/    # TSX → native DOM
├── router/      # File-based routing
├── islands/     # Island architecture
├── server/      # Dev server with HMR
├── builder/     # Rolldown production build
├── cli/         # Command-line interface
└── plugins/     # Plugin system
```

## Signals Package

The heart of Nova's reactivity system.

### Core Concepts

**Signal**: A reactive container holding a value
- Tracks dependencies when read within effects/computed
- Notifies dependents when updated
- Minimal overhead - just a getter/setter

**Computed**: A derived signal
- Automatically recomputes when dependencies change
- Caches value until invalidated
- Creates dynamic dependency chain

**Effect**: A side effect
- Runs when dependencies change
- Returns cleanup function
- Essential for DOM updates

### Execution Flow

```
1. User reads signal
   ↓
2. If in effect context, add dependency
   ↓
3. User writes signal
   ↓
4. Notify all dependents
   ↓
5. Dependents recompute/run
```

### Implementation Details

```typescript
// Dependency tracking
let currentEffect: Effect | null = null;
let batchDepth = 0;
let pendingEffects = new Set<Subscriber>();

// When effect runs
currentEffect = effect;
// ... code runs, signals are read
// ... signals add effect to their subscriber list
currentEffect = null;

// When signal changes
if (batchDepth > 0) {
  // Group updates together
  subscribers.forEach(sub => pendingEffects.add(sub));
} else {
  // Iterate subscribers, call run()
  subscribers.forEach(sub => sub.run?.());
}
```

## Compiler Package

Transforms TypeScript + JSX into optimized native DOM operations.

### Compilation Pipeline

```
Source TSX
    ↓
Parse → AST
    ↓
Detect signals, islands, static nodes
    ↓
Generate native DOM operations
    ↓
Optimize (tree-shake, hoist statics)
    ↓
Output optimized code
```

### Key Transformations

**JSX → createElement calls**
```typescript
// Input
<div class="container">
  <Button onClick={handler}>Click</Button>
</div>

// Output
createElement('div', { class: 'container' },
  createElement(Button, { onClick: handler }, 'Click')
)
```

**Signal Detection**
```typescript
// Detects these patterns
const count = signal(0);
const doubled = computed(() => count.value * 2);
effect(() => console.log(count.value));
```

**Island Splitting**
```typescript
// Interactive component marked for island
function Counter() {
  const count = signal(0);
  return <button onClick={() => count.value++}>{count.value}</button>;
}
// Gets own bundle for independent hydration
```

## Runtime Package

Ultra-lightweight (<5kb) runtime for:
- DOM patching
- Signal effect scheduling
- Hydration
- Island mounting

### DOM Patching Algorithm

```
1. No Virtual DOM mapping or array allocations overhead.
2. High-performance template cloning (<template>.cloneNode) for static node creation.
3. Patch attributes conditionally (only if changed) to prevent browser reflows.
4. Pointer-based DOM tree traversal (firstChild, nextSibling) instead of array instantiation.
5. Global Event Delegation (one listener per event type on document).
6. **Component Isolation**: Every component call is wrapped in `untrack()`. This prevents "reactive leakage" where a signal read during a component's initialization (setup phase) could link the entire component to a parent effect, causing unnecessary full re-renders.
```

### True Fine-grained Hydration Process

```
1. Server-rendered HTML exists in DOM
2. Load hydration data (props, initial signals)
3. Set global 'isHydrating' context and 'hydrateCursor = el'
4. Component executes but NO new elements are created
5. createElement acts as a DOM walker, moving the cursor
6. Signal effects are attached directly to the existing nodes
7. Zero VDOM diffing overhead during startup
```

## Router Package

File-based routing without additional runtime.

### File Structure → Routes

```
pages/
├── index.tsx          → /
├── about.tsx          → /about
├── posts/
│   ├── index.tsx      → /posts
│   └── [id].tsx       → /posts/:id
```

### Route Matching

```typescript
pathToPattern('pages/posts/[id].tsx')
→ /posts/:id
→ /posts/(?<id>[^/]+)  // RegExp

matchRoute('/posts/123', routes)
→ Route, { id: '123' }
```

## Islands Package

Implements island architecture for partial hydration.

### Island Lifecycle

```
1. Server renders entire page as HTML
2. Compiler detects interactive components (islands)
3. Each island gets own bundle
4. HTML includes island metadata
5. Client loads metadata
6. **Smart Detection**: Island registry distinguishes between lazy factories and direct components using introspection, allowing for seamless integration of both dynamic imports and pre-loaded modules.
7. Each island hydrates independently
8. Page is progressively interactive
```

### Island Metadata

```html
<div data-nova-island="chart_1" data-nova-hydration='{"count":0}'>
  <!-- Server-rendered static content -->
</div>
```

## Dev Server Package

Vite-like development server with fast HMR.

### Architecture

```
Client                          Server
  ↓                               ↓
Watch for change ← File changed ← Watch filesystem
  ↓                               ↓
Send update ──→ HMR handler ←─ Parse & compile
  ↓                               ↓
Update module ← WebSocket ─← Send new code
  ↓                               ↓
Patch signals                 Module graph
  ↓                               ↓
New render                    Dependency tracking
```

### Module Graph

Tracks dependencies for precise HMR:

```
app.tsx
├── counter.tsx (imports)
└── utils.ts (imports)

counter.tsx changes
→ app.tsx affected
→ utils.ts not affected
→ Only reload counter
```

## Builder Package

Production build with Rolldown/esbuild.

### Build Pipeline

```
Analyze
  ↓
Tree-shake unused code
  ↓
Split islands into chunks
  ↓
Minify bundles
  ↓
Generate source maps
  ↓
Output optimized files
```

### Island Bundling

Each island gets:
- Own entry point
- Own dependencies
- Minimal duplication via shared chunks

## Plugin System

Extensible architecture through hooks.

### Hook Types

```typescript
beforeCompile(code, id)  // Before compilation
afterCompile(code, id)   // After compilation
transform(code, id)      // Module transformation
resolveId(id)            // Module resolution
load(id)                 // Module loading
hmrUpdate(moduleId)      // HMR notification
beforeBuild()            // Before build
afterBuild()             // After build
beforeSSR()              // Before SSR
afterSSR()               // After SSR
```

## Motion Package

Integrated 60fps animations via a specialized "interpolating signal".

### How it works:
1. `useMotion(target)` creates a local signal initialized to the target's current value.
2. An `effect` tracks the `target`. When it changes, a high-performance `requestAnimationFrame` loop begins.
3. On every frame, the local signal is updated using the easing function.
4. Since DOM updates are fine-grained, only the specific nodes using the motion signal re-render at 60fps.

## Forms Package

Declarative state management for complex user input.

### Architecture:
- **Control-based**: Each field is an object containing `value`, `error`, and `isDirty` signals.
- **Unified Events**: The `register()` helper provides standardized `onInput` and `onChange` handlers that sync DOM attributes (like `checked`) automatically.
- **Validation Pipeline**: Validators are executed reactively on input, but submission is blocked and loading state (`isSubmitting`) is handled automatically.

### Example Plugin

```typescript
definePlugin({
  name: 'my-plugin',
  
  transform(code, id) {
    if (id.endsWith('.special')) {
      // Custom transformation
      return transformCode(code);
    }
  },
});
```

## Compilation Strategy

### No Virtual DOM - Direct Operations

Instead of:
```typescript
// Expensive: create virtual tree, diff, patch
render() {
  return {
    type: 'div',
    children: [...]
  };
}
```

Nova does:
```typescript
// Fast: direct DOM operations
const div = document.createElement('div');
div.appendChild(...);
el.replaceWith(div);
```

### Granular Reactivity

Instead of:
```typescript
// Expensive: re-render entire component
effect(() => {
  component.render();
});
```

Nova does:
```typescript
// Fast: update only changed nodes
effect(() => {
  element.textContent = signal.value; // Precise update
});
```

## Performance Characteristics

### Startup
- Parse: Fast (small file)
- Hydration: Progressive (per island)
- First Paint: Minimal overhead

### Runtime
- Signal reads: O(1)
- Signal writes: O(n) subscribers
- Effect runs: Only affected
- DOM updates: Minimal mutations

### Build
- Compile: Fast (no AST walking)
- Minify: esbuild (parallel)
- Code split: Automatic islands

## Data Flow Example

```typescript
// Component
function App() {
  const count = signal(0);
  const doubled = computed(() => count.value * 2);

  return (
    <div>
      <p>{count.value}</p>
      <p>{doubled.value}</p>
      <button onClick={() => count.value++}>+</button>
    </div>
  );
}

// User clicks button
1. onClick handler runs
2. count.value = 1 (write)
3. Notify count's subscribers
4. doubled re-computes
5. DOM text nodes update (in effect)
6. New render with updated values
```

## Design Principles

### 1. Explicit is Better

✅ Signal dependencies are explicit
✅ Components are functions
✅ Effects declare what they watch

### 2. Minimal Abstraction

✅ No virtual DOM
✅ No render functions
✅ Direct native APIs

### 3. Predictable

✅ No black magic
✅ Clear data flow
✅ Deterministic updates

### 4. AI-Friendly

✅ Code is readable
✅ Patterns are consistent
✅ Architecture is simple
