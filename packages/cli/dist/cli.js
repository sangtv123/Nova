#!/usr/bin/env node
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { build as esbuildBuild } from 'esbuild';
import { compile } from '@nova/compiler';
import { Watcher, HMRHandler } from '@nova/server';
const scssCache = new Map();
function compileScssWithCache(filePath) {
    const stats = fs.statSync(filePath);
    const cached = scssCache.get(filePath);
    if (cached && cached.mtime === stats.mtimeMs) {
        return cached.css;
    }
    const css = execSync(`npx -y sass "${filePath}" --no-source-map --style=compressed`).toString();
    scssCache.set(filePath, { mtime: stats.mtimeMs, css });
    return css;
}
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
function scanIslands(projectDir) {
    const islandsDir = path.join(projectDir, 'src/islands');
    if (!fs.existsSync(islandsDir))
        return [];
    return fs.readdirSync(islandsDir)
        .filter(f => f.endsWith('.tsx') || f.endsWith('.ts'))
        .map(f => ({
        name: f.replace(/\.(tsx?|ts)$/, '').toLowerCase(),
        importPath: `./islands/${f.replace(/\.(tsx?|ts)$/, '')}`
    }));
}
/**
 * Scan src/pages for file-based routing with nested layouts
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
        .filter(f => (f.endsWith('.tsx') || f.endsWith('.ts')) && !f.includes('layout.'))
        .map(f => {
        const rel = path.relative(pagesDir, f).replace(/\\/g, '/');
        const routePath = `pages/${rel}`;
        const importPath = `./pages/${rel.replace(/\.(tsx?|ts)$/, '')}`;
        // Find layouts in the hierarchy
        const layouts = [];
        let currentDir = path.dirname(f);
        while (currentDir.startsWith(pagesDir)) {
            const layoutPath = path.join(currentDir, 'layout.tsx');
            if (fs.existsSync(layoutPath)) {
                const relLayout = path.relative(pagesDir, layoutPath).replace(/\\/g, '/');
                layouts.unshift(`./pages/${relLayout.replace(/\.tsx$/, '')}`);
            }
            currentDir = path.dirname(currentDir);
        }
        return { path: routePath, importPath, layouts };
    });
}
import { loadConfig } from './config.js';
import { PluginManager } from '@nova/plugins';
async function dev(args) {
    const config = loadConfig();
    const port = config.server?.port || parseInt(args[0] || '3000');
    const middlewares = config.server?.middlewares || [];
    const pluginManager = new PluginManager();
    (config.plugins || []).forEach((p) => pluginManager.use(p));
    const ctx = {
        env: 'dev',
        command: 'serve',
        config: config
    };
    const novaPlugin = createNovaPlugin(pluginManager, ctx);
    const handleRequest = async (req, res) => {
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
              if (data.type === 'hmr:reload') location.reload();
              if (data.type === 'hmr:update') {
                console.log("[HMR] Updating module:", data.moduleId);
                // Implementation of hot swapping would go here
                location.reload(); // Fallback for now
              }
            };`;
                    }
                    res.writeHead(200, { 'Content-Type': 'application/javascript' });
                    res.end(code);
                    return;
                }
            }
            // 3. Handle SCSS compilation on the fly
            if (requestUrl.endsWith('.scss')) {
                const fullPath = path.join(projectDir, requestUrl.startsWith('/') ? requestUrl.slice(1) : requestUrl);
                if (fs.existsSync(fullPath)) {
                    try {
                        const { execSync } = await import('child_process');
                        console.log(`[nova/sass] Compiling ${requestUrl}...`);
                        // Use npx -y sass to ensure it installs if missing without prompting
                        const css = execSync(`npx -y sass "${fullPath}" --no-source-map`).toString();
                        res.writeHead(200, { 'Content-Type': 'text/css' });
                        res.end(css);
                        return;
                    }
                    catch (err) {
                        console.error('[nova/sass] Compilation failed:', err.message);
                        res.writeHead(500);
                        res.end(`SCSS Error: ${err.message}`);
                        return;
                    }
                }
            }
            // 4. Static Assets & SPA Fallback
            let filePath = path.join(projectDir, requestUrl === '/' ? 'index.html' : requestUrl.slice(1));
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
                    '.scss': 'text/css',
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
    };
    const server = createServer(async (req, res) => {
        let index = 0;
        const next = async () => {
            if (index < middlewares.length) {
                const mw = middlewares[index++];
                mw(req, res, next);
            }
            else {
                await handleRequest(req, res);
            }
        };
        await next();
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
        if (filename.endsWith('.tsx') || filename.endsWith('.ts')) {
            hmrHandler.broadcastUpdate(filename, ''); // Signaling update
        }
        else {
            hmrHandler.broadcastReload();
        }
    });
    server.listen(port, () => {
        console.log(`🚀 Nova dev server running on http://localhost:${port}`);
        console.log('📝 Edit files to see changes instantly');
        console.log('💫 HMR enabled for fast refresh');
    });
}
import { createBuilder } from '@nova/builder';
async function build(args) {
    console.log('📦 Building Nova app...');
    const config = loadConfig();
    const pluginManager = new PluginManager();
    (config.plugins || []).forEach((p) => pluginManager.use(p));
    const ctx = { env: 'prod', command: 'build', config };
    try {
        const builder = createBuilder({
            entry: path.join(process.cwd(), 'src/main.tsx'),
            outDir: path.join(process.cwd(), 'dist'),
            minify: true,
            analyze: true,
            plugins: [createNovaPlugin(pluginManager, ctx)]
        });
        await builder.build();
        // Copy and transform index.html
        const indexPath = path.join(process.cwd(), 'index.html');
        if (fs.existsSync(indexPath)) {
            let html = fs.readFileSync(indexPath, 'utf8');
            html = html.replace('/src/main.tsx', '/main.js');
            html = html.replace('/src/styles.scss', '/styles.css');
            fs.writeFileSync(path.join(process.cwd(), 'dist', 'index.html'), html);
        }
        // Copy public directory if exists
        const publicDir = path.join(process.cwd(), 'public');
        if (fs.existsSync(publicDir)) {
            console.log('📂 Copying static assets from public/ to dist/...');
            fs.cpSync(publicDir, path.join(process.cwd(), 'dist'), { recursive: true });
        }
        // Compile global styles
        const stylesPath = path.join(process.cwd(), 'src', 'styles.scss');
        if (fs.existsSync(stylesPath)) {
            console.log('🎨 Compiling global styles (with cache)...');
            const css = compileScssWithCache(stylesPath);
            fs.writeFileSync(path.join(process.cwd(), 'dist', 'styles.css'), css);
        }
        console.log('✅ Build complete. You can serve the app using: npx serve dist');
    }
    catch (err) {
        console.error('❌ Build failed:', err);
        process.exit(1);
    }
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
export function createNovaPlugin(pluginManager, ctx) {
    return {
        name: 'nova',
        setup(build) {
            // Handle SCSS imports within JS/TSX
            build.onResolve({ filter: /\.scss$/ }, (args) => {
                return { path: path.resolve(args.resolveDir, args.path), namespace: 'scss-inline' };
            });
            build.onLoad({ filter: /.*/, namespace: 'scss-inline' }, async (args) => {
                try {
                    const css = compileScssWithCache(args.path);
                    const js = `
            if (typeof document !== 'undefined') {
              const style = document.createElement('style');
              style.setAttribute('data-nova-style', '${path.basename(args.path)}');
              style.textContent = ${JSON.stringify(css)};
              document.head.appendChild(style);
            }
          `;
                    return { contents: js, loader: 'js' };
                }
                catch (err) {
                    console.error('[nova/sass] Inline compilation failed:', err.message);
                    return { contents: '', loader: 'js' };
                }
            });
            // Mark @nova/* as external in dev, or resolve to local source in prod
            build.onResolve({ filter: /^@nova\// }, (args) => {
                if (ctx.env === 'dev') {
                    return { path: `/@framework/${args.path}`, external: true };
                }
                // Prod: resolve directly to the monorepo package source
                const pkgName = args.path.replace('@nova/', '');
                return { path: path.resolve(process.cwd(), `../packages/${pkgName}/src/index.ts`) };
            });
            build.onLoad({ filter: /\.tsx?$/ }, async (args) => {
                let source = fs.readFileSync(args.path, 'utf8');
                // 1. Run beforeCompile hooks
                source = await pluginManager.runHook('beforeCompile', source, ctx);
                // Auto-inject createElement import for JSX
                if (args.path.endsWith('.tsx') && !source.includes('createElement') && !source.includes('Fragment')) {
                    source = `import { createElement, Fragment } from '@nova/runtime';\n${source}`;
                }
                // Auto-inject routes into the main entry point
                if (args.path.toLowerCase().endsWith('main.tsx')) {
                    const [pages, islands] = await Promise.all([
                        Promise.resolve(scanPages(process.cwd())),
                        Promise.resolve(scanIslands(process.cwd()))
                    ]);
                    const routeCode = pages
                        .map(p => `router.registerRoute('${p.path}', () => import('${p.importPath}'), [${p.layouts.map(l => `() => import('${l}')`).join(', ')}]);`)
                        .join('\n');
                    const islandCode = islands
                        .map(i => `registerIsland('${i.name}', () => import('${i.importPath}'));`)
                        .join('\n');
                    // Robust import injection for main.tsx
                    const ensureImport = (pkg, identifier) => {
                        const regex = new RegExp(`import\\s+\\{([^}]*)\\}\\s+from\\s+['"]${pkg}['"]`);
                        const match = source.match(regex);
                        if (match) {
                            const imports = match[1].split(',').map(i => i.trim());
                            if (!imports.includes(identifier)) {
                                const newImports = [...imports, identifier].join(', ');
                                source = source.replace(match[0], `import { ${newImports} } from '${pkg}'`);
                            }
                        }
                        else if (!source.includes(pkg)) {
                            source = `import { ${identifier} } from '${pkg}';\n${source}`;
                        }
                    };
                    ensureImport('@nova/router', 'router');
                    ensureImport('@nova/islands', 'registerIsland');
                    if (source.includes('router.init()')) {
                        source = source.replace('router.init()', `\n// Auto-routing\n${routeCode}\n\n// Auto-islands\n${islandCode}\n\nrouter.init()`);
                    }
                    else {
                        source += `\n\n// Auto-routing\n${routeCode}\n\n// Auto-islands\n${islandCode}`;
                    }
                }
                // 2. Run transform hooks
                source = await pluginManager.runHook('transform', source, ctx);
                const compiled = await compile(source, { filename: args.path, isDev: ctx.env === 'dev' });
                // 3. Run afterCompile hooks
                let code = compiled.code;
                code = await pluginManager.runHook('afterCompile', code, ctx);
                return { contents: code, loader: 'tsx' };
            });
        },
    };
}
//# sourceMappingURL=cli.js.map