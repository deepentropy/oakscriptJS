import { describe, it, expect } from 'vitest';
import { PineParser } from '../src/transpiler/PineParser';
import { transpile } from '../src/transpiler/PineToTS';

describe('PineParser', () => {
  it('should parse a simple indicator declaration', () => {
    const parser = new PineParser();
    const { ast, errors } = parser.parse('indicator("My Indicator")');
    
    expect(errors).toHaveLength(0);
    expect(ast.type).toBe('Program');
    expect(ast.children).toBeDefined();
    expect(ast.children!.length).toBeGreaterThan(0);
  });

  it('should parse variable assignment', () => {
    const parser = new PineParser();
    const { ast, errors } = parser.parse('x = 10');
    
    expect(errors).toHaveLength(0);
    expect(ast.type).toBe('Program');
  });

  it('should parse function calls', () => {
    const parser = new PineParser();
    const { ast, errors } = parser.parse('ta.sma(close, 14)');
    
    expect(errors).toHaveLength(0);
    expect(ast.type).toBe('Program');
  });

  it('should parse comments', () => {
    const parser = new PineParser();
    const { ast, errors } = parser.parse('// This is a comment');
    
    expect(errors).toHaveLength(0);
    expect(ast.children![0]!.type).toBe('Comment');
  });
});

describe('transpile', () => {
  it('should transpile a simple indicator', () => {
    const source = `indicator("Simple RSI")
rsi_value = ta.rsi(close, 14)
plot(rsi_value)`;
    
    const result = transpile(source);
    
    expect(result).toContain("import { Series, ta");
    expect(result).toContain("export function Simple_RSI");
    expect(result).toContain("ta.rsi(close, 14)");
    expect(result).toContain("return {");
    expect(result).toContain("metadata:");
  });

  it('should include OHLCV series definitions', () => {
    const source = `indicator("Test")`;
    const result = transpile(source);
    
    expect(result).toContain("const open = new Series");
    expect(result).toContain("const high = new Series");
    expect(result).toContain("const low = new Series");
    expect(result).toContain("const close = new Series");
    expect(result).toContain("const volume = new Series");
  });

  it('should handle arithmetic expressions', () => {
    const source = `indicator("BOP")
bop = (close - open) / (high - low)`;
    
    const result = transpile(source);
    
    expect(result).toContain("close.sub(open)");
  });

  it('should generate Series method calls for arithmetic operators', () => {
    const source = `indicator("Test Arithmetic")
a = ta.sma(close, 14)
b = ta.sma(close, 21)
c1 = a + b
c2 = a - b
c3 = a * b
c4 = a / b
c5 = a % b`;
    
    const result = transpile(source);
    
    expect(result).toContain("a.add(b)");
    expect(result).toContain("a.sub(b)");
    expect(result).toContain("a.mul(b)");
    expect(result).toContain("a.div(b)");
    expect(result).toContain("a.mod(b)");
  });

  it('should generate Series method calls for comparison operators', () => {
    const source = `indicator("Test Comparison")
a = ta.sma(close, 14)
b = ta.sma(close, 21)
c1 = a > b
c2 = a < b
c3 = a >= b
c4 = a <= b
c5 = a == b
c6 = a != b`;
    
    const result = transpile(source);
    
    expect(result).toContain("a.gt(b)");
    expect(result).toContain("a.lt(b)");
    expect(result).toContain("a.gte(b)");
    expect(result).toContain("a.lte(b)");
    expect(result).toContain("a.eq(b)");
    expect(result).toContain("a.neq(b)");
  });

  it('should generate Series.neg() for unary minus', () => {
    const source = `indicator("Test Unary")
a = ta.sma(close, 14)
b = -a`;
    
    const result = transpile(source);
    
    expect(result).toContain("a.neg()");
  });

  it('should detect Series in ternary expressions with na', () => {
    const source = `indicator("Test Ternary")
ma(source, length) => ta.sma(source, length)
enableMA = true
smoothingMA = enableMA ? ma(close, 14) : na
b = ta.sma(close, 21)
c = smoothingMA - b`;
    
    const result = transpile(source);
    
    expect(result).toContain("smoothingMA.sub(b)");
    expect(result).not.toContain("(smoothingMA - b)");
  });

  it('should handle user-defined functions as Series', () => {
    const source = `indicator("Test User Function")
myFunc(x) => ta.sma(x, 10)
a = myFunc(close)
b = ta.ema(close, 20)
c = a + b`;
    
    const result = transpile(source);
    
    expect(result).toContain("a.add(b)");
  });
});
