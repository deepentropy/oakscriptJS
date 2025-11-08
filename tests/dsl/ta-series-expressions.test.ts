/**
 * Test that ta.sma() and other ta functions work with Series expressions
 * This tests the bug fix for: ta.sma(high - low, length) failing
 */

import { indicator, plot, compile, high, low, close, open, ta, resetDSLContext } from '../../src';

describe('DSL ta functions with Series expressions', () => {
  beforeEach(() => {
    resetDSLContext();
  });

  it('should handle ta.sma(high - low) expression', () => {
    // This was the reported bug: ta.sma(high - low, 14) would fail
    indicator("Average Day Range");

    const lengthInput = 14;
    const adr = ta.sma(high.sub(low), lengthInput);

    // Should return a Series object, not throw an error
    expect(adr).toBeDefined();
    expect(adr).toHaveProperty('_compute');
    expect(typeof adr._compute).toBe('function');

    plot(adr, {title: "ADR"});

    // Should compile without errors
    const compiled = compile();
    expect(compiled).toBeDefined();
    expect(compiled.bind).toBeDefined();
  });

  it('should handle ta.sma(close - open) body expression', () => {
    indicator("Body SMA");

    const avgBody = ta.sma(close.sub(open), 20);

    expect(avgBody).toBeDefined();
    expect(avgBody).toHaveProperty('_compute');

    plot(avgBody);
    const compiled = compile();
    expect(compiled).toBeDefined();
  });

  it('should handle nested Series expressions', () => {
    indicator("Nested Expressions");

    // Calculate range
    const range = high.sub(low);

    // Use range in another ta function
    const avgRange = ta.sma(range, 10);

    // Use avgRange in yet another calculation
    const volatility = ta.stdev(range, 10);
    const normalizedVol = volatility.div(avgRange);

    expect(normalizedVol).toBeDefined();
    expect(normalizedVol).toHaveProperty('_compute');

    plot(normalizedVol);
    const compiled = compile();
    expect(compiled).toBeDefined();
  });

  it('should handle complex expressions in ta.rsi()', () => {
    indicator("RSI on Midpoint");

    const midpoint = high.add(low).div(2);
    const rsiMid = ta.rsi(midpoint, 14);

    expect(rsiMid).toBeDefined();
    expect(rsiMid).toHaveProperty('_compute');

    plot(rsiMid);
    const compiled = compile();
    expect(compiled).toBeDefined();
  });

  it('should handle ta.bb() with expression', () => {
    indicator("Bollinger Bands on Range");

    const range = high.sub(low);
    const [upper, basis, lower] = ta.bb(range, 20, 2);

    expect(upper).toBeDefined();
    expect(basis).toBeDefined();
    expect(lower).toBeDefined();

    expect(upper).toHaveProperty('_compute');
    expect(basis).toHaveProperty('_compute');
    expect(lower).toHaveProperty('_compute');

    plot(upper);
    plot(basis);
    plot(lower);

    const compiled = compile();
    expect(compiled).toBeDefined();
  });
});
