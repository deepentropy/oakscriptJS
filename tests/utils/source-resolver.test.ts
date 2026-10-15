/**
 * Study on study: a source input naming another source reads the host's values (#103 of the app).
 */
import { getSource, getSourceSeries, setSourceResolver } from '../../src';
import type { Bar } from '../../src';
import { executeScript, input } from '../../src/script';

const bars: Bar[] = [1, 2, 3, 4].map((i) => ({ time: i * 86400, open: i, high: i + 1, low: i - 1, close: i + 0.5, volume: 10 * i }));

describe('source resolver', () => {
  afterEach(() => setSourceResolver(null));

  it('unknown names fall back to close without a resolver', () => {
    expect(getSource(bars, 'rsi$0' as never)).toEqual([1.5, 2.5, 3.5, 4.5]);
    expect(getSourceSeries(bars, 'rsi$0' as never).toArray()).toEqual([1.5, 2.5, 3.5, 4.5]);
  });

  it('reads the host values aligned with the bars (NaN past them)', () => {
    setSourceResolver((name) => (name === 'rsi$0' ? [50, 60, 70] : null));
    expect(getSource(bars, 'rsi$0' as never)).toEqual([50, 60, 70, NaN]);
    expect(getSourceSeries(bars, 'rsi$0' as never).toArray()).toEqual([50, 60, 70, NaN]);
    // Unknown to the host: close.
    expect(getSource(bars, 'other$1' as never)).toEqual([1.5, 2.5, 3.5, 4.5]);
    // Built-ins never go to the host.
    expect(getSource(bars, 'hl2')).toEqual([1, 2, 3, 4]);
  });

  it('input.source of a script reads the host values', () => {
    setSourceResolver((name) => (name === 'rsi$0' ? [50, 60, 70, 80] : null));
    let v: number[] = [];
    executeScript(() => { v = input.source('close', 'Source').toArray(); }, bars, { source: 'rsi$0' });
    expect(v).toEqual([50, 60, 70, 80]);
  });
});
