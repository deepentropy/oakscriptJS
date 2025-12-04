import { describe, it, expect } from 'vitest';
import { SemanticAnalyzer } from '../src/transpiler/semantic/SemanticAnalyzer';
import { PineParser } from '../src/transpiler/PineParser';

describe('SemanticAnalyzer', () => {
  describe('variable scoping', () => {
    it('should detect undefined variables', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Test")
        result = undefined_var + 10
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]!.kind).toBe('UNDEFINED_VARIABLE');
      expect(result.errors[0]!.message).toContain('undefined_var');
    });
    
    it('should allow access to variables in parent scope', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Test")
        x = 10
        if true
            y = x + 5
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should detect duplicate declarations in same scope', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Test")
        x = 10
        x = 20
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]!.kind).toBe('DUPLICATE_DECLARATION');
      expect(result.errors[0]!.message).toContain('x');
    });
    
    it('should allow variable shadowing in nested scopes', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Test")
        x = 10
        if true
            x = 20
            y = x
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      // Currently our implementation doesn't support shadowing as a separate declaration
      // The inner x = 20 is treated as a new declaration in the nested scope
      // This may fail with DUPLICATE_DECLARATION if we're in the same scope
      // For now, we expect it to pass since if-blocks create new scopes
      expect(result.valid).toBe(true);
    });
    
    it('should recognize built-in variables', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Test")
        sma_val = ta.sma(close, 14)
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
  
  describe('const checking', () => {
    it('should allow reassignment of user-defined variables in Phase 1', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Test")
        myVar = 10
        myVar := 20
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      // In Phase 1, we're lenient about const reassignment for user variables
      // This is a common PineScript pattern
      expect(result.valid).toBe(true);
    });
    
    it('should detect reassignment of built-in constants', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Test")
        close := 100
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]!.kind).toBe('CONST_REASSIGNMENT');
      expect(result.errors[0]!.message).toContain('close');
    });
    
    it('should not error on reassignment when variable does not exist', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Test")
        myVar := 20
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]!.kind).toBe('UNDEFINED_VARIABLE');
    });
  });
  
  describe('function calls', () => {
    it('should detect wrong argument count for built-in functions', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Test")
        sma_val = ta.sma(close)
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]!.kind).toBe('WRONG_ARGUMENT_COUNT');
      expect(result.errors[0]!.message).toContain('ta.sma');
    });
    
    it('should allow correct argument count', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Test")
        sma_val = ta.sma(close, 14)
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should recognize user-defined functions', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Test")
        myFunc(x) => x * 2
        result = myFunc(10)
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should allow optional parameters', () => {
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
  });
  
  describe('control flow', () => {
    it('should detect break outside loop', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Test")
        if true
            break
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]!.kind).toBe('BREAK_OUTSIDE_LOOP');
    });
    
    it('should detect continue outside loop', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Test")
        if true
            continue
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]!.kind).toBe('CONTINUE_OUTSIDE_LOOP');
    });
    
    it('should allow break inside for loop', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Test")
        for i = 1 to 10
            if i == 5
                break
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should allow continue inside while loop', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Test")
        i = 0
        while i < 10
            i := i + 1
            if i == 5
                continue
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      // Note: i := i + 1 will error because i is const
      // We're mainly testing that continue doesn't error in a loop
      expect(result.errors.some(e => e.kind === 'CONTINUE_OUTSIDE_LOOP')).toBe(false);
    });
  });
  
  describe('function declarations', () => {
    it('should detect duplicate function declarations', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Test")
        myFunc(x) => x * 2
        myFunc(y) => y * 3
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]!.kind).toBe('DUPLICATE_DECLARATION');
      expect(result.errors[0]!.message).toContain('myFunc');
    });
    
    it('should allow access to variables in function body', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Test")
        multiplier = 2
        myFunc(x) => x * multiplier
        result = myFunc(10)
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
  
  describe('complex scenarios', () => {
    it('should validate a complete indicator without errors', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Moving Average Cross")
        fast_length = 10
        slow_length = 20
        fast_ma = ta.sma(close, fast_length)
        slow_ma = ta.sma(close, slow_length)
        plot(fast_ma)
        plot(slow_ma)
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should catch multiple errors in one pass', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Test")
        x = undefined_var
        close := 20
        z = ta.sma(close)
        break
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      
      // Should have undefined variable error
      expect(result.errors.some(e => e.kind === 'UNDEFINED_VARIABLE')).toBe(true);
      // Should have const reassignment error for built-in
      expect(result.errors.some(e => e.kind === 'CONST_REASSIGNMENT')).toBe(true);
      // Should have wrong argument count error
      expect(result.errors.some(e => e.kind === 'WRONG_ARGUMENT_COUNT')).toBe(true);
      // Should have break outside loop error
      expect(result.errors.some(e => e.kind === 'BREAK_OUTSIDE_LOOP')).toBe(true);
    });
  });
  
  describe('named parameters', () => {
    it('should not error on named parameters in indicator()', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Test", shorttitle="T", overlay=true)
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should not error on named parameters in input functions', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Test")
        len = input.int(14, title="Length", minval=1, maxval=100)
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should not error on named parameters in plot()', () => {
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
    
    it('should still error on actual undefined variables', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Test")
        x = undefinedVar + 1
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]!.kind).toBe('UNDEFINED_VARIABLE');
      expect(result.errors[0]!.message).toContain('undefinedVar');
    });
    
    it('should handle complex mixed positional and named parameters', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Average Day Range", shorttitle="ADR", timeframe="", timeframe_gaps=true)
        lengthInput = input.int(14, title="Length")
        plot(close, title="ADR", color=color.blue)
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should validate expressions in named parameter values', () => {
      const parser = new PineParser();
      const { ast } = parser.parse(`
        indicator("Test")
        plot(close, title="Close", color=undefinedColor)
      `);
      
      const analyzer = new SemanticAnalyzer();
      const result = analyzer.analyze(ast);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]!.kind).toBe('UNDEFINED_VARIABLE');
      expect(result.errors[0]!.message).toContain('undefinedColor');
    });
  });
});
