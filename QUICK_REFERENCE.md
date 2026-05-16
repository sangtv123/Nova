# Nova Quick Reference

## Installation & Setup

```bash
# Create new Nova project
npm create nova@latest my-app
cd my-app

# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run type-check   # Type checking
npm run test         # Run tests
```

## Core APIs

### Signals
```typescript
import { signal, computed, effect, batch, untrack } from '@nova/signals';

// Create reactive value
const count = signal(0);

// Read/write value
console.log(count.value);  // Get
count.value = 1;           // Set

// Peek without dependency
const v = count.peek();

// Derived value (auto-updates)
const doubled = computed(() => count.value * 2);

// Side effects
const cleanup = effect(() => {
  console.log(count.value);
  return () => console.log('cleanup');
});

// Batch updates
batch(() => {
  sig1.value = 1;
  sig2.value = 2;
});

// Read without dependency
const value = untrack(() => signal.value);
```

### Components
```typescript
// Basic component
function Welcome() {
  return <h1>Hello!</h1>;
}

// With props
function Greeting(props: { name: string }) {
  return <h1>Hello, {props.name}!</h1>;
}

// With children
function Card(props: { title: string; children: any }) {
  return (
    <div>
      <h2>{props.title}</h2>
      {props.children}
    </div>
  );
}

// Interactive component
function Counter() {
  const count = signal(0);
  return (
    <button onClick={() => count.value++}>
      Count: {count.value}
    </button>
  );
}

// Fragment
function List() {
  return (
    <>
      <li>Item 1</li>
      <li>Item 2</li>
    </>
  );
}
```

### Routing
```typescript
import { router } from '@nova/router';

// Navigate
router.navigate('/about');
router.navigate('/posts/123');

// Get current route
const match = router.getCurrentMatch();
// match.route.path
// match.params
// match.query

// Listen to changes
const unsubscribe = router.subscribe((match) => {
  console.log('Route:', match?.route.path);
});

// Initialize (in main.ts)
router.init();
```

### Islands
```typescript
import { registerIsland, mountIslands } from '@nova/islands';

// Register island
registerIsland('counter', Counter, (props) => {
  return hydrate(el, props, Counter);
});

// Mount all islands
await mountIslands();

// Serialize/deserialize props
const serialized = serializeProps({ count: 0 });
const props = deserializeProps(serialized);
```

### DOM Runtime
```typescript
import { createElement, patch, hydrate } from '@nova/runtime';

// Create element
const button = createElement('button', 
  { class: 'btn', onClick: handler },
  'Click me'
);

// Patch existing element
patch(oldEl, newEl, signalMap);

// Hydrate server-rendered
const island = hydrate(el, hydrationData, Component);

### Lifecycles
```typescript
import { onMount, onUnmount, onCleanup, onHydrated } from '@nova/runtime';

onMount(() => {
  // Logic after component is added to DOM
});

onHydrated(() => {
  // Logic after Island becomes interactive
});

onUnmount(() => {
  // Cleanup logic
});
```

## Configuration

### nova.config.ts
```typescript
import { defineConfig } from '@nova/cli';

export default defineConfig({
  root: '.',
  entry: 'src/main.ts',
  outDir: 'dist',
  publicDir: 'public',
  
  ssr: false,
  minify: true,
  sourcemap: false,
  
  server: {
    port: 3000,
    host: 'localhost',
    hmr: true,
  },
  
  build: {
    target: 'es2020',
    minify: true,
  },
  
  plugins: [],
});
```

## File Structure

```
src/
├── pages/
│   ├── index.tsx       # / (home)
│   ├── about.tsx       # /about
│   └── posts/
│       └── [id].tsx    # /posts/:id
├── components/
│   ├── Header.tsx
│   └── Footer.tsx
├── lib/
│   └── utils.ts
└── main.ts             # Entry point

public/
├── index.html
└── favicon.ico

nova.config.ts
package.json
```

## Common Patterns

### Todo List
```typescript
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

