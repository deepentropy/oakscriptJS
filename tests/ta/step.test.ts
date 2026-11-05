/**
 * ta.* one bar at a time (#196): each machine driven over an array gives the doubles of the array function of `ta`,
 * bit for bit (Object.is: -0 and NaN included), on series with na, ±Infinity, -0, ties and flat runs. A step with
 * another value before the bar's own one (a live update of the forming bar) changes nothing.
 */
import { taCore, math } from '../../src';
import * as step from '../../src/ta/step';
import type { BarStep } from '../../src/ta/step';

const N = 1500;

function rng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

/** Price-like walk with na / ±Infinity / -0 / flat runs injected */
function series(seed: number, special = true): number[] {
  const r = rng(seed);
  let p = 100;
  return Array.from({ length: N }, (_, i) => {
    p = Math.max(0.01, p * (1 + (r() - 0.5) * 0.04));
    if (!special) return p;
    const k = Math.floor(r() * 40);
    if (k === 0) return NaN;
    if (k === 1) return r() < 0.5 ? Infinity : -Infinity;
    if (k === 2) return -0;
    if (k === 3) return 0;
    if (i % 97 < 6) return 100; // flat run (ties)
    return p;
  });
}

const prices = series(7);
const clean = series(11, false);
const other = series(13);
const high = clean.map((c, i) => c * (1 + 0.01 * ((i * 7) % 5)));
const low = clean.map((c, i) => c * (1 - 0.01 * ((i * 3) % 4)));
const closeNa = clean.map((c, i) => (i % 53 === 7 ? NaN : c));
const volume = clean.map((_, i) => (i % 41 === 0 ? 0 : (i % 31 === 3 ? NaN : 1000 + ((i * 37) % 500))));
const cond = prices.map((v, i) => (i % 17 === 3 || v > 101 ? 1 : 0));

/** The machine's results over the arrays; on every bar a wrong step first, then the bar's own values. */
function drive<A extends unknown[], R>(m: BarStep<A, R>, args: (i: number) => A, wrong: (i: number) => A): R[] {
  const out: R[] = [];
  for (let i = 0; i < N; i++) {
    m.step(...wrong(i));
    out.push(m.step(...args(i)));
    m.commit();
  }
  return out;
}

const same = (a: ArrayLike<unknown>, b: ArrayLike<unknown>): void => {
  expect(a.length).toBe(b.length);
  for (let i = 0; i < a.length; i++) {
    if (!Object.is(a[i], b[i])) throw new Error(`bar ${i}: step ${String(a[i])}, array ${String(b[i])}`);
  }
};

const shift = (x: number[], i: number): number => x[(i + 5) % N]! * 1.5 + 3;

const sources: Array<[string, number[]]> = [['prices', prices], ['clean', clean], ['other', other]];
const lengths = [1, 2, 3, 7, 14, 50];

