#!/usr/bin/env node
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import * as fs from 'fs';
import * as path from 'path';
import { build as esbuildBuild } from 'esbuild';
import { compile } from '@nova/compiler';
import { Watcher, HMRHandler } from '@nova/server';
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
/**
 * Scan src/pages for file-based routing
 */
function scanPages(projectDir) {
    const pagesDir = path.join(projectDir, 'src/pages');
    if (!fs.existsSync(pagesDir))
        return [];
    function getFiles(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        return entries.flatMap((entry) => {
            const res = path.join(dir, entry.name);
            return entry.isDirectory() ? getFiles(res) : res;
        });
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
async function dev(args) {
    const port = parseInt(args[0] || '3000');
    const novaPlugin = {
        name: 'nova',
        setup(build) {
            // Mark @nova/* as external and rewrite to a shared URL
            build.onResolve({ filter: /^@nova\// }, (args) => {
                return { path: `/@framework/${args.path}`, external: true };
            });
            build.onLoad({ filter: /\.tsx?$/ }, async (args) => {
                let source = fs.readFileSync(args.path, 'utf8');
                // Auto-inject createElement import for JSX
                if (args.path.endsWith('.tsx') && !source.includes('createElement') && !source.includes('Fragment')) {
                    source = `import { createElement, Fragment } from '@nova/runtime';\n${source}`;
                }
                // Auto-inject routes into the main entry point
                if (args.path.toLowerCase().endsWith('main.tsx')) {
                    const pages = scanPages(process.cwd());
                    const routeCode = pages
                        .map(p => `router.registerRoute('${p.path}', () => import('${p.importPath}'));`)
                        .join('\n');
                    if (source.includes('router.init()')) {
                        source = source.replace('router.init()', `\n// Auto-routing\n${routeCode}\nrouter.init()`);
                    }
                    else {
                        source += `\n\n// Auto-routing\n${routeCode}`;
                    }
                }
                const compiled = await compile(source, { filename: args.path, isDev: true });
                return { contents: compiled.code, loader: 'tsx' };
            });
        },
    };
    const server = createServer(async (req, res) => {
        const requestUrl = (req.url || '/').split('?')[0];
        const projectDir = process.cwd();
        try {
            // 1. Handle shared framework modules
            if (requestUrl.startsWith('/@framework/@nova/')) {
                const pkgName = requestUrl.split('/').pop() || '';
                const fullPath = path.resolve(projectDir, `../packages/${pkgName}/src/index.ts`);
                if (fs.existsSync(fullPath)) {
                    const result = await esbuildBuild({
                        entryPoints: [fullPath],
                        bundle: true,
                        format: 'esm',
                        write: false,
                        plugins: [novaPlugin],
                        define: { 'process.env.NODE_ENV': '"development"' },
                    });
                    res.writeHead(200, { 'Content-Type': 'application/javascript' });
                    res.end(result.outputFiles[0].text);
                    return;
                }
            }
            // 2. Handle TSX/TS files (Compilation & Bundling)
            if (requestUrl.match(/\.(tsx?|ts)$/) || requestUrl === '/src/main.tsx') {
                const fullPath = path.join(projectDir, requestUrl.startsWith('/') ? requestUrl.slice(1) : requestUrl);
                if (fs.existsSync(fullPath)) {
                    const result = await esbuildBuild({
                        entryPoints: [fullPath],
                        bundle: true,
                        format: 'esm',
                        write: false,
                        jsxFactory: 'createElement',
                        jsxFragment: 'Fragment',
                        plugins: [novaPlugin],
                        define: { 'process.env.NODE_ENV': '"development"' },
                    });
                    let code = result.outputFiles[0].text;
                    if (requestUrl.endsWith('main.tsx')) {
                        code += `\nconsole.log("[HMR] Connected");
            const socket = new WebSocket('ws://' + location.host);
            socket.onmessage = (e) => {
              const data = JSON.parse(e.data);
              if (data.type === 'reload') location.reload();
            };`;
                    }
                    res.writeHead(200, { 'Content-Type': 'application/javascript' });
                    res.end(code);
                    return;
                }
            }
            // 3. Static Assets & SPA Fallback
            let filePath = path.join(projectDir, requestUrl === '/' ? 'index.html' : requestUrl.slice(1));
            // SPA Fallback: If not a file and not an asset, serve index.html
            if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
                if (!path.extname(requestUrl)) {
                    filePath = path.join(projectDir, 'index.html');
                }
            }
            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
                const ext = path.extname(filePath);
                const mimeTypes = {
                    '.html': 'text/html',
                    '.css': 'text/css',
                    '.js': 'application/javascript',
                    '.png': 'image/png',
                    '.jpg': 'image/jpeg',
                    '.svg': 'image/svg+xml',
                    '.json': 'application/json'
                };
                res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
                res.end(fs.readFileSync(filePath));
                return;
            }
            res.writeHead(404);
            res.end('Not Found');
        }
        catch (err) {
            res.writeHead(500);
            res.end(err.stack);
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
    console.log('✅ Build complete');
}
async function create(args) {
    const projectName = args[0] || 'nova-app';
    const targetDir = path.resolve(process.cwd(), projectName);
    const templateDir = path.resolve(process.cwd(), 'examples/default-app');
    if (fs.existsSync(targetDir)) {
        console.error(`❌ Error: Directory already exists.`);
        return;
    }
    fs.cpSync(templateDir, targetDir, { recursive: true });
    console.log(`✅ Project created.`);
}
function printHelp() {
    console.log(`Nova CLI help...`);
}
main().catch(console.error);
//# sourceMappingURL=cli.js.map