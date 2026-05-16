# Nova - Getting Started Guide

## Installation

```bash
npm create nova@latest my-app
cd my-app
npm install
npm run dev
```

## Your First Component

Create `src/App.tsx`:

```typescript
import { signal } from '@nova/signals';

export default function App() {
  const count = signal(0);

  return (
    <div class="container">
      <h1>Nova App</h1>
      <p>Count: {count.value}</p>
      <button onClick={() => count.value++}>
        Increment
      </button>
      <button onClick={() => count.value = 0}>
        Reset
      </button>
    </div>
  );
}
```

## Project Structure

```
my-app/
├── src/
│   ├── pages/           # File-based routes
│   │   ├── index.tsx    # Home page (/)
│   │   ├── about.tsx    # About page (/about)
│   │   └── posts/
│   │       └── [id].tsx # Dynamic route (/posts/:id)
│   ├── components/      # Reusable components
│   ├── lib/            # Utilities
│   └── main.ts         # Entry point
├── public/             # Static assets
├── nova.config.ts      # Configuration
└── package.json
```

## Signals Tutorial

Signals are the core of Nova's reactivity:

```typescript
import { signal, computed, effect } from '@nova/signals';

// Create a signal
const name = signal('World');

// Computed value (automatically updated)
const greeting = computed(() => `Hello, ${name.value}!`);

// Side effect (runs when dependencies change)
effect(() => {
  console.log(greeting.value);
});

// Change signal (triggers computed and effect)
name.value = 'Nova'; // Logs: "Hello, Nova!"
```

### Key Methods

- `signal.value` - Get/set value
- `signal.peek()` - Get without dependency
- `computed(() => ...)` - Derived value
- `effect(() => ...)` - Run side effects
- `batch(() => {...})` - Batch updates
- `untrack(() => ...)` - Read without dependency

## Components

Components are functions that return JSX:

```typescript
// Simple component
function Welcome() {
  return <h1>Welcome!</h1>;
}

// With props
function Greeting(props: { name: string; age: number }) {
  return (
    <div>
      <p>{props.name} ({props.age})</p>
    </div>
  );
}

// With children
function Card(props: { title: string; children: any }) {
  return (
    <div class="card">
      <h2>{props.title}</h2>
      {props.children}
    </div>
  );
}

// Interactive component
function Counter() {
  const count = signal(0);

  return (
    <>
      <p>Count: {count.value}</p>
      <button onClick={() => count.value++}>+</button>
      <button onClick={() => count.value--}>-</button>
    </>
  );
}
```

## Routing

Nova uses file-based routing automatically:

```
pages/
├── index.tsx → /
├── about.tsx → /about
└── posts/
    ├── index.tsx → /posts
    └── [id].tsx → /posts/:id
```

In your component, use the router:

```typescript
import { router } from '@nova/router';

export default function Navigation() {
  return (
    <nav>
      <a href="/" onClick={(e) => {
        e.preventDefault();
        router.navigate('/');
      }}>
        Home
      </a>
      <a href="/about" onClick={(e) => {
        e.preventDefault();
        router.navigate('/about');
      }}>
        About
      </a>
    </nav>
  );
}
```

## Islands

Mark components as interactive islands:

```typescript
// Regular server-rendered component
function BlogPost(props: { title: string; content: string }) {
  return (
    <article>
      <h1>{props.title}</h1>
      <div>{props.content}</div>
    </article>
  );
}

// Interactive island
function CommentSection() {
  const comments = signal<string[]>([]);

  return (
    <div>
      <h3>Comments</h3>
      <ul>
        {comments.value.map(c => <li>{c}</li>)}
      </ul>
      <input 
        type="text"
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            comments.value = [...comments.value, e.target.value];
            e.target.value = '';
          }
        }}
      />
    </div>
  );
}

// In your page
export default function Blog() {
  return (
    <>
      <BlogPost title="My Post" content="..." />
      {/* CommentSection is an island - only hydrated on client */}
      <CommentSection />
    </>
  );
}
```

## Server-Side Rendering (SSR)

Enable SSR in `nova.config.ts`:

```typescript
export default defineConfig({
  ssr: true,
});
```

Your components automatically render on the server:

```typescript
// This renders on the server first, then hydrates on client
export default function App() {
  const data = signal(await fetchData()); // Server-side
  return <div>{data.value}</div>;
}
```

## Styling

Use CSS modules or inline styles:

```typescript
// CSS modules
import styles from './Component.module.css';

export function Component() {
  return <div class={styles.container}>Styled</div>;
}

// Inline styles
export function Button() {
  return (
    <button style={{
      color: 'white',
      backgroundColor: '#0066cc',
      padding: '8px 16px',
      border: 'none',
      borderRadius: '4px',
    }}>
      Click me
    </button>
  );
}
```

## Building for Production

```bash
npm run build
```

This:
- Compiles TypeScript
- Optimizes islands
- Splits code automatically
- Minifies bundles
- Generates source maps (if enabled)

The output is in the `dist/` directory.

## Deployment

Deploy the `dist/` directory to any static host:

```bash
# Vercel
vercel deploy

# Netlify
netlify deploy --prod

# GitHub Pages
npm run build
git add dist/
git commit -m "Deploy"
git push origin main
```

## Next Steps

- Explore [examples](../examples)
- Read the [API reference](./api.md)
- Check out [plugins](./plugins.md)
- Join the [community](https://discord.gg/nova)
