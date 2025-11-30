# Migration Guide

## Migrating from Separate Packages

This monorepo consolidates the OakScript ecosystem into a single repository:

- `@deepentropy/oakscriptjs` - Technical analysis library
- `@deepentropy/oakscript-engine` - PineScript transpiler

### Package Names

The package names remain the same:
- `@deepentropy/oakscriptjs` (unchanged)
- `@deepentropy/oakscript-engine` (unchanged)

### Installation

**Before (npm):**
```bash
npm install @deepentropy/oakscriptjs
```

**After (pnpm recommended):**
```bash
pnpm add @deepentropy/oakscriptjs
```

### Repository Structure

The main difference is the internal organization:

```
oakscript/
├── packages/
│   ├── oakscriptjs/       # @deepentropy/oakscriptjs
│   └── oakscript-engine/  # @deepentropy/oakscript-engine
├── docs/
├── pnpm-workspace.yaml
└── ...
```

## API Changes

### v0.2.x → v0.3.0

No breaking API changes. The v0.3.0 release is primarily a structural change to monorepo.

## For Contributors

### Development Setup

```bash
# Clone the repository
git clone https://github.com/deepentropy/oakscriptJS.git
cd oakscriptJS

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

### Working with Packages

```bash
# Build only oakscriptjs
pnpm --filter @deepentropy/oakscriptjs build

# Test only oakscript-engine
pnpm --filter @deepentropy/oakscript-engine test

# Add a dependency to oakscriptjs
pnpm --filter @deepentropy/oakscriptjs add lodash
```

### Workspace Dependencies

The `@deepentropy/oakscript-engine` package depends on `@deepentropy/oakscriptjs` using workspace protocol:

```json
{
  "dependencies": {
    "@deepentropy/oakscriptjs": "workspace:*"
  }
}
```

This ensures the local version is used during development.

## Publishing

Packages are published independently to npm:

```bash
# From root
pnpm -r publish --access public
```

Or through the GitHub Actions publish workflow when a tag is pushed.
