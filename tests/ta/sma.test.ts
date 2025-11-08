import { taCore } from '../../src';

describe('ta.sma', () => {
  it('should calculate simple moving average correctly', () => {
    const source = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result = taCore.sma(source, 3);

    expect(result[0]).toBeNaN();
    expect(result[1]).toBeNaN();
    expect(result[2]).toBe(2); // (1+2+3)/3 = 2
    expect(result[3]).toBe(3); // (2+3+4)/3 = 3
    expect(result[4]).toBe(4); // (3+4+5)/3 = 4
    expect(result[9]).toBe(9); // (8+9+10)/3 = 9
  });

  it('should handle length of 1', () => {
    const source = [1, 2, 3, 4, 5];
    const result = taCore.sma(source, 1);

    expect(result).toEqual(source);
  });

  it('should handle empty array', () => {
    const source: number[] = [];
    const result = taCore.sma(source, 3);

    expect(result).toEqual([]);
  });

  it('should match PineScript behavior for period 5', () => {
    // Test data matching a typical price series
    const source = [10, 12, 11, 13, 15, 14, 16, 18, 17, 19];
    const result = taCore.sma(source, 5);

    expect(result[4]).toBe((10 + 12 + 11 + 13 + 15) / 5);
    expect(result[9]).toBe((14 + 16 + 18 + 17 + 19) / 5);
  });
});
