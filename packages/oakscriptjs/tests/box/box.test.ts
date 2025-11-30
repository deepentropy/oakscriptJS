import * as box from '../../src/box';

describe('Box Functions', () => {
  describe('box.new', () => {
    it('should create a box with required parameters', () => {
      const b = box.new(10, 105, 20, 100);

      expect(b.left).toBe(10);
      expect(b.top).toBe(105);
      expect(b.right).toBe(20);
      expect(b.bottom).toBe(100);
      expect(b.xloc).toBe('bar_index');
      expect(b.extend).toBe('none');
      expect(b.border_width).toBe(1);
      expect(b.border_style).toBe('solid');
    });

    it('should create a box with custom xloc and extend', () => {
      const b = box.new(10, 105, 20, 100, 'bar_index', 'right');

      expect(b.xloc).toBe('bar_index');
      expect(b.extend).toBe('right');
    });

    it('should create a box with border styling', () => {
      const b = box.new(10, 105, 20, 100, 'bar_index', 'none', '#FF0000', 2, 'dashed');

      expect(b.border_color).toBe('#FF0000');
      expect(b.border_width).toBe(2);
      expect(b.border_style).toBe('dashed');
    });

    it('should create a box with background color', () => {
      const b = box.new(10, 105, 20, 100, 'bar_index', 'none', undefined, undefined, undefined, '#00FF00');

      expect(b.bgcolor).toBe('#00FF00');
    });

    it('should create a box with text content', () => {
      const b = box.new(
        10, 105, 20, 100,
        'bar_index', 'none',
        undefined, undefined, undefined, undefined,
        'Gap', 'auto', '#000000', 'center', 'center'
      );

      expect(b.text).toBe('Gap');
      expect(b.text_size).toBe('auto');
      expect(b.text_color).toBe('#000000');
      expect(b.text_halign).toBe('center');
      expect(b.text_valign).toBe('center');
    });
  });

  describe('box.get_left', () => {
    it('should return left border coordinate', () => {
      const b = box.new(10, 105, 20, 100);
      expect(box.get_left(b)).toBe(10);
    });

    it('should work with negative bar indices', () => {
      const b = box.new(-5, 105, 20, 100);
      expect(box.get_left(b)).toBe(-5);
    });
  });

  describe('box.get_right', () => {
    it('should return right border coordinate', () => {
      const b = box.new(10, 105, 20, 100);
      expect(box.get_right(b)).toBe(20);
    });
  });

  describe('box.get_top', () => {
    it('should return top border price', () => {
      const b = box.new(10, 105, 20, 100);
      expect(box.get_top(b)).toBe(105);
    });

    it('should work with decimal prices', () => {
      const b = box.new(10, 105.75, 20, 100.25);
      expect(box.get_top(b)).toBe(105.75);
    });
  });

  describe('box.get_bottom', () => {
    it('should return bottom border price', () => {
      const b = box.new(10, 105, 20, 100);
      expect(box.get_bottom(b)).toBe(100);
    });
  });

  describe('Box computational use cases', () => {
    describe('Gap detection and tracking', () => {
      it('should detect when price enters gap from above', () => {
        // Bearish gap from bar 10-20, price 100-105
        const gap = box.new(10, 105, 20, 100);

        // Price action enters gap
        const high = 104;
        const low = 101;

        const enteredGap = high < box.get_top(gap) && low > box.get_bottom(gap);
        expect(enteredGap).toBe(true);
      });

      it('should detect when gap is completely filled', () => {
        // Bearish gap (gap down)
        const gap = box.new(10, 105, 20, 100);

        // Price fills gap by going above the top
        const high = 106;

        const gapFilled = high > box.get_top(gap);
        expect(gapFilled).toBe(true);
      });

      it('should detect partial gap fill', () => {
        // Bullish gap (gap up) from 150-155
        const gap = box.new(10, 155, 20, 150);

        // Price partially fills gap
        const low = 152;
        const high = 158;

        const partiallyFilled = low < box.get_top(gap) && high > box.get_bottom(gap);
        expect(partiallyFilled).toBe(true);
      });

      it('should calculate gap duration', () => {
        const gap = box.new(10, 105, 20, 100);
        const currentBar = 50;

        const duration = currentBar - box.get_left(gap);
        expect(duration).toBe(40);

        // Check if gap exceeded max duration
        const maxDuration = 30;
        if (duration > maxDuration) {
          expect(duration).toBeGreaterThan(maxDuration);
        }
      });

      it('should calculate gap width (height)', () => {
        const gap = box.new(10, 105, 20, 100);

        const gapWidth = box.get_top(gap) - box.get_bottom(gap);
        expect(gapWidth).toBe(5);
      });

      it('should implement gap tracking logic from official Gaps indicator', () => {
        // Simulate gap tracking pattern from official indicator
        const gaps: any[] = [];

        // Create a gap
        const gap = box.new(10, 105, 20, 100);
        gaps.push({ box: gap, isActive: true, isBull: false });

        // Check if gap closed (price went above top)
        const high = 106;
        const low = 99;

        if (gaps[0].isActive) {
          const activeBox = gaps[0].box;
          const top = box.get_top(activeBox);
          const bot = box.get_bottom(activeBox);

          // For bearish gap, close when high > top
          if (high > top && !gaps[0].isBull) {
            gaps[0].isActive = false;
            expect(gaps[0].isActive).toBe(false);
          }
        }
      });
    });

    describe('Range breakout detection', () => {
      it('should detect breakout above range', () => {
        // Consolidation range from bar 100-150, price 145-155
        const range = box.new(100, 155, 150, 145);

        // Price breaks above
        const close = 157;

        const breakoutAbove = close > box.get_top(range);
        expect(breakoutAbove).toBe(true);
      });

      it('should detect breakout below range', () => {
        const range = box.new(100, 155, 150, 145);

        // Price breaks below
        const close = 143;

        const breakoutBelow = close < box.get_bottom(range);
        expect(breakoutBelow).toBe(true);
      });

      it('should detect price inside range', () => {
        const range = box.new(100, 155, 150, 145);

        // Price inside range
        const close = 150;

        const insideRange = close >= box.get_bottom(range) && close <= box.get_top(range);
        expect(insideRange).toBe(true);
      });

      it('should calculate range width', () => {
        const range = box.new(100, 155, 150, 145);

        const rangeWidth = box.get_top(range) - box.get_bottom(range);
        expect(rangeWidth).toBe(10);

        // Check if range is tight enough for pattern
        const minWidth = 5;
        expect(rangeWidth).toBeGreaterThan(minWidth);
      });

      it('should calculate range duration', () => {
        const range = box.new(100, 155, 150, 145);

        const rangeDuration = box.get_right(range) - box.get_left(range);
        expect(rangeDuration).toBe(50);
      });
    });

    describe('Rectangle pattern recognition', () => {
      it('should identify valid rectangle pattern', () => {
        // Rectangle from bar 50-100, price 100-110
        const rectangle = box.new(50, 110, 100, 100);

        const height = box.get_top(rectangle) - box.get_bottom(rectangle);
        const width = box.get_right(rectangle) - box.get_left(rectangle);

        // Valid rectangle if width > 2 * height (horizontal pattern)
        const isValidRectangle = width > 20 && height > 5 && height < 20;
        expect(isValidRectangle).toBe(true);
      });

      it('should validate box boundaries', () => {
        const b = box.new(10, 105, 20, 100);

        // Ensure top > bottom
        expect(box.get_top(b)).toBeGreaterThan(box.get_bottom(b));

        // Ensure right > left (normally)
        expect(box.get_right(b)).toBeGreaterThan(box.get_left(b));
      });
    });

    describe('Dynamic support/resistance', () => {
      it('should use box top as resistance level', () => {
        const resistanceBox = box.new(0, 155, 100, 150);
        const resistance = box.get_top(resistanceBox);

        const currentPrice = 154;
        const distanceToResistance = resistance - currentPrice;

        expect(distanceToResistance).toBe(1);
        expect(currentPrice).toBeLessThan(resistance);
      });

      it('should use box bottom as support level', () => {
        const supportBox = box.new(0, 105, 100, 100);
        const support = box.get_bottom(supportBox);

        const currentPrice = 102;
        const distanceToSupport = currentPrice - support;

        expect(distanceToSupport).toBe(2);
        expect(currentPrice).toBeGreaterThan(support);
      });
    });
  });

  describe('box.copy', () => {
    it('should create an independent copy', () => {
      const original = box.new(10, 105, 20, 100, 'bar_index', 'none', '#FF0000');
      const copied = box.copy(original);

      expect(copied.left).toBe(original.left);
      expect(copied.top).toBe(original.top);
      expect(copied.right).toBe(original.right);
      expect(copied.bottom).toBe(original.bottom);
      expect(copied.border_color).toBe(original.border_color);
    });

    it('should not modify original when copy is changed', () => {
      const original = box.new(10, 105, 20, 100);
      const copied = box.copy(original);

      copied.top = 110;

      expect(original.top).toBe(105);
      expect(copied.top).toBe(110);
    });
  });

  describe('box.delete', () => {
    it('should exist for API compatibility', () => {
      const b = box.new(10, 105, 20, 100);

      // Should not throw
      expect(() => box.delete_box(b)).not.toThrow();
    });
  });

  describe('Edge cases', () => {
    it('should handle inverted box (bottom > top)', () => {
      // User might create inverted box
      const b = box.new(10, 100, 20, 105);

      expect(box.get_top(b)).toBe(100);
      expect(box.get_bottom(b)).toBe(105);
    });

    it('should handle zero-height box', () => {
      const b = box.new(10, 100, 20, 100);

      expect(box.get_top(b)).toBe(box.get_bottom(b));
    });

    it('should handle zero-width box', () => {
      const b = box.new(15, 105, 15, 100);

      expect(box.get_left(b)).toBe(box.get_right(b));
    });

    it('should handle negative prices', () => {
      const b = box.new(10, -50, 20, -60);

      expect(box.get_top(b)).toBe(-50);
      expect(box.get_bottom(b)).toBe(-60);
    });
  });
});
