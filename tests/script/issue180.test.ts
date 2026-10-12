/**
 * #180: two-series rsi (PineScript v4), the sign of a negative percent that rounds to zero, input.symbol, and
 * syminfo.basecurrency / syminfo.root. Expected values are PineScript results of the same calls (BITSTAMP:BTCUSD 1D).
 */
import { input as coreInput, str, taCore } from '../../src';
import { executeScript, input, syminfo } from '../../src/script';

const na = NaN;
const bits = (v: number[]) => v.map((x) => (Number.isNaN(x) ? 'na' : String(x)));

describe('rsi(x, y) with two series (PineScript v4)', () => {
  it('100 - 100 / (1 + x / y), 100 when y is within 1e-10 of zero, 0 when x is, -Infinity when x = -y (#182)', () => {
    const x = [0, 11.69, 11.7, 0, 8.22, 0.6999999999999993, 0, 0, 1, 3.0600000000000005, na, na, 0.20000000000000018];
    const y = [0, 0.16000000000000014, 0, 0, -0.22000000000000064, -0.6999999998999993, 2e-10, 4e-10, -0.9999999995, -2.7499999992, -0.88, 0, -0.20000000000000018];
    expect(bits(taCore.rsi(x, y))).toEqual(bits([
      100, 98.64978902953587, 100, 100, 102.75000000000001, 700000408475.6489, 0, 0, 199999983551.92715, 987.0967716462003, na, 100, -Infinity,
    ]));
  });

  it('the length form is unchanged', () => {
    expect(() => taCore.rsi([1, 2, 3], 0)).toThrow("in the 'rsi' function");
  });
});

describe('str.tostring: a negative percent that rounds to zero keeps its sign', () => {
  it.each([
    [-0.0004, '#.#%', '-0%'], [-0.0004, '#%', '-0%'], [-0.0004, '0.0%', '-0.0%'], [-0.0005, '#.#%', '-0.1%'],
    [-1e-8, '#.##%', '-0%'], [-0, '#.#%', '0%'], [0.0004, '#.#%', '0%'], [-0.0004, '#.#', '0'], [-0.0004, '0.0', '0.0'],
    [-0.0004, 'percent', '0.00%'], [-0.04, 'percent', '-0.04%'],
  ])('%p with %p gives %p', (v, f, want) => {
    expect(str.tostring(v as number, f as string)).toBe(want);
  });
});

describe('input.symbol and syminfo of other symbols', () => {
  it('input.symbol declares a symbol input', () => {
    let v = '';
    const run = executeScript(() => { v = input.symbol('NASDAQ:MSFT', 'Compare with'); }, [], { compare_with: 'AMEX:SPY' });
    expect(v).toBe('AMEX:SPY');
    expect(run.inputConfig[0]).toMatchObject({ id: 'compare_with', type: 'symbol', defval: 'NASDAQ:MSFT' });
    expect(coreInput.symbol('NASDAQ:MSFT').type).toBe('symbol');
  });

  it('syminfo.basecurrency and syminfo.root come from the chart context', () => {
    let out: string[] = [];
    executeScript(() => { out = [syminfo.basecurrency, syminfo.root]; }, [], {}, { basecurrency: 'BTC', root: 'BTC' });
    expect(out).toEqual(['BTC', 'BTC']);
    expect(() => executeScript(() => { void syminfo.root; }, [], {}, {})).toThrow('syminfo.root is not known');
  });
});
