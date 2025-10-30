# Contributing to OakScriptJS

Thank you for your interest in contributing to OakScriptJS! This document provides guidelines and instructions for contributing.

## Core Principles

When contributing to OakScriptJS, please keep these priorities in mind:

1. **Exact same signature as PineScript API** - All functions must match PineScript exactly
2. **Accuracy** - Implementations must produce results matching PineScript
3. **Performance** - Code should be optimized for speed and efficiency

## Getting Started

### Prerequisites

- Node.js 16.0.0 or higher
- npm or yarn

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/oakscriptJS.git
   cd oakscriptJS
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Building

```bash
npm run build
```

### Linting and Formatting

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

## Adding New Functions

When adding new PineScript functions:

1. **Research the PineScript function**
   - Check TradingView's Pine Script documentation
   - Understand the exact signature and behavior
   - Note any edge cases or special behavior

2. **Add the function to the appropriate namespace**
   - Place in correct directory: `src/ta/`, `src/math/`, etc.
   - Use exact same parameter names and types as PineScript
   - Add comprehensive JSDoc comments

3. **Write tests**
   - Create tests in corresponding `tests/` directory
   - Test edge cases, boundary conditions
   - Compare results with PineScript when possible

4. **Update exports**
   - Add to namespace index file
   - Add to main `src/index.ts` if commonly used

5. **Document**
   - Add to README if it's a major function
   - Include usage examples

### Example: Adding a New Function

```typescript
// src/ta/newfunction.ts

/**
 * Description matching PineScript docs
 * @param source - Source series
 * @param length - Length parameter
 * @returns Result series
 */
export function newfunction(source: Source, length: simple_int): series_float {
  // Implementation here
  const result: series_float = [];

  // ... calculation logic ...

  return result;
}
```

```typescript
// tests/ta/newfunction.test.ts

import { ta } from '../../src';

describe('ta.newfunction', () => {
  it('should calculate correctly', () => {
    const source = [1, 2, 3, 4, 5];
    const result = ta.newfunction(source, 2);

    expect(result).toEqual(/* expected values */);
  });

  // More tests...
});
```

## Type System

Follow these type conventions:

- `series_float` for arrays of floats (price data, indicators)
- `series_int` for arrays of integers
- `series_bool` for boolean arrays
- `simple_int`, `simple_float` for scalar parameters
- Use `Source` type for price/indicator inputs

## Code Style

- Use TypeScript
- Follow existing code formatting (Prettier config)
- Use descriptive variable names
- Add comments for complex logic
- Keep functions pure when possible
- Avoid external dependencies

## Testing Guidelines

- Write tests for all new functions
- Test edge cases:
  - Empty arrays
  - Single element arrays
  - NaN values
  - Zero/negative lengths
- Aim for >80% code coverage
- Use descriptive test names

## Documentation

- Add JSDoc comments to all public functions
- Include `@param` and `@returns` tags
- Provide examples in complex functions
- Update README for significant additions
- Keep examples up to date

## Commit Messages

Use clear, descriptive commit messages:

```
feat: add ta.wma (Weighted Moving Average)
fix: correct RSI calculation for edge cases
docs: update README with matrix namespace
test: add tests for array.median function
refactor: optimize ta.sma performance
```

Prefixes:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Test additions/changes
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `chore:` - Build/tooling changes

## Pull Request Process

1. Ensure all tests pass
2. Update documentation
3. Add tests for new functionality
4. Run linting and formatting
5. Create pull request with clear description
6. Reference any related issues

### PR Checklist

- [ ] Tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Code is formatted (`npm run format`)
- [ ] Documentation updated
- [ ] Examples added/updated if needed
- [ ] CHANGELOG updated (if applicable)

## Questions or Issues?

- Open an issue for bugs or feature requests
- Use discussions for questions
- Check existing issues before creating new ones

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