export function TodoApp() {
  const todos = signal<Todo[]>([]);
  const input = signal('');

  const addTodo = () => {
    if (input.value.trim()) {
      todos.value = [...todos.value, {
        id: Date.now(),
        text: input.value,
        completed: false,
      }];
      input.value = '';
    }
  };

  return (
    <div>
      <input 
        value={input.value}
        onChange={(e) => input.value = e.target.value}
      />
      <button onClick={addTodo}>Add</button>
      <ul>
        {todos.value.map(todo => (
          <li key={todo.id}>{todo.text}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Computed Dashboard
```typescript
export function Dashboard() {
  const sales = signal(1000);
  const expenses = signal(300);
  const profit = computed(() => sales.value - expenses.value);
  const margin = computed(() => profit.value / sales.value * 100);

  return (
    <div>
      <p>Sales: ${sales.value}</p>
      <p>Expenses: ${expenses.value}</p>
      <p>Profit: ${profit.value}</p>
      <p>Margin: {margin.value}%</p>
    </div>
  );
}
```

### Conditional Rendering
```typescript
export function StatusPage() {
  const status = signal<'loading' | 'success' | 'error'>('loading');

  return (
    <div>
      {status.value === 'loading' && <p>Loading...</p>}
      {status.value === 'success' && <p>Success!</p>}
      {status.value === 'error' && <p>Error occurred</p>}
    </div>
  );
}
```

### Form Handling
```typescript
export function Form() {
  const name = signal('');
  const email = signal('');
  const submitted = signal(false);

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    submitted.value = true;
    console.log(name.value, email.value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={name.value}
        onChange={(e) => name.value = e.target.value}
        placeholder="Name"
      />
      <input
        type="email"
        value={email.value}
        onChange={(e) => email.value = e.target.value}
        placeholder="Email"
      />
      <button type="submit">Submit</button>
      {submitted.value && <p>Form submitted!</p>}
    </form>
  );
}
```

## Plugin System

```typescript
import { definePlugin } from '@nova/plugins';

export default definePlugin({
  name: 'my-plugin',
  version: '1.0.0',

  // Transform source code before compilation
  beforeCompile(code, id) {
    if (id.endsWith('.special')) {
      return transformCode(code);
    }
  },

  // Transform compiled modules
  transform(code, id) {
    return code;
  },

  // Resolve module IDs
  resolveId(id) {
    if (id === 'special-module') {
      return 'resolved-path';
    }
  },

  // Load module content
  load(id) {
    if (id.endsWith('.data')) {
      return 'export default {}';
    }
  },

  // Build hooks
  beforeBuild(ctx) {
    console.log('Building for:', ctx.env);
  },

  afterBuild(ctx) {
    console.log('Build complete');
  },

  // SSR hooks
  beforeSSR(html) {
    return html;
  },

  afterSSR(html) {
    return html;
  },

  // HMR notification
  hmrUpdate(moduleId) {
    console.log('Module updated:', moduleId);
  },
});
```

## CLI Commands

```bash
# Development
nova dev                    # Start dev server
nova dev --port 5000      # Custom port
nova dev --host 0.0.0.0   # Custom host

# Production
nova build                  # Build for production
nova build --ssr           # Build with SSR
nova build --minify        # Minify output
nova build --sourcemap     # Include source maps

# Project
nova create my-app         # Create new project
nova preview               # Preview production build

# Help
nova --help                # Show help
nova dev --help            # Command-specific help
```

## Deployment

### Static Hosting (Vercel, Netlify, etc.)
```bash
npm run build
# Upload dist/ directory
```

### Server-Side Rendering
```bash
npm run build -- --ssr
# Deploy server with dist/
```

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install && npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## Styling

### Inline Styles
```typescript
<div style={{
  color: 'red',
  backgroundColor: '#f0f0f0',
  padding: '10px',
}}>
  Styled
</div>
```

### CSS Modules
```typescript
import styles from './Component.module.css';

<div class={styles.container}>Content</div>
```

### Tailwind CSS
```typescript
<div class="flex gap-4 p-4 bg-gray-100">
  <button class="px-4 py-2 bg-blue-500 text-white rounded">
    Click
  </button>
</div>
```

## Debugging

### Console Logging
```typescript
const count = signal(0);

effect(() => {
  console.log('Count:', count.value);
});

// In DevTools
console.table([{ count: count.value }]);
```

### Performance Monitoring
```typescript
const start = performance.now();

// Code to measure
const elapsed = performance.now() - start;
console.log('Elapsed:', elapsed, 'ms');
```

## Resources

- 📖 [Full Documentation](./docs)
- 💻 [Examples](./examples)
- 📝 [API Reference](./docs/API.md)
- 🏗️ [Architecture Guide](./docs/ARCHITECTURE.md)
- 🤝 [Contributing Guide](./docs/CONTRIBUTING.md)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Signal not updating | Reassign entire value: `sig.value = newValue` |
| HMR not working | Restart dev server, check WebSocket |
| Bundle too large | Check for unused dependencies, use islands |
| SSR errors | Check async operations, use untrack |
| Type errors | Enable strict mode, add type annotations |

## Tips & Tricks

- ✅ Use `computed()` for derived values
- ✅ Batch related updates with `batch()`
- ✅ Use `effect()` for side effects
- ✅ Mark islands for better performance
- ✅ Use file-based routing for automatic routes
- ✅ Leverage TypeScript for type safety
- ✅ Keep components small and focused
- ✅ Profile before optimizing

---

**For more info, visit [docs/](./docs) directory**
