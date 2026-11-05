/**
 * ta.* functions one bar at a time (#196).
 *
 * Each machine is the state of one ta.* call. {@link BarStep.step} gives the result of the current bar from the kept
 * state of the earlier bars, without changing it: calling it again on the same bar (a live update of the forming bar,
 * or the same call in a loop) starts again from the same state. {@link BarStep.commit} ends the bar: its last step is
 * kept for the next bars. A bar without a step is not in the history of the call (a call in an `if` block), and a
 * commit without a step does nothing.
 *
 * Driven once per bar over an array (step, commit), a machine gives the doubles of the array function of `ta`, bit for
 * bit (tests/ta/step.test.ts): the same rules for na and ±Infinity, the same operation order.
 */
import { RunningSum, isNa } from './running-sum.js';
import { checkPositiveLength, checkSumLength, checkWindowLength } from './limits.js';
import { eq, ge, gt, le } from '../compare/index.js';

export interface BarStep<A extends unknown[], R> {
  /** The result of the current bar from the state of the earlier bars (a later step of the same bar replaces it) */
  step(...args: A): R;
  /** The current bar is final: its last step is kept */
  commit(): void;
}

/** A value ta.* functions skip: na (NaN, null, undefined) or ±Infinity. */
const skipped = (v: number): boolean => v === undefined || v === null || !Number.isFinite(v);

// ── Window sums ──────────────────────────────────────────────────────────────

/**
 * `math.sum(source, length)`: the correctly rounded sum of the last `length` non-na values; a bar with an na value
 * keeps the previous result. The length can change from one bar to the next (series length).
 */
export class SumStep implements BarStep<[value: number, length: number], number> {
  private readonly sum = new RunningSum();
  private stepped = false;

  step(value: number, length: number): number {
    const len = Math.floor(length);
    this.stepped = len >= 1;
    if (!this.stepped) return NaN;
    return isNa(value) ? this.sum.stepNa(len) : this.sum.step(value, len);
  }

  commit(): void {
    if (this.stepped) this.sum.commit();
    this.stepped = false;
  }

  /** Forget the steps of the current bar (the bar is not in the history) */
  discard(): void {
    this.stepped = false;
  }
}

/** `ta.sma(source, length)`: {@link SumStep} divided by the length. */
export class SmaStep implements BarStep<[value: number, length: number], number> {
  private readonly sum = new SumStep();

  step(value: number, length: number): number {
    checkSumLength('ta.sma', Math.floor(length), 0);
    return this.sum.step(value, length) / Math.floor(length);
  }

  commit(): void {
    this.sum.commit();
  }
}

/**
 * `ta.variance(source, length, biased)` from the window sums of the values and of their squares: biased
 * `sumSq / n - mean * mean`, unbiased `sumSq / (n - 1) - mean * sum / (n - 1)` (na for a length of 1).
 */
export class VarianceStep implements BarStep<[value: number, length: number, biased?: boolean], number> {
  private readonly sums = new SumStep();
  private readonly squares = new SumStep();

  constructor(private readonly name = 'ta.variance') {}

  step(value: number, length: number, biased = true): number {
    const len = Math.floor(length);
    checkSumLength(this.name, len, 0);
    const sum = this.sums.step(value, len);
    const sq = this.squares.step(isNa(value) ? NaN : value * value, len);
    if ((biased ? len : len - 1) <= 0) return NaN;
    const mean = sum / len;
    return biased ? sq / len - mean * mean : sq / (len - 1) - (mean * sum) / (len - 1);
  }

  commit(): void {
    this.sums.commit();
    this.squares.commit();
  }
}

/** `ta.stdev(source, length, biased)`: the square root of {@link VarianceStep} (0 when it is not positive). */
export class StdevStep implements BarStep<[value: number, length: number, biased?: boolean], number> {
  private readonly variance = new VarianceStep('ta.stdev');

  step(value: number, length: number, biased = true): number {
    const v = this.variance.step(value, length, biased);
    return Number.isNaN(v) ? NaN : v > 0 ? Math.sqrt(v) : 0;
  }

  commit(): void {
    this.variance.commit();
  }
}

// ── Moving averages ──────────────────────────────────────────────────────────

/**
 * Exponential averages seeded with `ta.sma` on the bar of the `length`-th non-na value (ta.ema, ta.rma); a bar with an
 * na value gives na and keeps the state.
 */
abstract class SeededAverage implements BarStep<[value: number], number> {
  private readonly seed = new SumStep();
  private value = NaN;
  private count = 0;
  private stepped = false;
  /** The last step of the bar added its value to the seed sum */
  private seeded = false;
  private nextValue = NaN;
  private nextCount = 0;
  protected readonly len: number;

  constructor(name: string, length: number) {
    checkPositiveLength(name, length, 0);
    this.len = Math.floor(length);
  }

  protected abstract next(value: number, previous: number): number;

  step(value: number): number {
    this.stepped = true;
    this.seeded = false;
    this.nextValue = this.value;
    this.nextCount = this.count;
    if (skipped(value)) return NaN;
    this.nextCount = this.count + 1;
    if (this.count < this.len) {
      this.seeded = true;
      const s = this.seed.step(value, this.len);
      if (this.nextCount < this.len) return NaN;
      this.nextValue = s / this.len;
      return this.nextValue;
    }
    this.nextValue = this.next(value, this.value);
    return this.nextValue;
  }

