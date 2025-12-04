import { math } from '../../src';
import { Series } from '../../src/runtime/series';

describe('math functions with Series support', () => {
  const bars = [
    { time: 1, open: 100, high: 110, low: 90, close: 105, volume: 1000 },
    { time: 2, open: 105, high: 115, low: 95, close: 110, volume: 1100 },
    { time: 3, open: 110, high: 120, low: 100, close: 115, volume: 1200 },
    { time: 4, open: 115, high: 125, low: 105, close: 120, volume: 1300 },
    { time: 5, open: 120, high: 130, low: 110, close: 125, volume: 1400 },
  ];

  describe('math.pow', () => {
    it('should accept Series base and scalar exponent', () => {
      const baseSeries = Series.fromArray(bars, [2, 3, 4, 5, 10]);
      const result = math.pow(baseSeries, 2);
      
      expect(result).toBeInstanceOf(Series);
      const values = result.toArray();
      expect(values).toEqual([4, 9, 16, 25, 100]);
    });

    it('should accept scalar base and Series exponent', () => {
      const expSeries = Series.fromArray(bars, [1, 2, 3, 4, 5]);
      const result = math.pow(2, expSeries);
      
      expect(result).toBeInstanceOf(Series);
      const values = result.toArray();
      expect(values).toEqual([2, 4, 8, 16, 32]);
    });

    it('should accept both Series base and Series exponent', () => {
      const baseSeries = Series.fromArray(bars, [2, 3, 4, 5, 10]);
      const expSeries = Series.fromArray(bars, [1, 2, 2, 2, 1]);
      const result = math.pow(baseSeries, expSeries);
      
      expect(result).toBeInstanceOf(Series);
      const values = result.toArray();
      expect(values).toEqual([2, 9, 16, 25, 10]);
    });

    it('should return scalar when both arguments are scalars', () => {
      const result = math.pow(2, 3);
      expect(typeof result).toBe('number');
      expect(result).toBe(8);
    });
  });

  describe('math.sqrt', () => {
    it('should accept Series input', () => {
      const inputSeries = Series.fromArray(bars, [4, 9, 16, 25, 100]);
      const result = math.sqrt(inputSeries);
      
      expect(result).toBeInstanceOf(Series);
      const values = result.toArray();
      expect(values).toEqual([2, 3, 4, 5, 10]);
    });

    it('should return scalar when input is scalar', () => {
      const result = math.sqrt(16);
      expect(typeof result).toBe('number');
      expect(result).toBe(4);
    });

    it('should handle NaN values in Series', () => {
      const inputSeries = Series.fromArray(bars, [4, NaN, 16, -1, 25]);
      const result = math.sqrt(inputSeries);
      
      const values = result.toArray();
      expect(values[0]).toBe(2);
      expect(values[1]).toBeNaN();
      expect(values[2]).toBe(4);
      expect(values[3]).toBeNaN(); // sqrt of negative is NaN
      expect(values[4]).toBe(5);
    });
  });

  describe('math.abs', () => {
    it('should accept Series input', () => {
      const inputSeries = Series.fromArray(bars, [-5, 3, -10, 0, 7]);
      const result = math.abs(inputSeries);
      
      expect(result).toBeInstanceOf(Series);
      const values = result.toArray();
      expect(values).toEqual([5, 3, 10, 0, 7]);
    });

    it('should return scalar when input is scalar', () => {
      const result = math.abs(-5);
      expect(typeof result).toBe('number');
      expect(result).toBe(5);
    });
  });

  describe('math.ceil', () => {
    it('should accept Series input', () => {
      const inputSeries = Series.fromArray(bars, [4.2, 4.8, -4.2, 5, 0.1]);
      const result = math.ceil(inputSeries);
      
      expect(result).toBeInstanceOf(Series);
      const values = result.toArray();
      expect(values).toEqual([5, 5, -4, 5, 1]);
    });

    it('should return scalar when input is scalar', () => {
      const result = math.ceil(4.2);
      expect(typeof result).toBe('number');
      expect(result).toBe(5);
    });
  });

  describe('math.floor', () => {
    it('should accept Series input', () => {
      const inputSeries = Series.fromArray(bars, [4.2, 4.8, -4.2, 5, 0.9]);
      const result = math.floor(inputSeries);
      
      expect(result).toBeInstanceOf(Series);
      const values = result.toArray();
      expect(values).toEqual([4, 4, -5, 5, 0]);
    });

    it('should return scalar when input is scalar', () => {
      const result = math.floor(4.8);
      expect(typeof result).toBe('number');
      expect(result).toBe(4);
    });
  });

  describe('math.round', () => {
    it('should accept Series input without precision', () => {
      const inputSeries = Series.fromArray(bars, [4.2, 4.5, 4.8, -4.5, 0.1]);
      const result = math.round(inputSeries);
      
      expect(result).toBeInstanceOf(Series);
      const values = result.toArray();
      expect(values).toEqual([4, 5, 5, -4, 0]);
    });

    it('should accept Series input with precision', () => {
      const inputSeries = Series.fromArray(bars, [4.567, 3.141, 2.718, 1.414, 0.577]);
      const result = math.round(inputSeries, 2);
      
      expect(result).toBeInstanceOf(Series);
      const values = result.toArray();
      expect(values[0]).toBeCloseTo(4.57, 10);
      expect(values[1]).toBeCloseTo(3.14, 10);
      expect(values[2]).toBeCloseTo(2.72, 10);
      expect(values[3]).toBeCloseTo(1.41, 10);
      expect(values[4]).toBeCloseTo(0.58, 10);
    });

    it('should return scalar when input is scalar', () => {
      const result = math.round(4.567, 2);
      expect(typeof result).toBe('number');
      expect(result).toBeCloseTo(4.57, 10);
    });
  });

  describe('math.max', () => {
    it('should accept Series in arguments', () => {
      const series1 = Series.fromArray(bars, [1, 5, 3, 8, 2]);
      const series2 = Series.fromArray(bars, [4, 2, 6, 3, 7]);
      const result = math.max(series1, series2);
      
      expect(result).toBeInstanceOf(Series);
      const values = result.toArray();
      expect(values).toEqual([4, 5, 6, 8, 7]);
    });

    it('should accept mix of Series and scalars', () => {
      const series1 = Series.fromArray(bars, [1, 5, 3, 8, 2]);
      const result = math.max(series1, 4, 6);
      
      expect(result).toBeInstanceOf(Series);
      const values = result.toArray();
      expect(values).toEqual([6, 6, 6, 8, 6]);
    });

    it('should return scalar when all inputs are scalars', () => {
      const result = math.max(1, 5, 3, 8, 2);
      expect(typeof result).toBe('number');
      expect(result).toBe(8);
    });
  });

  describe('math.min', () => {
    it('should accept Series in arguments', () => {
      const series1 = Series.fromArray(bars, [1, 5, 3, 8, 2]);
      const series2 = Series.fromArray(bars, [4, 2, 6, 3, 7]);
      const result = math.min(series1, series2);
      
      expect(result).toBeInstanceOf(Series);
      const values = result.toArray();
      expect(values).toEqual([1, 2, 3, 3, 2]);
    });

    it('should accept mix of Series and scalars', () => {
      const series1 = Series.fromArray(bars, [10, 5, 8, 3, 12]);
      const result = math.min(series1, 6, 9);
      
      expect(result).toBeInstanceOf(Series);
      const values = result.toArray();
      expect(values).toEqual([6, 5, 6, 3, 6]);
    });

    it('should return scalar when all inputs are scalars', () => {
      const result = math.min(1, 5, 3, 8, 2);
      expect(typeof result).toBe('number');
      expect(result).toBe(1);
    });
  });

  describe('math.avg', () => {
    it('should accept Series in arguments', () => {
      const series1 = Series.fromArray(bars, [2, 4, 6, 8, 10]);
      const series2 = Series.fromArray(bars, [4, 6, 8, 10, 12]);
      const result = math.avg(series1, series2);
      
      expect(result).toBeInstanceOf(Series);
      const values = result.toArray();
      expect(values).toEqual([3, 5, 7, 9, 11]);
    });

    it('should accept mix of Series and scalars', () => {
      const series1 = Series.fromArray(bars, [2, 4, 6, 8, 10]);
      const result = math.avg(series1, 10);
      
      expect(result).toBeInstanceOf(Series);
      const values = result.toArray();
      expect(values).toEqual([6, 7, 8, 9, 10]);
    });

    it('should return scalar when all inputs are scalars', () => {
      const result = math.avg(1, 2, 3, 4, 5);
      expect(typeof result).toBe('number');
      expect(result).toBe(3);
    });
  });

  describe('math.exp', () => {
    it('should accept Series input', () => {
      const inputSeries = Series.fromArray(bars, [0, 1, 2, -1, 3]);
      const result = math.exp(inputSeries);
      
      expect(result).toBeInstanceOf(Series);
      const values = result.toArray();
      expect(values[0]).toBeCloseTo(1, 10);
      expect(values[1]).toBeCloseTo(Math.E, 10);
      expect(values[2]).toBeCloseTo(Math.E * Math.E, 10);
      expect(values[3]).toBeCloseTo(1 / Math.E, 10);
    });

    it('should return scalar when input is scalar', () => {
      const result = math.exp(1);
      expect(typeof result).toBe('number');
      expect(result).toBeCloseTo(Math.E, 10);
    });
  });

  describe('math.log', () => {
    it('should accept Series input', () => {
      const inputSeries = Series.fromArray(bars, [1, Math.E, 10, 100, 2]);
      const result = math.log(inputSeries);
      
      expect(result).toBeInstanceOf(Series);
      const values = result.toArray();
      expect(values[0]).toBeCloseTo(0, 10);
      expect(values[1]).toBeCloseTo(1, 10);
    });

    it('should return scalar when input is scalar', () => {
      const result = math.log(Math.E);
      expect(typeof result).toBe('number');
      expect(result).toBeCloseTo(1, 10);
    });
  });

  describe('math.log10', () => {
    it('should accept Series input', () => {
      const inputSeries = Series.fromArray(bars, [1, 10, 100, 1000, 10000]);
      const result = math.log10(inputSeries);
      
      expect(result).toBeInstanceOf(Series);
      const values = result.toArray();
      expect(values).toEqual([0, 1, 2, 3, 4]);
    });

    it('should return scalar when input is scalar', () => {
      const result = math.log10(100);
      expect(typeof result).toBe('number');
      expect(result).toBe(2);
    });
  });

  describe('trigonometric functions', () => {
    describe('math.sin', () => {
      it('should accept Series input', () => {
        const inputSeries = Series.fromArray(bars, [0, Math.PI / 2, Math.PI, Math.PI / 6, Math.PI / 4]);
        const result = math.sin(inputSeries);
        
        expect(result).toBeInstanceOf(Series);
        const values = result.toArray();
        expect(values[0]).toBeCloseTo(0, 10);
        expect(values[1]).toBeCloseTo(1, 10);
        expect(values[2]).toBeCloseTo(0, 10);
        expect(values[3]).toBeCloseTo(0.5, 10);
      });

      it('should return scalar when input is scalar', () => {
        const result = math.sin(Math.PI / 2);
        expect(typeof result).toBe('number');
        expect(result).toBeCloseTo(1, 10);
      });
    });

    describe('math.cos', () => {
      it('should accept Series input', () => {
        const inputSeries = Series.fromArray(bars, [0, Math.PI / 2, Math.PI, Math.PI / 3, 2 * Math.PI]);
        const result = math.cos(inputSeries);
        
        expect(result).toBeInstanceOf(Series);
        const values = result.toArray();
        expect(values[0]).toBeCloseTo(1, 10);
        expect(values[1]).toBeCloseTo(0, 10);
        expect(values[2]).toBeCloseTo(-1, 10);
        expect(values[3]).toBeCloseTo(0.5, 10);
        expect(values[4]).toBeCloseTo(1, 10);
      });

      it('should return scalar when input is scalar', () => {
        const result = math.cos(0);
        expect(typeof result).toBe('number');
        expect(result).toBe(1);
      });
    });

    describe('math.tan', () => {
      it('should accept Series input', () => {
        const inputSeries = Series.fromArray(bars, [0, Math.PI / 4, Math.PI / 6, -Math.PI / 4, Math.PI]);
        const result = math.tan(inputSeries);
        
        expect(result).toBeInstanceOf(Series);
        const values = result.toArray();
        expect(values[0]).toBeCloseTo(0, 10);
        expect(values[1]).toBeCloseTo(1, 10);
      });

      it('should return scalar when input is scalar', () => {
        const result = math.tan(Math.PI / 4);
        expect(typeof result).toBe('number');
        expect(result).toBeCloseTo(1, 10);
      });
    });

    describe('math.asin', () => {
      it('should accept Series input', () => {
        const inputSeries = Series.fromArray(bars, [0, 0.5, 1, -1, -0.5]);
        const result = math.asin(inputSeries);
        
        expect(result).toBeInstanceOf(Series);
        const values = result.toArray();
        expect(values[0]).toBeCloseTo(0, 10);
        expect(values[1]).toBeCloseTo(Math.PI / 6, 10);
        expect(values[2]).toBeCloseTo(Math.PI / 2, 10);
        expect(values[3]).toBeCloseTo(-Math.PI / 2, 10);
      });

      it('should return scalar when input is scalar', () => {
        const result = math.asin(1);
        expect(typeof result).toBe('number');
        expect(result).toBeCloseTo(Math.PI / 2, 10);
      });
    });

    describe('math.acos', () => {
      it('should accept Series input', () => {
        const inputSeries = Series.fromArray(bars, [1, 0.5, 0, -1, -0.5]);
        const result = math.acos(inputSeries);
        
        expect(result).toBeInstanceOf(Series);
        const values = result.toArray();
        expect(values[0]).toBeCloseTo(0, 10);
        expect(values[1]).toBeCloseTo(Math.PI / 3, 10);
        expect(values[2]).toBeCloseTo(Math.PI / 2, 10);
        expect(values[3]).toBeCloseTo(Math.PI, 10);
      });

      it('should return scalar when input is scalar', () => {
        const result = math.acos(0);
        expect(typeof result).toBe('number');
        expect(result).toBeCloseTo(Math.PI / 2, 10);
      });
    });

    describe('math.atan', () => {
      it('should accept Series input', () => {
        const inputSeries = Series.fromArray(bars, [0, 1, -1, 100, -100]);
        const result = math.atan(inputSeries);
        
        expect(result).toBeInstanceOf(Series);
        const values = result.toArray();
        expect(values[0]).toBeCloseTo(0, 10);
        expect(values[1]).toBeCloseTo(Math.PI / 4, 10);
        expect(values[2]).toBeCloseTo(-Math.PI / 4, 10);
      });

      it('should return scalar when input is scalar', () => {
        const result = math.atan(1);
        expect(typeof result).toBe('number');
        expect(result).toBeCloseTo(Math.PI / 4, 10);
      });
    });
  });

  describe('angle conversion functions', () => {
    describe('math.toradians', () => {
      it('should accept Series input', () => {
        const inputSeries = Series.fromArray(bars, [0, 90, 180, 270, 360]);
        const result = math.toradians(inputSeries);
        
        expect(result).toBeInstanceOf(Series);
        const values = result.toArray();
        expect(values[0]).toBeCloseTo(0, 10);
        expect(values[1]).toBeCloseTo(Math.PI / 2, 10);
        expect(values[2]).toBeCloseTo(Math.PI, 10);
        expect(values[3]).toBeCloseTo(3 * Math.PI / 2, 10);
        expect(values[4]).toBeCloseTo(2 * Math.PI, 10);
      });

      it('should return scalar when input is scalar', () => {
        const result = math.toradians(180);
        expect(typeof result).toBe('number');
        expect(result).toBeCloseTo(Math.PI, 10);
      });
    });

    describe('math.todegrees', () => {
      it('should accept Series input', () => {
        const inputSeries = Series.fromArray(bars, [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2, 2 * Math.PI]);
        const result = math.todegrees(inputSeries);
        
        expect(result).toBeInstanceOf(Series);
        const values = result.toArray();
        expect(values[0]).toBeCloseTo(0, 10);
        expect(values[1]).toBeCloseTo(90, 10);
        expect(values[2]).toBeCloseTo(180, 10);
        expect(values[3]).toBeCloseTo(270, 10);
        expect(values[4]).toBeCloseTo(360, 10);
      });

      it('should return scalar when input is scalar', () => {
        const result = math.todegrees(Math.PI);
        expect(typeof result).toBe('number');
        expect(result).toBeCloseTo(180, 10);
      });
    });
  });

  describe('math.sign', () => {
    it('should accept Series input', () => {
      const inputSeries = Series.fromArray(bars, [5, -3, 0, 100, -0.001]);
      const result = math.sign(inputSeries);
      
      expect(result).toBeInstanceOf(Series);
      const values = result.toArray();
      expect(values).toEqual([1, -1, 0, 1, -1]);
    });

    it('should return scalar when input is scalar', () => {
      const result = math.sign(-5);
      expect(typeof result).toBe('number');
      expect(result).toBe(-1);
    });
  });

  describe('math.round_to_mintick', () => {
    it('should accept Series input', () => {
      const inputSeries = Series.fromArray(bars, [1.2345, 1.2367, 2.5678, 3.1415, 0.9999]);
      const result = math.round_to_mintick(inputSeries, 0.01);
      
      expect(result).toBeInstanceOf(Series);
      const values = result.toArray();
      expect(values[0]).toBeCloseTo(1.23, 10);
      expect(values[1]).toBeCloseTo(1.24, 10);
      expect(values[2]).toBeCloseTo(2.57, 10);
      expect(values[3]).toBeCloseTo(3.14, 10);
      expect(values[4]).toBeCloseTo(1.00, 10);
    });

    it('should return scalar when input is scalar', () => {
      const result = math.round_to_mintick(1.2367, 0.01);
      expect(typeof result).toBe('number');
      expect(result).toBeCloseTo(1.24, 10);
    });

    it('should handle NaN values in Series', () => {
      const inputSeries = Series.fromArray(bars, [1.2345, NaN, 2.5678, 3.1415, NaN]);
      const result = math.round_to_mintick(inputSeries, 0.01);
      
      const values = result.toArray();
      expect(values[0]).toBeCloseTo(1.23, 10);
      expect(values[1]).toBeNaN();
      expect(values[2]).toBeCloseTo(2.57, 10);
      expect(values[3]).toBeCloseTo(3.14, 10);
      expect(values[4]).toBeNaN();
    });

    it('should throw error when mintick is not provided', () => {
      const inputSeries = Series.fromArray(bars, [1.2345, 2.5678, 3.1415]);
      expect(() => math.round_to_mintick(inputSeries)).toThrow();
    });
  });
});
