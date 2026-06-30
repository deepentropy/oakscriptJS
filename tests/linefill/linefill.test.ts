import * as line from '../../src/line';
import * as linefill from '../../src/linefill';

describe('Linefill Functions', () => {
  describe('linefill.new', () => {
    it('should create a linefill with two lines', () => {
      const line1 = line.new(0, 160, 50, 170);
      const line2 = line.new(0, 140, 50, 150);

      const fill = linefill.new(line1, line2);

      expect(fill.line1).toBe(line1);
      expect(fill.line2).toBe(line2);
      expect(fill.color).toBeUndefined();
    });

    it('should create a linefill with color', () => {
      const line1 = line.new(0, 160, 50, 170);
      const line2 = line.new(0, 140, 50, 150);

      const fill = linefill.new(line1, line2, '#0000FF20');

      expect(fill.color).toBe('#0000FF20');
    });

    it('should work with different line configurations', () => {
      // Uptrending channel
      const upperUp = line.new(0, 160, 50, 180, 'bar_index', 'right');
      const lowerUp = line.new(0, 140, 50, 160, 'bar_index', 'right');
      const upChannel = linefill.new(upperUp, lowerUp, '#00FF0020');

      expect(upChannel.line1).toBe(upperUp);
      expect(upChannel.line2).toBe(lowerUp);

      // Downtrending channel
      const upperDown = line.new(0, 160, 50, 150, 'bar_index', 'right');
      const lowerDown = line.new(0, 140, 50, 130, 'bar_index', 'right');
      const downChannel = linefill.new(upperDown, lowerDown, '#FF000020');

      expect(downChannel.line1).toBe(upperDown);
      expect(downChannel.line2).toBe(lowerDown);
    });
  });

  describe('linefill.get_line1', () => {
    it('should return first line reference', () => {
      const line1 = line.new(0, 160, 50, 170);
      const line2 = line.new(0, 140, 50, 150);
      const fill = linefill.new(line1, line2);

      const retrieved = linefill.get_line1(fill);

      expect(retrieved).toBe(line1);
      expect(retrieved.x1).toBe(0);
      expect(retrieved.y1).toBe(160);
    });

    it('should allow manipulating retrieved line', () => {
      const line1 = line.new(0, 160, 50, 170);
      const line2 = line.new(0, 140, 50, 150);
      const fill = linefill.new(line1, line2);

      // Retrieve and modify
      const retrieved = linefill.get_line1(fill);
      line.set_y2(retrieved, 175);

      // Modification affects original
      expect(line1.y2).toBe(175);
      expect(fill.line1.y2).toBe(175);
    });
  });

  describe('linefill.get_line2', () => {
    it('should return second line reference', () => {
      const line1 = line.new(0, 160, 50, 170);
      const line2 = line.new(0, 140, 50, 150);
      const fill = linefill.new(line1, line2);

      const retrieved = linefill.get_line2(fill);

      expect(retrieved).toBe(line2);
      expect(retrieved.x1).toBe(0);
      expect(retrieved.y1).toBe(140);
    });

    it('should allow manipulating retrieved line', () => {
      const line1 = line.new(0, 160, 50, 170);
      const line2 = line.new(0, 140, 50, 150);
      const fill = linefill.new(line1, line2);

      // Retrieve and modify
      const retrieved = linefill.get_line2(fill);
      line.set_y2(retrieved, 145);

      // Modification affects original
      expect(line2.y2).toBe(145);
      expect(fill.line2.y2).toBe(145);
    });
  });

  describe('linefill.set_color', () => {
    it('should set fill color', () => {
      const line1 = line.new(0, 160, 50, 170);
      const line2 = line.new(0, 140, 50, 150);
      const fill = linefill.new(line1, line2);

      linefill.set_color(fill, '#FF000030');

      expect(fill.color).toBe('#FF000030');
    });

    it('should update color dynamically', () => {
      const line1 = line.new(0, 160, 50, 170);
      const line2 = line.new(0, 140, 50, 150);
      const fill = linefill.new(line1, line2, '#0000FF20');

      // Change color
      linefill.set_color(fill, '#00FF0020');
      expect(fill.color).toBe('#00FF0020');

      // Change again
      linefill.set_color(fill, '#FF000020');
      expect(fill.color).toBe('#FF000020');
    });
  });

  describe('Real-world use cases', () => {
    it('should create regression channel fill', () => {
      // Upper regression line
      const upper = line.new(0, 165, 100, 175, 'bar_index', 'both');
      // Base regression line
      const base = line.new(0, 155, 100, 165, 'bar_index', 'both');
      // Lower regression line
      const lower = line.new(0, 145, 100, 155, 'bar_index', 'both');

      // Fill upper half
      const upperFill = linefill.new(upper, base, '#0000FF15');
      // Fill lower half
      const lowerFill = linefill.new(base, lower, '#0000FF15');

      expect(upperFill.line1).toBe(upper);
      expect(upperFill.line2).toBe(base);
      expect(lowerFill.line1).toBe(base);
      expect(lowerFill.line2).toBe(lower);
    });

    it('should create dynamic channel with color changes', () => {
      const upperLine = line.new(0, 160, 50, 170, 'bar_index', 'right');
      const lowerLine = line.new(0, 140, 50, 150, 'bar_index', 'right');
      const channel = linefill.new(upperLine, lowerLine, '#00FF0020');

      // Simulate trend change
      const isBullish = false;
      if (!isBullish) {
        linefill.set_color(channel, '#FF000020'); // Change to red
      }

      expect(channel.color).toBe('#FF000020');
    });

    it('should create Bollinger Bands fill', () => {
      // Upper band
      const upperBand = line.new(0, 160, 100, 165, 'bar_index', 'right');
      // Middle band (SMA)
      const middleBand = line.new(0, 150, 100, 155, 'bar_index', 'right');
      // Lower band
      const lowerBand = line.new(0, 140, 100, 145, 'bar_index', 'right');

      // Fill between upper and middle
      const upperFill = linefill.new(upperBand, middleBand, '#8080FF20');
      // Fill between middle and lower
      const lowerFill = linefill.new(middleBand, lowerBand, '#8080FF20');

      expect(upperFill.line1).toBe(upperBand);
      expect(lowerFill.line2).toBe(lowerBand);
    });

    it('should update channel dynamically by manipulating lines', () => {
      const upperLine = line.new(0, 160, 50, 170);
      const lowerLine = line.new(0, 140, 50, 150);
      const channel = linefill.new(upperLine, lowerLine, '#0000FF20');

      // Extend channel as new data comes in
      line.set_x2(upperLine, 75);
      line.set_y2(upperLine, 177.5);
      line.set_x2(lowerLine, 75);
      line.set_y2(lowerLine, 157.5);

      // Verify lines updated
      expect(linefill.get_line1(channel).x2).toBe(75);
      expect(linefill.get_line2(channel).x2).toBe(75);
    });

    it('should create Fibonacci extension fills', () => {
      // Create Fibonacci levels as lines
      const fib618 = line.new(0, 162, 100, 162, 'bar_index', 'both'); // Horizontal
      const fib786 = line.new(0, 165, 100, 165, 'bar_index', 'both');
      const fib1000 = line.new(0, 170, 100, 170, 'bar_index', 'both');

      // Fill between levels
      const fill618_786 = linefill.new(fib618, fib786, '#FFD70030');
      const fill786_1000 = linefill.new(fib786, fib1000, '#FFD70030');

      expect(fill618_786.line1).toBe(fib618);
      expect(fill786_1000.line2).toBe(fib1000);
    });

    it('should manage multiple channel fills', () => {
      // Short-term channel
      const stUpper = line.new(0, 160, 50, 170);
      const stLower = line.new(0, 140, 50, 150);
      const shortTermChannel = linefill.new(stUpper, stLower, '#0000FF15');

      // Long-term channel
      const ltUpper = line.new(0, 165, 100, 180);
      const ltLower = line.new(0, 135, 100, 145);
      const longTermChannel = linefill.new(ltUpper, ltLower, '#FF000015');

      expect(shortTermChannel.line1).toBe(stUpper);
      expect(longTermChannel.line1).toBe(ltUpper);
      expect(shortTermChannel.color).not.toBe(longTermChannel.color);
    });
  });

  describe('linefill.delete', () => {
    it('should exist for API compatibility', () => {
      const line1 = line.new(0, 160, 50, 170);
      const line2 = line.new(0, 140, 50, 150);
      const fill = linefill.new(line1, line2);

      // Should not throw
      expect(() => linefill.delete_linefill(fill)).not.toThrow();
    });
  });

  describe('Edge cases', () => {
    it('should handle crossing lines', () => {
      // Lines that cross
      const ascending = line.new(0, 140, 50, 160);
      const descending = line.new(0, 160, 50, 140);

      const fill = linefill.new(ascending, descending);

      expect(fill.line1).toBe(ascending);
      expect(fill.line2).toBe(descending);
    });

    it('should handle parallel horizontal lines', () => {
      const upper = line.new(0, 160, 100, 160);
      const lower = line.new(0, 140, 100, 140);

      const fill = linefill.new(upper, lower, '#00FF0020');

      expect(line.get_y1(fill.line1)).toBe(160);
      expect(line.get_y1(fill.line2)).toBe(140);
    });

    it('should handle identical lines', () => {
      const line1 = line.new(0, 150, 100, 160);
      const line2 = line.new(0, 150, 100, 160);

      const fill = linefill.new(line1, line2);

      // Should create fill (even though it's zero-width)
      expect(fill.line1).toBe(line1);
      expect(fill.line2).toBe(line2);
    });

    it('should handle lines with different extends', () => {
      const extendedBoth = line.new(0, 160, 50, 170, 'bar_index', 'both');
      const extendedRight = line.new(0, 140, 50, 150, 'bar_index', 'right');

      const fill = linefill.new(extendedBoth, extendedRight);

      expect(fill.line1.extend).toBe('both');
      expect(fill.line2.extend).toBe('right');
    });

    it('should handle very narrow channels', () => {
      const upper = line.new(0, 150.1, 100, 160.1);
      const lower = line.new(0, 150.0, 100, 160.0);

      const fill = linefill.new(upper, lower, '#0000FF40');

      // Channel is only 0.1 units wide
      const width = line.get_y1(fill.line1) - line.get_y1(fill.line2);
      expect(width).toBeCloseTo(0.1);
    });
  });
});
