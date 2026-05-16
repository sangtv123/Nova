# Nova Framework - Complete Documentation Index

## Quick Links

- **Getting Started** → [GETTING_STARTED.md](./GETTING_STARTED.md)
- **API Reference** → [API.md](./API.md)
- **Architecture** → [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Contributing** → [CONTRIBUTING.md](./CONTRIBUTING.md)

## What is Nova?

Nova is a modern frontend framework designed for:

- **AI Code Generation** - Predictable, easy-to-understand architecture
- **Ultra-fast Development** - <5kb runtime, instant HMR
- **Fine-grained Reactivity** - Signals-based, no virtual DOM
- **Progressive Enhancement** - Island architecture for optimal performance
- **Developer Experience** - Zero-config setup, clear mental model

## Key Features

| Feature | Nova | React | Vue | Svelte |
|---------|------|-------|-----|--------|
| **Runtime Size** | <5kb | 42kb | 34kb | 14kb |
| **No Virtual DOM** | ✅ | ❌ | ❌ | ✅ |
| **Signals** | ✅ | ❌ | ✅ | ✅ |
| **Islands Architecture** | ✅ | ❌ | ❌ | ❌ |
| **File-based Routing** | ✅ | ⚠️ | ⚠️ | ✅ |
| **SSR Streaming** | ✅ | ✅ | ✅ | ✅ |
| **AI-Friendly** | ✅ | ⚠️ | ⚠️ | ⚠️ |

## Getting Started

### Installation

```bash
npm create nova@latest my-app
cd my-app
npm run dev
```

### Your First Component

```typescript
import { signal } from '@nova/signals';

export default function App() {
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

See [Getting Started Guide](./GETTING_STARTED.md) for more.

## Core Concepts

### Signals

Fine-grained reactivity with automatic dependency tracking.

```typescript
const count = signal(0);
const doubled = computed(() => count.value * 2);

effect(() => {
  console.log(count.value, doubled.value);
});

count.value = 1; // Logs: 1, 2
```

### Components

Functions that return JSX, with props and children.

```typescript
function Card(props: { title: string; children: any }) {
  return (
    <div>
      <h2>{props.title}</h2>
      {props.children}
    </div>
  );
}
```

### Islands

Interactive components partially hydrated on the client.

```typescript
// Server renders everything, only Counter is interactive
export function Dashboard() {
  return (
    <>
      <Header /> {/* Static */}
      <Counter /> {/* Interactive island */}
      <Footer /> {/* Static */}
    </>
  );
}
```

### File-based Routing

Automatic routing from file structure.

```
pages/
├── index.tsx      → /
├── about.tsx      → /about
└── posts/
    └── [id].tsx   → /posts/:id
```

## Architecture Overview

```
┌─────────────────────────────────────┐
│     Your Nova Application           │
├─────────────────────────────────────┤
│  Components (JSX)                   │
│  Signals (Reactivity)               │
│  Router (Navigation)                │
├─────────────────────────────────────┤
│  Compiler (TSX → Native DOM)        │
│  Islands (Partial Hydration)        │
│  Plugins (Extensibility)            │
├─────────────────────────────────────┤
│  Runtime (<5kb)                     │
│  - Signal graph                     │
│  - DOM patching                     │
│  - Effects scheduler                │
├─────────────────────────────────────┤
│  Dev: HMR Server                    │
│  Prod: Rolldown Builder             │
└─────────────────────────────────────┘
```

## Package Overview

- **@nova/signals** - Reactivity core
- **@nova/compiler** - TSX → native DOM transformation
- **@nova/runtime** - DOM operations, hydration, <5kb
- **@nova/router** - File-based routing
- **@nova/islands** - Island architecture
- **@nova/server** - Development server with HMR
- **@nova/builder** - Production build with tree-shaking
- **@nova/cli** - Command-line interface
- **@nova/plugins** - Plugin system

## CLI Commands

```bash
# Start development server
nova dev

# Build for production
nova build

# Create new project
nova create my-app

# Preview production build
nova preview
```

## Configuration

Create `nova.config.ts`:

```typescript
import { defineConfig } from '@nova/cli';

export default defineConfig({
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

## Examples

### Counter App

A simple counter demonstrating signals:

```bash
cd examples/counter
npm run dev
```

### Todo App

A full-featured todo app with routing and computed values:

```bash
cd examples/todo-app
npm run dev
```

## Performance

- **Startup**: <1s (no AST building overhead)
- **Hydration**: Progressive (island by island)
- **Re-renders**: O(1) per signal change
- **Bundle**: < 100kb for typical app
- **Runtime**: <5kb gzipped

## Best Practices

### 1. Use Signals Properly

```typescript
// ✅ Good: fine-grained reactivity
const count = signal(0);
effect(() => {
  document.body.textContent = count.value;
});

// ❌ Avoid: re-rendering everything
effect(() => {
  document.body.innerHTML = renderApp();
});
```

### 2. Mark Islands Clearly

```typescript
// ✅ Good: explicit island boundary
export function Dashboard() {
  return (
    <>
      <StaticHeader />
      <InteractiveChart /> {/* Island */}
    </>
  );
}
```

### 3. Batch Updates

```typescript
// ✅ Good: batch related updates
batch(() => {
  state1.value = a;
  state2.value = b;
  state3.value = c;
});

// ❌ Avoid: individual updates
state1.value = a;
state2.value = b;
state3.value = c;
```

### 4. Use Computed for Derived State

```typescript
// ✅ Good: automatic caching
const doubled = computed(() => count.value * 2);

// ❌ Avoid: manual memoization
let cachedDoubled = 0;
effect(() => {
  cachedDoubled = count.value * 2;
});
```

## Plugins

Extend Nova with custom plugins:

```typescript
import { definePlugin } from '@nova/plugins';

export default definePlugin({
  name: 'my-plugin',

  transform(code, id) {
    if (id.endsWith('.custom')) {
      return transformCode(code);
    }
  },
});
```

## Deployment

### Static Hosting

```bash
npm run build
# Upload dist/ directory
```

### Server-Side Rendering

```bash
npm run build -- --ssr
# Run server with dist/ directory
```

### Vercel

```bash
vercel deploy
```

### Netlify

```bash
netlify deploy --prod
```

## Resources

- **Documentation**: [docs/](.)
- **Examples**: [examples/](../examples)
- **Packages**: [packages/](../packages)
- **GitHub**: https://github.com/nova-framework/nova
- **Discord**: https://discord.gg/nova
- **Discussions**: https://github.com/nova-framework/nova/discussions

## Frequently Asked Questions

### Q: How is Nova different from React?

A: Nova uses signals instead of hooks, has no virtual DOM, and includes island architecture out of the box. It's optimized for AI code generation and has a tiny runtime.

### Q: Can I use Nova in production?

A: Nova is in active development. The architecture is stable but the API may change. Use at your own risk in production.

### Q: How do I migrate from React?

A: Check the [migration guide](./MIGRATION.md) for step-by-step instructions.

### Q: Is SSR supported?

A: Yes, with streaming support. Set `ssr: true` in config and Nova handles the rest.

### Q: Can I use with my favorite CSS framework?

A: Yes, Nova works with Tailwind, Styled Components, CSS Modules, and plain CSS.

## Troubleshooting

### Signals not updating

```typescript
// ✅ Correct: trigger recompute
signal.value = newValue;

// ❌ Wrong: mutate object
signal.value.prop = newValue; // Won't trigger
signal.value = { ...signal.value, prop: newValue };
```

### HMR not working

1. Check WebSocket connection
2. Verify dev server is running
3. Check console for errors
4. Restart dev server

### Bundle too large

1. Check for unused dependencies
2. Enable tree-shaking
3. Split into islands
4. Use code splitting

## Contributing

Nova welcomes contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT © Nova Contributors

## Roadmap

- [ ] Compiler optimizations
- [ ] More built-in plugins
- [ ] Official component library
- [ ] Mobile support (React Native)
- [ ] DevTools browser extension
- [ ] Community plugins showcase
- [ ] Official templates

## Support

- 💬 Discord: https://discord.gg/nova
- 📝 GitHub Issues: https://github.com/nova-framework/nova/issues
- 💭 Discussions: https://github.com/nova-framework/nova/discussions
- 🐦 Twitter: @nova_framework

---

**Made with ❤️ for AI agents and humans alike**