describe('ta one bar at a time equals the array functions (#196)', () => {
  for (const [name, x] of sources) {
    for (const len of lengths) {
      it(`${name}, length ${len}: sum, sma, variance, stdev, ema, rma, wma`, () => {
        const one = (i: number): [number] => [x[i]!];
        const wrong1 = (i: number): [number] => [shift(x, i)];
        const two = (i: number): [number, number] => [x[i]!, len];
        const wrong2 = (i: number): [number, number] => [shift(x, i), len];
        same(drive(new step.SumStep(), two, wrong2), math.sum(x, len));
        same(drive(new step.SmaStep(), two, wrong2), taCore.sma(x, len));
        same(drive(new step.VarianceStep(), (i) => [x[i]!, len, true], (i) => [shift(x, i), len, true]), taCore.variance(x, len, true));
        same(drive(new step.VarianceStep(), (i) => [x[i]!, len, false], (i) => [shift(x, i), len, false]), taCore.variance(x, len, false));
        same(drive(new step.StdevStep(), (i) => [x[i]!, len, true], (i) => [shift(x, i), len, true]), taCore.stdev(x, len, true));
        same(drive(new step.StdevStep(), (i) => [x[i]!, len, false], (i) => [shift(x, i), len, false]), taCore.stdev(x, len, false));
        same(drive(new step.EmaStep(len), one, wrong1), taCore.ema(x, len));
        same(drive(new step.RmaStep(len), one, wrong1), taCore.rma(x, len));
        same(drive(new step.WmaStep(), two, wrong2), taCore.wma(x, len));
      });

      it(`${name}, length ${len}: change, mom, roc, rsi, highest, lowest, valuewhen`, () => {
        const one = (i: number): [number] => [x[i]!];
        const wrong1 = (i: number): [number] => [shift(x, i)];
        same(drive(new step.ChangeStep(len), one, wrong1), taCore.change(x, len));
        same(drive(new step.MomStep(len), one, wrong1), taCore.mom(x, len));
        same(drive(new step.RocStep(len), one, wrong1), taCore.roc(x, len));
        same(drive(new step.RsiStep(len), one, wrong1), taCore.rsi(x, len));
        same(drive(new step.HighestStep(), (i) => [x[i]!, len], (i) => [shift(x, i), len]), taCore.highest(x, len));
        same(drive(new step.LowestStep(), (i) => [x[i]!, len], (i) => [shift(x, i), len]), taCore.lowest(x, len));
        const occ = len % 4;
        same(drive(new step.ValuewhenStep(occ), (i) => [cond[i]!, x[i]!], (i) => [1 - cond[i]!, shift(x, i)]), taCore.valuewhen(cond.map(Boolean), x, occ));
      });
    }

    it(`${name}: cum, crossover, crossunder, cross, barssince`, () => {
      const pair = (i: number): [number, number] => [x[i]!, other[i]!];
      const wrongPair = (i: number): [number, number] => [other[i]!, x[i]!];
      same(drive(new step.CumStep(), (i) => [x[i]!], (i) => [shift(x, i)]), taCore.cum(x));
      same(drive(new step.CrossoverStep(), pair, wrongPair), taCore.crossover(x, other));
      same(drive(new step.CrossunderStep(), pair, wrongPair), taCore.crossunder(x, other));
      same(drive(new step.CrossStep(), pair, wrongPair), taCore.cross(x, other));
      same(drive(new step.BarssinceStep(), (i) => [cond[i]!], (i) => [1 - cond[i]!]), taCore.barssince(cond.map(Boolean)));
    });
  }

  for (const len of lengths) {
    it(`bars, length ${len}: tr, atr, stoch, obv, vwma, macd, bb`, () => {
      const hlc = (i: number): [number, number, number] => [high[i]!, low[i]!, closeNa[i]!];
      const wrongHlc = (i: number): [number, number, number] => [low[i]!, high[i]! * 2, clean[(i + 3) % N]!];
      same(drive(new step.TrStep(false), hlc, wrongHlc), taCore.tr(false, high, low, closeNa));
      same(drive(new step.TrStep(true), hlc, wrongHlc), taCore.tr(true, high, low, closeNa));
      same(drive(new step.AtrStep(len), hlc, wrongHlc), taCore.atr(len, high, low, closeNa));
      same(
        drive(new step.StochStep(len), (i) => [prices[i]!, high[i]!, low[i]!], (i) => [shift(prices, i), low[i]!, high[i]!]),
        taCore.stoch(prices, high, low, len)
      );
      same(drive(new step.ObvStep(), (i) => [closeNa[i]!, volume[i]!], (i) => [clean[(i + 9) % N]!, 7]), taCore.obv(closeNa, volume));
      same(drive(new step.VwmaStep(len), (i) => [prices[i]!, volume[i]!], (i) => [shift(prices, i), 3]), taCore.vwma(prices, len, volume));
      const macd = drive(new step.MacdStep(len, len * 2 + 1, Math.max(1, len - 1)), (i) => [prices[i]!], (i) => [shift(prices, i)]);
      const ref = taCore.macd(prices, len, len * 2 + 1, Math.max(1, len - 1));
      for (let k = 0; k < 3; k++) same(macd.map((m) => m[k]), ref[k]!);
      const bb = drive(new step.BbStep(len, 2), (i) => [prices[i]!], (i) => [shift(prices, i)]);
      const refBb = taCore.bb(prices, len, 2);
      for (let k = 0; k < 3; k++) same(bb.map((m) => m[k]), refBb[k]!);
    });
  }

  it('a bar without a step is not in the history of the call (a call in an if block)', () => {
    const m = new step.ChangeStep(1);
    expect(m.step(10)).toBeNaN();
    m.commit();
    m.commit(); // a bar without a call
    expect(m.step(13)).toBe(3);
  });
});

