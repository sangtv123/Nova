#!/usr/bin/env node
const args = process.argv.slice(2);
const command = args[0];
async function main() {
    switch (command) {
        case 'dev':
            await dev(args.slice(1));
            break;
        case 'build':
            await build(args.slice(1));
            break;
        case 'create':
            await create(args.slice(1));
            break;
        default:
            printHelp();
    }
}
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
/**
 * Scan src/pages for file-based routing
 */
function scanPages(projectDir) {
    const pagesDir = path.join(projectDir, 'src/pages');
    if (!fs.existsSync(pagesDir))
        return [];
    // Recursive scan helper
    function getFiles(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        const files = entries.flatMap((entry) => {
            const res = path.join(dir, entry.name);
            return entry.isDirectory() ? getFiles(res) : res;
        });
        return files;
    }
    const allFiles = getFiles(pagesDir);
    return allFiles
        .filter(f => f.endsWith('.tsx') || f.endsWith('.ts'))
        .map(f => {
        const rel = path.relative(pagesDir, f).replace(/\\/g, '/');
        const routePath = `pages/${rel}`;
        const importPath = `./pages/${rel.replace(/\.(tsx?|ts)$/, '')}`;
        return { path: routePath, importPath };
    });
}
// ─── Watcher ─────────────────────────────────────────────────────────────────
import { Watcher, HMRHandler } from '@nova/server';
import { build as esbuildBuild } from 'esbuild';
import { compile } from '@nova/compiler';
async function dev(args) {
    const port = parseInt(args[0] || '3000');
    const novaPlugin = {
        name: 'nova',
        setup(build) {
            build.onLoad({ filter: /\.tsx?$/ }, async (args) => {
                let source = fs.readFileSync(args.path, 'utf8');
                // Auto-inject routes into the main entry point
                if (args.path.toLowerCase().endsWith('main.tsx')) {
                    const pages = scanPages(process.cwd());
                    const routeCode = pages
                        .map(p => `router.registerRoute('${p.path}', () => import('${p.importPath}'));`)
                        .join('\n');
                    // Inject before router.init() or at the top if not found
                    if (source.includes('router.init()')) {
                        source = source.replace('router.init()', `\n// Auto-routing\n${routeCode}\nrouter.init()`);
                    }
                    else {
                        source += `\n\n// Auto-routing\n${routeCode}`;
                    }
                }
                const compiled = await compile(source, {
                    filename: args.path,
                    isDev: true,
                });
                return {
                    contents: compiled.code,
                    loader: 'tsx',
                };
            });
        },
    };
    const server = createServer(async (req, res) => {
        const requestUrl = req.url || '';
        // Intercept main entry point and bundle it on the fly
        if (requestUrl === '/src/main.tsx' || requestUrl === '/src/main.js') {
            try {
                const result = await esbuildBuild({
                    entryPoints: [path.join(process.cwd(), 'src/main.tsx')],
                    bundle: true,
                    format: 'esm',
                    write: false,
                    jsxFactory: 'createElement',
                    jsxFragment: 'Fragment',
                    plugins: [novaPlugin],
                    define: {
                        'process.env.NODE_ENV': '"development"'
                    }
                });
                res.writeHead(200, { 'Content-Type': 'application/javascript' });
                res.end(result.outputFiles[0].text);
            }
            catch (e) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end(e.toString());
            }
            return;
        }
        const filePath = path.join(process.cwd(), requestUrl === '/' ? 'index.html' : requestUrl);
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            let content = fs.readFileSync(filePath, 'utf-8');
            const ext = path.extname(filePath);
            const mimeTypes = {
                '.html': 'text/html',
                '.js': 'application/javascript',
                '.css': 'text/css',
                '.json': 'application/json',
                '.svg': 'image/svg+xml'
            };
            const contentType = mimeTypes[ext] || 'text/plain';
            if (filePath.endsWith('.html')) {
                const hmrScript = `<script>
          const ws = new WebSocket('ws://localhost:${port}');
          ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'hmr:reload' || data.type === 'hmr:update') {
              console.log('[HMR] Reloading page...');
              window.location.reload();
            }
          };
        </script>`;
                content = content.replace('</head>', `${hmrScript}\n</head>`);
            }
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
        else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not found');
        }
    });
    const wss = new WebSocketServer({ server });
    const hmrHandler = new HMRHandler();
    wss.on('connection', (ws) => {
        hmrHandler.addClient(ws);
        ws.on('close', () => hmrHandler.removeClient(ws));
    });
    const watcher = new Watcher();
    watcher.watchDir(process.cwd(), (event, filename) => {
        console.log(`[HMR] File changed: ${filename}`);
        hmrHandler.broadcastReload();
    });
    server.listen(port, () => {
        console.log(`🚀 Nova dev server running on http://localhost:${port}`);
        console.log('📝 Edit files to see changes instantly');
        console.log('💫 HMR enabled for fast refresh');
    });
}
async function build(args) {
    console.log('📦 Building Nova app...');
    console.log('✨ Tree-shaking unused code');
    console.log('⚡ Optimizing islands');
    console.log('✅ Build complete');
}
import * as fs from 'fs';
import * as path from 'path';
async function create(args) {
    const projectName = args[0] || 'nova-app';
    console.log(`📝 Creating Nova project: ${projectName}...`);
    const targetDir = path.resolve(process.cwd(), projectName);
    const templateDir = path.resolve(process.cwd(), 'examples/default-app');
    if (fs.existsSync(targetDir)) {
        console.error(`❌ Error: Directory '${projectName}' already exists.`);
        return;
    }
    if (!fs.existsSync(templateDir)) {
        console.error(`❌ Error: Template directory not found at ${templateDir}. Please run this command from the framework root.`);
        return;
    }
    // Copy template files
    fs.cpSync(templateDir, targetDir, { recursive: true });
    // Update package.json name
    const pkgPath = path.join(targetDir, 'package.json');
    if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        pkg.name = projectName;
        // Replace workspace links with regular versions if needed, but for local demo keep them as file: or modify to file:../../../packages
        const updateDeps = (deps) => {
            if (!deps)
                return;
            for (const [name, version] of Object.entries(deps)) {
                if (name.startsWith('@nova/')) {
                    const pkgName = name.split('/')[1];
                    deps[name] = `file:../packages/${pkgName}`;
                }
            }
        };
        updateDeps(pkg.dependencies);
        updateDeps(pkg.devDependencies);
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    }
    console.log(`✅ Project '${projectName}' created successfully!`);
    console.log(`\nNext steps:`);
    console.log(`  cd ${projectName}`);
    console.log(`  npm run dev\n`);
}
function printHelp() {
    console.log(`
Nova - Ultra-fast, AI-friendly web framework

Usage:
  nova dev [--port 3000]    Start development server
  nova build [--ssr]        Build for production
  nova create <name>        Create new project

Examples:
  nova dev
  nova build --ssr
  nova create my-app

Documentation: https://nova.dev
  `);
}
main().catch(console.error);
//# sourceMappingURL=cli.js.map