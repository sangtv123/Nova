# API Reference

## Signals

### `signal<T>(initialValue: T): Signal<T>`

Create a reactive signal.

```typescript
const count = signal(0);
const name = signal('Nova');
```

**Properties:**
- `value` - Get or set the value
- `peek()` - Get value without creating dependency

**Example:**
```typescript
const count = signal(0);

// In an effect/computed context
console.log(count.value); // Creates dependency

// Outside effect context
const v = count.peek(); // No dependency
```

### `computed<T>(fn: () => T): Signal<T>`

Create a derived signal that automatically updates.

```typescript
const count = signal(5);
const doubled = computed(() => count.value * 2);

console.log(doubled.value); // 10
count.value = 6;
console.log(doubled.value); // 12 (automatically updated)
```

**Features:**
- Memoized (caches result)
- Lazy (computed only when needed)
- Read-only (throws if you try to set)

### `effect(fn: () => void | (() => void)): () => void`

Run side effects when dependencies change.

```typescript
const count = signal(0);

const cleanup = effect(() => {
  console.log(`Count: ${count.value}`);
  
  // Return optional cleanup function
  return () => {
    console.log('Cleaning up');
  };
});

count.value = 1; // Logs: "Count: 1"
cleanup(); // Logs: "Cleaning up"
```

**Use cases:**
- DOM updates
- Event listeners
- API calls
- LocalStorage

### `batch<T>(fn: () => T): T`

Batch multiple signal updates.

```typescript
batch(() => {
  count.value = 1;
  name.value = 'Nova';
  age.value = 1;
  // Effects run once after batch completes
});
```

### `untrack<T>(fn: () => T): T`

Read signals without creating dependencies.

```typescript
const count = signal(0);
const name = signal('Nova');

effect(() => {
  const value = untrack(() => count.value);
  console.log(name.value); // Depends on name
  // Does NOT depend on count
});
```

## Components

Components are functions that return JSX.

```typescript
function Greeting(props: { name: string }) {
  return <h1>Hello, {props.name}!</h1>;
}
```

### Props

```typescript
interface Props {
  title: string;
  count?: number;
  onClick?: (e: MouseEvent) => void;
  children?: any;
}

function Component(props: Props) {
  return <div>{props.title}</div>;
}
```

### Children

```typescript
function Card(props: { children: any }) {
  return <div class="card">{props.children}</div>;
}

// Usage
<Card>
  <h2>Title</h2>
  <p>Content</p>
</Card>
```

### Event Handlers

```typescript
function Button() {
  return (
    <>
      <button onClick={(e) => console.log('clicked')}>Click</button>
      <input onChange={(e) => console.log(e.target.value)} />
      <form onSubmit={(e) => { e.preventDefault(); }} />
    </>
  );
}
```

### Fragments

```typescript
function Component() {
  return (
    <>
      <div>A</div>
      <div>B</div>
    </>
  );
}
```

## Router

### `router.navigate(path: string): Promise<RouteMatch | null>`

Navigate to a path.

```typescript
import { router } from '@nova/router';

router.navigate('/about');
router.navigate('/posts/123');
```

### `router.getCurrentMatch(): RouteMatch | null`

Get current route.

```typescript
const match = router.getCurrentMatch();
if (match) {
  console.log(match.route.path);      // '/posts/:id'
  console.log(match.params);          // { id: '123' }
  console.log(match.query);           // { sort: 'asc' }
}
```

### `router.subscribe(callback: (match: RouteMatch | null) => void): () => void`

Listen to route changes.

```typescript
const unsubscribe = router.subscribe((match) => {
  console.log('Route changed to:', match?.route.path);
});

// Cleanup
unsubscribe();
```

### `router.init(): void`

Initialize router with browser integration.

```typescript
router.init(); // Listen to popstate, set initial route
```

## Islands

### `registerIsland(id: string, component: any, hydrate: (props) => any): void`

Register an interactive island.

```typescript
import { registerIsland } from '@nova/islands';

registerIsland('counter', Counter, (props) => {
  return new Counter(props);
});
```

### `mountIslands(): Promise<void>`

Mount all islands in the document.

```typescript
import { mountIslands } from '@nova/islands';

await mountIslands(); // Find and hydrate all islands
```

### `serializeProps(props: Record<string, any>): string`

