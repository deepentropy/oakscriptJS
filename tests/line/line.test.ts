import * as line from '../../src/line';

describe('Line Functions', () => {
  describe('line.new', () => {
    it('should create a line with required parameters', () => {
      const l = line.new(0, 100, 50, 150);

      expect(l.x1).toBe(0);
      expect(l.y1).toBe(100);
      expect(l.x2).toBe(50);
      expect(l.y2).toBe(150);
      expect(l.xloc).toBe('bar_index');
      expect(l.extend).toBe('none');
      expect(l.style).toBe('solid');
      expect(l.width).toBe(1);
      // PineScript keeps a width of 0 (#172)
      expect(line.new(0, 100, 10, 110, 'bar_index', 'none', undefined, 'solid', 0).width).toBe(0);
    });

    it('should create a line with custom xloc and extend', () => {
      const l = line.new(0, 100, 50, 150, 'bar_index', 'right');

      expect(l.xloc).toBe('bar_index');
      expect(l.extend).toBe('right');
    });

    it('should create a line with styling options', () => {
      const l = line.new(0, 100, 50, 150, 'bar_index', 'none', '#FF0000', 'dashed', 2);

      expect(l.color).toBe('#FF0000');
      expect(l.style).toBe('dashed');
      expect(l.width).toBe(2);
    });

    it('should handle bar_time xloc', () => {
      const l = line.new(1609459200000, 100, 1609545600000, 150, 'bar_time');

      expect(l.xloc).toBe('bar_time');
    });
  });

  describe('line.get_price', () => {
    describe('Basic interpolation', () => {
      it('should calculate price at midpoint', () => {
        const l = line.new(0, 100, 50, 150);
        const price = line.get_price(l, 25);

        expect(price).toBeCloseTo(125);
      });

      it('should calculate price at any point in segment', () => {
        const l = line.new(0, 100, 50, 150);

        expect(line.get_price(l, 0)).toBeCloseTo(100);
        expect(line.get_price(l, 10)).toBeCloseTo(110);
        expect(line.get_price(l, 25)).toBeCloseTo(125);
        expect(line.get_price(l, 40)).toBeCloseTo(140);
        expect(line.get_price(l, 50)).toBeCloseTo(150);
      });

      it('should handle negative slope (descending line)', () => {
        const l = line.new(0, 150, 50, 100);

        expect(line.get_price(l, 0)).toBeCloseTo(150);
        expect(line.get_price(l, 25)).toBeCloseTo(125);
        expect(line.get_price(l, 50)).toBeCloseTo(100);
      });

      it('should handle horizontal line (zero slope)', () => {
        const l = line.new(0, 100, 50, 100);

        expect(line.get_price(l, 0)).toBeCloseTo(100);
        expect(line.get_price(l, 25)).toBeCloseTo(100);
        expect(line.get_price(l, 50)).toBeCloseTo(100);
      });

      it('should return NaN for vertical line (undefined slope)', () => {
        const l = line.new(25, 100, 25, 150);

        expect(line.get_price(l, 25)).toBeNaN();
      });
    });

    describe('Extension modes', () => {
      // PineScript reads the line as extended on both sides whatever its extend (#174)
      it.each(['none', 'left', 'right', 'both'] as const)('extends both sides with extend=%s', (ext) => {
        const l = line.new(10, 100, 50, 150, 'bar_index', ext);
        expect(line.get_price(l, 0)).toBe(87.5);
        expect(line.get_price(l, 5)).toBe(93.75);
        expect(line.get_price(l, 30)).toBe(125);
        expect(line.get_price(l, 60)).toBe(162.5);
        expect(line.get_price(l, 100)).toBe(212.5);
      });

      it('computes y1 + (y2 - y1) * (x - x1) / (x2 - x1) in that order', () => {
        // BITSTAMP:BTCUSD 1D bar 13: line from (3, close[10]) to (8, close[5]), price at 13 (PineScript 4.740000000000003)
        const l = line.new(3, 11.7, 8, 8.22, 'bar_index', 'none');
        expect(line.get_price(l, 13)).toBe(4.740000000000003); // the slope form gives 4.740000000000002
      });

      it('throws RE10119 for a line placed with xloc.bar_time', () => {
        const l = line.new(1000, 1, 2000, 2, 'bar_time');
        expect(() => line.get_price(l, 5)).toThrow("'line.get_price' must be used with lines created using 'xloc=xloc.bar_index'.");
      });
    });

    describe('Real-world use cases', () => {
      it('should detect trend line breakout', () => {
        // Uptrend line from bar 0 (price 100) to bar 50 (price 150)
        const trendLine = line.new(0, 100, 50, 150, 'bar_index', 'right');

        // Calculate expected price at bar 75
        const expectedPrice = line.get_price(trendLine, 75);
        expect(expectedPrice).toBeCloseTo(175);

        // Simulate price breaking above trend
        const currentPrice = 180;
        if (currentPrice > expectedPrice) {
          // Breakout detected!
          expect(currentPrice).toBeGreaterThan(expectedPrice);
        }
      });

      it('should calculate support/resistance levels', () => {
        // Horizontal support at 100
        const support = line.new(0, 100, 100, 100, 'bar_index', 'both');

        // Support level should be constant
        expect(line.get_price(support, 50)).toBe(100);
        expect(line.get_price(support, 100)).toBe(100);
        expect(line.get_price(support, 150)).toBe(100);
      });

      it('should work with decimal prices and bars', () => {
        const l = line.new(0, 100.5, 50, 150.75);

        expect(line.get_price(l, 25)).toBeCloseTo(125.625);
      });

      it('should handle very steep slopes', () => {
        const l = line.new(0, 100, 10, 1000); // Gain of 900 in 10 bars

        expect(line.get_price(l, 5)).toBeCloseTo(550);
        expect(line.get_price(l, 10)).toBeCloseTo(1000);
      });
    });

    describe('Edge cases', () => {
      it('should handle negative bar indices', () => {
        const l = line.new(-10, 100, 10, 120, 'bar_index', 'both');

        expect(line.get_price(l, -10)).toBeCloseTo(100);
        expect(line.get_price(l, 0)).toBeCloseTo(110);
        expect(line.get_price(l, 10)).toBeCloseTo(120);
      });

      it('should handle negative prices', () => {
        const l = line.new(0, -100, 50, -50);

        expect(line.get_price(l, 25)).toBeCloseTo(-75);
      });

      it('should handle reversed x coordinates (x2 < x1)', () => {
        const l = line.new(50, 150, 0, 100);

        expect(line.get_price(l, 25)).toBeCloseTo(125);
      });

      it('should throw error for bar_time xloc', () => {
        const l = line.new(1609459200000, 100, 1609545600000, 150, 'bar_time');

        expect(() => line.get_price(l, 1609502400000)).toThrow(
          "'line.get_price' must be used with lines created using 'xloc=xloc.bar_index'."
        );
      });
    });
  });

  describe('line.get_x1/x2/y1/y2', () => {
    it('should return correct coordinates', () => {
      const l = line.new(10, 100, 50, 150);

      expect(line.get_x1(l)).toBe(10);
      expect(line.get_y1(l)).toBe(100);
      expect(line.get_x2(l)).toBe(50);
      expect(line.get_y2(l)).toBe(150);
    });

    it('should be used to calculate line slope', () => {
      const l = line.new(0, 100, 50, 150);

      const dx = line.get_x2(l) - line.get_x1(l);
      const dy = line.get_y2(l) - line.get_y1(l);
      const slope = dy / dx;

      expect(slope).toBeCloseTo(1.0); // 50/50 = 1
    });

    it('should be used to calculate line offset', () => {
      // Pattern from Auto Fib Extension indicator
      const line1 = line.new(0, 100, 50, 150);
      const line2 = line.new(10, 120, 60, 170);

      const offset = line.get_y1(line1) - line.get_y2(line2);
      expect(offset).toBe(-70); // 100 - 170
    });
  });

  describe('line.copy', () => {
    it('should create an independent copy', () => {
      const original = line.new(0, 100, 50, 150, 'bar_index', 'right', '#FF0000');
      const copied = line.copy(original);

      expect(copied.x1).toBe(original.x1);
      expect(copied.y1).toBe(original.y1);
      expect(copied.x2).toBe(original.x2);
      expect(copied.y2).toBe(original.y2);
      expect(copied.extend).toBe(original.extend);
      expect(copied.color).toBe(original.color);
    });

    it('should not modify original when copy is changed', () => {
      const original = line.new(0, 100, 50, 150);
      const copied = line.copy(original);

      copied.y2 = 200;

      expect(original.y2).toBe(150);
      expect(copied.y2).toBe(200);
    });
  });

  describe('line.delete', () => {
    it('should exist for API compatibility', () => {
      const l = line.new(0, 100, 50, 150);

      // Should not throw
      expect(() => line.delete_line(l)).not.toThrow();
    });
  });
});
