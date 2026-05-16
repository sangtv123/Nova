# Nova - AI-Friendly Frontend Framework

> Ultra-fast, signals-based, no virtual DOM, island architecture, <5kb runtime

## Features

- **⚡ Signals-based Reactivity** - Fine-grained, efficient dependency tracking
- **🏝️ Island Architecture** - Partial hydration for faster page loads
- **🎯 No Virtual DOM** - Direct native DOM operations for predictability
- **📦 Tiny Runtime** - Under 5kb gzipped, minimal abstraction
- **🚀 Zero-config DX** - Works out of the box with smart defaults
- **🤖 AI-Friendly** - Predictable architecture, easy code generation
- **⚙️ SSR Streaming** - Server-side rendering with granular updates
- **🔥 Fast HMR** - Instant hot module replacement in dev
- **📂 File-based Routing** - Automatic routing from file structure
- **🧩 Plugin System** - Extend with custom plugins

## Quick Start

```bash
# Create a new Nova project
npm create nova@latest my-app
cd my-app

# Start development server
npm run dev

# Build for production
npm run build
```

## Architecture

```
packages/
├── signals/      # Reactivity core
├── compiler/     # TSX to native DOM
├── runtime/      # DOM patching & hydration
├── router/       # File-based routing
├── islands/      # Island architecture
├── server/       # Dev server with HMR
├── builder/      # Rolldown production build
├── cli/          # Command-line interface
└── plugins/      # Plugin system
```

## Core Concepts

### Signals

Fine-grained reactivity with automatic dependency tracking:

```typescript
import { signal, computed, effect } from '@nova/signals';

const count = signal(0);
const doubled = computed(() => count.value * 2);

effect(() => {
  console.log(`Count: ${count.value}`);
});

count.value = 1; // Logs: "Count: 1"
```

### Components

Write components with TSX syntax:

```typescript
export function Counter() {
  const count = signal(0);

  return (
    <div>
      <p>Count: {count.value}</p>
      <button onClick={() => count.value++}>
        Increment
      </button>
    </div>
  );
}
```

### Islands

Mark components for client-side interactivity:

```typescript
// pages/dashboard.tsx
export function Dashboard() {
  // Static content
  const header = <h1>Dashboard</h1>;

  // Interactive island
  const chart = <Chart data={staticData} />;

  return (
    <div>
      {header}
      {/* Only Chart is hydrated on client */}
      {chart}
    </div>
  );
}
```

### Routing

Automatic file-based routing:

```
pages/
├── index.tsx          → /
├── about.tsx          → /about
├── posts/
│   ├── index.tsx      → /posts
│   └── [id].tsx       → /posts/:id
└── admin/
    └── settings.tsx   → /admin/settings
```

## API Reference

### Signals

```typescript
// Create a reactive signal
const state = signal(initialValue);

// Get value (creates dependency)
console.log(state.value);

// Set value (triggers effects)
state.value = newValue;

// Peek without dependency
const value = state.peek();

// Derived signals
const derived = computed(() => state.value * 2);

// Side effects
effect(() => {
  console.log(state.value);
  // Returns cleanup function
  return () => {/* cleanup */};
});

// Batch updates
batch(() => {
  signal1.value = 1;
  signal2.value = 2;
});

// Untrack dependencies
untrack(() => {
  const value = signal.value; // No dependency created
});

// Lifecycles
import { onMount, onUnmount, onCleanup, onHydrated } from '@nova/runtime';

onMount(() => {
  console.log('Mounted');
});

onHydrated(() => {
  console.log('Island hydrated');
});
```

### Components

```typescript
// Functional components with JSX
function App() {
  return <div>Hello Nova!</div>;
}

// Props
function Greeting(props: { name: string }) {
  return <div>Hello {props.name}!</div>;
}

// Children
function Card(props: { children: any }) {
  return <div class="card">{props.children}</div>;
}

// Event handlers
function Button() {
  return (
    <button onClick={(e) => console.log(e)}>
      Click me
    </button>
  );
}
```

### Router

```typescript
import { router } from '@nova/router';

// Navigate
await router.navigate('/about');

// Get current route
const match = router.getCurrentMatch();

// Subscribe to changes
router.subscribe((match) => {
  console.log('Route changed:', match?.route.path);
});
```

### Islands

```typescript
import { registerIsland, mountIslands } from '@nova/islands';

// Register interactive island
registerIsland('chart', ChartComponent, (props) => {
  return hydrate(element, props, ChartComponent);
});

// Mount all islands on page
await mountIslands();
```

## Configuration

Create a `nova.config.ts` file:

```typescript
import { defineConfig } from '@nova/cli';

export default defineConfig({
  root: '.',
  entry: 'src/main.ts',
  outDir: 'dist',
  ssr: true,
  server: {
    port: 3000,
    hmr: true,
  },
  plugins: [],
});
```

## Plugins

Create custom plugins:

```typescript
import { definePlugin } from '@nova/plugins';

export default definePlugin({
  name: 'my-plugin',
  
  beforeCompile(code, id) {
    // Transform source code
    return code;
  },
  
  transform(code, id) {
    // Transform modules
    return code;
  },
});
```

## Performance

- **Runtime**: <5kb gzipped
- **Initial Load**: Minimal overhead, direct DOM operations
- **Hydration**: Progressive, island-by-island
- **Re-renders**: Only affected signals update DOM
- **Build**: Fast compilation with esbuild
- **Dev Server**: Instant HMR with ESM

## Comparison

| Feature | Nova | React | Vue | Svelte |
|---------|------|-------|-----|--------|
| No Virtual DOM | ✅ | ❌ | ❌ | ✅ |
| Signals | ✅ | ❌ | ✅ | ✅ |
| Island Architecture | ✅ | ❌ | ❌ | ❌ |
| Runtime Size | <5kb | 42kb | 34kb | 14kb |
| SSR Support | ✅ | ✅ | ✅ | ✅ |
| AI-Friendly | ✅ | ⚠️ | ⚠️ | ⚠️ |

## Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Type check
npm run type-check

# Run tests
npm run test

# Watch mode
npm run dev
```

## Contributing

Nova is built with AI agents in mind. The architecture is designed to be:

- **Predictable**: Minimal magic, explicit dependencies
- **Readable**: Clear code paths, easy to understand
- **Generatable**: AI can reliably produce working code
- **Composable**: Small, focused modules

## License

MIT

## Resources

- [Documentation](https://nova.dev/docs)
- [Examples](./examples)
- [GitHub](https://github.com/nova-framework/nova)
- [Community](https://discord.gg/nova)
