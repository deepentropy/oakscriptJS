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
});
