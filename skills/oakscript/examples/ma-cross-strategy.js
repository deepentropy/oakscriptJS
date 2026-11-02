// Moving-average cross strategy: long and short entries on the crosses, a stop loss
// and a take profit from the entry price, and a results table on the last bar.
strategy("MA Cross Strategy", {
  shorttitle: "MA X Strat",
  overlay: true,
  initial_capital: 10000,
  default_qty_type: strategy.percent_of_equity,
  default_qty_value: 50,
  commission_type: strategy.commission.percent,
  commission_value: 0.05,
});

const fastLength = input.int(10, "Fast length", { minval: 1 });
const slowLength = input.int(30, "Slow length", { minval: 1 });
const stopPercent = input.float(2, "Stop loss %", { minval: 0.1, step: 0.1 });
const takePercent = input.float(4, "Take profit %", { minval: 0.1, step: 0.1 });

// Series math happens before the bar loop, on all bars at once.
const fast = ta.sma(close, fastLength);
const slow = ta.sma(close, slowLength);
const longSignal = ta.crossover(fast, slow);
const shortSignal = ta.crossunder(fast, slow);

plot(fast, "Fast", { color: color.teal });
plot(slow, "Slow", { color: color.orange });

// Orders and strategy.* reads only work inside strategy.eachBar(): the callback runs at the
// close of each bar; market orders fill at the open of the next bar.
strategy.eachBar((c) => {
  if (c.get(longSignal) === 1) strategy.entry("Long", strategy.long);
  if (c.get(shortSignal) === 1) strategy.entry("Short", strategy.short);

  const size = strategy.position_size;
  const entryPrice = strategy.position_avg_price;
  if (size > 0) {
    strategy.exit("Long exit", {
      from_entry: "Long",
      stop: entryPrice * (1 - stopPercent / 100),
      limit: entryPrice * (1 + takePercent / 100),
    });
  } else if (size < 0) {
    strategy.exit("Short exit", {
      from_entry: "Short",
      stop: entryPrice * (1 + stopPercent / 100),
      limit: entryPrice * (1 - takePercent / 100),
    });
  }

  // Results so far, read from the order engine.
  if (c.i === c.n - 1) {
    const t = table.new(position.top_right, 2, 2, color.new(color.black, 20));
    table.cell(t, 0, 0, "Net profit", 0, 0, color.white);
    table.cell(t, 1, 0, str.tostring(strategy.netprofit, "#.##"), 0, 0, color.white);
    table.cell(t, 0, 1, "Closed trades", 0, 0, color.white);
    table.cell(t, 1, 1, str.tostring(strategy.closedtrades), 0, 0, color.white);
  }
});
