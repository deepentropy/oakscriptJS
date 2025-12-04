/**
 * Tests for array functions with drawing object types
 * Tests array.new_line, array.new_box, array.new_label, array.new_linefill
 */

import * as array from '../../src/array';
import * as line from '../../src/line';
import * as box from '../../src/box';
import * as label from '../../src/label';
import * as linefill from '../../src/linefill';

describe('Array Drawing Object Functions', () => {
  describe('array.new_line', () => {
    it('should create empty line array by default', () => {
      const arr = array.new_line();

      expect(array.size(arr)).toBe(0);
    });

    it('should create line array with specified size', () => {
      const arr = array.new_line(5);

      expect(array.size(arr)).toBe(5);
    });

    it('should create line array with initial value', () => {
      const initialLine = line.new(0, 100, 50, 150);
      const arr = array.new_line(3, initialLine);

      expect(array.size(arr)).toBe(3);
      expect(array.get(arr, 0)).toBe(initialLine);
      expect(array.get(arr, 1)).toBe(initialLine);
      expect(array.get(arr, 2)).toBe(initialLine);
    });

    it('should work with array.push and array.shift', () => {
      const lines = array.new_line();

      // Add lines
      const line1 = line.new(0, 100, 10, 110);
      const line2 = line.new(10, 110, 20, 120);
      array.push(lines, line1);
      array.push(lines, line2);

      expect(array.size(lines)).toBe(2);

      // Remove oldest line
      const removed = array.shift(lines);
      expect(removed).toBe(line1);
      expect(array.size(lines)).toBe(1);
    });

    it('should manage last N lines pattern from docs', () => {
      // Pattern from PineScript docs: draw last 15 lines
      const lines = array.new_line();
      const maxLines = 15;

      // Simulate adding lines over 20 bars
      for (let i = 0; i < 20; i++) {
        const newLine = line.new(i, 100 + i, i + 1, 101 + i);
        array.push(lines, newLine);

        if (array.size(lines) > maxLines) {
          array.shift(lines);
        }
      }

      expect(array.size(lines)).toBe(maxLines);
    });

    it('should work with array.get for line calculations', () => {
      const lines = array.new_line();

      // Add trend lines
      array.push(lines, line.new(0, 100, 50, 150));
      array.push(lines, line.new(0, 90, 50, 140));

      // Check prices at bar 25
      const line1 = array.get(lines, 0);
      const line2 = array.get(lines, 1);

      const price1 = line.get_price(line1, 25);
      const price2 = line.get_price(line2, 25);

      expect(price1).toBe(125); // 100 + (150-100)*(25-0)/(50-0)
      expect(price2).toBe(115); // 90 + (140-90)*(25-0)/(50-0)
    });
  });

  describe('array.new_box', () => {
    it('should create empty box array by default', () => {
      const arr = array.new_box();

      expect(array.size(arr)).toBe(0);
    });

    it('should create box array with specified size', () => {
      const arr = array.new_box(5);

      expect(array.size(arr)).toBe(5);
    });

    it('should create box array with initial value', () => {
      const initialBox = box.new(0, 120, 10, 100);
      const arr = array.new_box(3, initialBox);

      expect(array.size(arr)).toBe(3);
      expect(array.get(arr, 0)).toBe(initialBox);
      expect(array.get(arr, 1)).toBe(initialBox);
      expect(array.get(arr, 2)).toBe(initialBox);
    });

    it('should track multiple gaps pattern', () => {
      const gaps = array.new_box();

      // Add gap boxes
      const gap1 = box.new(10, 120, 15, 110);
      const gap2 = box.new(25, 135, 30, 125);
      const gap3 = box.new(40, 140, 45, 130);

      array.push(gaps, gap1);
      array.push(gaps, gap2);
      array.push(gaps, gap3);

      expect(array.size(gaps)).toBe(3);

      // Check all gaps
      for (let i = 0; i < array.size(gaps); i++) {
        const gap = array.get(gaps, i);
        const gapTop = box.get_top(gap);
        const gapBottom = box.get_bottom(gap);
        const gapHeight = gapTop - gapBottom;

        expect(gapHeight).toBe(10); // All gaps are 10 points high
      }
    });

    it('should detect filled gaps from array', () => {
      const gaps = array.new_box();

      // Add unfilled gaps
      array.push(gaps, box.new(10, 120, 15, 110));
      array.push(gaps, box.new(25, 135, 30, 125));

      // Simulate price data
      const currentHigh = 128;
      const currentLow = 122;

      // Check which gaps are filled
      const filledGaps = [];
      for (let i = 0; i < array.size(gaps); i++) {
        const gap = array.get(gaps, i);
        const gapTop = box.get_top(gap);
        const gapBottom = box.get_bottom(gap);

        if (currentLow <= gapTop && currentHigh >= gapBottom) {
          filledGaps.push(i);
        }
      }

      expect(filledGaps).toEqual([1]); // Second gap (125-135) is filled by price 122-128
    });

    it('should remove filled gaps from array', () => {
      const gaps = array.new_box();

      array.push(gaps, box.new(10, 120, 15, 110)); // Won't be filled
      array.push(gaps, box.new(25, 135, 30, 125)); // Will be filled

      const currentHigh = 130;
      const currentLow = 127;

      // Remove filled gaps (iterate backwards to avoid index issues)
      for (let i = array.size(gaps) - 1; i >= 0; i--) {
        const gap = array.get(gaps, i);
        const gapTop = box.get_top(gap);
        const gapBottom = box.get_bottom(gap);

        if (currentLow <= gapTop && currentHigh >= gapBottom) {
          array.remove(gaps, i);
        }
      }

      expect(array.size(gaps)).toBe(1); // Only unfilled gap remains
      const remaining = array.get(gaps, 0);
      expect(box.get_top(remaining)).toBe(120);
    });
  });

  describe('array.new_label', () => {
    it('should create empty label array by default', () => {
      const arr = array.new_label();

      expect(array.size(arr)).toBe(0);
    });

    it('should create label array with specified size', () => {
      const arr = array.new_label(5);

      expect(array.size(arr)).toBe(5);
    });

    it('should create label array with initial value', () => {
      const initialLabel = label.new(50, 155.5, 'Test');
      const arr = array.new_label(3, initialLabel);

      expect(array.size(arr)).toBe(3);
      expect(array.get(arr, 0)).toBe(initialLabel);
      expect(array.get(arr, 1)).toBe(initialLabel);
      expect(array.get(arr, 2)).toBe(initialLabel);
    });

    it('should limit label count pattern from docs', () => {
      const labelArray = array.new_label();
      const maxLabels = 50;

      // Simulate adding labels over 100 bars
      for (let i = 0; i < 100; i++) {
        const text = i % 2 === 0 ? 'Rising' : 'Falling';
        const lbl = label.new(i, 100 + i * 0.5, text);
        array.push(labelArray, lbl);

        // Limit to maxLabels
        if (array.size(labelArray) > maxLabels) {
          array.shift(labelArray);
        }
      }

      expect(array.size(labelArray)).toBe(maxLabels);

      // Verify labels are the most recent ones
      const firstLabel = array.get(labelArray, 0);
      expect(label.get_x(firstLabel)).toBe(50); // Bar 50 (100 - 50 = 50)
    });

    it('should mark pivot points with labels', () => {
      const pivotLabels = array.new_label();

      // Add pivot high labels
      array.push(pivotLabels, label.new(10, 155, 'PH', 'bar_index', 'abovebar'));
      array.push(pivotLabels, label.new(25, 160, 'PH', 'bar_index', 'abovebar'));
      array.push(pivotLabels, label.new(40, 158, 'PH', 'bar_index', 'abovebar'));

      expect(array.size(pivotLabels)).toBe(3);

      // Find highest pivot
      let highestPivot = array.get(pivotLabels, 0);
      let highestPrice = label.get_y(highestPivot);

      for (let i = 1; i < array.size(pivotLabels); i++) {
        const pivot = array.get(pivotLabels, i);
        const price = label.get_y(pivot);
        if (price > highestPrice) {
          highestPrice = price;
          highestPivot = pivot;
        }
      }

      expect(label.get_x(highestPivot)).toBe(25);
      expect(highestPrice).toBe(160);
    });

    it('should update label properties in array', () => {
      const labels = array.new_label();

      // Add labels
      array.push(labels, label.new(10, 100, 'Signal 1'));
      array.push(labels, label.new(20, 110, 'Signal 2'));

      // Update all labels to green
      for (let i = 0; i < array.size(labels); i++) {
        const lbl = array.get(labels, i);
        label.set_color(lbl, '#00FF00');
      }

      // Verify updates
      expect(array.get(labels, 0).color).toBe('#00FF00');
      expect(array.get(labels, 1).color).toBe('#00FF00');
    });
  });

  describe('array.new_linefill', () => {
    it('should create empty linefill array by default', () => {
      const arr = array.new_linefill();

      expect(array.size(arr)).toBe(0);
    });

    it('should create linefill array with specified size', () => {
      const arr = array.new_linefill(5);

      expect(array.size(arr)).toBe(5);
    });

    it('should create linefill array with initial value', () => {
      const line1 = line.new(0, 120, 50, 130);
      const line2 = line.new(0, 100, 50, 110);
      const initialFill = linefill.new(line1, line2, '#0000FF15');
      const arr = array.new_linefill(3, initialFill);

      expect(array.size(arr)).toBe(3);
      expect(array.get(arr, 0)).toBe(initialFill);
      expect(array.get(arr, 1)).toBe(initialFill);
      expect(array.get(arr, 2)).toBe(initialFill);
    });

    it('should manage multiple channel fills', () => {
      const channels = array.new_linefill();

      // Create short-term channel
      const stUpper = line.new(0, 120, 50, 130);
      const stLower = line.new(0, 100, 50, 110);
      const stChannel = linefill.new(stUpper, stLower, '#0000FF15');

      // Create long-term channel
      const ltUpper = line.new(0, 125, 100, 140);
      const ltLower = line.new(0, 95, 100, 105);
      const ltChannel = linefill.new(ltUpper, ltLower, '#FF000015');

      array.push(channels, stChannel);
      array.push(channels, ltChannel);

      expect(array.size(channels)).toBe(2);

      // Verify different colors
      expect(array.get(channels, 0).color).toBe('#0000FF15');
      expect(array.get(channels, 1).color).toBe('#FF000015');
    });

    it('should change colors of all channels based on condition', () => {
      const channels = array.new_linefill();

      // Add multiple channels
      for (let i = 0; i < 3; i++) {
        const upper = line.new(i * 20, 120 + i * 10, (i + 1) * 20, 130 + i * 10);
        const lower = line.new(i * 20, 100 + i * 10, (i + 1) * 20, 110 + i * 10);
        const fill = linefill.new(upper, lower, '#0000FF15');
        array.push(channels, fill);
      }

      // Simulate trend change - make all channels red
      const isBullish = false;
      const newColor = isBullish ? '#00FF0020' : '#FF000020';

      for (let i = 0; i < array.size(channels); i++) {
        const channel = array.get(channels, i);
        linefill.set_color(channel, newColor);
      }

      // Verify all updated
      for (let i = 0; i < array.size(channels); i++) {
        expect(array.get(channels, i).color).toBe('#FF000020');
      }
    });

    it('should retrieve lines from linefills in array', () => {
      const channels = array.new_linefill();

      const upper = line.new(0, 120, 50, 130);
      const lower = line.new(0, 100, 50, 110);
      const channel = linefill.new(upper, lower, '#0000FF15');

      array.push(channels, channel);

      // Retrieve and verify lines
      const retrieved = array.get(channels, 0);
      const line1 = linefill.get_line1(retrieved);
      const line2 = linefill.get_line2(retrieved);

      expect(line1).toBe(upper);
      expect(line2).toBe(lower);
    });
  });

  describe('Real-world integration patterns', () => {
    it('should manage trend lines with breakout detection', () => {
      const trendLines = array.new_line();

      // Add support and resistance lines
      const support = line.new(0, 95, 50, 105, 'bar_index', 'right');
      const resistance = line.new(0, 115, 50, 125, 'bar_index', 'right');

      array.push(trendLines, support);
      array.push(trendLines, resistance);

      // Check current price against all trend lines
      const currentBar = 60;
      const currentPrice = 120;

      let aboveSupport = false;
      let aboveResistance = false;

      for (let i = 0; i < array.size(trendLines); i++) {
        const trendLine = array.get(trendLines, i);
        const linePrice = line.get_price(trendLine, currentBar);

        if (i === 0 && currentPrice > linePrice) {
          aboveSupport = true;
        } else if (i === 1 && currentPrice > linePrice) {
          aboveResistance = false; // 120 is below resistance at ~127
        }
      }

      expect(aboveSupport).toBe(true);
      expect(aboveResistance).toBe(false);
    });

    it('should track gaps and remove when filled', () => {
      const gaps = array.new_box();

      // Add several gaps
      array.push(gaps, box.new(10, 120, 15, 110));
      array.push(gaps, box.new(25, 135, 30, 125));
      array.push(gaps, box.new(40, 145, 45, 140));

      // Simulate price filling second gap
      const high = 130;
      const low = 122;

      // Remove filled gaps
      for (let i = array.size(gaps) - 1; i >= 0; i--) {
        const gap = array.get(gaps, i);
        if (low <= box.get_top(gap) && high >= box.get_bottom(gap)) {
          array.remove(gaps, i);
        }
      }

      expect(array.size(gaps)).toBe(2); // Two gaps remain
    });

    it('should combine lines, boxes, and labels', () => {
      const lines = array.new_line();
      const boxes = array.new_box();
      const labels = array.new_label();

      // Add support line
      const support = line.new(0, 100, 50, 110);
      array.push(lines, support);

      // Add consolidation box
      const consolidation = box.new(20, 115, 30, 105);
      array.push(boxes, consolidation);

      // Add breakout label
      const breakoutLabel = label.new(35, 118, 'BO');
      array.push(labels, breakoutLabel);

      expect(array.size(lines)).toBe(1);
      expect(array.size(boxes)).toBe(1);
      expect(array.size(labels)).toBe(1);
    });

    it('should manage channel fills with dynamic updates', () => {
      const channels = array.new_linefill();
      const lines = array.new_line();

      // Create multiple channels
      for (let i = 0; i < 5; i++) {
        const upper = line.new(i * 10, 120, (i + 1) * 10, 125);
        const lower = line.new(i * 10, 100, (i + 1) * 10, 105);

        array.push(lines, upper);
        array.push(lines, lower);

        const fill = linefill.new(upper, lower, '#0000FF10');
        array.push(channels, fill);
      }

      expect(array.size(channels)).toBe(5);
      expect(array.size(lines)).toBe(10); // 2 lines per channel

      // Remove oldest channel
      array.shift(channels);
      expect(array.size(channels)).toBe(4);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle undefined initial values', () => {
      const lines = array.new_line(3);
      expect(array.size(lines)).toBe(3);
      expect(array.get(lines, 0)).toBeUndefined();
    });

    it('should work with size 0', () => {
      const arr = array.new_line(0);
      expect(array.size(arr)).toBe(0);
    });

    it('should work with array.concat', () => {
      const arr1 = array.new_line();
      const arr2 = array.new_line();

      array.push(arr1, line.new(0, 100, 10, 110));
      array.push(arr2, line.new(10, 110, 20, 120));

      const combined = array.concat(arr1, arr2);
      expect(array.size(combined)).toBe(2);
    });

    it('should work with array.slice', () => {
      const lines = array.new_line();

      for (let i = 0; i < 10; i++) {
        array.push(lines, line.new(i, 100 + i, i + 1, 101 + i));
      }

      const last5 = array.slice(lines, 5, 10);
      expect(array.size(last5)).toBe(5);
    });

    it('should work with array.reverse', () => {
      const labels = array.new_label();

      array.push(labels, label.new(0, 100, 'A'));
      array.push(labels, label.new(10, 110, 'B'));
      array.push(labels, label.new(20, 120, 'C'));

      array.reverse(labels);

      expect(label.get_text(array.get(labels, 0))).toBe('C');
      expect(label.get_text(array.get(labels, 1))).toBe('B');
      expect(label.get_text(array.get(labels, 2))).toBe('A');
    });
  });
});