  commit(): void {
    if (!this.stepped) return;
    this.stepped = false;
    if (this.seeded) this.seed.commit();
    else this.seed.discard();
    this.value = this.nextValue;
    this.count = this.nextCount;
  }
}

/** `ta.ema(source, length)`: `(source - ema) * 2 / (length + 1) + ema` after the seed. */
export class EmaStep extends SeededAverage {
  private readonly multiplier: number;

  constructor(length: number) {
    super('ema', length);
    this.multiplier = 2 / (this.len + 1);
  }

  protected next(value: number, previous: number): number {
    return (value - previous) * this.multiplier + previous;
  }
}

/** `ta.rma(source, length)`: `(source + (length - 1) * rma) / length` after the seed. */
export class RmaStep extends SeededAverage {
  constructor(length: number, name = 'rma') {
    super(name, length);
  }

  protected next(value: number, previous: number): number {
    return (value + (this.len - 1) * previous) / this.len;
  }
}

/** The PineScript ta.wma partial sum: `a + b`, 0 when `|a + b| <= 1e-10 * max(1, |a| + |b|)`. */
function wmaAdd(a: number, b: number): number {
  const sum = a + b;
  return Math.abs(sum) <= 1e-10 * Math.max(1, Math.abs(a) + Math.abs(b)) ? 0 : sum;
}

/**
 * `ta.wma(source, length)`: na on a bar with an na value and until `length` non-na values; otherwise the last `length`
 * bars (an na bar holds the previous non-na value), summed from the oldest with the PineScript zero rule.
 */
export class WmaStep implements BarStep<[value: number, length: number], number> {
  private readonly filled: number[] = [];
  private last = NaN;
  private count = 0;
  private stepped = false;
  private nextFilled = NaN;
  private nextValid = false;

  step(value: number, length: number): number {
    const len = Math.floor(length);
    checkPositiveLength('wma', len, this.filled.length);
    this.stepped = true;
    const na = skipped(value);
    this.nextValid = !na;
    this.nextFilled = na ? this.last : value;
    if (na || !(len >= 1) || this.count + 1 < len) return NaN;
    const n = this.filled.length;
    let sum = 0;
    let weightSum = 0;
    for (let j = len - 1; j >= 0; j--) {
      const weight = len - j;
      sum = wmaAdd(sum, (j === 0 ? this.nextFilled : this.filled[n - j]!) * weight);
      weightSum += weight;
    }
    return sum / weightSum;
  }

  commit(): void {
    if (!this.stepped) return;
    this.stepped = false;
    if (this.nextValid) {
      this.last = this.nextFilled;
      this.count++;
    }
    this.filled.push(this.nextFilled);
  }
}

// ── Changes ──────────────────────────────────────────────────────────────────

/** The values of the earlier bars of a call (one per bar with a step), for the `source[length]` of ta.change & co. */
abstract class HistoryStep<A extends unknown[], R> implements BarStep<A, R> {
  protected readonly history: number[] = [];
  private stepped = false;
  private pending = NaN;

  /** The current bar's value, kept by commit() */
  protected keep(value: number): void {
    this.stepped = true;
    this.pending = value;
  }

  /** The value `k` bars back (k >= 1), NaN before the first bar */
  protected back(k: number): number {
    const i = this.history.length - k;
    return i >= 0 ? this.history[i]! : NaN;
  }

  abstract step(...args: A): R;

  commit(): void {
    if (!this.stepped) return;
    this.stepped = false;
    this.history.push(this.pending);
  }
}

/** `ta.change(source, length)`: `source - source[length]` (na for the first `length` bars). */
export class ChangeStep extends HistoryStep<[value: number], number> {
  constructor(private readonly length = 1) {
    super();
    checkPositiveLength('change', length, 0);
  }

  step(value: number): number {
    this.keep(value);
    return this.history.length < this.length ? NaN : value - this.back(this.length);
  }
}

/** `ta.mom(source, length)`: `source - source[length]`, na when either is na. */
export class MomStep extends HistoryStep<[value: number], number> {
  constructor(private readonly length: number) {
    super();
    checkPositiveLength('mom', length, 0);
  }

  step(value: number): number {
    this.keep(value);
    if (this.history.length < this.length) return NaN;
    const old = this.back(this.length);
    return Number.isNaN(value) || Number.isNaN(old) ? NaN : value - old;
  }
}

/** `ta.roc(source, length)`: `100 * (source - source[length]) / source[length]` (a zero base gives ±Infinity). */
export class RocStep extends HistoryStep<[value: number], number> {
  constructor(private readonly length: number) {
    super();
    checkPositiveLength('roc', length, 0);
  }

  step(value: number): number {
    this.keep(value);
    if (this.history.length < this.length) return NaN;
    const old = this.back(this.length);
    if (Number.isNaN(old) || Number.isNaN(value)) return NaN;
    return (100 * (value - old)) / old;
  }
}

/** `ta.tr(handle_na)`: max(high - low, |high - close[1]|, |low - close[1]|); on the first bar or after an na close, na
 *  (or high - low with handle_na). */
