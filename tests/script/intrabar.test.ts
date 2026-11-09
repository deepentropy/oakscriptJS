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
  persist,
  eachBar,
  math,
  last_bar_index,
  type IntrabarUpdate,
  type StrategyEngine,
  type StrategySetup,
} from '../../src/script';
import { TestEngine } from '../../src/check/harness';
import type {
  StrategyDirection,
  StrategyEntryOptions,
  StrategyExitOptions,
  StrategyVariable,
} from '../../src/strategy';
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

// ── Resumed intrabar runs (#206) ─────────────────────────────────────────────

function makeBars(n: number, seed: number): Bar[] {
  let s = seed;
  const r = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  let p = 100;
  return Array.from({ length: n }, (_, i) => {
    const o = p;
    p = Math.max(1, p * (1 + (r() - 0.5) * 0.06));
    const c = i % 37 === 5 ? o : p;
    return {
      time: 1700000000 + i * 86400,
      open: o,
      high: Math.max(o, c) * (1 + r() * 0.01),
      low: Math.min(o, c) * (1 - r() * 0.01),
      close: c,
      volume: 1000 + Math.floor(r() * 500),
    };
  });
}

/** The ticks of a history bar: the open, a middle price, then the bar itself. */
function barTicks(bar: Bar): Bar[] {
  const mid = (bar.open + bar.close) / 2;
  return [
    { ...bar, high: bar.open, low: bar.open, close: bar.open },
    { ...bar, high: Math.max(bar.open, mid), low: Math.min(bar.open, mid), close: mid },
    bar,
  ];
}

const LONG = makeBars(150, 11);

interface Backtest {
  /** The order calls the engine received, with the bar and the tick they came from */
  log: string[];
  closed: unknown[];
  varip: unknown[];
  updates: IntrabarUpdate[];
  reason: string | null;
}

/**
 * A backtest with intrabar runs on the ticks of every bar but every 5th one (`resume` passed to executeIntrabar):
 * the host engine calls executeIntrabar from processBar, as a broker does.
 */
function backtest(body: () => void, resume: boolean): Backtest {
  const log: string[] = [];
  const updates: IntrabarUpdate[] = [];
  const recorder = new StrategyRecorder();
  let where = 'main';
  class Host extends TestEngine {
    override processBar(bar: number): void {
      super.processBar(bar);
      if (bar % 5 === 3) return;
      barTicks(LONG[bar]!).forEach((tick, t) => {
        where = `${bar}.${t}`;
        const bars = [...LONG.slice(0, bar), tick];
        updates.push(executeIntrabar(body, bars, {}, {}, { bar, lastBarIndex: LONG.length - 1, engine: this, recorder, resume }));
        where = 'main';
      });
    }
    override entry(id: string, direction: StrategyDirection, options: StrategyEntryOptions): void {
      log.push(`${where} entry ${id} ${direction} ${JSON.stringify(options)}`);
      super.entry(id, direction, options);
    }
    override exit(id: string, options: StrategyExitOptions): void {
      log.push(`${where} exit ${id} ${JSON.stringify(options)}`);
      super.exit(id, options);
    }
    override cancel(id: string): void {
      log.push(`${where} cancel ${id}`);
      super.cancel(id);
    }
  }
  let engine: TestEngine | null = null;
  executeScript(body, LONG, {}, {}, { strategyEngine: (setup: StrategySetup) => (engine = new Host(setup)), recorder });
  return { log, closed: engine!.closed, varip: [...recorder.varip], updates, reason: recorder.intrabarFullRunReason };
}

/** A strategy whose state is in persist() boxes, ta.* calls and a varip counter; it writes what it reads in cancel ids. */
const stats = { callbacks: 0 };
const tally = (): void => void stats.callbacks++;
const resumable = (): void => {
  strategy('R');
  const fast = ta.ema(close, 5);
  const slow = ta.sma(close, 12);
  const rsi = ta.rsi(close, 7);
  const islast = barstate.islast;
  const ups = persist(0);
  const trend = eachBar((c) => {
    if (c.close > c.get(close, 1)) ups.value += 1;
    return ups.value;
  });
  const recent = persist<number[]>([]);
  const ticks = varip(0);
  strategy.eachBar((c) => {
    tally();
    ticks.value += 1;
    recent.value.push(c.close);
    if (recent.value.length > 4) recent.value.shift();
    const size = strategy.position_size;
    strategy.cancel(
      `${c.i}|${c.get(fast)}|${c.get(slow)}|${c.get(rsi)}|${c.get(trend)}|${recent.value.join(',')}|${ticks.value}|` +
        `${size}|${c.n}|${c.get(last_bar_index)}|${c.get(islast)}`
    );
    if (c.get(fast) > c.get(slow) && size <= 0) strategy.entry('L', strategy.long);
    if (c.get(fast) < c.get(slow) && size >= 0) strategy.entry('S', strategy.short);
    if (size !== 0) strategy.exit('X', { from_entry: size > 0 ? 'L' : 'S', profit: 50, loss: 40 });
  });
};

