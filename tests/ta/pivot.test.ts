import { taCore } from '../../src';

const valuesAt = (series: number[]): Array<[number, number]> =>
  series.flatMap((v, i) => (Number.isNaN(v) ? [] : [[i, v] as [number, number]]));

// First 30 daily bars of NASDAQ:ARM and the PineScript pivots for them.
const high = [66.28, 69, 58.7407, 56.78, 55.4, 52.8, 52.9, 54.5, 54.53, 54.4099, 56.5, 56.79, 54.1899, 52.235,
  53.81, 53.9, 54.21, 55.8, 55.86, 56.33, 54.75, 52.56, 52.35, 52.76, 52.7, 52.7, 49.74, 51.88, 52.8917, 52.79];
const low = [55.54, 60.75, 55.02, 53.88, 51.52, 49.85, 50.3548, 50.02, 52.7, 51.7894, 52.86, 53.08, 51.91, 50.8,
  51.31, 52.09, 51.55, 53.37, 54.2, 54.38, 51.41, 50, 51.04, 50.65, 51.275, 49.53, 46.5, 46.5, 51.05, 49.31];

describe('ta.pivothigh / ta.pivotlow (PineScript values)', () => {
  it('returns the pivot value rightbars bars after the pivot bar', () => {
    expect(valuesAt(taCore.pivothigh(high, 3, 3))).toEqual([[14, 56.79], [22, 56.33]]);
    expect(valuesAt(taCore.pivotlow(low, 3, 3))).toEqual([[8, 49.85], [16, 50.8], [24, 50]]);
    expect(valuesAt(taCore.pivothigh(high, 5, 0))).toEqual([
      [10, 56.5], [11, 56.79], [17, 55.8], [18, 55.86], [19, 56.33], [28, 52.8917],
    ]);
  });

  it('supports the two-argument form', () => {
    expect(taCore.pivothigh(3, 3, undefined, high)).toEqual(taCore.pivothigh(high, 3, 3));
    expect(taCore.pivotlow(3, 3, undefined, low)).toEqual(taCore.pivotlow(low, 3, 3));
  });

  it('allows equal values on the left, not on the right', () => {
    expect(valuesAt(taCore.pivothigh([1, 2, 2, 1, 0], 1, 1))).toEqual([[3, 2]]);
    expect(valuesAt(taCore.pivotlow([3, 2, 2, 3, 4], 1, 1))).toEqual([[3, 2]]);
  });

  it('na values are skipped: the highest of the last left + right + 1 non-na values, on the bar right bars back', () => {
    // PineScript ta.pivothigh(src, 3, 2), src with na on bars 4 and 13 (values rounded)
    const src = [0, 100, -24, -90, NaN, 85, -64, -55, 94, 49, -86, -15, 101, NaN, -94, 40, 93];
    expect(valuesAt(taCore.pivothigh(src, 3, 2))).toEqual([[10, 94], [14, 101]]);
    // 3 on bar 0 is in the window of the last 3 values, so 2 is no pivot; an na value is never a pivot
    expect(valuesAt(taCore.pivothigh([3, NaN, 2, 1], 2, 1))).toEqual([]);
    expect(valuesAt(taCore.pivothigh([1, NaN, 1], 1, 1))).toEqual([]);
  });

  it('uses no future bar', () => {
    const base = taCore.pivothigh(high, 3, 3);
    const cut = taCore.pivothigh(high.slice(0, 20), 3, 3);
    expect(cut).toEqual(base.slice(0, 20));
  });
});