export class TrStep extends HistoryStep<[high: number, low: number, close: number], number> {
  constructor(private readonly handleNa = false) {
    super();
  }

  step(high: number, low: number, close: number): number {
    this.keep(close);
    const prev = this.back(1);
    if (this.history.length === 0 || Number.isNaN(prev)) return this.handleNa ? high - low : NaN;
    return Math.max(high - low, Math.abs(high - prev), Math.abs(low - prev));
  }
}

/** `ta.atr(length)`: {@link RmaStep} of `ta.tr(true)`. */
export class AtrStep implements BarStep<[high: number, low: number, close: number], number> {
  private readonly tr = new TrStep(true);
  private readonly rma: RmaStep;

  constructor(length: number) {
    checkPositiveLength('atr->rma', length, 0);
    this.rma = new RmaStep(length, 'atr->rma');
  }

  step(high: number, low: number, close: number): number {
    return this.rma.step(this.tr.step(high, low, close));
  }

  commit(): void {
    this.tr.commit();
    this.rma.commit();
  }
}

/**
 * `ta.rsi(source, length)`: the rma of the gains and of the losses of the changes from the previous bar; 100 when the
 * average loss is 0, else 0 when the average gain is 0 (comparisons with the 1e-10 tolerance).
 */
export class RsiStep extends HistoryStep<[value: number], number> {
  private readonly gains: RmaStep;
  private readonly losses: RmaStep;

  constructor(length: number) {
    super();
    checkPositiveLength('rsi', length, 0, 'y');
    this.gains = new RmaStep(length);
    this.losses = new RmaStep(length);
  }

  step(value: number): number {
    this.keep(value);
    if (this.history.length === 0) return NaN;
    const c = value - this.back(1);
    const up = this.gains.step(Number.isNaN(c) ? NaN : c > 0 ? c : 0);
    const down = this.losses.step(Number.isNaN(c) ? NaN : c < 0 ? -c : 0);
    if (eq(down, 0)) return 100;
    if (eq(up, 0)) return 0;
    return 100 - 100 / (1 + up / down);
  }

  override commit(): void {
    super.commit();
    this.gains.commit();
    this.losses.commit();
  }
}

// ── Running state ────────────────────────────────────────────────────────────

/** `ta.cum(source)`: the sum of the non-na values; na on a bar with an na value. */
export class CumStep implements BarStep<[value: number], number> {
  private sum = 0;
  private next = 0;
  private stepped = false;

  step(value: number): number {
    this.stepped = true;
    this.next = this.sum;
    if (!Number.isFinite(value)) return NaN;
    this.next = this.sum + value;
    return this.next;
  }

  commit(): void {
    if (this.stepped) this.sum = this.next;
    this.stepped = false;
  }
}

/** Compared with the last earlier bar where both values were not na (ta.crossover, ta.crossunder). */
class CrossTestStep implements BarStep<[a: number, b: number], boolean> {
  private prevA = NaN;
  private prevB = NaN;
  private nextA = NaN;
  private nextB = NaN;
  private stepped = false;

  constructor(private readonly test: (a: number, b: number, pa: number, pb: number) => boolean) {}

  step(a: number, b: number): boolean {
    this.stepped = true;
    const both = !Number.isNaN(a) && !Number.isNaN(b);
    this.nextA = both ? a : this.prevA;
    this.nextB = both ? b : this.prevB;
    return this.test(a, b, this.prevA, this.prevB);
  }

  commit(): void {
    if (!this.stepped) return;
    this.stepped = false;
    this.prevA = this.nextA;
    this.prevB = this.nextB;
  }
}

/** `ta.crossover(a, b)` */
export class CrossoverStep extends CrossTestStep {
  constructor() {
    super((a, b, pa, pb) => a > b && pa <= pb);
  }
}

/** `ta.crossunder(a, b)` */
export class CrossunderStep extends CrossTestStep {
  constructor() {
    super((a, b, pa, pb) => a < b && pa >= pb);
  }
}

/** `ta.cross(a, b)`: true when the values are strictly on the other side of the last strict side. */
export class CrossStep implements BarStep<[a: number, b: number], boolean> {
  private side = 0;
  private next = 0;
  private stepped = false;

  step(a: number, b: number): boolean {
    this.stepped = true;
    this.next = this.side;
    if (Number.isNaN(a) || Number.isNaN(b)) return false;
    const crossed = (this.side < 0 && a > b) || (this.side > 0 && a < b);
    if (a < b) this.next = -1;
    else if (a > b) this.next = 1;
    return crossed;
  }

  commit(): void {
    if (this.stepped) this.side = this.next;
    this.stepped = false;
  }
}

/** `ta.barssince(condition)`: 0 on a true bar, then +1 per bar; na before the first true bar. */
export class BarssinceStep implements BarStep<[condition: boolean | number], number> {
  private value = NaN;
  private next = NaN;
  private stepped = false;

  step(condition: boolean | number): number {
    this.stepped = true;
    this.next = condition ? 0 : Number.isNaN(this.value) ? NaN : this.value + 1;
    return this.next;
  }

  commit(): void {
    if (this.stepped) this.value = this.next;
    this.stepped = false;
  }
}

