/**
 * Intrabar runs of a strategy (executeIntrabar): a nested run on the bars up to a bar, the bars before replaying
 * the main run's engine answers, variables rolled back, varip kept, the outer run left as it was.
 */
import {
  barstate,
  close,
  executeIntrabar,
  executeScript,
  plot,
  strategy,
  StrategyRecorder,
  ta,
  varip,
  type StrategyEngine,
} from '../../src/script';
import type { Bar } from '../../src/types';

const BARS: Bar[] = [10, 11, 12, 11, 13, 14].map((c, i) => ({
  time: 1700000000 + i * 86400,
  open: c - 0.5,
  high: c + 1,
  low: c - 1,
  close: c,
  volume: 100,
}));

/** An engine whose position_size is the bar index (so a replay is visible) and that logs the order calls. */
function engine(log: string[], onBar?: (bar: number) => void): StrategyEngine {
  let bar = -1;
  const none = (): void => {};
  return {
    processBar: (b) => {
      bar = b;
      onBar?.(b);
    },
    processClose: none,
    entry: (id) => log.push(`entry ${id} @${bar}`),
    order: none,
    exit: none,
    close: none,
    close_all: none,
    cancel: none,
    cancel_all: none,
    get: (name) => (name === 'position_size' ? bar : undefined),
    openTrade: () => undefined,
    closedTrade: () => undefined,
  };
}

describe('executeIntrabar', () => {
  it('re-runs a bar inside the main run, replays the bars before and keeps the outer run', () => {
    const log: string[] = [];
    const seen: string[] = [];
    const recorder = new StrategyRecorder();
    let inner: (() => void) | null = null;
    const body = () => {
      strategy('S');
      const sma = ta.sma(close, 2);
      const last = barstate.islast.toArray();
      let count = 0; // a `var`: rolled back in an intrabar run
      const kept = varip(0);
      strategy.eachBar((c) => {
        count += 1;
        kept.value += 1;
        const size = strategy.position_size;
        seen.push(`${c.i}:${c.close}:${c.get(sma)}:${size}:${count}:${kept.value}:${last[c.i]}:${c.n}`);
        if (c.close > 13) strategy.entry('L', strategy.long);
      });
      plot(sma, 'sma');
    };
    const main = engine(log, (bar) => {
      if (bar === 3) inner?.();
    });
    inner = () => {
      const bars = BARS.slice(0, 4);
      bars[3] = { ...BARS[3]!, close: 14 };
      seen.push('--');
      executeIntrabar(body, bars, {}, {}, { bar: 3, lastBarIndex: BARS.length - 1, engine: main, recorder });
      seen.push('--');
    };
    const result = executeScript(body, BARS, {}, {}, { strategyEngine: () => main, recorder });
    // The intrabar run: bars 0-2 replayed (sizes 0, 1, 2 as the main run read them), bar 3 at the tick close 14
    // calls the main engine (position_size 3), the var counter rolled back to 4 at bar 3, the varip one kept.
    const at = seen.indexOf('--');
    expect(seen.slice(at + 1, seen.indexOf('--', at + 1))).toEqual([
      '0:10:NaN:0:1:1:0:6',
      '1:11:10.5:1:2:2:0:6',
      '2:12:11.5:2:3:3:0:6',
      '3:14:13:3:4:4:0:6',
    ]);
    // The main run goes on as before the nested run: its own values, the varip one counted by both runs.
    expect(seen.slice(seen.lastIndexOf('--') + 1)).toEqual([
      '3:11:11.5:3:4:5:0:6',
      '4:13:12:4:5:6:0:6',
      '5:14:13.5:5:6:7:1:6',
    ]);
    // The entry of the intrabar run went to the main engine on bar 3; replayed bars placed nothing.
    expect(log).toEqual(['entry L @3', 'entry L @5']);
    // The outputs are the main run's.
    expect(Object.values(result.result.plots)[0]?.map((p) => p.value)).toEqual([10.5, 11.5, 11.5, 12, 13.5]);
  });

  it('declares no risk rule again and treats the bar as a confirmed history bar', () => {
    const recorder = new StrategyRecorder();
    let rules = 0;
    const confirmed: number[] = [];
    const main: StrategyEngine = { ...engine([]), risk: () => void rules++ };
    const body = () => {
      strategy('S');
      strategy.risk.allow_entry_in(strategy.direction.long);
      const flag = barstate.isconfirmed.toArray();
      strategy.eachBar((c) => {
        confirmed.push(flag[c.i]!);
      });
    };
    executeScript(body, BARS, {}, {}, { strategyEngine: () => main, recorder });
    confirmed.length = 0;
    executeIntrabar(body, BARS.slice(0, 3), {}, {}, { bar: 2, lastBarIndex: 5, engine: main, recorder });
    expect(rules).toBe(1);
    expect(confirmed).toEqual([1, 1, 1]);
  });
});