Serialize props for transmission.

```typescript
const serialized = serializeProps({
  count: 0,
  name: 'Nova',
  date: new Date(),
});

// Returns JSON string with special type handling
```

### `deserializeProps(serialized: string): Record<string, any>`

Deserialize props from transmission.

```typescript
const props = deserializeProps(serialized);
```

## Runtime DOM

### `createElement(tag: string, attrs?: Record<string, any>, ...children: any[]): Element`

Create a DOM element.

```typescript
const button = createElement('button', 
  { class: 'btn', onClick: handler },
  'Click me'
);
```

### `patch(oldVnode: Element | null, newVnode: Element | null, signals: Map): Element | null`

Patch DOM with minimal updates.

```typescript
const newEl = createElement('div', {}, 'Updated');
patch(oldElement, newEl, signalMap);
```

### `hydrate(el: Element, hydrationData: HydrationData, componentFn: Function): MountedIsland`

Hydrate server-rendered element.

```typescript
const island = hydrate(
  document.getElementById('app'),
  { id: 'app', props: {}, signals: {} },
  AppComponent
);
```

## Plugins

### `definePlugin(plugin: Plugin): Plugin`

Define a plugin.

```typescript
import { definePlugin } from '@nova/plugins';

const myPlugin = definePlugin({
  name: 'my-plugin',
  version: '1.0.0',
  
  beforeCompile(code, id) {
    return code; // Transform
  },
  
  transform(code, id) {
    return code; // Transform
  },
});

export default myPlugin;
```

### Hook Types

```typescript
beforeCompile?(code: string, id: string, ctx?: PluginContext): string | null;
afterCompile?(code: string, id: string, ctx?: PluginContext): string | null;
transform?(code: string, id: string): string | null;
resolveId?(id: string): string | null;
load?(id: string): string | null;
beforeBuild?(ctx: PluginContext): void;
afterBuild?(ctx: PluginContext): void;
beforeSSR?(html: string, ctx: PluginContext): string;
afterSSR?(html: string, ctx: PluginContext): string;
hmrUpdate?(moduleId: string, ctx: PluginContext): void;
```

## CLI

### Commands

```bash
# Development server
nova dev [--port 3000] [--host localhost]

# Production build
nova build [--ssr] [--minify] [--sourcemap]

# Create project
nova create [project-name]

# Preview build
nova preview
```

### Configuration

Create `nova.config.ts`:

```typescript
import { defineConfig } from '@nova/cli';

export default defineConfig({
  root: '.',
  entry: 'src/main.ts',
  outDir: 'dist',
  publicDir: 'public',
  ssr: false,
  server: {
    port: 3000,
    host: 'localhost',
    hmr: true,
  },
  build: {
    target: 'es2020',
    minify: true,
    sourcemap: false,
  },
  plugins: [],
});
```

## Types

### Signal

```typescript
interface Signal<T> {
  value: T;
  peek(): T;
}
```

### Route

```typescript
interface Route {
  path: string;
  pattern: RegExp;
  module: () => Promise<any>;
  layout?: () => Promise<any>;
  isSSR?: boolean;
}

interface RouteMatch {
  route: Route;
  params: Record<string, string>;
  query: Record<string, string>;
}
```

### Island

```typescript
interface IslandMetadata {
  id: string;
  name: string;
  props: Record<string, any>;
  hydrationData: string;
}

interface MountedIsland {
  id: string;
  el: Element;
  signals: Map<string, Signal<any>>;
}
```

### Plugin

```typescript
interface Plugin {
  name: string;
  version?: string;
  apply?: 'pre' | 'post' | 'normal';
  
  beforeCompile?: BeforeCompileHook;
  afterCompile?: AfterCompileHook;
  transform?: TransformHook;
  resolveId?: ResolveIdHook;
  load?: LoadHook;
  beforeBuild?: (ctx: PluginContext) => void;
  afterBuild?: (ctx: PluginContext) => void;
  beforeSSR?: (html: string, ctx: PluginContext) => string;
  afterSSR?: (html: string, ctx: PluginContext) => string;
  hmrUpdate?: (moduleId: string, ctx: PluginContext) => void;
}

interface PluginContext {
  env: 'dev' | 'prod';
  command: 'serve' | 'build';
  config: Record<string, any>;
}
```