/** `ta.valuewhen(condition, source, occurrence)`: the source value of the `occurrence`-th last true bar (0: the last). */
export class ValuewhenStep implements BarStep<[condition: boolean | number, value: number], number> {
  private readonly values: number[] = [];
  private pending: number | null = null;
  private stepped = false;

  constructor(private readonly occurrence: number) {}

  step(condition: boolean | number, value: number): number {
    this.stepped = true;
    this.pending = condition ? value : null;
    const n = this.values.length + (condition ? 1 : 0);
    const k = n - 1 - this.occurrence;
    if (k < 0 || k >= n) return NaN;
    return k === this.values.length ? value : (this.values[k] ?? NaN);
  }

  commit(): void {
    if (this.stepped && this.pending !== null) this.values.push(this.pending);
    this.stepped = false;
    this.pending = null;
  }
}

/** `ta.obv`: the cumulated `sign(close - close[1]) * volume` (na on the first bar). */
export class ObvStep extends HistoryStep<[close: number, volume: number], number> {
  private readonly cum = new CumStep();

  step(close: number, volume: number): number {
    this.keep(close);
    return this.cum.step(this.history.length === 0 ? NaN : Math.sign(close - this.back(1)) * volume);
  }

  override commit(): void {
    super.commit();
    this.cum.commit();
  }
}

// ── Window extremes ──────────────────────────────────────────────────────────

/**
 * `ta.highest` / `ta.lowest`: the extreme of the last `length` non-na values (all of them when fewer), also on a bar
 * whose own value is na; na before bar `length - 1` and while no value was received. Math.max / Math.min of the
 * window: +0 wins over -0 for the highest, -0 for the lowest.
 */
class ExtremeStep implements BarStep<[value: number, length: number], number> {
  private readonly values: number[] = [];
  private bars = 0;
  private pending = NaN;
  private stepped = false;

  constructor(private readonly lowest: boolean) {}

  step(value: number, length: number): number {
    checkWindowLength(this.lowest ? 'lowest' : 'highest', length, this.bars);
    this.stepped = true;
    this.pending = value;
    const len = Math.trunc(length);
    const own = !skipped(value);
    const n = this.values.length + (own ? 1 : 0);
    if (this.bars < len - 1 || n === 0) return NaN;
    let best = own ? value : this.values[n - 1]!;
    const from = Math.max(0, n - len);
    for (let i = from; i < this.values.length; i++) {
      const v = this.values[i]!;
      best = this.lowest ? Math.min(best, v) : Math.max(best, v);
    }
    return best;
  }

  commit(): void {
    if (!this.stepped) return;
    this.stepped = false;
    this.bars++;
    if (!skipped(this.pending)) this.values.push(this.pending);
  }
}

/** `ta.highest(source, length)` */
export class HighestStep extends ExtremeStep {
  constructor() {
    super(false);
  }
}

/** `ta.lowest(source, length)` */
export class LowestStep extends ExtremeStep {
  constructor() {
    super(true);
  }
}

// ── Composites ───────────────────────────────────────────────────────────────

/** `ta.macd(source, fast, slow, signal)`: `[macd, signal, histogram]`. */
export class MacdStep implements BarStep<[value: number], [number, number, number]> {
  private readonly fast: EmaStep;
  private readonly slow: EmaStep;
  private readonly signal: EmaStep;

  constructor(fastLength: number, slowLength: number, signalLength: number) {
    this.fast = new EmaStep(fastLength);
    this.slow = new EmaStep(slowLength);
    this.signal = new EmaStep(signalLength);
  }

  step(value: number): [number, number, number] {
    const line = this.fast.step(value) - this.slow.step(value);
    const signal = this.signal.step(line);
    return [line, signal, line - signal];
  }

  commit(): void {
    this.fast.commit();
    this.slow.commit();
    this.signal.commit();
  }
}

/** `ta.bb(source, length, mult)`: `[basis, upper, lower]`. */
export class BbStep implements BarStep<[value: number], [number, number, number]> {
  private readonly basis = new SumStep();
  private readonly dev = new StdevStep();
  private readonly len: number;

  constructor(length: number, private readonly mult: number) {
    checkSumLength('ta.bb', length, 0);
    this.len = Math.floor(length);
  }

  step(value: number): [number, number, number] {
    const basis = this.basis.step(value, this.len) / this.len;
    const dev = this.dev.step(value, this.len);
    return [basis, basis + this.mult * dev, basis - this.mult * dev];
  }

  commit(): void {
    this.basis.commit();
    this.dev.commit();
  }
}

/** `ta.vwma(source, length)`: `sma(source * volume) / sma(volume)`, na when the volume average is 0 or na. */
export class VwmaStep implements BarStep<[value: number, volume: number], number> {
  private readonly numerator = new SumStep();
  private readonly denominator = new SumStep();
  private readonly len: number;

  constructor(length: number) {
    checkPositiveLength('vwma->sma', length, 0);
    this.len = Math.floor(length);
  }

  step(value: number, volume: number): number {
    checkSumLength('ta.sma', this.len, 0);
    const num = this.numerator.step(value * volume, this.len) / this.len;
    const den = this.denominator.step(volume, this.len) / this.len;
    return den === 0 || Number.isNaN(den) ? NaN : num / den;
  }

