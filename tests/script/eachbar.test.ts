/**
 * Tests for eachBar() — the per-bar stateful execution mode of the script API.
 */
import {
  executeScript,
  indicator,
  plot,
  eachBar,
  seriesOf,
  ta,
  close,
  high,
} from '../../src/script';
import type { Bar } from '../../src/types';

function makeBars(closes: number[]): Bar[] {
  return closes.map((c, i) => ({
    time: 1700000000 + i * 86400,
    open: c - 1,
    high: c + 1,
    low: c - 2,
    close: c,
    volume: 1000 + i,
  }));
}

const BARS = makeBars([100, 102, 101, 103, 105, 104, 106, 108, 107, 109, 108, 111]);

/** Runs a body and returns a captured value from inside it. */
function capture<T>(body: () => T, bars: Bar[] = BARS): T {
  let result!: T;
  executeScript(() => {
    indicator('t');
    result = body();
  }, bars);
  return result;
}

describe('eachBar', () => {
  test('recursive EMA written per-bar matches vectorized ta.ema', () => {
    const len = 3;
    const [mine, ref] = capture(() => {
      const myEma = eachBar((c) => {
        if (c.i < len - 1) return; // warm-up → na
        if (c.i === len - 1) {
          let sum = 0;
          for (let k = 0; k < len; k++) sum += c.get(close, k);
          return sum / len; // SMA seed
        }
        const alpha = 2 / (len + 1);
        return alpha * c.close + (1 - alpha) * c.prev(); // ema := α·src + (1-α)·ema[1]
      });
      return [myEma.toArray(), ta.ema(close, len).toArray()];
    });
    expect(mine).toHaveLength(ref.length);
    for (let i = 0; i < ref.length; i++) {
      if (Number.isNaN(ref[i]!)) expect(mine[i]).toBeNaN();
      else expect(mine[i]).toBeCloseTo(ref[i]!, 10);
    }
  });

  test('closure let variables act as PineScript var state', () => {
    const dirs = capture(() => {
      let dir = 0; // var dir = 0
      return eachBar((c) => {
        const prevClose = c.get(close, 1);
        if (c.close > prevClose) dir = 1; // dir := 1
        else if (c.close < prevClose) dir = -1;
        return dir;
      }).toArray();
    });
    // closes: 100,102,101,103,105,104,...
    expect(dirs.slice(0, 6)).toEqual([0, 1, -1, 1, 1, -1]);
  });

  test('for-loop highest matches ta.highest', () => {
    const [mine, ref] = capture(() => {
      const h = eachBar((c) => {
        if (c.i < 2) return;
        let best = -Infinity;
        for (let k = 0; k < 3; k++) best = Math.max(best, c.get(high, k));
        return best;
      });
      return [h.toArray(), ta.highest(high, 3).toArray()];
    });
    for (let i = 2; i < ref.length; i++) {
      expect(mine[i]).toBeCloseTo(ref[i]!, 10);
    }
  });

  test('boolean returns collect as 1/0, void as NaN, out-of-range history as NaN', () => {
    const vals = capture(() =>
      eachBar((c) => {
        if (c.i === 0) return; // NaN
        return c.get(close, 5) > 0; // NaN comparison → false for early bars
      }).toArray()
    );
    expect(vals[0]).toBeNaN();
    expect(vals[1]).toBe(0); // close[5] is NaN → comparison false
    expect(vals[6]).toBe(1); // close[5] = 102 at i=6... closes[1]=102 > 0
  });

  test('prev() clamps offset to at least 1 and returns NaN before start', () => {
    const cum = capture(() =>
      eachBar((c) => {
        const before = c.prev(); // NaN on first bar
        return (Number.isNaN(before) ? 0 : before) + c.close;
      }).toArray()
    );
    expect(cum[0]).toBe(100);
    expect(cum[1]).toBe(202);
    expect(cum[2]).toBe(303);
  });

  test('result is a Series usable by plot() and ta.*', () => {
    const run = executeScript(() => {
      indicator('EachBarPlot');
      const s = eachBar((c) => c.close - c.open);
      plot(ta.sma(s, 2), 'smoothed');
    }, BARS);
    expect(run.result.plots['plot0']!.length).toBeGreaterThan(0);
  });

  test('seriesOf wraps side outputs accumulated in the loop', () => {
    const run = executeScript(() => {
      indicator('Side');
      const upper: number[] = [];
      eachBar((c) => {
        upper.push(c.high + 1);
        return c.close;
      });
      plot(seriesOf(upper), 'upper');
    }, BARS);
    expect(run.result.plots['plot0']!).toHaveLength(BARS.length);
  });

  test('throws outside executeScript', () => {
    expect(() => eachBar(() => 1)).toThrow(/executeScript/);
  });
});

describe('history reference limit (PineScript RE10008, issue #149)', () => {
  const many = makeBars(Array.from({ length: 5200 }, (_, i) => 100 + (i % 50)));
  const run = (body: () => void) => {
    try {
      executeScript(body, many);
      return null;
    } catch (e) {
      return (e as Error).message;
    }
  };

  it('a reference above 5000 bars back stops the script at once', () => {
    const msg = run(() => {
      indicator('limit');
      const x = eachBar((c) => c.close * 1);
      plot(eachBar((c) => c.get(x, c.i >= 5100 ? 5001 : 0)), 'v');
    });
    expect(msg).toContain('Error on bar 5100');
    expect(msg).toContain('(5001 bars back)');
  });

  it('a growing reference x[bar_index] stops on bar 4348 with 7032 bars back (buffer 242, x 1.618034)', () => {
    const msg = run(() => {
      indicator('grow');
      const x = eachBar((c) => c.close * 1);
      plot(eachBar((c) => c.get(x, c.i)), 'v');
    });
    expect(msg).toContain('Error on bar 4348');
    expect(msg).toContain('(7032 bars back)');
  });

  it('Series.offset above 5000 throws for a script series, not for the built-in close', () => {
    expect(run(() => {
      indicator('offset');
      const x = eachBar((c) => c.close * 1);
      plot(x.offset(5001), 'v');
    })).toContain('(5001 bars back)');
    expect(run(() => {
      indicator('offset close');
      plot(close.offset(5100), 'v');
    })).toBeNull();
  });

  it('a jump that stays, a loop within 5000 and the built-in close run without error', () => {
    expect(run(() => {
      indicator('jump');
      const x = eachBar((c) => c.close * 1);
      plot(eachBar((c) => c.get(x, c.i >= 3300 ? 3200 : 0)), 'v');
    })).toBeNull();
    expect(run(() => {
      indicator('builtin');
      plot(eachBar((c) => c.get(close, c.i)), 'v');
    })).toBeNull();
  });
});
