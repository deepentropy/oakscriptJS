# Strategies

A strategy is a script declared with `strategy()` whose orders go to an order engine. OakScriptJS does not fill
orders itself: the host supplies the engine (an app's backtester, or your own), which fills the orders, keeps the
trades and computes the results the host shows (net profit, drawdown, list of trades...).

## Declaration and sizing

```js
strategy("Breakout", {
  overlay: true,                                   // default false
  initial_capital: 10000,                          // default 100000
  default_qty_type: strategy.percent_of_equity,    // or strategy.fixed (units), strategy.cash (amount)
  default_qty_value: 25,                           // default 100 (% of equity)
  pyramiding: 0,                                   // entries allowed in the same direction beyond the first
  commission_type: strategy.commission.percent,    // or .cash_per_contract, .cash_per_order
  commission_value: 0.1,
  slippage: 2,                                     // ticks added to market and stop fills
});
const length = input.int(20, "Channel length", { minval: 2 });
const upper = ta.highest(high, length).offset(1);
const lower = ta.lowest(low, length).offset(1);
plot(upper, "Upper", { color: color.green });
plot(lower, "Lower", { color: color.red });
strategy.eachBar((c) => {
  if (strategy.position_size <= 0) strategy.entry("Long", strategy.long, { stop: c.get(upper) });
  if (strategy.position_size >= 0) strategy.entry("Short", strategy.short, { stop: c.get(lower) });
});
```

Other properties, with the Pine Script v6 names and defaults: `currency`, `margin_long` / `margin_short` (100),
`process_orders_on_close` (false), `close_entries_rule` (`"FIFO"`), `calc_on_order_fills`, `calc_on_every_tick`,
`use_bar_magnifier`, `fill_orders_on_standard_ohlc`, `backtest_fill_limits_assumption`, `risk_free_rate` (2).
A host can override them from its settings.

Order size: the `qty` option of an order (units) wins over `default_qty_type` / `default_qty_value`.

## The bar loop

`strategy.eachBar((c) => ...)` is the strategy's `eachBar` (same `c`, returns a Series) and runs once per script.
On each bar:

1. the engine fills the orders placed before (market orders at the bar's open; stop / limit orders when the
   bar reaches their price);
2. the callback runs at the bar's close: read the state, place, change or cancel orders;
3. with `process_orders_on_close: true`, new market orders fill at that close; else at the next bar's open.

Order calls and per-bar `strategy.*` reads throw outside `strategy.eachBar()`. Compute every Series before it.

## Orders

| Call | Use |
|---|---|
| `strategy.entry(id, strategy.long / strategy.short, { qty, limit, stop, oca_name, oca_type, comment, alert_message })` | open a position; an entry in the other direction reverses the position; market order without `limit` / `stop` |
| `strategy.order(id, direction, { qty, limit, stop, ... })` | a raw order: adds to or reduces the position, no reversal logic |
| `strategy.exit(id, { from_entry, qty, qty_percent, stop, limit, loss, profit, trail_price, trail_points, trail_offset, comment, ... })` | stop loss / take profit / trailing stop for an entry; `stop` / `limit` / `trail_price` are prices, `loss` / `profit` / `trail_points` / `trail_offset` are in ticks |
| `strategy.close(id, { qty, qty_percent, comment, immediately })` | close the trades of entry `id` at market |
| `strategy.close_all({ comment, immediately })` | close the whole position at market |
| `strategy.cancel(id)`, `strategy.cancel_all()` | cancel pending orders |

- A call with the id of a pending order changes that order (calling `strategy.exit` on every bar with new prices
  moves the stop).
- `NaN` in an option means "not given" (it is removed), as `na` in Pine.
- `strategy.exit` placed while the entry is still pending waits for it (`from_entry`).

```js
strategy("Trailing exit", { overlay: true, initial_capital: 10000, default_qty_type: strategy.fixed, default_qty_value: 10 });
const fast = ta.ema(close, 12);
const slow = ta.ema(close, 26);
const atr = ta.atr(14);
const goLong = ta.crossover(fast, slow);
const goFlat = ta.crossunder(fast, slow);
strategy.eachBar((c) => {
  if (c.get(goLong) === 1) strategy.entry("Long", strategy.long, { comment: "EMA cross" });
  if (c.get(goFlat) === 1) strategy.close("Long", { comment: "Cross down" });
  if (strategy.position_size > 0) {
    const trade = strategy.opentrade(0);                     // Pine strategy.opentrades.*(0)
    const stop = trade.entry_price - 2 * c.get(atr);
    strategy.exit("Stop", { from_entry: "Long", stop, comment: "ATR stop" });
  }
});
plot(fast, "Fast");
plot(slow, "Slow");
```

## Reading the results

Inside `strategy.eachBar()`, from the engine, for the current bar:

| Variable | Meaning |
|---|---|
| `strategy.position_size` | signed quantity: > 0 long, < 0 short, 0 flat |
| `strategy.position_avg_price`, `strategy.position_entry_name` | average entry price (NaN when flat), entry id |
| `strategy.equity`, `strategy.initial_capital` | initial capital + net profit + open profit |
| `strategy.netprofit`, `strategy.openprofit`, `strategy.grossprofit`, `strategy.grossloss` (and `_percent`) | profits |
| `strategy.opentrades`, `strategy.closedtrades`, `strategy.wintrades`, `strategy.losstrades`, `strategy.eventrades` | trade counts |
| `strategy.max_drawdown`, `strategy.max_runup`, `strategy.avg_trade`... | statistics |
| `strategy.opentrade(i)`, `strategy.closedtrade(i)` | trade `i` (0 = oldest): `{ entry_id, entry_price, entry_bar_index, entry_time, size, profit, commission, exit_price, exit_bar_index, ... }`, undefined when there is none |
| `strategy.default_entry_qty(price)` | the quantity a default-size entry would get |

Pine's `strategy.closedtrades.profit(i)` is `strategy.closedtrade(i)?.profit`. `strategy.initial_capital` and
`strategy.account_currency` can be read anywhere.

```js
strategy("Equity curve", { overlay: false, initial_capital: 5000, default_qty_type: strategy.cash, default_qty_value: 1000 });
strategy.risk.allow_entry_in(strategy.direction.long);   // risk rules: top level, after strategy()
const rsi = ta.rsi(close, 14);
const equity = strategy.eachBar((c) => {
  if (c.get(rsi) < 30) strategy.entry("Long", strategy.long);
  if (c.get(rsi) > 70) strategy.close_all({ comment: "RSI > 70" });
  const last = strategy.closedtrade(strategy.closedtrades - 1);
  if (last && last.exit_bar_index === c.i && last.profit < 0) alert("Losing trade closed");
  return strategy.equity;                                // the loop's Series: equity per bar
});
plot(equity, "Equity", { color: color.teal });
hline(5000, "Initial capital", { color: color.gray });
```

Risk rules: `strategy.risk.allow_entry_in(dir)`, `max_drawdown(value, type)`, `max_intraday_loss(value, type)`,
`max_cons_loss_days(count)`, `max_intraday_filled_orders(count)`, `max_position_size(contracts)` (type:
`"percent_of_equity"` or `"cash"`). An engine that does not support a rule or a variable throws
"... is not provided by the strategy engine".

## The host side

A host passes an engine factory to `executeScript`:

```ts
import { executeScript, type StrategyEngine } from 'oakscriptjs/script';

const run = executeScript(body, bars, inputs, chart, {
  strategyEngine: ({ properties, bars, chart }) => new MyEngine(properties, bars), // implements StrategyEngine
});
// run.strategyConfig: the resolved properties
```

`StrategyEngine` methods: `processBar(i)`, `processClose(i)`, `entry`, `order`, `exit`, `close`, `close_all`,
`cancel`, `cancel_all`, `get(variable)`, `openTrade(i)`, `closedTrade(i)`, and optionally `risk(rule)`,
`defaultEntryQty(price)`. The option objects keep the Pine names. Without an engine, `strategy()` declares the
strategy and `strategy.eachBar()` throws "no strategy engine".