  commit(): void {
    this.numerator.commit();
    this.denominator.commit();
  }
}

/**
 * `ta.stoch(source, high, low, length)`: `100 * (source - lowest(low)) / (highest(high) - lowest(low))`; an na result
 * keeps the previous one.
 */
export class StochStep implements BarStep<[source: number, high: number, low: number], number> {
  private readonly highest = new HighestStep();
  private readonly lowest = new LowestStep();
  private previous = NaN;
  private next = NaN;
  private stepped = false;

  constructor(private readonly length: number) {
    checkPositiveLength('stoch->highest', length, 0);
  }

  step(source: number, high: number, low: number): number {
    this.stepped = true;
    const lo = this.lowest.step(low, this.length);
    const k = (100 * (source - lo)) / (this.highest.step(high, this.length) - lo);
    this.next = Number.isNaN(k) ? this.previous : k;
    return this.next;
  }

  commit(): void {
    if (!this.stepped) return;
    this.stepped = false;
    this.previous = this.next;
    this.highest.commit();
    this.lowest.commit();
  }
}

// ── More composites ──────────────────────────────────────────────────────────

/** `ta.hma(source, length)`: wma(2 * wma(source, length / 2) - wma(source, length), floor(sqrt(length))). */
export class HmaStep implements BarStep<[value: number], number> {
  private readonly half = new WmaStep();
  private readonly full = new WmaStep();
  private readonly outer = new WmaStep();
  private readonly halfLength: number;
  private readonly sqrtLength: number;

  constructor(private readonly length: number) {
    checkPositiveLength('hma', length, 0);
    this.halfLength = Math.floor(length / 2);
    this.sqrtLength = Math.floor(Math.sqrt(length));
  }

  step(value: number): number {
    const diff = 2 * this.half.step(value, this.halfLength) - this.full.step(value, this.length);
    return this.outer.step(diff, this.sqrtLength);
  }

  commit(): void {
    this.half.commit();
    this.full.commit();
    this.outer.commit();
  }
}

/** `ta.dev(source, length)`: the mean of |source - sma| over the last `length` bars (na until bar length - 1). */
export class DevStep extends HistoryStep<[value: number], number> {
  private readonly mean = new SmaStep();
  private readonly len: number;

  constructor(length: number) {
    super();
    checkPositiveLength('dev', length, 0);
    this.len = Math.floor(length);
  }

  step(value: number): number {
    this.keep(value);
    const mean = this.mean.step(value, this.len);
    if (this.history.length < this.len - 1 || Number.isNaN(mean)) return NaN;
    let sum = 0;
    for (let k = 0; k < this.len; k++) sum += Math.abs((k === 0 ? value : this.back(k)) - mean);
    return sum / this.len;
  }

  override commit(): void {
    super.commit();
    this.mean.commit();
  }
}

/** `ta.cci(source, length)`: (source - sma) / (0.015 * dev); a zero dev keeps the previous value (0 at the start). */
export class CciStep implements BarStep<[value: number], number> {
  private readonly mean = new SmaStep();
  private readonly dev: DevStep;
  private last = 0;
  private next = 0;
  private stepped = false;

  constructor(private readonly length: number) {
    checkPositiveLength('cci', length, 0);
    this.dev = new DevStep(length);
  }

  step(value: number): number {
    this.stepped = true;
    this.next = this.last;
    const mean = this.mean.step(value, this.length);
    const d = this.dev.step(value);
    if (Number.isNaN(mean) || Number.isNaN(d)) return NaN;
    if (!eq(d, 0)) this.next = (value - mean) / (0.015 * d);
    return this.next;
  }

  commit(): void {
    if (this.stepped) this.last = this.next;
    this.stepped = false;
    this.mean.commit();
    this.dev.commit();
  }
}

/** `ta.mfi(source, length)`: the window sums of the money flow of the up and down bars. */
export class MfiStep extends HistoryStep<[value: number, volume: number], number> {
  private readonly upper = new SumStep();
  private readonly lower = new SumStep();

  constructor(private readonly length: number) {
    super();
    checkPositiveLength('mfi', length, 0);
  }

  step(value: number, volume: number): number {
    this.keep(value);
    const change = this.history.length === 0 ? NaN : value - this.back(1);
    const flow = volume * value;
    const zero = (x: number): number => (Math.abs(x) <= 1e-10 ? 0 : x);
    const u = zero(this.upper.step(le(change, 0) ? 0 : flow, this.length));
    const l = zero(this.lower.step(ge(change, 0) ? 0 : flow, this.length));
    if (Number.isNaN(u) || Number.isNaN(l)) return NaN;
    if (l === 0) return 100;
    const ratio = 1 + u / l;
    return ratio === 0 ? NaN : 100 - 100 / ratio;
  }

  override commit(): void {
    super.commit();
    this.upper.commit();
    this.lower.commit();
  }
}

