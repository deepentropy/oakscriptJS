/**
 * @fileoverview Types and constants of the PineScript `strategy.*` API.
 *
 * OakScriptJS does not simulate orders. The script API (`oakscriptjs/script`) declares the strategy,
 * forwards every `strategy.*` call to a {@link StrategyEngine} that the host supplies, and reads the
 * `strategy.*` variables from it. The engine fills the orders, keeps the trades and computes the
 * results.
 *
 * Names follow PineScript v6: option objects use the PineScript argument names, and the engine
 * receives them unchanged. An `na` (NaN) numeric argument is removed before the call, since in
 * PineScript it means "not given". The deprecated `when` argument does not exist: use `if`.
 *
 * @module strategy
 */

export type StrategyDirection = 'long' | 'short';
export type StrategyQtyType = 'fixed' | 'cash' | 'percent_of_equity';
export type StrategyCommissionType = 'percent' | 'cash_per_contract' | 'cash_per_order';
export type StrategyOcaType = 'none' | 'cancel' | 'reduce';
/** `strategy.direction.*`, for `strategy.risk.allow_entry_in`. */
export type StrategyRiskDirection = 'all' | 'long' | 'short';
export type StrategyRiskValueType = 'percent_of_equity' | 'cash';

/** PineScript `strategy.*` constants. */
export const STRATEGY_CONSTANTS = {
  long: 'long',
  short: 'short',
  fixed: 'fixed',
  cash: 'cash',
  percent_of_equity: 'percent_of_equity',
  commission: { percent: 'percent', cash_per_contract: 'cash_per_contract', cash_per_order: 'cash_per_order' },
  direction: { all: 'all', long: 'long', short: 'short' },
  oca: { none: 'none', cancel: 'cancel', reduce: 'reduce' },
} as const;

/** Arguments of the PineScript `strategy()` declaration, after `title`. */
export interface StrategyOptions {
  shorttitle?: string;
  overlay?: boolean;
  format?: string;
  precision?: number;
  scale?: string;
  pyramiding?: number;
  calc_on_order_fills?: boolean;
  calc_on_every_tick?: boolean;
  max_bars_back?: number;
  backtest_fill_limits_assumption?: number;
  default_qty_type?: StrategyQtyType;
  default_qty_value?: number;
  initial_capital?: number;
  /** Account currency; default: the symbol currency. */
  currency?: string;
  /** Ticks added to market and stop fills. */
  slippage?: number;
  commission_type?: StrategyCommissionType;
  commission_value?: number;
  process_orders_on_close?: boolean;
  close_entries_rule?: 'FIFO' | 'ANY';
  margin_long?: number;
  margin_short?: number;
  explicit_plot_zorder?: boolean;
  max_lines_count?: number;
  max_labels_count?: number;
  max_boxes_count?: number;
  calc_bars_count?: number;
  risk_free_rate?: number;
  use_bar_magnifier?: boolean;
  fill_orders_on_standard_ohlc?: boolean;
  max_polylines_count?: number;
}

/** Strategy properties passed to the engine: the declared values, else the PineScript defaults. */
export interface StrategyProperties {
  pyramiding: number;
  calc_on_order_fills: boolean;
  calc_on_every_tick: boolean;
  backtest_fill_limits_assumption: number;
  default_qty_type: StrategyQtyType;
  default_qty_value: number;
  initial_capital: number;
  /** undefined: the symbol currency. */
  currency?: string;
  slippage: number;
  commission_type: StrategyCommissionType;
  commission_value: number;
  process_orders_on_close: boolean;
  close_entries_rule: 'FIFO' | 'ANY';
  margin_long: number;
  margin_short: number;
  calc_bars_count: number;
  risk_free_rate: number;
  use_bar_magnifier: boolean;
  fill_orders_on_standard_ohlc: boolean;
}

/** PineScript defaults of the `strategy()` arguments (v6 reference). */
export const STRATEGY_DEFAULTS: StrategyProperties = {
  pyramiding: 0,
  calc_on_order_fills: false,
  calc_on_every_tick: false,
  backtest_fill_limits_assumption: 0,
  // v6 values; PineScript v5: fixed / 1 / 1000000 and margins 0
  default_qty_type: 'percent_of_equity',
  default_qty_value: 100,
  initial_capital: 100000,
  slippage: 0,
  commission_type: 'percent',
  commission_value: 0,
  process_orders_on_close: false,
  close_entries_rule: 'FIFO',
  margin_long: 100,
  margin_short: 100,
  calc_bars_count: 0,
  risk_free_rate: 2,
  use_bar_magnifier: false,
  fill_orders_on_standard_ohlc: false,
};

/** `strategy.entry()` / `strategy.order()` arguments after `id` and `direction`. */
export interface StrategyEntryOptions {
  qty?: number;
  limit?: number;
  stop?: number;
  oca_name?: string;
  oca_type?: StrategyOcaType;
  comment?: string;
  alert_message?: string;
  disable_alert?: boolean;
}

