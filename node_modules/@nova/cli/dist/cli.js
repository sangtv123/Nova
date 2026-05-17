#!/usr/bin/env node
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { context as esbuildContext, transform as esbuildTransform } from 'esbuild';
import { compile } from '@nova/compiler';
import { Watcher, HMRHandler } from '@nova/server';
const scssCache = new Map();
// Per-file transpile cache (transpile-only mode — no bundling in dev)
const transpileCache = new Map();
// Persistent esbuild contexts for @nova/* framework packages (bundled once, kept alive)
const esbuildContexts = new Map();
async function incrementalBuild(entryPoint, buildOptions) {
    if (!esbuildContexts.has(entryPoint)) {
        const ctx = await esbuildContext({ ...buildOptions, write: false });
        esbuildContexts.set(entryPoint, ctx);
    }
    const ctx = esbuildContexts.get(entryPoint);
    const result = await ctx.rebuild();
    return result.outputFiles[0].text;
}
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
    const config = await loadConfig();
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
            // 1. Handle shared framework modules (incremental esbuild context — fast on F5)
            if (requestUrl.startsWith('/@framework/@nova/')) {
                const pkgName = requestUrl.split('/').pop() || '';
                const fullPath = path.resolve(projectDir, `../packages/${pkgName}/src/index.ts`);
                if (fs.existsSync(fullPath)) {
                    const code = await incrementalBuild(fullPath, {
                        entryPoints: [fullPath],
                        bundle: true,
                        format: 'esm',
                        plugins: [novaPlugin],
                        define: { 'process.env.NODE_ENV': '"development"' },
                    });
                    res.writeHead(200, { 'Content-Type': 'application/javascript' });
                    res.end(code);
                    return;
                }
            }
            // 2. Handle TSX/TS files — transpile-only, per-file mtime cache, browser handles ESM imports
            let fullPath = path.join(projectDir, requestUrl.startsWith('/') ? requestUrl.slice(1) : requestUrl);
            // Resolve extensionless imports (e.g. import './Counter' -> ./Counter.tsx)
            if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
                if (fs.existsSync(fullPath + '.tsx'))
                    fullPath += '.tsx';
                else if (fs.existsSync(fullPath + '.ts'))
                    fullPath += '.ts';
                else if (fs.existsSync(fullPath + '/index.tsx'))
                    fullPath += '/index.tsx';
                else if (fs.existsSync(fullPath + '/index.ts'))
                    fullPath += '/index.ts';
            }
            if (fullPath.match(/\.(tsx?|ts)$/) || requestUrl === '/src/main.tsx') {
                if (fs.existsSync(fullPath)) {
                    // Serve from cache if file unchanged
                    const mtime = fs.statSync(fullPath).mtimeMs;
                    const cached = transpileCache.get(fullPath);
                    if (cached && cached.mtime === mtime) {
                        res.writeHead(200, { 'Content-Type': 'application/javascript' });
                        res.end(cached.code);
                        return;
                    }
                    // Nova compiler pipeline (same logic as esbuild onLoad, but without bundling)
                    let source = fs.readFileSync(fullPath, 'utf8');
                    source = await pluginManager.runHook('beforeCompile', source, ctx);
                    if (fullPath.endsWith('.tsx') && !source.includes('createElement') && !source.includes('Fragment')) {
                        source = `import { createElement, Fragment } from '@nova/runtime';\n${source}`;
                    }
                    const isMain = fullPath.toLowerCase().endsWith('main.tsx');
                    if (isMain) {
                        const pages = scanPages(projectDir);
                        const islands = scanIslands(projectDir);
                        const customPipes = config.customPipes || [];
                        const routeCode = pages.map(p => `router.registerRoute('${p.path}', () => import('${p.importPath}'), [${p.layouts.map((l) => `() => import('${l}')`).join(', ')}]);`).join('\n');
                        const islandCode = islands.map((i) => `registerIsland('${i.name}', () => import('${i.importPath}'));`).join('\n');
                        const pipeImports = customPipes.map(p => `import { ${p}Pipe } from './pipes/${p}';`).join('\n');
                        const pipeCode = customPipes.map(p => `registerPipe(${p}Pipe);`).join('\n');
                        const ensureImport = (pkg, id) => {
                            const m = source.match(new RegExp(`import\\s+\\{([^}]*)\\}\\s+from\\s+['"]${pkg.replace('/', '\\/')}['"]`));
                            if (m) {
                                const ids = m[1].split(',').map((s) => s.trim());
                                if (!ids.includes(id))
                                    source = source.replace(m[0], `import { ${[...ids, id].join(', ')} } from '${pkg}'`);
                            }
                            else if (!source.includes(`'${pkg}'`) && !source.includes(`"${pkg}"`))
                                source = `import { ${id} } from '${pkg}';\n${source}`;
                        };
                        ensureImport('@nova/router', 'router');
                        ensureImport('@nova/islands', 'registerIsland');
                        if (customPipes.length > 0) {
                            ensureImport('@nova/signals', 'registerPipe');
                            source = `${pipeImports}\n${source}`;
                        }
                        const injection = `\n// Auto-routing\n${routeCode}\n// Auto-islands\n${islandCode}\n// Auto-pipes\n${pipeCode}`;
                        source = source.includes('router.init()') ? source.replace('router.init()', injection + '\nrouter.init()') : source + injection;
                    }
                    // Auto-inject custom pipe factories
                    const customPipesAll = config.customPipes || [];
                    if (customPipesAll.length > 0 && !isMain) {
                        const pipesDir = path.join(projectDir, 'src', 'pipes');
                        const fileDir = path.dirname(fullPath);
                        const injections = [];
                        for (const pipeName of customPipesAll) {
                            if (!new RegExp(`\\b${pipeName}\\s*[\\(|]`).test(source) || source.includes(`_${pipeName}PipeDef`))
                                continue;
                            let rel = path.relative(fileDir, path.join(pipesDir, pipeName)).replace(/\\/g, '/');
                            if (!rel.startsWith('.'))
                                rel = `./${rel}`;
                            injections.push(`import { ${pipeName}Pipe as _${pipeName}PipeDef } from '${rel}';`);
                            injections.push(`const ${pipeName} = (...args: any[]) => (val: any) => _${pipeName}PipeDef.transform(val, ...args);`);
                        }
                        if (injections.length > 0)
                            source = `// [Nova] Auto-injected pipes\n${injections.join('\n')}\n${source}`;
                    }
                    source = await pluginManager.runHook('transform', source, ctx);
                    const compiled = await compile(source, { filename: fullPath, isDev: true, customPipes: config.customPipes });
                    let code = compiled.code;
                    code = await pluginManager.runHook('afterCompile', code, ctx);
                    if (fullPath.endsWith('.tsx') && code.includes('resolvePipe') && !/import\s+{[^}]*\bresolvePipe\b/.test(code)) {
                        code = `import { resolvePipe } from '@nova/signals';\n${code}`;
                    }
                    // Transpile TSX/TS → ESM JS (no bundling — browser handles module graph)
                    const transpiled = await esbuildTransform(code, {
                        loader: 'tsx',
                        format: 'esm',
                        jsxFactory: 'createElement',
                        jsxFragment: 'Fragment',
                        target: 'es2020',
                        sourcefile: fullPath,
                    });
                    let js = transpiled.code;
                    // Rewrite @nova/* → /@framework/@nova/* so browser ESM can load them
                    js = js.replace(/(from\s+['"])@nova\//g, '$1/@framework/@nova/');
                    js = js.replace(/(import\s+['"])@nova\//g, '$1/@framework/@nova/');
                    if (isMain) {
                        js += `\nconsole.log('[HMR] Connected');\nconst _hmrSock = new WebSocket('ws://' + location.host);\n_hmrSock.onmessage = (e) => { const d = JSON.parse(e.data); if (d.type === 'hmr:reload' || d.type === 'hmr:update') location.reload(); };`;
                    }
                    transpileCache.set(fullPath, { mtime, code: js });
                    res.writeHead(200, { 'Content-Type': 'application/javascript' });
                    res.end(js);
                    return;
                }
            }
            // 3. Handle SCSS — cached via compileScssWithCache (mtime-based)
            if (requestUrl.endsWith('.scss') || requestUrl.endsWith('.css')) {
                const fullPath = path.join(projectDir, requestUrl.startsWith('/') ? requestUrl.slice(1) : requestUrl);
                if (fs.existsSync(fullPath)) {
                    try {
                        const isScss = fullPath.endsWith('.scss');
                        const css = isScss ? compileScssWithCache(fullPath) : fs.readFileSync(fullPath, 'utf8');
                        // If requested via ES module import, return JS wrapper to satisfy strict MIME type
                        const dest = req.headers['sec-fetch-dest'];
                        if (dest === 'script' || dest === 'empty') {
                            const js = `
                if (typeof document !== 'undefined') {
                  const style = document.createElement('style');
                  style.setAttribute('data-nova-style', '${path.basename(fullPath)}');
                  style.textContent = ${JSON.stringify(css)};
                  document.head.appendChild(style);
                }
              `;
                            res.writeHead(200, { 'Content-Type': 'application/javascript' });
                            res.end(js);
                        }
                        else {
                            res.writeHead(200, { 'Content-Type': 'text/css' });
                            res.end(css);
                        }
                    }
                    catch (err) {
                        console.error('[nova/sass] Compilation failed:', err.message);
                        res.writeHead(500);
                        res.end(`SCSS Error: ${err.message}`);
                    }
                    return;
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
                let content = fs.readFileSync(filePath, 'utf8');
                if (filePath.endsWith('index.html')) {
                    content = await pluginManager.runHook('afterSSR', content, ctx);
                }
                res.end(content);
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
        if (filename.endsWith('.tsx') || filename.endsWith('.ts')) {
            // Invalidate per-file transpile cache for changed file
            transpileCache.delete(filename);
            for (const key of transpileCache.keys()) {
                if (key.replace(/\\/g, '/').endsWith(filename.replace(/\\/g, '/'))) {
                    transpileCache.delete(key);
                }
            }
            console.log(`[HMR] ${path.basename(filename)} changed — cache cleared`);
            hmrHandler.broadcastUpdate(filename, '');
        }
        else if (filename.endsWith('.scss')) {
            scssCache.delete(filename);
            hmrHandler.broadcastReload();
        }
        else {
            hmrHandler.broadcastReload();
        }
    });
    server.listen(port, async () => {
        console.log(`🚀 Nova dev server running on http://localhost:${port}`);
        // Pre-warm @nova/* framework bundles in background so first request is instant
        const pkgs = ['signals', 'runtime', 'islands', 'router', 'motion', 'store', 'http', 'forms'];
        const warmOpts = { bundle: true, format: 'esm', plugins: [novaPlugin], define: { 'process.env.NODE_ENV': '"development"' } };
        const projectDir = process.cwd();
        Promise.all(pkgs.map(pkg => {
            const p = path.resolve(projectDir, `../packages/${pkg}/src/index.ts`);
            return fs.existsSync(p) ? incrementalBuild(p, { entryPoints: [p], ...warmOpts }).catch(() => { }) : Promise.resolve();
        })).then(() => console.log('✅ @nova/* packages pre-warmed'));
        console.log('💫 Transpile-only mode — each file: ~5ms, F5: instant from cache');
    });
}
import { createBuilder } from '@nova/builder';
async function build(args) {
    console.log('📦 Building Nova app...');
    const config = await loadConfig();
    const pluginManager = new PluginManager();
    (config.plugins || []).forEach((p) => pluginManager.use(p));
    const ctx = { env: 'prod', command: 'build', config };
    try {
        // Kích hoạt hook beforeBuild trước khi build
        await pluginManager.runHook('beforeBuild', ctx);
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
            // Chạy afterSSR hooks khi biên dịch/đóng gói index.html
            html = await pluginManager.runHook('afterSSR', html, ctx);
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
        // Kích hoạt hook afterBuild sau khi build xong
        await pluginManager.runHook('afterBuild', ctx);
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
                    const customPipes = ctx.config.customPipes || [];
                    const pipeImports = customPipes
                        .map(p => `import { ${p}Pipe } from './pipes/${p}';`)
                        .join('\n');
                    const pipeCode = customPipes
                        .map(p => `registerPipe(${p}Pipe);`)
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
                    if (customPipes.length > 0) {
                        ensureImport('@nova/signals', 'registerPipe');
                        source = `${pipeImports}\n${source}`;
                    }
                    if (source.includes('router.init()')) {
                        source = source.replace('router.init()', `\n// Auto-routing\n${routeCode}\n\n// Auto-islands\n${islandCode}\n\n// Auto-pipes\n${pipeCode}\n\nrouter.init()`);
                    }
                    else {
                        source += `\n\n// Auto-routing\n${routeCode}\n\n// Auto-islands\n${islandCode}\n\n// Auto-pipes\n${pipeCode}`;
                    }
                }
                // Auto-inject custom pipe factory functions into any file that references them.
                // This is the "declare once in nova.config.ts, use everywhere" pattern.
                {
                    const customPipes = ctx.config.customPipes || [];
                    if (customPipes.length > 0 && !args.path.toLowerCase().endsWith('main.tsx')) {
                        const projectDir = process.cwd();
                        const pipesDir = path.join(projectDir, 'src', 'pipes');
                        const fileDir = path.dirname(args.path);
                        const injections = [];
                        for (const pipeName of customPipes) {
                            // Only inject if file references this pipe name as a call or in pipe syntax,
                            // and hasn't already imported it from the pipes directory.
                            const isUsed = new RegExp(`\\b${pipeName}\\s*[\\(|]`).test(source);
                            const alreadyImported = source.includes(`_${pipeName}PipeDef`);
                            if (!isUsed || alreadyImported)
                                continue;
                            let relPath = path.relative(fileDir, path.join(pipesDir, pipeName)).replace(/\\/g, '/');
                            if (!relPath.startsWith('.'))
                                relPath = `./${relPath}`;
                            // Inject: import + a local curried factory matching .pipe(exclaim(arg)) usage
                            injections.push(`import { ${pipeName}Pipe as _${pipeName}PipeDef } from '${relPath}';`);
                            injections.push(`const ${pipeName} = (...args: any[]) => (val: any) => _${pipeName}PipeDef.transform(val, ...args);`);
                        }
                        if (injections.length > 0) {
                            source = `// [Nova] Auto-injected pipes (declared in nova.config.ts)\n${injections.join('\n')}\n${source}`;
                        }
                    }
                }
                // 2. Run transform hooks
                source = await pluginManager.runHook('transform', source, ctx);
                const compiled = await compile(source, {
                    filename: args.path,
                    isDev: ctx.env === 'dev',
                    customPipes: ctx.config.customPipes
                });
                // 3. Run afterCompile hooks
                let code = compiled.code;
                code = await pluginManager.runHook('afterCompile', code, ctx);
                // Auto-inject resolvePipe import from @nova/signals if custom pipes are resolved at runtime
                if (args.path.endsWith('.tsx') && code.includes('resolvePipe') && !/import\s+{[^}]*\bresolvePipe\b[^}]*}\s+from\s+['"]@nova\/signals['"]/.test(code)) {
                    code = `import { resolvePipe } from '@nova/signals';\n${code}`;
                }
                return { contents: code, loader: 'tsx' };
            });
        },
    };
}
//# sourceMappingURL=cli.js.map