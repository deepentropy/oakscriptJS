/**
 * Guards for the common script mistakes: operators on a Series, ta.* inside a bar loop, a misspelt namespace
 * member. Each one used to give a silent wrong value (NaN, a constant condition, "[object Object]", undefined).
 */
import { close, color, eachBar, executeScript, indicator, input, math, open, plot, request, str, ta } from '../../src/script';
import { syntheticBars } from '../skills/harness';

const BARS = syntheticBars(200);
const run = (body: () => void) => executeScript(body, BARS, {}, { timeframe: '60', timezone: 'Etc/UTC', session: '24x7' });

describe('JavaScript operators on a Series', () => {
  it.each([
    ['close - open', () => (close as unknown as number) - (open as unknown as number)],
    ['close + 1', () => (close as unknown as number) + 1],
    ['close * 2', () => (close as unknown as number) * 2],
    ['close > 100', () => (close as unknown as number) > 100],
    ['close >= open', () => (close as unknown as number) >= (open as unknown as number)],
    ['close == 100', () => (close as unknown as number) == 100],
    ['-close', () => -(close as unknown as number)],
  ])('%s throws with the Series methods', (_, expr) => {
    expect(expr).toThrow(TypeError);
    expect(expr).toThrow(/a\.sub\(b\).*a\.gt\(b\).*cond\.iff\(x, y\).*c\.get\(a\)/);
  });

  it('a Series in a text throws with the bar-loop read', () => {
    expect(() => `RSI ${close}`).toThrow(/not a text.*str\.tostring\(c\.get\(rsi\)\)/);
    expect(() => String(close)).toThrow(TypeError);
  });

  it('the Series methods, equality of references and truthiness still work', () => {
    run(() => {
      indicator('ok');
      const diff = close.sub(open).toArray();
      expect(diff[5]).toBeCloseTo(BARS[5]!.close - BARS[5]!.open, 12);
      expect(close === close).toBe(true);
      expect(Boolean(close)).toBe(true);
      expect(close instanceof Object).toBe(true);
    });
  });
});

describe('ta.* inside eachBar()', () => {
  it('throws with the fix, naming the function', () => {
    expect(() =>
      run(() => {
        indicator('t');
        eachBar((c) => c.get(ta.sma(close, 5)));
      })
    ).toThrow(/ta\.sma\(\) was called inside eachBar\(\).*before the loop.*c\.get\(x\)/);
  });

  it('the top level is free again after a loop that threw', () => {
    run(() => {
      indicator('t');
      expect(() => eachBar(() => void ta.rsi(close, 14))).toThrow(/ta\.rsi\(\) was called inside eachBar/);
      const sma = ta.sma(close, 5);
      const out = eachBar((c) => c.get(sma)).toArray();
      expect(out[10]).toBe(sma.toArray()[10]);
    });
  });

  it('a ta.* variable (ta.obv) is read inside the loop', () => {
    run(() => {
      indicator('t');
      const out = eachBar((c) => c.get(ta.obv)).toArray();
      expect(out[50]).toBe(ta.obv.toArray()[50]);
    });
  });
});

describe('unknown namespace members', () => {
  it.each([
    [() => (ta as unknown as Record<string, unknown>).smaa, /^ta\.smaa does not exist\. Did you mean ta\.sma\b/],
    [() => (ta as unknown as Record<string, unknown>).crossOver, /Did you mean ta\.crossover\b/],
    [() => (color as unknown as Record<string, unknown>).purpel, /^color\.purpel does not exist\. Did you mean color\.purple\b/],
    [() => (input as unknown as Record<string, unknown>).integer, /^input\.integer does not exist\. Did you mean input\.int\b/],
    [() => (math as unknown as Record<string, unknown>).maximum, /Did you mean math\.max\b/],
    [() => (str as unknown as Record<string, unknown>).toString2, /^str\.toString2 does not exist\. Did you mean str\.tostring\b/],
    [() => (request as unknown as Record<string, unknown>).securty, /Did you mean request\.security\b/],
  ])('%#: throws with the closest names', (read, message) => {
    expect(read).toThrow(TypeError);
    expect(read).toThrow(message);
  });

  it('a name without a close match still throws', () => {
    expect(() => (ta as unknown as Record<string, unknown>).qwertyuiop).toThrow(/^ta\.qwertyuiop does not exist\. See/);
  });

  it('probes of tools and the object methods stay undefined or inherited', () => {
    const t = ta as unknown as Record<string, unknown>;
    expect(t.then).toBeUndefined();
    expect(t.toJSON).toBeUndefined();
    expect(t.__esModule).toBeUndefined();
    expect(typeof t.hasOwnProperty).toBe('function');
    expect('sma' in ta).toBe(true);
    expect({ ...ta }.sma).toBe(ta.sma);
    expect(Object.keys(color)).toContain('purple');
  });

  it('the members still work', () => {
    const out = run(() => {
      indicator('t');
      plot(ta.sma(close, input.int(5, 'Length')), 'SMA', { color: color.new(color.purple, 50) });
    });
    expect(out.result.plots.plot0!.length).toBe(BARS.length - 4);
  });
});
