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
import { eq } from '../compare/index.js';

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
};
