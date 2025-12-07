import {describe, expect, it} from 'vitest';
import {transpile} from '../src/transpiler/PineToTS';

describe('Recursive Formulas', () => {
  it('should generate bar-by-bar iteration for recursive formulas', () => {
    const source = `//@version=6
indicator("Test Recursive")
x = 0.0
x := na(x[1]) ? 1 : x[1] + 2
plot(x)`;
    
    const result = transpile(source);
    
    // Check that bar-by-bar iteration is generated
    expect(result).toContain('const xValues: number[] = new Array(bars.length).fill(NaN)');
    expect(result).toContain('for (let i = 0; i < bars.length; i++)');
    expect(result).toContain('const xPrev = i > 0 ? xValues[i - 1] : NaN');
    expect(result).toContain('x = Series.fromArray(bars, xValues)');
  });

  it('should correctly transpile McGinley Dynamic formula', () => {
    const source = `//@version=6
indicator(title="McGinley Dynamic", overlay=true)
length = input.int(14, minval=1)
source = close
mg = 0.0
mg := na(mg[1]) ? ta.ema(source, length) : mg[1] + (source - mg[1]) / (length * math.pow(source/mg[1], 4))
plot(mg)`;
    
    const result = transpile(source);
    
    // Check recursive formula generation
    expect(result).toContain('// Recursive formula for mg');
    expect(result).toContain('const mgValues: number[]');
    expect(result).toContain('const mgPrev = i > 0 ? mgValues[i - 1] : NaN');

      // Check the formula includes the correct structure with proper operator precedence
      // The formula should be: mgPrev + ((source - mgPrev) / (length * pow(...)))
      // NOT: (mgPrev + (source - mgPrev)) / (length * pow(...))
      expect(result).toContain('mgPrev + ((source.get(i) - mgPrev) /');
    expect(result).toContain('math.pow');
  });

  it('should handle non-recursive reassignments normally', () => {
    const source = `//@version=6
indicator("Test Non-Recursive")
x = 10
x := x + 5
plot(x)`;
    
    const result = transpile(source);
    
    // Should NOT generate bar-by-bar iteration
    expect(result).not.toContain('const xValues: number[]');
    expect(result).not.toContain('for (let i = 0');
    
    // Should generate normal reassignment (as Series operation since x becomes a Series)
    expect(result).toContain('x = x.add(5)');
  });
});

describe('History Access', () => {
  it('should use offset() for history access instead of get()', () => {
    const source = `//@version=6
indicator("Test History")
x = close[1]
plot(x)`;
    
    const result = transpile(source);
    
    // Should use .offset() not .get()
    expect(result).toContain('.offset(1)');
    expect(result).not.toMatch(/close\.get\(1\)/);
  });

  it('should correctly transpile ROC formula with offset', () => {
    const source = `//@version=6
indicator(title="Rate Of Change", shorttitle="ROC")
length = input.int(9, minval=1)
source = input(close, "Source")
roc = 100 * (source - source[length])/source[length]
plot(roc)`;
    
    const result = transpile(source);
    
    // Should use .offset(length) for source[length]
    expect(result).toContain('.offset(length)');
    expect(result).not.toMatch(/sourceSeries\.get\(length\)/);
    
    // Check formula structure
    expect(result).toContain('sourceSeries.sub(sourceSeries.offset(length))');
    expect(result).toContain('.mul(100)');
    expect(result).toContain('.div(sourceSeries.offset(length))');
  });

  it('should handle multiple history accesses in expression', () => {
    const source = `//@version=6
indicator("Test Multiple History")
diff = close[0] - close[1] + close[2]
plot(diff)`;
    
    const result = transpile(source);
    
    // All history accesses should use offset
    expect(result).toContain('.offset(0)');
    expect(result).toContain('.offset(1)');
    expect(result).toContain('.offset(2)');
  });
});
