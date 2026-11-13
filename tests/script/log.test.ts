/**
 * log.info / log.warning / log.error: the messages of a run in result.logs.
 */
import { createScriptRun, executeScript, eachBar, indicator, log, close, setLogLineResolver, MAX_LOG_ENTRIES, persist } from '../../src/script';
import type { Bar } from '../../src/types';

function makeBars(closes: number[]): Bar[] {
  return closes.map((c, i) => ({ time: 1700000000 + i * 86400, open: c - 1, high: c + 1, low: c - 2, close: c, volume: 1000 + i }));
}

const BARS = makeBars([100, 102, 101, 103, 105, 104, 106, 108, 107, 109]);

describe('log.*', () => {
  test('inside eachBar: one message on the bar, with its level, bar and time; arguments formatted', () => {
    const run = executeScript(() => {
      indicator('Logs');
      eachBar((c) => {
        if (c.i === 2) log.info('close {0}', c.close);
        if (c.i === 5) log.warning('warn');
        if (c.i === 9) log.error('bar {0} of {1}', c.i, 1000);
      });
    }, BARS);
    expect(run.result.logs).toEqual([
      { bar: 2, time: BARS[2]!.time, level: 'info', message: 'close 101' },
      { bar: 5, time: BARS[5]!.time, level: 'warning', message: 'warn' },
      { bar: 9, time: BARS[9]!.time, level: 'error', message: 'bar 9 of 1,000' },
    ]);
  });

  test('at the top level: a message on every bar, a Series argument read on each bar, na text makes none', () => {
    const run = executeScript(() => {
      indicator('Top');
      log.info('c={0}', close);
      log.warning(BARS.map((_, i) => (i === 4 ? 'four' : undefined)));
    }, BARS);
    const logs = run.result.logs!;
    expect(logs.filter((e) => e.level === 'info').map((e) => e.message)).toEqual(BARS.map((b) => `c=${b.close}`));
    expect(logs.filter((e) => e.level === 'warning')).toEqual([{ bar: 4, time: BARS[4]!.time, level: 'warning', message: 'four' }]);
  });

  test('no log call: no logs; a message without arguments is not formatted', () => {
    expect(executeScript(() => indicator('None'), BARS).result.logs).toBeUndefined();
    const run = executeScript(() => {
      indicator('Raw');
      eachBar((c) => {
        if (c.i === 0) log.info("it's {0}");
      });
    }, BARS);
    expect(run.result.logs![0]!.message).toBe("it's {0}");
  });

  test('the line resolver gets the stack of the call; null leaves the line out', () => {
    const stacks: string[] = [];
    setLogLineResolver((stack) => {
      stacks.push(stack);
      return 42;
    });
    try {
      const run = executeScript(() => {
        indicator('Lines');
        eachBar((c) => {
          if (c.i === 1) log.info('x');
        });
      }, BARS);
      expect(run.result.logs![0]!.line).toBe(42);
      expect(stacks[0]).toMatch(/log\.test/);
    } finally {
      setLogLineResolver(null);
    }
  });

  test('a run keeps the newest MAX_LOG_ENTRIES messages', () => {
    const many = makeBars(Array.from({ length: 3 }, (_, i) => 100 + i));
    const run = executeScript(() => {
      indicator('Many');
      eachBar((c) => {
        for (let k = 0; k < MAX_LOG_ENTRIES; k++) log.info('m {0}', c.i * MAX_LOG_ENTRIES + k);
      });
    }, many);
    const logs = run.result.logs!;
    expect(logs.length).toBe(MAX_LOG_ENTRIES);
    expect(logs[logs.length - 1]!.bar).toBe(2);
    expect(logs[0]!.bar).toBe(2);
  });

  test('a resumed update has the messages of a full run (the bars before it kept from the update before)', () => {
    const bars = makeBars(Array.from({ length: 40 }, (_, i) => 100 + Math.sin(i) * 5));
    const body = () => {
      indicator('Resumed');
      const count = persist(0);
      eachBar((c) => {
        count.value++;
        if (c.i % 3 === 0) log.info('bar {0} count {1}', c.i, count.value);
      });
      log.warning('top {0}', close);
    };
    const run = createScriptRun(body, {}, {}, { verify: 0 });
    run.update(bars.slice(0, 30));
    for (let k = 30; k <= bars.length; k++) {
      const got = run.update(bars.slice(0, k));
      expect(got.result.logs).toEqual(executeScript(body, bars.slice(0, k)).result.logs);
    }
    expect(run.fullRunReason).toBeNull();
  });
});