describe('taStep (#196)', () => {
  it('a live feed: history, updates of the forming bar, a new bar, gives the array result of the final bars', () => {
    const { taStep } = require('../../src') as typeof import('../../src');
    const final = clean.slice(0, 400);
    const rsi = taStep.rsi(14);
    const bb = taStep.bb(20, 2);
    const got: number[] = [];
    const gotUpper: number[] = [];
    for (let i = 0; i < final.length; i++) {
      // the forming bar receives a few prices before its close
      for (const tick of [final[i]! * 0.99, final[i]! * 1.02, final[i]!]) {
        got[i] = rsi.step(tick);
        gotUpper[i] = bb.step(tick)[1];
      }
      rsi.commit();
      bb.commit();
    }
    same(got, taCore.rsi(final, 14));
    same(gotUpper, taCore.bb(final, 20, 2)[1]);
  });
});

describe('more ta one bar at a time (#196)', () => {
  for (const [name, x] of sources) {
    for (const len of [2, 3, 7, 14, 50]) {
      it(`${name}, length ${len}: hma, dev, cci, linreg, percentrank, median, correlation, mfi`, () => {
        const one = (i: number): [number] => [x[i]!];
        const wrong1 = (i: number): [number] => [shift(x, i)];
        same(drive(new step.HmaStep(len), one, wrong1), taCore.hma(x, len));
        same(drive(new step.DevStep(len), one, wrong1), taCore.dev(x, len));
        same(drive(new step.CciStep(len), one, wrong1), taCore.cci(x, len));
        same(drive(new step.LinregStep(len, 0), one, wrong1), taCore.linreg(x, len, 0));
        same(drive(new step.LinregStep(len, 2), one, wrong1), taCore.linreg(x, len, 2));
        same(drive(new step.PercentrankStep(len), one, wrong1), taCore.percentrank(x, len));
        same(drive(new step.MedianStep(len), one, wrong1), taCore.median(x, len));
        same(drive(new step.CorrelationStep(len), (i) => [x[i]!, other[i]!], (i) => [other[i]!, shift(x, i)]), taCore.correlation(x, other, len));
        same(drive(new step.MfiStep(len), (i) => [x[i]!, volume[i]!], (i) => [shift(x, i), 5]), taCore.mfi(x, len, volume));
      });
    }
  }

  for (const len of [2, 7, 14, 30]) {
    it(`bars, length ${len}: dmi, wpr, supertrend`, () => {
      const hlc = (i: number): [number, number, number] => [high[i]!, low[i]!, closeNa[i]!];
      const wrongHlc = (i: number): [number, number, number] => [low[i]!, high[i]! * 2, clean[(i + 3) % N]!];
      const dmi = drive(new step.DmiStep(len, Math.max(1, len - 1)), hlc, wrongHlc);
      const refDmi = taCore.dmi(len, Math.max(1, len - 1), high, low, closeNa);
      for (let k = 0; k < 3; k++) same(dmi.map((m) => m[k]), refDmi[k]!);
      same(drive(new step.WprStep(len), hlc, wrongHlc), taCore.wpr(high, low, closeNa, len));
      const st = drive(new step.SupertrendStep(3, len), hlc, wrongHlc);
      const refSt = taCore.supertrend(3, len, high, low, closeNa);
      for (let k = 0; k < 2; k++) same(st.map((m) => m[k]), refSt[k]!);
    });
  }
});
