import { build, transform, analyzeMetafile } from 'esbuild';
import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
// ─── Helpers ─────────────────────────────────────────────────────────────────
/** Human-readable size string */
function fmtBytes(bytes) {
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)} kB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
/** Warn if a chunk exceeds the recommended size */
function warnLargeChunk(fileName, sizeBytes, limitKB = 50) {
    if (sizeBytes > limitKB * 1024) {
        console.warn(`⚠️  ${fileName} is ${fmtBytes(sizeBytes)} — exceeds ${limitKB} kB limit.\n` +
            `   Consider splitting with islands or dynamic imports.`);
    }
}
// ─── Builder ─────────────────────────────────────────────────────────────────
/**
 * esbuild-powered builder — actual tree-shaking, minification and code-splitting.
 */
export class Builder {
    constructor(options) {
        this.options = {
            outDir: 'dist',
            minify: true,
            sourceMap: false,
            ssr: false,
            target: 'es2020',
            analyze: false,
            external: [],
            plugins: [],
            ...options,
        };
    }
    // ── Main bundle ────────────────────────────────────────────────────────────
    /**
     * Build the main application bundle with esbuild.
     * Tree-shaking and code-splitting are enabled by default.
     */
    async buildMain() {
        const entryPoints = typeof this.options.entry === 'string'
            ? [this.options.entry]
            : Object.values(this.options.entry);
        const result = await build({
            entryPoints,
            bundle: true,
            // ESM format enables native code-splitting in the browser
            format: 'esm',
            splitting: true,
            // Real tree-shaking: unused exports are removed
            treeShaking: true,
            minify: this.options.minify,
            minifyWhitespace: this.options.minify,
            minifyIdentifiers: this.options.minify,
            minifySyntax: this.options.minify,
            sourcemap: this.options.sourceMap,
            target: this.options.target,
            outdir: this.options.outDir,
            platform: this.options.ssr ? 'node' : 'browser',
            external: this.options.external,
            plugins: this.options.plugins,
            // metafile lets us generate a bundle analysis report
            metafile: true,
            // Write files directly to outDir
            write: true,
            // Mark Nova packages as external if they're already in the page
            // (useful when islands share the same runtime chunk)
            define: {
                'process.env.NODE_ENV': this.options.minify ? '"production"' : '"development"',
            },
        });
        // Print human-readable analysis
        if (this.options.analyze && result.metafile) {
            await this.printAnalysis(result.metafile);
        }
        // Warn on oversized chunks
        if (result.metafile) {
            for (const [file, info] of Object.entries(result.metafile.outputs)) {
                warnLargeChunk(file, info.bytes);
            }
        }
        // Return first output file content for callers that need the string
        const outputs = Object.entries(result.metafile?.outputs ?? {});
        const mainOutput = outputs.find(([f]) => !f.includes('chunk-')) ?? outputs[0];
        return {
            code: mainOutput ? `/* see ${mainOutput[0]} */` : '',
            fileName: mainOutput?.[0] ?? 'bundle.js',
            metafile: result.metafile,
            modules: result.metafile
                ? Object.fromEntries(Object.entries(result.metafile.outputs).map(([k, v]) => [k, fmtBytes(v.bytes)]))
                : {},
        };
    }
    // ── Island bundles ─────────────────────────────────────────────────────────
    /**
     * Build individual island bundles.
     * Each island is an independent ESM chunk with shared deps extracted automatically.
     */
    async buildIslands(islands) {
        if (islands.length === 0)
            return [];
        const entryPoints = {};
        for (const island of islands) {
            entryPoints[`island-${island.id}`] = island.entry;
        }
        const result = await build({
            entryPoints,
            bundle: true,
            format: 'esm',
            splitting: true, // Shared deps (signals, runtime) extracted once
            treeShaking: true,
            minify: this.options.minify,
            sourcemap: this.options.sourceMap,
            target: this.options.target,
            outdir: this.options.outDir,
            platform: 'browser',
            metafile: true,
            write: true,
            plugins: this.options.plugins,
            define: {
                'process.env.NODE_ENV': this.options.minify ? '"production"' : '"development"',
            },
        });
        const bundles = [];
        for (const island of islands) {
            const fileName = `island-${island.id}.js`;
            const outputInfo = result.metafile?.outputs[join(this.options.outDir, fileName)];
            const sizeBytes = outputInfo?.bytes ?? 0;
            bundles.push({
                id: island.id,
                fileName,
                code: `/* see ${join(this.options.outDir, fileName)} */`,
                size: sizeBytes,
            });
            warnLargeChunk(fileName, sizeBytes, 20); // Islands should be very small
        }
        return bundles;
    }
    // ── Minify (standalone) ────────────────────────────────────────────────────
    /**
     * Minify an arbitrary code string with esbuild (fast, parallel).
     */
    async minify(code) {
        if (!this.options.minify)
            return code;
        const result = await transform(code, {
            minify: true,
            minifyWhitespace: true,
            minifyIdentifiers: true,
            minifySyntax: true,
            target: this.options.target,
        });
        return result.code;
    }
    // ── SSR bundle ────────────────────────────────────────────────────────────
    /**
     * Build a Node.js-compatible SSR bundle.
     * Client-only APIs are replaced with SSR-safe stubs.
     */
    async buildSSR(entry) {
        const result = await build({
            entryPoints: [entry],
            bundle: true,
            format: 'esm',
            treeShaking: true,
            minify: this.options.minify,
            platform: 'node',
            target: 'node18',
            outdir: join(this.options.outDir, 'ssr'),
            metafile: true,
            write: true,
            define: {
                'process.env.NODE_ENV': '"production"',
                // Stub out browser globals for SSR
                'typeof window': '"undefined"',
                'typeof document': '"undefined"',
            },
        });
        return {
            code: '',
            fileName: 'ssr/bundle.js',
            metafile: result.metafile,
            modules: {},
        };
    }
    // ── Bundle analysis ────────────────────────────────────────────────────────
    /**
     * Print a human-readable bundle size report.
     */
    async printAnalysis(metafile) {
        const report = await analyzeMetafile(metafile, { color: true });
        console.log('\n📦 Bundle Analysis\n' + '─'.repeat(60));
        console.log(report);
        // Summary table
        const outputs = metafile.outputs;
        let totalBytes = 0;
        console.log('\n📊 Output Summary:');
        for (const [file, info] of Object.entries(outputs)) {
            const size = info.bytes;
            totalBytes += size;
            const indicator = size > 50 * 1024 ? '🔴' : size > 20 * 1024 ? '🟡' : '🟢';
            console.log(`  ${indicator}  ${file.padEnd(40)} ${fmtBytes(size)}`);
        }
        console.log('─'.repeat(60));
        console.log(`     ${'Total'.padEnd(40)} ${fmtBytes(totalBytes)}\n`);
    }
    /**
     * Write analysis to a JSON file for CI/CD use.
     */
    async saveAnalysis(metafile, outPath = 'dist/bundle-analysis.json') {
        await mkdir(dirname(outPath), { recursive: true });
        await writeFile(outPath, JSON.stringify(metafile, null, 2), 'utf8');
        console.log(`📄 Bundle analysis saved to ${outPath}`);
    }
    // ── Full pipeline ──────────────────────────────────────────────────────────
    /**
     * Run the full build pipeline:
     *   1. Main bundle (with tree-shaking + code splitting)
     *   2. Minification (handled by esbuild inline)
     *   3. SSR build (if enabled)
     *   4. Bundle analysis (if enabled)
     */
    async build() {
        console.log('🔨 Nova build starting…');
        const start = Date.now();
        const main = await this.buildMain();
        if (this.options.ssr && typeof this.options.entry === 'string') {
            await this.buildSSR(this.options.entry);
        }
        if (this.options.analyze && main.metafile) {
            await this.saveAnalysis(main.metafile);
        }
        const elapsed = Date.now() - start;
        console.log(`✅ Build complete in ${elapsed}ms`);
        return main;
    }
}
/**
 * Create a builder instance.
 */
export function createBuilder(options) {
    return new Builder(options);
}
//# sourceMappingURL=index.js.map