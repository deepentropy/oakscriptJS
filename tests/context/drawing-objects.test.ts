/**
 * Tests for drawing objects in context API
 * Verifies that context wrappers provide implicit data correctly
 */

import { createContext } from '../../src/context';
import { Bar } from '../../src/types';

// Sample bar data for testing
const sampleBars: Bar[] = [
  { time: 1000, open: 100, high: 110, low: 95, close: 105, volume: 1000 },
  { time: 2000, open: 105, high: 115, low: 100, close: 110, volume: 1100 },
  { time: 3000, open: 110, high: 120, low: 105, close: 115, volume: 1200 },
  { time: 4000, open: 115, high: 125, low: 110, close: 120, volume: 1300 },
  { time: 5000, open: 120, high: 130, low: 115, close: 125, volume: 1400 }
];

describe('Context - Drawing Objects', () => {
  describe('line namespace', () => {
    it('should be available in context', () => {
      const ctx = createContext({ data: sampleBars });

      expect(ctx.line).toBeDefined();
      expect(typeof ctx.line.new).toBe('function');
      expect(typeof ctx.line.get_price).toBe('function');
    });

    it('should create lines using context', () => {
      const { line } = createContext({ data: sampleBars });

      const trendLine = line.new(0, 100, 4, 120);

      expect(trendLine.x1).toBe(0);
      expect(trendLine.y1).toBe(100);
      expect(trendLine.x2).toBe(4);
      expect(trendLine.y2).toBe(120);
    });

    it('should get price at specific bar index', () => {
      const { line } = createContext({ data: sampleBars });
      const trendLine = line.new(0, 100, 4, 120);

      const priceAt2 = line.get_price(trendLine, 2);

      expect(priceAt2).toBe(110); // Linear interpolation: 100 + (120-100)*(2-0)/(4-0)
    });

    it('should get price at current bar when x not provided (implicit)', () => {
      const { line } = createContext({ data: sampleBars });
      const trendLine = line.new(0, 100, 4, 120);

      // Should use current bar (last bar index = 4)
      const currentPrice = line.get_price(trendLine);

      expect(currentPrice).toBe(120); // Price at bar 4
    });

    it('should throw error if no chart context and x not provided', () => {
      const { line } = createContext(); // No chart data
      const trendLine = line.new(0, 100, 4, 120);

      expect(() => line.get_price(trendLine)).toThrow(
        'Chart context required for implicit bar index in line.get_price()'
      );
    });

    it('should work with explicit x even without chart context', () => {
      const { line } = createContext(); // No chart data
      const trendLine = line.new(0, 100, 4, 120);

      const priceAt2 = line.get_price(trendLine, 2);

      expect(priceAt2).toBe(110);
    });

    it('should detect breakout at current bar using implicit x', () => {
      const { line, getSource } = createContext({ data: sampleBars });
      const close = getSource('close');

      // Create support line
      const support = line.new(0, 95, 4, 110);

      // Check if current close is above support line
      const currentLinePrice = line.get_price(support);
      const currentClose = close[close.length - 1];

      expect(currentClose).toBe(125);
      expect(currentLinePrice).toBe(110);
      expect(currentClose > currentLinePrice).toBe(true); // Breakout detected!
    });

    it('should work with extended lines using implicit x', () => {
      const { line } = createContext({ data: sampleBars });

      // Create line that extends right
      const extendedLine = line.new(0, 100, 2, 110, 'bar_index', 'right');

      // Get price at current bar (4), which is beyond x2=2
      const priceAtCurrent = line.get_price(extendedLine);

      // Should extrapolate: 100 + (110-100)*(4-0)/(2-0) = 100 + 10*2 = 120
      expect(priceAtCurrent).toBe(120);
    });

    it('should handle all line functions through context', () => {
      const { line } = createContext({ data: sampleBars });

      const testLine = line.new(0, 100, 4, 120);

      // Test getters
      expect(line.get_x1(testLine)).toBe(0);
      expect(line.get_y1(testLine)).toBe(100);
      expect(line.get_x2(testLine)).toBe(4);
      expect(line.get_y2(testLine)).toBe(120);

      // Test setters
      line.set_y2(testLine, 130);
      expect(testLine.y2).toBe(130);

      line.set_color(testLine, '#FF0000');
      expect(testLine.color).toBe('#FF0000');

      // Test copy
      const copied = line.copy(testLine);
      expect(copied.y2).toBe(130);
      expect(copied).not.toBe(testLine);
    });
  });

  describe('box namespace', () => {
    it('should be available in context', () => {
      const ctx = createContext({ data: sampleBars });

      expect(ctx.box).toBeDefined();
      expect(typeof ctx.box.new).toBe('function');
      expect(typeof ctx.box.get_top).toBe('function');
    });

    it('should create boxes using context', () => {
      const { box } = createContext({ data: sampleBars });

      const rect = box.new(0, 120, 2, 100);

      expect(rect.left).toBe(0);
      expect(rect.top).toBe(120);
      expect(rect.right).toBe(2);
      expect(rect.bottom).toBe(100);
    });

    it('should detect gap fills using box getters', () => {
      const { box, getSource } = createContext({ data: sampleBars });
      const close = getSource('close');

      // Create gap box (gap up from 100 to 110)
      const gapBox = box.new(1, 110, 1, 100);

      // Check if current price filled the gap
      const gapTop = box.get_top(gapBox);
      const gapBottom = box.get_bottom(gapBox);
      const currentClose = close[close.length - 1];

      expect(gapTop).toBe(110);
      expect(gapBottom).toBe(100);
      expect(currentClose).toBe(125);
      expect(currentClose > gapTop).toBe(true); // Gap filled!
    });

    it('should handle all box functions through context', () => {
      const { box } = createContext({ data: sampleBars });

      const testBox = box.new(0, 120, 2, 100);

      // Test getters
      expect(box.get_left(testBox)).toBe(0);
      expect(box.get_top(testBox)).toBe(120);
      expect(box.get_right(testBox)).toBe(2);
      expect(box.get_bottom(testBox)).toBe(100);

      // Test setters
      box.set_top(testBox, 125);
      expect(testBox.top).toBe(125);

      box.set_bgcolor(testBox, '#0000FF20');
      expect(testBox.bgcolor).toBe('#0000FF20');

      // Test copy
      const copied = box.copy(testBox);
      expect(copied.top).toBe(125);
      expect(copied).not.toBe(testBox);
    });
  });

  describe('label namespace', () => {
    it('should be available in context', () => {
      const ctx = createContext({ data: sampleBars });

      expect(ctx.label).toBeDefined();
      expect(typeof ctx.label.new).toBe('function');
      expect(typeof ctx.label.get_text).toBe('function');
    });

    it('should create labels using context', () => {
      const { label } = createContext({ data: sampleBars });

      const lbl = label.new(2, 115, 'Pivot High');

      expect(lbl.x).toBe(2);
      expect(lbl.y).toBe(115);
      expect(lbl.text).toBe('Pivot High');
    });

    it('should handle all label functions through context', () => {
      const { label } = createContext({ data: sampleBars });

      const testLabel = label.new(2, 115, 'Test');

      // Test getters
      expect(label.get_x(testLabel)).toBe(2);
      expect(label.get_y(testLabel)).toBe(115);
      expect(label.get_text(testLabel)).toBe('Test');

      // Test setters
      label.set_text(testLabel, 'Updated');
      expect(testLabel.text).toBe('Updated');

      label.set_color(testLabel, '#FF0000');
      expect(testLabel.color).toBe('#FF0000');

      // Test copy
      const copied = label.copy(testLabel);
      expect(copied.text).toBe('Updated');
      expect(copied).not.toBe(testLabel);
    });
  });

  describe('linefill namespace', () => {
    it('should be available in context', () => {
      const ctx = createContext({ data: sampleBars });

      expect(ctx.linefill).toBeDefined();
      expect(typeof ctx.linefill.new).toBe('function');
      expect(typeof ctx.linefill.get_line1).toBe('function');
    });

    it('should create linefills using context', () => {
      const { line, linefill } = createContext({ data: sampleBars });

      const upperLine = line.new(0, 120, 4, 130);
      const lowerLine = line.new(0, 100, 4, 110);
      const fill = linefill.new(upperLine, lowerLine, '#0000FF20');

      expect(fill.line1).toBe(upperLine);
      expect(fill.line2).toBe(lowerLine);
      expect(fill.color).toBe('#0000FF20');
    });

    it('should retrieve lines from linefill', () => {
      const { line, linefill } = createContext({ data: sampleBars });

      const upperLine = line.new(0, 120, 4, 130);
      const lowerLine = line.new(0, 100, 4, 110);
      const fill = linefill.new(upperLine, lowerLine);

      const retrieved1 = linefill.get_line1(fill);
      const retrieved2 = linefill.get_line2(fill);

      expect(retrieved1).toBe(upperLine);
      expect(retrieved2).toBe(lowerLine);
    });

    it('should create channel fills with dynamic colors', () => {
      const { line, linefill } = createContext({ data: sampleBars });

      const upperLine = line.new(0, 120, 4, 130);
      const lowerLine = line.new(0, 100, 4, 110);
      const channel = linefill.new(upperLine, lowerLine, '#00FF0020');

      // Change color based on condition
      const isBullish = false;
      if (!isBullish) {
        linefill.set_color(channel, '#FF000020');
      }

      expect(channel.color).toBe('#FF000020');
    });
  });

  describe('Real-world context patterns', () => {
    it('should detect trendline breakout using context', () => {
      const { line, getSource } = createContext({ data: sampleBars });
      const close = getSource('close');

      // Create resistance line from first two highs
      const resistance = line.new(0, 110, 1, 115, 'bar_index', 'right');

      // Check breakout at current bar (implicit x)
      const resistancePrice = line.get_price(resistance);
      const currentClose = close[close.length - 1];

      expect(currentClose).toBe(125);
      // Line at bar 4: 110 + (115-110)*(4-0)/(1-0) = 110 + 5*4 = 130
      expect(resistancePrice).toBe(130);
      // Price 125 < 130, so resistance not broken yet
      expect(currentClose < resistancePrice).toBe(true);
    });

    it('should track gap with box and check fill status', () => {
      const { box, getSource } = createContext({ data: sampleBars });
      const high = getSource('high');
      const low = getSource('low');

      // Create gap box between bars 1 and 2
      const gapBox = box.new(1, 105, 2, 100);

      // Check if any subsequent bar filled the gap
      let gapFilled = false;
      const gapTop = box.get_top(gapBox);
      const gapBottom = box.get_bottom(gapBox);

      for (let i = 2; i < high.length; i++) {
        if (low[i] <= gapTop && high[i] >= gapBottom) {
          gapFilled = true;
          break;
        }
      }

      expect(gapFilled).toBe(true);
    });

    it('should mark pivot points with labels', () => {
      const { label, getSource } = createContext({ data: sampleBars });
      const high = getSource('high');

      // Find pivot high at bar 2
      const pivotBar = 2;
      const pivotHigh = high[pivotBar];

      // Create label
      const pivotLabel = label.new(pivotBar, pivotHigh, 'PH', 'bar_index', 'abovebar');

      expect(label.get_x(pivotLabel)).toBe(2);
      expect(label.get_y(pivotLabel)).toBe(120);
      expect(label.get_text(pivotLabel)).toBe('PH');
    });

    it('should create channel with fill between support and resistance', () => {
      const { line, linefill } = createContext({ data: sampleBars });

      // Support line (ascending)
      const support = line.new(0, 95, 4, 115, 'bar_index', 'right');

      // Resistance line (ascending, parallel)
      const resistance = line.new(0, 110, 4, 130, 'bar_index', 'right');

      // Fill channel
      const channel = linefill.new(resistance, support, '#0000FF15');

      // Verify channel structure
      expect(channel.line1).toBe(resistance);
      expect(channel.line2).toBe(support);

      // Get prices at current bar
      const supportPrice = line.get_price(support); // Implicit current bar
      const resistancePrice = line.get_price(resistance);

      expect(supportPrice).toBe(115);
      expect(resistancePrice).toBe(130);
      expect(resistancePrice - supportPrice).toBe(15); // Channel width
    });

    it('should combine multiple drawing objects for pattern recognition', () => {
      const { line, box, label, linefill } = createContext({ data: sampleBars });

      // 1. Draw support line
      const support = line.new(0, 95, 4, 115);

      // 2. Draw resistance line
      const resistance = line.new(0, 110, 4, 130);

      // 3. Fill channel
      const channel = linefill.new(resistance, support, '#0000FF10');

      // 4. Mark consolidation box
      const consolidation = box.new(1, 115, 3, 105);

      // 5. Label breakout point
      const breakoutLabel = label.new(4, 125, 'BO', 'bar_index', 'price');

      // Verify all objects created
      expect(line.get_price(support)).toBe(115);
      expect(line.get_price(resistance)).toBe(130);
      expect(channel.line1).toBe(resistance);
      expect(box.get_top(consolidation)).toBe(115);
      expect(label.get_text(breakoutLabel)).toBe('BO');
    });
  });

  describe('Context without chart data', () => {
    it('should still allow creating drawing objects', () => {
      const { line, box, label, linefill } = createContext(); // No chart data

      const testLine = line.new(0, 100, 10, 200);
      const testBox = box.new(0, 200, 10, 100);
      const testLabel = label.new(5, 150, 'Test');
      const fill = linefill.new(testLine, line.new(0, 90, 10, 190));

      expect(testLine.x1).toBe(0);
      expect(testBox.left).toBe(0);
      expect(testLabel.x).toBe(5);
      expect(fill.line1).toBe(testLine);
    });

    it('should require explicit x for line.get_price', () => {
      const { line } = createContext(); // No chart data
      const testLine = line.new(0, 100, 10, 200);

      // Should throw without x
      expect(() => line.get_price(testLine)).toThrow();

      // Should work with explicit x
      const price = line.get_price(testLine, 5);
      expect(price).toBe(150);
    });
  });
});
