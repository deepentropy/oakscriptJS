import { describe, it, expect } from 'vitest';
import { SemanticAnalyzer } from '../src/transpiler/semantic/SemanticAnalyzer';
import { PineParser } from '../src/transpiler/PineParser';

describe('Built-in Function Signatures', () => {
  describe('ta.vwma', () => {
    it('should accept 2 arguments (source, length)', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Test")
        vwma_val = ta.vwma(close, 14)
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should reject 3 arguments', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Test")
        vwma_val = ta.vwma(close, 14, volume)
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.kind === 'WRONG_ARGUMENT_COUNT')).toBe(true);
    });
  });
  
  describe('plot', () => {
    it('should accept basic call with 1 argument', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Test")
        plot(close)
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should accept 4 arguments with named parameters', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Test")
        plot(close, title="Close", color=color.red, linewidth=2)
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should accept 5+ arguments with style parameter', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Test")
        plot(close, title="X", color=color.red, linewidth=2, style=plot.style_line)
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should accept many optional parameters', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Test")
        plot(close, title="Close", color=color.red, linewidth=2, style=plot.style_line, trackprice=true, offset=0, join=true)
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
  
  describe('indicator', () => {
    it('should accept basic call with 1 argument', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Test")
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should accept shorttitle and overlay parameters', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Test", shorttitle="T", overlay=true)
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should accept timeframe parameters', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Test", shorttitle="T", overlay=true, timeframe="", timeframe_gaps=true)
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should accept max_bars_back and precision parameters', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Test", precision=2, max_bars_back=500)
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
  
  describe('Additional TA functions', () => {
    it('should accept ta.wma with 2 arguments', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Test")
        wma_val = ta.wma(close, 14)
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should accept ta.highest with 2 arguments', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Test")
        highest_val = ta.highest(high, 20)
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should accept ta.lowest with 2 arguments', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Test")
        lowest_val = ta.lowest(low, 20)
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should accept ta.stdev with 2 arguments', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Test")
        stdev_val = ta.stdev(close, 20)
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should accept ta.atr with 1 argument', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Test")
        atr_val = ta.atr(14)
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
  
  describe('Math functions', () => {
    it('should accept math.abs', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Test")
        abs_val = math.abs(-5.5)
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should accept math.round', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Test")
        round_val = math.round(5.567)
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should accept math.sqrt', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Test")
        sqrt_val = math.sqrt(16.0)
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should accept math.pow', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Test")
        pow_val = math.pow(2.0, 3.0)
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
  
  describe('Utility functions', () => {
    it('should accept nz with 1 argument', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Test")
        nz_val = nz(close)
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should accept nz with 2 arguments', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Test")
        nz_val = nz(close, 0)
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
  
  describe('Display functions', () => {
    it('should accept hline', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Test")
        hline(0, title="Zero", color=color.gray)
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should accept bgcolor', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Test")
        bgcolor(color.red, title="Background")
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
  
  describe('Array functions', () => {
    it('should accept array.new_float', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Test")
        arr = array.new_float(10, 0.0)
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should accept array.new_int', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Test")
        arr = array.new_int(10, 0)
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