/** `ta.dmi(diLength, adxSmoothing)`: [+DI, -DI, ADX]; a DI that cannot be computed keeps the previous one. */
export class DmiStep implements BarStep<[high: number, low: number, close: number], [number, number, number]> {
  private readonly tr = new TrStep(false);
  private readonly trur: RmaStep;
  private readonly plus: RmaStep;
  private readonly minus: RmaStep;
  private readonly adx: RmaStep;
  private prevHigh = NaN;
  private prevLow = NaN;
  private bars = 0;
  private lastPlus = NaN;
  private lastMinus = NaN;
  private next: [number, number, number, number] = [NaN, NaN, NaN, NaN];
  private stepped = false;

  constructor(diLength: number, adxSmoothing: number) {
    this.trur = new RmaStep(diLength);
    this.plus = new RmaStep(diLength);
    this.minus = new RmaStep(diLength);
    this.adx = new RmaStep(adxSmoothing);
  }

  step(high: number, low: number, close: number): [number, number, number] {
    this.stepped = true;
    const up = this.bars === 0 ? NaN : high - this.prevHigh;
    const down = this.bars === 0 ? NaN : this.prevLow - low;
    const plusDM = Number.isNaN(up) ? NaN : gt(up, down) && gt(up, 0) ? up : 0;
    const minusDM = Number.isNaN(down) ? NaN : gt(down, up) && gt(down, 0) ? down : 0;
    const t = this.trur.step(this.tr.step(high, low, close));
    const directional = (v: number, last: number): number => {
      const value = t === 0 ? NaN : (100 * v) / t;
      return Number.isNaN(value) ? last : value;
    };
    const plus = directional(this.plus.step(plusDM), this.lastPlus);
    const minus = directional(this.minus.step(minusDM), this.lastMinus);
    const sum = plus + minus;
    const dx = Math.abs(plus - minus) / (eq(sum, 0) ? 1 : sum);
    const adx = 100 * this.adx.step(dx);
    this.next = [plus, minus, high, low];
    return [plus, minus, adx];
  }

  commit(): void {
    if (!this.stepped) return;
    this.stepped = false;
    [this.lastPlus, this.lastMinus, this.prevHigh, this.prevLow] = this.next;
    this.bars++;
    this.tr.commit();
    this.trur.commit();
    this.plus.commit();
    this.minus.commit();
    this.adx.commit();
  }
}

/** `ta.linreg(source, length, offset)`: least squares line of the last `length` bars (na when one of them is NaN). */
export class LinregStep extends HistoryStep<[value: number], number> {
  private readonly len: number;

  constructor(length: number, private readonly offset = 0) {
    super();
    checkPositiveLength('linreg', length, 0);
    this.len = Math.floor(length);
  }

  step(value: number): number {
    this.keep(value);
    const len = this.len;
    if (this.history.length < len - 1) return NaN;
    const at = (j: number): number => (j === len - 1 ? value : this.back(len - 1 - j));
    for (let j = 0; j < len; j++) if (isNaN(at(j))) return NaN;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;
    for (let j = 0; j < len; j++) {
      const x = j + 1;
      const y = at(j);
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    }
    const slope = (len * sumXY - sumX * sumY) / (len * sumX2 - sumX * sumX);
    const intercept = sumY / len - (slope * sumX) / len + slope;
    return intercept + slope * (len - 1 - this.offset);
  }
}

/** `ta.percentrank(source, length)`: the percentage of the `length` bars before that are less than or equal to the bar. */
export class PercentrankStep extends HistoryStep<[value: number], number> {
  constructor(private readonly length: number) {
    super();
    checkPositiveLength('percentrank', length, 0);
  }

  step(value: number): number {
    this.keep(value);
    if (this.history.length < this.length) return NaN;
    let count = 0;
    for (let j = 1; j <= this.length; j++) if (le(this.back(j), value)) count++;
    return (count * 100) / this.length;
  }
}

/** `ta.median(source, length)`: the median of the last `length` non-na values (sorted as ta.median keeps them). */
export class MedianStep implements BarStep<[value: number], number> {
  private sorted: number[] = [];
  private readonly kept: number[] = [];
  private nextSorted: number[] | null = null;
  private nextValue: number | null = null;
  private stepped = false;
  private readonly len: number;

  constructor(length: number) {
    checkPositiveLength('median', length, 0);
    this.len = Math.floor(length);
  }

  private static bound(sorted: readonly number[], v: number, after: boolean): number {
    let lo = 0;
    let hi = sorted.length;
    while (lo < hi) {
      const m = (lo + hi) >> 1;
      if (after ? sorted[m]! <= v : sorted[m]! < v) lo = m + 1;
      else hi = m;
    }
    return lo;
  }

  step(value: number): number {
    this.stepped = true;
    const len = this.len;
    let sorted = this.sorted;
    let count = this.kept.length;
    this.nextValue = null;
    this.nextSorted = null;
    if (Number.isFinite(value)) {
      sorted = sorted.slice();
      count++;
      sorted.splice(MedianStep.bound(sorted, value, false), 0, value);
      // the value that leaves the window: kept[count - 1 - len] in the order of the kept values (this one is last)
      if (count > len) {
        const k = count - 1 - len;
        const leaving = k === this.kept.length ? value : this.kept[k]!;
        sorted.splice(MedianStep.bound(sorted, leaving, true) - 1, 1);
      }
      this.nextValue = value;
      this.nextSorted = sorted;
    }
    if (!(len >= 1) || count < len) return NaN;
    const mid = Math.floor(len / 2);
    return len % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
  }

