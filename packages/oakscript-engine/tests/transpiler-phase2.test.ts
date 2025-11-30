import { describe, it, expect } from 'vitest';
import { PineParser } from '../src/transpiler/PineParser';
import { transpile } from '../src/transpiler/PineToTS';

describe('Phase 2: Input System & Built-in Variables', () => {
  describe('Input Functions', () => {
    describe('input.int()', () => {
      it('should parse input.int with positional args', () => {
        const parser = new PineParser();
        const { ast, errors } = parser.parse('length = input.int(14, "Length")');
        
        expect(errors).toHaveLength(0);
        expect(ast.children).toBeDefined();
      });

      it('should generate IndicatorInputs interface for input.int', () => {
        const source = `indicator("Test")
length = input.int(14, "Length")
plot(close)`;
        
        const result = transpile(source);
        
        expect(result).toContain('export interface IndicatorInputs');
        expect(result).toContain('length: number');
        expect(result).toContain('const defaultInputs: IndicatorInputs');
        expect(result).toContain('length: 14');
      });

      it('should handle input.int with named arguments', () => {
        const source = `indicator("Test")
period = input.int(title="Period", defval=20)`;
        
        const result = transpile(source);
        
        expect(result).toContain('period: number');
        expect(result).toContain('period: 20');
      });

      it('should add inputs parameter to function', () => {
        const source = `indicator("Test")
length = input.int(14, "Length")`;
        
        const result = transpile(source);
        
        expect(result).toContain('inputs: Partial<IndicatorInputs> = {}');
        expect(result).toContain('{ length } = { ...defaultInputs, ...inputs }');
      });
    });

    describe('input.float()', () => {
      it('should generate number type for input.float', () => {
        const source = `indicator("Test")
multiplier = input.float(2.0, "Multiplier")`;
        
        const result = transpile(source);
        
        expect(result).toContain('multiplier: number');
        expect(result).toContain('multiplier: 2');
      });

      it('should parse input.float with step parameter', () => {
        const source = `indicator("Test")
mult = input.float(2.0, "Mult", step=0.1)`;
        
        const result = transpile(source);
        
        expect(result).toContain('mult: number');
      });
    });

    describe('input.bool()', () => {
      it('should generate boolean type for input.bool', () => {
        const source = `indicator("Test")
showMA = input.bool(true, "Show MA")`;
        
        const result = transpile(source);
        
        expect(result).toContain('showMA: boolean');
        expect(result).toContain('showMA: true');
      });

      it('should handle false default value', () => {
        const source = `indicator("Test")
hideBands = input.bool(false, "Hide Bands")`;
        
        const result = transpile(source);
        
        expect(result).toContain('hideBands: boolean');
        expect(result).toContain('hideBands: false');
      });
    });

    describe('input.string()', () => {
      it('should generate string type for input.string', () => {
        const source = `indicator("Test")
ticker = input.string("AAPL", "Ticker")`;
        
        const result = transpile(source);
        
        expect(result).toContain('ticker: string');
        expect(result).toContain('ticker: "AAPL"');
      });

      it('should generate union type for input.string with options', () => {
        const source = `indicator("Test")
maType = input.string("SMA", "MA Type", options=["SMA", "EMA", "WMA"])`;
        
        const result = transpile(source);
        
        // Options should create union type
        expect(result).toContain('"SMA" | "EMA" | "WMA"');
      });
    });

    describe('input.color()', () => {
      it('should generate string type for input.color', () => {
        const source = `indicator("Test")
bullColor = input.color(color.green, "Bull Color")`;
        
        const result = transpile(source);
        
        expect(result).toContain('bullColor: string');
        expect(result).toContain('#00FF00'); // color.green mapped to hex
      });
    });

    describe('input.source()', () => {
      it('should generate union type for input.source', () => {
        const source = `indicator("Test")
src = input.source(close, "Source")`;
        
        const result = transpile(source);
        
        expect(result).toContain('"open" | "high" | "low" | "close" | "hl2" | "hlc3" | "ohlc4" | "hlcc4"');
        expect(result).toContain('src: "close"');
      });
    });

    describe('Multiple inputs', () => {
      it('should handle multiple input declarations', () => {
        const source = `indicator("Test")
length = input.int(14, "Length")
multiplier = input.float(2.0, "Mult")
showBands = input.bool(true, "Show")`;
        
        const result = transpile(source);
        
        expect(result).toContain('length: number');
        expect(result).toContain('multiplier: number');
        expect(result).toContain('showBands: boolean');
        expect(result).toContain('{ length, multiplier, showBands }');
      });
    });
  });

  describe('Calculated Price Sources', () => {
    it('should generate hl2 calculation', () => {
      const source = `indicator("Test")
plot(hl2)`;
      
      const result = transpile(source);
      
      expect(result).toContain('const hl2 = high.add(low).div(2)');
    });

    it('should generate hlc3 calculation', () => {
      const source = `indicator("Test")
plot(hlc3)`;
      
      const result = transpile(source);
      
      expect(result).toContain('const hlc3 = high.add(low).add(close).div(3)');
    });

    it('should generate ohlc4 calculation', () => {
      const source = `indicator("Test")
plot(ohlc4)`;
      
      const result = transpile(source);
      
      expect(result).toContain('const ohlc4 = open.add(high).add(low).add(close).div(4)');
    });

    it('should generate hlcc4 calculation', () => {
      const source = `indicator("Test")
plot(hlcc4)`;
      
      const result = transpile(source);
      
      expect(result).toContain('const hlcc4 = high.add(low).add(close).add(close).div(4)');
    });
  });

  describe('bar_index and barstate Variables', () => {
    it('should generate bar_index variable', () => {
      const source = `indicator("Test")
position = bar_index`;
      
      const result = transpile(source);
      
      expect(result).toContain('const last_bar_index = bars.length - 1');
    });

    it('should translate bar_index to i', () => {
      const source = `indicator("Test")
position = bar_index`;
      
      const result = transpile(source);
      
      // bar_index should translate to loop variable i
      expect(result).toContain('= i');
    });

    it('should translate barstate.isfirst', () => {
      const source = `indicator("Test")
if barstate.isfirst
    x = 1`;
      
      const result = transpile(source);
      
      expect(result).toContain('(i === 0)');
    });

    it('should translate barstate.islast', () => {
      const source = `indicator("Test")
if barstate.islast
    x = 1`;
      
      const result = transpile(source);
      
      expect(result).toContain('(i === bars.length - 1)');
    });
  });

  describe('Time Variables', () => {
    it('should generate year series', () => {
      const source = `indicator("Test")
y = year`;
      
      const result = transpile(source);
      
      expect(result).toContain("const year = new Series(bars, (bar) => new Date(bar.time).getFullYear())");
    });

    it('should generate month series', () => {
      const source = `indicator("Test")
m = month`;
      
      const result = transpile(source);
      
      expect(result).toContain("const month = new Series(bars, (bar) => new Date(bar.time).getMonth() + 1)");
    });

    it('should generate dayofmonth series', () => {
      const source = `indicator("Test")
d = dayofmonth`;
      
      const result = transpile(source);
      
      expect(result).toContain("const dayofmonth = new Series(bars, (bar) => new Date(bar.time).getDate())");
    });

    it('should generate dayofweek series', () => {
      const source = `indicator("Test")
dow = dayofweek`;
      
      const result = transpile(source);
      
      expect(result).toContain("const dayofweek = new Series(bars, (bar) => new Date(bar.time).getDay() + 1)");
    });

    it('should generate hour series', () => {
      const source = `indicator("Test")
h = hour`;
      
      const result = transpile(source);
      
      expect(result).toContain("const hour = new Series(bars, (bar) => new Date(bar.time).getHours())");
    });

    it('should generate minute series', () => {
      const source = `indicator("Test")
min = minute`;
      
      const result = transpile(source);
      
      expect(result).toContain("const minute = new Series(bars, (bar) => new Date(bar.time).getMinutes())");
    });
  });

  describe('na() and nz() Functions', () => {
    it('should generate na helper function', () => {
      const source = `indicator("Test")`;
      
      const result = transpile(source);
      
      expect(result).toContain('function na(value: number | null | undefined): boolean');
      expect(result).toContain('return value === null || value === undefined || Number.isNaN(value)');
    });

    it('should generate nz helper function', () => {
      const source = `indicator("Test")`;
      
      const result = transpile(source);
      
      expect(result).toContain('function nz(value: number | null | undefined, replacement: number = 0): number');
      expect(result).toContain('return na(value) ? replacement : value as number');
    });

    it('should allow using na() in conditionals', () => {
      const source = `indicator("Test")
var x = 0
if na(close[100])
    x := 1`;
      
      const result = transpile(source);
      
      expect(result).toContain('if (na(close.get(100)))');
    });

    it('should allow using nz() for safe values', () => {
      const source = `indicator("Test")
safeValue = nz(close[100])`;
      
      const result = transpile(source);
      
      expect(result).toContain('nz(close.get(100))');
    });

    it('should allow nz() with replacement value', () => {
      const source = `indicator("Test")
safeValue = nz(close[100], -1)`;
      
      const result = transpile(source);
      
      expect(result).toContain('nz(close.get(100), -1)');
    });
  });

  describe('Integration Tests', () => {
    it('should handle input test case from spec', () => {
      const source = `indicator("Input Test", overlay=true)
length = input.int(14, "Length")
multiplier = input.float(2.0, "Multiplier")
showBands = input.bool(true, "Show Bands")
maType = input.string("EMA", "MA Type")
src = input.source(close, "Source")

ma = switch maType
    "SMA" => ta.sma(src, length)
    "EMA" => ta.ema(src, length)
    "WMA" => ta.wma(src, length)

plot(ma)`;
      
      const result = transpile(source);
      
      // Should have all inputs in interface
      expect(result).toContain('length: number');
      expect(result).toContain('multiplier: number');
      expect(result).toContain('showBands: boolean');
      expect(result).toContain('maType: string');
      
      // Should have switch statement
      expect(result).toContain('switch (maType)');
    });

    it('should handle barstate test case from spec', () => {
      const source = `indicator("Barstate Test")
var firstClose = 0
if barstate.isfirst
    firstClose := close

plot(firstClose)`;
      
      const result = transpile(source);
      
      expect(result).toContain('if ((i === 0))');
      expect(result).toContain('firstClose = close');
    });

    it('should handle time test case from spec', () => {
      const source = `indicator("Time Test")
isMonday = dayofweek == 2
isMarketOpen = hour >= 9`;
      
      const result = transpile(source);
      
      // Should use dayofweek series
      expect(result).toContain('dayofweek');
      expect(result).toContain('hour');
    });

    it('should compile generated TypeScript without syntax errors', () => {
      const source = `indicator("Complete Test")
length = input.int(14, "Length")
src = input.source(close, "Source")

smaValue = ta.sma(src, length)

if barstate.isfirst
    firstVal = close

if na(close[100])
    safeClose = nz(close[100], 0)

plot(smaValue)`;
      
      // This should not throw
      expect(() => transpile(source)).not.toThrow();
      
      const result = transpile(source);
      
      // Basic structure checks
      expect(result).toContain('export function');
      expect(result).toContain('return {');
      expect(result).toContain('metadata:');
      expect(result).toContain('plots:');
    });
  });
});