/** `strategy.exit()` arguments after `id`. `profit`, `loss`, `trail_points` and `trail_offset` are in ticks. */
export interface StrategyExitOptions {
  from_entry?: string;
  qty?: number;
  qty_percent?: number;
  profit?: number;
  limit?: number;
  loss?: number;
  stop?: number;
  trail_price?: number;
  trail_points?: number;
  trail_offset?: number;
  oca_name?: string;
  comment?: string;
  comment_profit?: string;
  comment_loss?: string;
  comment_trailing?: string;
  alert_message?: string;
  alert_profit?: string;
  alert_loss?: string;
  alert_trailing?: string;
  disable_alert?: boolean;
}

/** `strategy.close()` arguments after `id`. */
export interface StrategyCloseOptions {
  comment?: string;
  qty?: number;
  qty_percent?: number;
  alert_message?: string;
  immediately?: boolean;
  disable_alert?: boolean;
}

/** `strategy.close_all()` arguments. */
export interface StrategyCloseAllOptions {
  comment?: string;
  alert_message?: string;
  immediately?: boolean;
  disable_alert?: boolean;
}

/** A `strategy.risk.*` rule. */
export type StrategyRiskRule =
  | { rule: 'allow_entry_in'; direction: StrategyRiskDirection }
  | { rule: 'max_cons_loss_days'; count: number; alert_message?: string }
  | { rule: 'max_drawdown'; value: number; type: StrategyRiskValueType; alert_message?: string }
  | { rule: 'max_intraday_filled_orders'; count: number; alert_message?: string }
  | { rule: 'max_intraday_loss'; value: number; type: StrategyRiskValueType; alert_message?: string }
  | { rule: 'max_position_size'; contracts: number };

/**
 * One trade, as the PineScript `strategy.opentrades.*(i)` / `strategy.closedtrades.*(i)` functions
 * return it. Times are UNIX milliseconds. The `exit_*` fields are for closed trades only; `exit_id` and the
 * comments are undefined when the engine does not provide them.
 */
export interface StrategyTrade {
  entry_id: string;
  entry_price: number;
  entry_bar_index: number;
  entry_time: number;
  /** undefined when the order had no comment, or when the engine does not keep it apart from the id. */
  entry_comment?: string;
  /** Signed quantity: positive for a long trade, negative for a short trade. */
  size: number;
  profit: number;
  profit_percent: number;
  commission: number;
  max_runup: number;
  max_runup_percent: number;
  max_drawdown: number;
  max_drawdown_percent: number;
  exit_id?: string;
  exit_price?: number;
  exit_bar_index?: number;
  exit_time?: number;
  exit_comment?: string;
}

/** Numeric `strategy.*` variables. */
export const STRATEGY_NUMBER_VARIABLES = [
  'position_size',
  'position_avg_price',
  'equity',
  'initial_capital',
  'netprofit',
  'netprofit_percent',
  'openprofit',
  'openprofit_percent',
  'grossprofit',
  'grossprofit_percent',
  'grossloss',
  'grossloss_percent',
  'opentrades',
  'closedtrades',
  'wintrades',
  'losstrades',
  'eventrades',
  'avg_trade',
  'avg_trade_percent',
  'avg_winning_trade',
  'avg_winning_trade_percent',
  'avg_losing_trade',
  'avg_losing_trade_percent',
  'max_drawdown',
  'max_drawdown_percent',
  'max_runup',
  'max_runup_percent',
  'max_contracts_held_all',
  'max_contracts_held_long',
  'max_contracts_held_short',
  'margin_liquidation_price',
] as const;

/** Text `strategy.*` variables. */
export const STRATEGY_TEXT_VARIABLES = ['position_entry_name', 'account_currency'] as const;

export type StrategyNumberVariable = (typeof STRATEGY_NUMBER_VARIABLES)[number];
export type StrategyTextVariable = (typeof STRATEGY_TEXT_VARIABLES)[number];
export type StrategyVariable = StrategyNumberVariable | StrategyTextVariable;

/**
 * The order engine the host supplies. OakScriptJS calls it in this order on each bar `i` of
 * `strategy.eachBar()`:
 *
 * 1. `processBar(i)`: fill the orders placed before bar `i` (at the open and inside the bar);
 * 2. the script runs at the close of bar `i`: order calls and variable reads;
 * 3. `processClose(i)`: after the script; with `process_orders_on_close`, fill the new market orders
 *    at the close.
 */
export interface StrategyEngine {
  processBar(bar: number): void;
  processClose(bar: number): void;
  entry(id: string, direction: StrategyDirection, options: StrategyEntryOptions): void;
  order(id: string, direction: StrategyDirection, options: StrategyEntryOptions): void;
  exit(id: string, options: StrategyExitOptions): void;
  close(id: string, options: StrategyCloseOptions): void;
  close_all(options: StrategyCloseAllOptions): void;
  cancel(id: string): void;
  cancel_all(): void;
  /** Current value of a `strategy.*` variable; undefined when the engine does not provide it. */
  get(variable: StrategyVariable): number | string | undefined;
  /** Open trade number `index` (0 = oldest); undefined when it does not exist. */
  openTrade(index: number): StrategyTrade | undefined;
  /** Closed trade number `index` (0 = oldest); undefined when it does not exist. */
  closedTrade(index: number): StrategyTrade | undefined;
  /** `strategy.risk.*` rules; optional. */
  risk?(rule: StrategyRiskRule): void;
  /** `strategy.default_entry_qty(fill_price)`; optional. */
  defaultEntryQty?(fillPrice: number): number;
}