  commit(): void {
    if (!this.stepped) return;
    this.stepped = false;
    if (this.nextValue !== null) {
      this.kept.push(this.nextValue);
      this.sorted = this.nextSorted!;
    }
  }
}

/** `ta.correlation(source1, source2, length)`: covariance over the square root of the two variances. */
export class CorrelationStep implements BarStep<[a: number, b: number], number> {
  private readonly meanXY = new SmaStep();
  private readonly meanX = new SmaStep();
  private readonly meanY = new SmaStep();
  private readonly varX = new VarianceStep();
  private readonly varY = new VarianceStep();

  constructor(private readonly length: number) {
    checkPositiveLength('correlation', length, 0);
  }

  step(a: number, b: number): number {
    const product = a === null || a === undefined || b === null || b === undefined ? NaN : a * b;
    const mxy = this.meanXY.step(product, this.length);
    const cov = mxy - this.meanX.step(a, this.length) * this.meanY.step(b, this.length);
    const vx = this.varX.step(a, this.length);
    const vy = this.varY.step(b, this.length);
    if (Number.isNaN(cov)) return NaN;
    if (Math.abs(cov) <= 1e-10) return 0;
    const denominator = Math.sqrt(vx * vy);
    return denominator === 0 ? NaN : cov / denominator;
  }

  commit(): void {
    this.meanXY.commit();
    this.meanX.commit();
    this.meanY.commit();
    this.varX.commit();
    this.varY.commit();
  }
}

/** `ta.wpr(length)`: 100 * (close - highest(high)) / (highest(high) - lowest(low)); na on a zero range. */
export class WprStep implements BarStep<[high: number, low: number, close: number], number> {
  private readonly highest = new HighestStep();
  private readonly lowest = new LowestStep();

  constructor(private readonly length = 14) {
    checkPositiveLength('wpr', length, 0);
  }

  step(high: number, low: number, close: number): number {
    const hmax = this.highest.step(high, this.length);
    const range = hmax - this.lowest.step(low, this.length);
    return range === 0 ? NaN : (100 * (close - hmax)) / range;
  }

  commit(): void {
    this.highest.commit();
    this.lowest.commit();
  }
}

/** `ta.supertrend(factor, atrPeriod)`: [supertrend, direction] (bands from hl2 and the atr, as ta.supertrend). */
export class SupertrendStep implements BarStep<[high: number, low: number, close: number], [number, number]> {
  private readonly atr: AtrStep;
  private lastLower = NaN;
  private lastUpper = NaN;
  private prevSuperTrend = NaN;
  private prevAtr = NaN;
  private prevHigh = NaN;
  private prevLow = NaN;
  private bars = 0;
  private next: [number, number, number, number, number, number] = [NaN, NaN, NaN, NaN, NaN, NaN];
  private stepped = false;

  constructor(private readonly factor: number, atrPeriod: number, private readonly wicks = false) {
    this.atr = new AtrStep(atrPeriod);
  }

  step(high: number, low: number, close: number): [number, number] {
    this.stepped = true;
    const nz = (v: number): number => (isNaN(v) ? 0 : v);
    const source = (high + low) / 2;
    const atr = this.atr.step(high, low, close);
    const atrValue = atr * this.factor;
    let upperBand = source + atrValue;
    let lowerBand = source - atrValue;
    const prevLowerBand = nz(this.lastLower);
    const prevUpperBand = nz(this.lastUpper);
    const highPrice = this.wicks ? high : close;
    const lowPrice = this.wicks ? low : close;
    const prevLowPrice = this.bars > 0 ? this.prevLow : NaN;
    const prevHighPrice = this.bars > 0 ? this.prevHigh : NaN;
    lowerBand = lowerBand > prevLowerBand || prevLowPrice < prevLowerBand ? lowerBand : prevLowerBand;
    upperBand = upperBand < prevUpperBand || prevHighPrice > prevUpperBand ? upperBand : prevUpperBand;
    let direction: number;
    if (this.bars === 0 || isNaN(this.prevAtr)) direction = 1;
    else if (this.prevSuperTrend === prevUpperBand) direction = highPrice > upperBand ? -1 : 1;
    else direction = lowPrice < lowerBand ? 1 : -1;
    const superTrend = direction === -1 ? lowerBand : upperBand;
    this.next = [lowerBand, upperBand, superTrend, atr, highPrice, lowPrice];
    return [superTrend, direction];
  }

  commit(): void {
    if (!this.stepped) return;
    this.stepped = false;
    [this.lastLower, this.lastUpper, this.prevSuperTrend, this.prevAtr, this.prevHigh, this.prevLow] = this.next;
    this.bars++;
    this.atr.commit();
  }
}

// ── Factories (PineScript names) ─────────────────────────────────────────────

/**
 * One machine per ta.* call, by PineScript name (#196): `const ema = taStep.ema(14)`, then on each bar
 * `ema.step(close)` (again on the same bar for a live update of the forming bar) and `ema.commit()` when the bar is
 * final. Driven once per bar over an array, a machine gives the doubles of the `ta` / `taCore` function.
 * The window functions take their length on each step (a series length is allowed); the others at creation.
 */
