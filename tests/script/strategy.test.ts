/**
 * strategy() declaration and strategy.* API: calls are forwarded to the engine the host supplies.
 */
import {
  executeScript,
  indicator,
  strategy,
  close,
  ta,
  STRATEGY_DEFAULTS,
  type StrategyEngine,
  type StrategySetup,
  type StrategyTrade,
  type StrategyVariable,
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

/** Test engine: market entries fill at the next bar open; logs every call. */
class FakeEngine implements StrategyEngine {
  log: string[] = [];
  size = 0;
  price = NaN;
  pending: { id: string; qty: number } | null = null;
  trades: StrategyTrade[] = [];
  constructor(readonly setup: StrategySetup) {}
  processBar(bar: number): void {
    this.log.push(`processBar ${bar}`);
    if (this.pending) {
      this.size = this.pending.qty;
      this.price = this.setup.bars[bar]!.open;
      this.pending = null;
    }
  }
  processClose(bar: number): void {
    this.log.push(`processClose ${bar}`);
  }
  entry(id: string, direction: 'long' | 'short', options: object): void {
    this.log.push(`entry ${id} ${direction} ${JSON.stringify(options)}`);
    this.pending = { id, qty: direction === 'long' ? 1 : -1 };
  }
  order(id: string): void {
    this.log.push(`order ${id}`);
  }
  exit(id: string, options: object): void {
    this.log.push(`exit ${id} ${JSON.stringify(options)}`);
  }
  close(id: string, options: object): void {
    this.log.push(`close ${id} ${JSON.stringify(options)}`);
  }
  close_all(options: object): void {
    this.log.push(`close_all ${JSON.stringify(options)}`);
  }
  cancel(id: string): void {
    this.log.push(`cancel ${id}`);
  }
  cancel_all(): void {
    this.log.push('cancel_all');
  }
  get(variable: StrategyVariable): number | string | undefined {
    if (variable === 'position_size') return this.size;
    if (variable === 'position_avg_price') return this.price;
    if (variable === 'opentrades') return this.size === 0 ? 0 : 1;
    if (variable === 'account_currency') return 'USD';
    return undefined;
  }
  openTrade(index: number): StrategyTrade | undefined {
    return this.trades[index];
  }
  closedTrade(): StrategyTrade | undefined {
    return undefined;
  }
}

function run(body: () => void, withEngine = true) {
  let engine: FakeEngine | undefined;
  const result = executeScript(body, BARS, {}, {}, withEngine
    ? { strategyEngine: (setup) => (engine = new FakeEngine(setup)) }
    : {});
  return { result, engine: engine! };
}

describe('strategy() declaration', () => {
  it('metadata and properties: declared values, else the PineScript defaults', () => {
    const { result, engine } = run(() => {
      strategy('Test', { shorttitle: 'T', initial_capital: 10000, default_qty_type: strategy.percent_of_equity,
        default_qty_value: 100, commission_value: 0.1, process_orders_on_close: true, currency: 'EUR' });
    });
    expect(result.metadata).toMatchObject({ title: 'Test', shortTitle: 'T', overlay: false });
    const expected = { ...STRATEGY_DEFAULTS, initial_capital: 10000, default_qty_type: 'percent_of_equity',
      default_qty_value: 100, commission_value: 0.1, process_orders_on_close: true, currency: 'EUR' };
    expect(result.strategyConfig).toEqual(expected);
    expect(engine.setup.properties).toEqual(expected);
    expect(engine.setup.bars).toHaveLength(BARS.length);
  });

  it('PineScript defaults', () => {
    expect(STRATEGY_DEFAULTS).toMatchObject({ pyramiding: 0, default_qty_type: 'fixed', default_qty_value: 1,
      initial_capital: 1000000, commission_type: 'percent', close_entries_rule: 'FIFO', margin_long: 100,
      margin_short: 100, risk_free_rate: 2 });
  });

  it('a script has one declaration', () => {
    expect(() => run(() => { indicator('I'); strategy('S'); })).toThrow('already declared indicator()');
    expect(() => run(() => { strategy('S'); indicator('I'); })).toThrow('already declared strategy()');
  });

  it('an indicator has no strategyConfig', () => {
    expect(run(() => indicator('I')).result.strategyConfig).toBeUndefined();
  });
});

describe('strategy.eachBar', () => {
  it('per bar: processBar, then the callback at the close, then processClose', () => {
    const { engine } = run(() => {
      strategy('S');
      strategy.eachBar((c) => {
        if (c.i === 1) strategy.entry('L', strategy.long);
      });
    });
    expect(engine.log.slice(0, 7)).toEqual([
      'processBar 0', 'processClose 0',
      'processBar 1', 'entry L long {}', 'processClose 1',
      'processBar 2', 'processClose 2',
    ]);
  });

  it('strategy.* variables are read from the engine on the current bar', () => {
    let seen: number[] = [];
    const { result } = run(() => {
      strategy('S');
      const up = ta.crossover(close, ta.sma(close, 2));
      const size = strategy.eachBar((c) => {
        if (c.get(up) && strategy.position_size === 0) strategy.entry('L', strategy.long);
        return strategy.position_size;
      });
      seen = size.toArray();
    });
    // close 10, 11, 12, 11, 13, 14: crossover on bar 4 (13 > 12); filled at the open of bar 5
    expect(seen).toEqual([0, 0, 0, 0, 0, 1]);
    expect(result.strategyConfig).toBeDefined();
  });

  it('na options are removed; other options are passed unchanged', () => {
    const { engine } = run(() => {
      strategy('S');
      strategy.eachBar((c) => {
        if (c.i !== 0) return;
        strategy.exit('X', { from_entry: 'L', stop: NaN, limit: 12.5, comment_loss: 'SL' });
        strategy.close('L', { qty_percent: 50, comment: undefined });
        strategy.close_all({ immediately: true });
        strategy.cancel('X');
        strategy.cancel_all();
        strategy.order('O', strategy.short, { qty: 2 });
      });
    });
    expect(engine.log.slice(1, 7)).toEqual([
      'exit X {"from_entry":"L","limit":12.5,"comment_loss":"SL"}',
      'close L {"qty_percent":50}',
      'close_all {"immediately":true}',
      'cancel X',
      'cancel_all',
      'order O',
    ]);
  });

  it('runs once per script run, and order calls must be inside it', () => {
    expect(() => run(() => {
      strategy('S');
      strategy.eachBar(() => undefined);
      strategy.eachBar(() => undefined);
    })).toThrow('runs once per script run');
    expect(() => run(() => {
      strategy('S');
      strategy.entry('L', strategy.long);
    })).toThrow('strategy.entry() must be called inside strategy.eachBar()');
  });

  it('variables can be read after the loop (final state)', () => {
    let after = NaN;
    run(() => {
      strategy('S');
      strategy.eachBar((c) => {
        if (c.i === 0) strategy.entry('S', strategy.short);
      });
      after = strategy.position_size;
    });
    expect(after).toBe(-1);
  });
});

describe('engine errors and optional features', () => {
  it('without an engine, the declaration works and strategy.* calls throw', () => {
    const { result } = run(() => strategy('S', { pyramiding: 3 }), false);
    expect(result.strategyConfig?.pyramiding).toBe(3);
    expect(() => run(() => {
      strategy('S');
      strategy.eachBar(() => undefined);
    }, false)).toThrow('no strategy engine');
  });

  it('without strategy(), strategy.* calls throw', () => {
    expect(() => run(() => strategy.position_size)).toThrow('declare the script with strategy() first');
  });

  it('a variable the engine does not provide throws; text variables work', () => {
    let currency = '';
    run(() => {
      strategy('S');
      currency = strategy.account_currency;
    });
    expect(currency).toBe('USD');
    expect(() => run(() => {
      strategy('S');
      return strategy.max_drawdown;
    })).toThrow('strategy.max_drawdown is not provided by the strategy engine');
  });

  it('trades, risk rules and default_entry_qty are forwarded when the engine has them', () => {
    const trade = { entry_id: 'L', entry_price: 10, entry_bar_index: 1, entry_time: 0, entry_comment: '', size: 1,
      profit: 2, profit_percent: 20, commission: 0, max_runup: 3, max_runup_percent: 30, max_drawdown: 1,
      max_drawdown_percent: 10 };
    const rules: unknown[] = [];
    let got: unknown[] = [];
    executeScript(() => {
      strategy('S');
      strategy.risk.allow_entry_in(strategy.direction.long);
      strategy.risk.max_intraday_loss(2, strategy.percent_of_equity);
      got = [strategy.opentrade(0), strategy.opentrade(1), strategy.default_entry_qty(10)];
    }, BARS, {}, {}, {
      strategyEngine: (setup) => Object.assign(new FakeEngine(setup), {
        trades: [trade],
        risk: (rule: unknown) => rules.push(rule),
        defaultEntryQty: (price: number) => Math.floor(1000 / price),
      }),
    });
    expect(got).toEqual([trade, undefined, 100]);
    expect(rules).toEqual([
      { rule: 'allow_entry_in', direction: 'long' },
      { rule: 'max_intraday_loss', value: 2, type: 'percent_of_equity' },
    ]);
    expect(() => run(() => {
      strategy('S');
      strategy.risk.max_position_size(10);
    })).toThrow('strategy.risk.max_position_size() is not provided by the strategy engine');
  });

  it('constants', () => {
    expect([strategy.long, strategy.short, strategy.fixed, strategy.cash, strategy.percent_of_equity]).toEqual(
      ['long', 'short', 'fixed', 'cash', 'percent_of_equity']);
    expect(strategy.commission.cash_per_order).toBe('cash_per_order');
    expect(strategy.direction.all).toBe('all');
    expect(strategy.oca.reduce).toBe('reduce');
  });
});
