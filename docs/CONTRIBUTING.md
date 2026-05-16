# Contributing to Nova

Thank you for your interest in contributing to Nova! This guide will help you get started.

## Development Setup

```bash
# Clone repository
git clone https://github.com/nova-framework/nova.git
cd nova

# Install dependencies
npm install

# Build all packages
npm run build

# Watch mode for development
npm run dev

# Type checking
npm run type-check

# Run tests
npm run test
```

## Project Structure

- **packages/** - Core framework packages
  - **signals/** - Reactivity system
  - **compiler/** - TSX compilation
  - **runtime/** - DOM operations
  - **router/** - File-based routing
  - **islands/** - Island architecture
  - **server/** - Dev server
  - **builder/** - Production build
  - **cli/** - Command-line tool
  - **plugins/** - Plugin system

- **examples/** - Example projects
  - **counter/** - Simple counter
  - **todo-app/** - Todo list with routing

- **docs/** - Documentation

## Working on Packages

Each package is independent and can be developed separately:

```bash
# Build specific package
npm run build -w @nova/signals

# Watch specific package
npm run dev -w @nova/signals

# Type check specific package
npm run type-check -w @nova/compiler
```

## Code Style

Nova follows these conventions:

- **TypeScript** - Strict mode enabled
- **ESM** - Native ES modules only
- **Comments** - JSDoc for public APIs
- **Tests** - Jest for unit tests
- **Formatting** - Prettier (run `npm run format`)

### Example

```typescript
/**
 * Create a reactive signal with initial value
 * 
 * @example
 * const count = signal(0);
 * count.value = 1; // triggers subscribers
 */
export function signal<T>(initialValue: T): Signal<T> {
  // Implementation
}
```

## Testing

Write tests for new features:

```typescript
// test/signal.spec.ts
import { signal, computed, effect } from '@nova/signals';

describe('signal', () => {
  it('should create reactive value', () => {
    const count = signal(0);
    expect(count.value).toBe(0);
  });

  it('should notify dependents on change', () => {
    const count = signal(0);
    const doubled = computed(() => count.value * 2);
    
    count.value = 5;
    expect(doubled.value).toBe(10);
  });
});
```

Run tests:

```bash
npm test
```

## Commit Messages

Use conventional commits:

```
feat(signals): add batch function
fix(compiler): handle JSX fragments
docs: update getting started guide
refactor(runtime): optimize patch algorithm
test(router): add navigation tests
perf: improve signal dependency tracking
```

## Pull Requests

1. Create a branch for your feature
2. Make your changes
3. Add/update tests
4. Update documentation
5. Submit a PR with description

**PR Template:**

```markdown
## Description
Brief description of changes

## Motivation
Why is this change needed?

## Testing
How was this tested?

## Breaking Changes
Any breaking API changes?

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Types are correct
- [ ] No console errors
```

## Review Process

- All PRs require review from maintainers
- CI must pass
- Tests must pass
- Code coverage must not decrease
- Documentation must be updated

## Areas for Contribution

### High Priority

1. **Compiler improvements**
   - Better JSX support
   - Optimization passes
   - Source map generation

2. **Runtime optimizations**
   - Smaller bundle size
   - Faster DOM operations
   - Memory efficiency

3. **Documentation**
   - More examples
   - API reference
   - Migration guides

4. **Plugin system**
   - Official plugins
   - Plugin templates
   - Example plugins

### Welcome Contributions

- Bug fixes
- Performance improvements
- Documentation improvements
- New examples
- Plugin development
- Test coverage

## Reporting Issues

Use the issue template:

```markdown
## Bug Report / Feature Request

### Description
What is the issue?

### Steps to Reproduce
1. ...
2. ...
3. ...

### Expected Behavior
What should happen?

### Actual Behavior
What happens instead?

### Environment
- Nova version:
- Node version:
- OS:
- Browser (if applicable):

### Minimal Reproduction
Code example or link to reproduction
```

## Build & Release

### Release Process

1. Update version in all package.json files
2. Update CHANGELOG.md
3. Create git tag
4. Publish to npm
5. Create GitHub release

```bash
# Version format: major.minor.patch
npm version patch  # 0.0.1 → 0.0.2
npm version minor  # 0.0.1 → 0.1.0
npm version major  # 0.0.1 → 1.0.0
```

## Performance Guidelines

- Keep runtime under 5kb
- Minimize dependencies
- Optimize hot paths
- Profile before optimizing
- Benchmark changes

## Documentation Guidelines

- Keep docs up-to-date with code
- Include examples
- Document edge cases
- Use TypeScript for examples
- Link to related docs

## Community

- GitHub Discussions
- Discord: https://discord.gg/nova
- Twitter: @nova_framework
- Issues on GitHub

## License

All contributions are licensed under MIT.

## Questions?

- Open an issue for questions
- Ask in Discord
- Check existing docs
- Look at examples

Thank you for contributing! 🙏