export const taStep = {
  /** `math.sum(source, length)`: step(value, length) */
  sum: (): SumStep => new SumStep(),
  /** `ta.sma(source, length)`: step(value, length) */
  sma: (): SmaStep => new SmaStep(),
  /** `ta.variance(source, length, biased)`: step(value, length, biased?) */
  variance: (): VarianceStep => new VarianceStep(),
  /** `ta.stdev(source, length, biased)`: step(value, length, biased?) */
  stdev: (): StdevStep => new StdevStep(),
  /** `ta.ema(source, length)`: step(value) */
  ema: (length: number): EmaStep => new EmaStep(length),
  /** `ta.rma(source, length)`: step(value) */
  rma: (length: number): RmaStep => new RmaStep(length),
  /** `ta.wma(source, length)`: step(value, length) */
  wma: (): WmaStep => new WmaStep(),
  /** `ta.change(source, length)`: step(value) */
  change: (length = 1): ChangeStep => new ChangeStep(length),
  /** `ta.mom(source, length)`: step(value) */
  mom: (length: number): MomStep => new MomStep(length),
  /** `ta.roc(source, length)`: step(value) */
  roc: (length: number): RocStep => new RocStep(length),
  /** `ta.tr(handle_na)`: step(high, low, close) */
  tr: (handle_na = false): TrStep => new TrStep(handle_na),
  /** `ta.atr(length)`: step(high, low, close) */
  atr: (length: number): AtrStep => new AtrStep(length),
  /** `ta.rsi(source, length)`: step(value) */
  rsi: (length: number): RsiStep => new RsiStep(length),
  /** `ta.cum(source)`: step(value) */
  cum: (): CumStep => new CumStep(),
  /** `ta.crossover(a, b)`: step(a, b) */
  crossover: (): CrossoverStep => new CrossoverStep(),
  /** `ta.crossunder(a, b)`: step(a, b) */
  crossunder: (): CrossunderStep => new CrossunderStep(),
  /** `ta.cross(a, b)`: step(a, b) */
  cross: (): CrossStep => new CrossStep(),
  /** `ta.barssince(condition)`: step(condition) */
  barssince: (): BarssinceStep => new BarssinceStep(),
  /** `ta.valuewhen(condition, source, occurrence)`: step(condition, value) */
  valuewhen: (occurrence: number): ValuewhenStep => new ValuewhenStep(occurrence),
  /** `ta.obv`: step(close, volume) */
  obv: (): ObvStep => new ObvStep(),
  /** `ta.highest(source, length)`: step(value, length) */
  highest: (): HighestStep => new HighestStep(),
  /** `ta.lowest(source, length)`: step(value, length) */
  lowest: (): LowestStep => new LowestStep(),
  /** `ta.macd(source, fast, slow, signal)`: step(value) gives [macd, signal, histogram] */
  macd: (fastLength: number, slowLength: number, signalLength: number): MacdStep =>
    new MacdStep(fastLength, slowLength, signalLength),
  /** `ta.bb(source, length, mult)`: step(value) gives [basis, upper, lower] */
  bb: (length: number, mult: number): BbStep => new BbStep(length, mult),
  /** `ta.vwma(source, length)`: step(value, volume) */
  vwma: (length: number): VwmaStep => new VwmaStep(length),
  /** `ta.stoch(source, high, low, length)`: step(source, high, low) */
  stoch: (length: number): StochStep => new StochStep(length),
  /** `ta.hma(source, length)`: step(value) */
  hma: (length: number): HmaStep => new HmaStep(length),
  /** `ta.dev(source, length)`: step(value) */
  dev: (length: number): DevStep => new DevStep(length),
  /** `ta.cci(source, length)`: step(value) */
  cci: (length: number): CciStep => new CciStep(length),
  /** `ta.mfi(source, length)`: step(value, volume) */
  mfi: (length: number): MfiStep => new MfiStep(length),
  /** `ta.dmi(diLength, adxSmoothing)`: step(high, low, close) gives [plus, minus, adx] */
  dmi: (diLength: number, adxSmoothing: number): DmiStep => new DmiStep(diLength, adxSmoothing),
  /** `ta.linreg(source, length, offset)`: step(value), called on every bar (in an if block: callsite.linreg) */
  linreg: (length: number, offset = 0): LinregStep => new LinregStep(length, offset),
  /** `ta.percentrank(source, length)`: step(value) */
  percentrank: (length: number): PercentrankStep => new PercentrankStep(length),
  /** `ta.median(source, length)`: step(value) */
  median: (length: number): MedianStep => new MedianStep(length),
  /** `ta.correlation(source1, source2, length)`: step(a, b) */
  correlation: (length: number): CorrelationStep => new CorrelationStep(length),
  /** `ta.wpr(length)`: step(high, low, close) */
  wpr: (length = 14): WprStep => new WprStep(length),
  /** `ta.supertrend(factor, atrPeriod)`: step(high, low, close) gives [supertrend, direction] */
  supertrend: (factor: number, atrPeriod: number): SupertrendStep => new SupertrendStep(factor, atrPeriod),
};
