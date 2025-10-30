# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2024-10-30

### Added
- Initial project structure
- Core type system matching PineScript
- `ta` namespace with common technical analysis functions:
  - `sma()` - Simple Moving Average
  - `ema()` - Exponential Moving Average
  - `rsi()` - Relative Strength Index
  - `macd()` - MACD indicator
  - `bb()` - Bollinger Bands
  - `stdev()` - Standard Deviation
  - `crossover()` / `crossunder()` - Cross detection
  - `change()` - Price change
  - `tr()` - True Range
  - `atr()` - Average True Range
- `math` namespace with mathematical functions
- `array` namespace with array manipulation functions
- `str` namespace with string operations
- `color` namespace with color functions
- `utils` namespace with internal utilities
- Comprehensive test suite with Jest
- Build system with esbuild
- TypeScript support
- Examples and documentation
- ESLint and Prettier configuration

### Documentation
- README with quickstart guide
- API documentation
- Usage examples
- Contributing guidelines
- MIT License

[Unreleased]: https://github.com/houseofai/oakscriptJS/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/houseofai/oakscriptJS/releases/tag/v0.1.0
