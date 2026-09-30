import { taCore } from '../../src';

// First 9 daily bars of NASDAQ:ARM and the PineScript values for them.
const close = [63.59, 60.75, 58, 55.17, 52.91, 52.16, 51.32, 54.44, 53.52];
const high = [66.28, 69, 58.7407, 56.78, 55.4, 52.8, 52.9, 54.5, 54.53];
const na7 = close.map((x, i) => (i % 7 === 3 ? NaN : x)); // na on bar 3
const N = NaN;

const expectValues = (actual: number[], expected: number[]) =>
  expected.forEach((e, i) => (Number.isNaN(e) ? expect(actual[i]).toBeNaN() : expect(actual[i]).toBeCloseTo(e, 9)));

describe('ta.highest / ta.highestbars', () => {
  it('window of length bars; highestbars gives a negative offset', () => {
    expectValues(taCore.highest(high, 5), [N, N, N, N, 69, 69, 58.7407, 56.78, 55.4]);
    expectValues(taCore.highestbars(high, 5), [N, N, N, N, -3, -4, -4, -4, -4]);
  });

  it('an na value ends the window', () => {
    expectValues(taCore.highest(na7, 4), [N, N, N, N, 52.91, 52.91, 52.91, 54.44, 54.44]);
    expectValues(taCore.highestbars(na7, 4), [N, N, N, 0, 0, -1, -2, 0, -1]);
  });

  it('on equal values the oldest bar wins', () => {
    expect(taCore.highestbars([1, 3, 3, 2], 3)).toEqual([NaN, NaN, -1, -2]);
    expect(taCore.lowestbars([5, 1, 1, 2], 3)).toEqual([NaN, NaN, -1, -2]);
  });
});

describe('ta.stdev, ta.range (last length non-na values)', () => {
  it('stdev is biased by default; biased = false divides by length - 1', () => {
    const v = [1, 2, 3, 4];
    expect(taCore.stdev(v, 4)[3]).toBeCloseTo(Math.sqrt(1.25), 12);
    expect(taCore.stdev(v, 4, false)[3]).toBeCloseTo(Math.sqrt(5 / 3), 12);
  });

  it('skips na values, also on a bar whose value is na', () => {
    expectValues(taCore.stdev(na7, 5), [N, N, N, N, N, 4.415488194979187, 3.688758056582206]);
    expectValues(taCore.range(na7, 4), [N, N, N, N, 10.680000000000007, 8.590000000000003, 6.68, 3.1199999999999974, 3.12]);
    expect(taCore.range([1, 5, NaN, 2], 3)[2]).toBeNaN(); // only 2 non-na values so far
    expect(taCore.range([1, 5, NaN, 2], 3)[3]).toBe(4); // last 3 non-na values: 2, 5, 1
  });
});

describe('ta.max / ta.min (all-time)', () => {
  it('carry the best value over na bars', () => {
    const na5 = close.map((x, i) => (i % 5 === 0 ? NaN : x));
    expectValues(taCore.max(close), close.map(() => 63.59));
    expectValues(taCore.max(na5), [N, 60.75, 60.75, 60.75, 60.75, 60.75, 60.75, 60.75, 60.75]);
    expectValues(taCore.min([3, NaN, 1, 2]), [3, 3, 1, 1]);
  });
});

describe('ta.vwap with anchor and bands', () => {
  it('restarts the sums on anchor bars and returns vwap ± mult × stdev', () => {
    const src = [10, 12, 11, 20, 22];
    const vol = [1, 1, 2, 1, 3];
    const anchor = [true, false, false, true, false];
    const [m, u, l] = taCore.vwap(src, vol, anchor, 2);
    expect(m).toEqual([10, 11, 11, 20, 21.5]);
    // bar 4: Σv·x² / Σv − vwap² = (400 + 3·484) / 4 − 21.5² = 0.75
    expect(u[4]).toBeCloseTo(21.5 + 2 * Math.sqrt(0.75), 12);
    expect(l[4]).toBeCloseTo(21.5 - 2 * Math.sqrt(0.75), 12);
    // without anchor the sums never restart: bar 3 = 64 / 5, bar 4 = 130 / 8
    expect(taCore.vwap(src, vol)).toEqual([10, 11, 11, 12.8, 16.25]);
  });
});