describe('executeIntrabar resumed from the state at the start of the bar (#206)', () => {
  it('gives the same order calls, trades and varip values as the full replay, one bar per tick', () => {
    stats.callbacks = 0;
    const full = backtest(resumable, false);
    const fullCallbacks = stats.callbacks;
    stats.callbacks = 0;
    const resumed = backtest(resumable, true);
    expect(resumed.reason).toBeNull();
    expect(resumed.log).toEqual(full.log);
    expect(resumed.log.length).toBeGreaterThan(400);
    expect(resumed.closed).toEqual(full.closed);
    expect(resumed.closed.length).toBeGreaterThan(3);
    expect(resumed.varip).toEqual(full.varip);
    // c.n, last_bar_index and barstate.islast keep the chart's last bar in an intrabar run
    expect(full.log.filter((l) => l.startsWith('7.1 cancel 7|') && l.endsWith('|150|149|0'))).toHaveLength(1);
    // the first run records, the next ones resume from the previous intrabar run's bar
    expect(resumed.updates[0]).toMatchObject({ from: 0, incremental: false });
    expect(resumed.updates.slice(1).every((u) => u.incremental)).toBe(true);
    expect(resumed.updates[1]).toMatchObject({ from: 0, incremental: true });
    expect(resumed.updates[4]).toMatchObject({ from: 1, incremental: true });
    // the main run, about two bars per tick, and the 2 verified runs in full
    expect(stats.callbacks).toBeLessThan(150 + resumed.updates.length * 2 + 10);
    expect(fullCallbacks).toBeGreaterThan(stats.callbacks * 10);
  });

  it('keeps the full replay for a script with state outside the runtime, and names the reason', () => {
    const body = (): void => {
      strategy('P');
      let count = 0;
      strategy.eachBar((c) => {
        count += 1;
        strategy.cancel(`${c.i}|${count}`);
      });
    };
    const full = backtest(body, false);
    const resumed = backtest(body, true);
    expect(resumed.reason).toMatch(/count/);
    expect(resumed.updates.every((u) => !u.incremental)).toBe(true);
    expect(resumed.log).toEqual(full.log);
  });

  it('a run stopped in the middle makes no order call: the full run makes them once', () => {
    const body = (): void => {
      strategy('M');
      const n = persist(0);
      strategy.eachBar((c) => {
        n.value += 1;
        strategy.cancel(`${c.i}|${n.value}`);
        // a feature that is not resumed, met on a later bar only
        if (c.i === 60) strategy.cancel(`random ${math.random(0, 1, 7)}`);
      });
    };
    const full = backtest(body, false);
    const resumed = backtest(body, true);
    expect(resumed.reason).toBe('math.random');
    expect(resumed.log).toEqual(full.log);
    const at = resumed.updates.findIndex((u, k) => k > 0 && !u.incremental);
    expect(at).toBeGreaterThan(100);
    expect(resumed.updates.slice(1, at).every((u) => u.incremental)).toBe(true);
  });

  it('finds an engine whose reads change with the order calls of the bar (verified runs), then runs in full', () => {
    // opentrades counts the entry calls at once: a resumed run, which gives its calls at its end, reads other values
    const eager = (): void => {
      strategy('E');
      const n = persist(0);
      strategy.eachBar((c) => {
        n.value += 1;
        strategy.entry('L', strategy.long);
        strategy.cancel(`${c.i}|${n.value}|${strategy.opentrades}`);
      });
    };
    const run = (resume: boolean): { log: string[]; reason: string | null } => {
      const recorder = new StrategyRecorder();
      const log: string[] = [];
      class Eager extends TestEngine {
        calls = 0;
        override entry(id: string, direction: StrategyDirection, options: StrategyEntryOptions): void {
          this.calls++;
          super.entry(id, direction, options);
        }
        override get(variable: StrategyVariable): number | string | undefined {
          return variable === 'opentrades' ? this.calls : super.get(variable);
        }
        override cancel(id: string): void {
          log.push(id);
        }
        override processBar(bar: number): void {
          super.processBar(bar);
          if (bar < 2) return;
          const tick = barTicks(LONG[bar]!)[0]!;
          executeIntrabar(eager, [...LONG.slice(0, bar), tick], {}, {}, {
            bar,
            lastBarIndex: 29,
            engine: this,
            recorder,
            resume,
          });
        }
      }
      executeScript(eager, LONG.slice(0, 30), {}, {}, { strategyEngine: (setup) => new Eager(setup), recorder });
      return { log, reason: recorder.intrabarFullRunReason };
    };
    const full = run(false);
    const resumed = run(true);
    expect(resumed.reason).toMatch(/differs from a full run/);
    expect(resumed.log).toEqual(full.log);
  });
});
