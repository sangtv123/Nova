# Nova Framework - Getting Started Guide

Welcome to Nova! This guide will walk you through creating your very first high-performance web application from scratch using the Nova Framework.

---

## 1. Installation & Scaffolding

Use the automated `create-nova` CLI tool to scaffold a pre-configured project:

```bash
npm create nova@latest my-app
cd my-app
npm install
npm run dev
```

Once launched, open your browser to `http://localhost:3000` to see your running application.

---

## 2. Complete Project Architecture

```
my-app/
├── public/                 # Static public assets (favicon.ico, robots.txt...)
├── src/
│   ├── components/         # Reusable UI building blocks (Header, Footer, Layout)
│   ├── islands/            # Interactive client-hydrated Islands (Form, Counter...)
│   ├── pages/              # File-based route modules (/index, /about, /posts...)
│   ├── services/           # Network API Services
│   ├── stores/             # Global state stores (AuthStore, TodoStore...)
│   ├── styles/             # Global SCSS/CSS stylesheets
│   ├── App.tsx             # Root application and routing coordinator
│   ├── main.tsx            # Application entry point
│   └── routes.ts           # Route definitions & protection guards
├── nova.config.ts          # Compiler & development server configuration
├── package.json
└── tsconfig.json
```

---

## 3. Creating Your First Component (with Inline SCSS)

Create `src/components/Welcome.tsx` and `src/components/Welcome.scss`:

```scss
// Welcome.scss
.welcome-card {
  padding: 2rem;
  background: linear-gradient(135deg, #1e1e2f, #252540);
  border-radius: 12px;
  color: #fff;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);

  button {
    background: #00ffcc;
    color: #000;
    font-weight: bold;
    padding: 0.5rem 1.5rem;
    border-radius: 6px;
    border: none;
    cursor: pointer;
  }
}
```

```tsx
// Welcome.tsx
import { signal } from "@nova/signals";
import styles from "./Welcome.scss?inline"; // Import compiled SCSS directly as a string

export function Welcome() {
  const clicks = signal(0);

  return (
    <div class="welcome-card">
      <style>{styles}</style>
      <h2>Welcome to Nova!</h2>
      <p>Button clicked: {clicks.value} times</p>
      <button onClick={() => clicks.value++}>Click Me</button>
    </div>
  );
}
```

---

## 4. Rendering in a Route Page

Open `src/pages/index.tsx` and include the newly created `Welcome` component:

```tsx
import { Welcome } from "../components/Welcome";

export default function HomePage() {
  return (
    <div class="home-page">
      <h1>Home Page</h1>
      <Welcome />
    </div>
  );
}
```

When you save the file, Nova's real-time Hot Module Replacement (HMR) instantly updates the browser UI without losing active component state.

---

## 5. Building for Production

When your application is ready to deploy, run:

```bash
npm run build
```

Nova will compile your TypeScript, bundle and minify your JS and CSS assets, audit bundle sizes using **Bundle Guard**, and output the optimized build to the `dist/` directory. You can deploy this static directory directly to Vercel, Netlify, Nginx, or AWS S3.
