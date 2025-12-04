import { math } from '../../src';
import { Series } from '../../src/runtime/series';

describe('math.sum with Series', () => {
  const bars = [
    { time: 1, open: 100, high: 110, low: 90, close: 105, volume: 1000 },
    { time: 2, open: 105, high: 115, low: 95, close: 110, volume: 1100 },
    { time: 3, open: 110, high: 120, low: 100, close: 115, volume: 1200 },
    { time: 4, open: 115, high: 125, low: 105, close: 120, volume: 1300 },
    { time: 5, open: 120, high: 130, low: 110, close: 125, volume: 1400 },
  ];

  it('should accept Series input and return Series', () => {
    const closeSeries = new Series(bars, (bar) => bar.close);
    const sumSeries = math.sum(closeSeries, 3);
    
    // sumSeries should be a Series instance
    expect(sumSeries).toBeInstanceOf(Series);
    
    // Should have toArray() method
    const result = sumSeries.toArray();
    expect(Array.isArray(result)).toBe(true);
    
    // Verify values
    expect(result[0]).toBeNaN();
    expect(result[1]).toBeNaN();
    expect(result[2]).toBe(330); // 105+110+115
    expect(result[3]).toBe(345); // 110+115+120
    expect(result[4]).toBe(360); // 115+120+125
  });

  it('should accept array input and return array', () => {
    const closeArray = bars.map(bar => bar.close);
    const result = math.sum(closeArray, 3);
    
    // result should be an array
    expect(Array.isArray(result)).toBe(true);
    
    // Verify values
    expect(result[0]).toBeNaN();
    expect(result[1]).toBeNaN();
    expect(result[2]).toBe(330); // 105+110+115
    expect(result[3]).toBe(345); // 110+115+120
    expect(result[4]).toBe(360); // 115+120+125
  });

  it('should produce same numerical results for Series and array inputs', () => {
    const closeSeries = new Series(bars, (bar) => bar.close);
    const closeArray = bars.map(bar => bar.close);
    
    const seriesResult = math.sum(closeSeries, 3).toArray();
    const arrayResult = math.sum(closeArray, 3);
    
    expect(seriesResult.length).toBe(arrayResult.length);
    
    for (let i = 0; i < seriesResult.length; i++) {
      if (isNaN(seriesResult[i])) {
        expect(arrayResult[i]).toBeNaN();
      } else {
        expect(seriesResult[i]).toBe(arrayResult[i]);
      }
    }
  });
});
