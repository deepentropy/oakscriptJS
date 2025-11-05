import * as label from '../../src/label';

describe('Label Functions', () => {
  describe('label.new', () => {
    it('should create a label with required parameters', () => {
      const lbl = label.new(50, 155.5);

      expect(lbl.x).toBe(50);
      expect(lbl.y).toBe(155.5);
      expect(lbl.xloc).toBe('bar_index');
      expect(lbl.yloc).toBe('price');
      expect(lbl.text).toBeUndefined();
    });

    it('should create a label with text', () => {
      const lbl = label.new(50, 155.5, 'Pivot High');

      expect(lbl.text).toBe('Pivot High');
    });

    it('should create a label with all parameters', () => {
      const lbl = label.new(
        50, 155.5, 'Pivot',
        'bar_index', 'price',
        '#FF0000', 'label_down',
        '#FFFFFF', 'large', 'center',
        'Resistance level', 'monospace'
      );

      expect(lbl.x).toBe(50);
      expect(lbl.y).toBe(155.5);
      expect(lbl.text).toBe('Pivot');
      expect(lbl.color).toBe('#FF0000');
      expect(lbl.style).toBe('label_down');
      expect(lbl.textcolor).toBe('#FFFFFF');
      expect(lbl.size).toBe('large');
      expect(lbl.textalign).toBe('center');
      expect(lbl.tooltip).toBe('Resistance level');
      expect(lbl.text_font_family).toBe('monospace');
    });

    it('should support different yloc modes', () => {
      const priceLabel = label.new(50, 155.5, 'Price', 'bar_index', 'price');
      const aboveLabel = label.new(50, 0, 'Above', 'bar_index', 'abovebar');
      const belowLabel = label.new(50, 0, 'Below', 'bar_index', 'belowbar');

      expect(priceLabel.yloc).toBe('price');
      expect(aboveLabel.yloc).toBe('abovebar');
      expect(belowLabel.yloc).toBe('belowbar');
    });

    it('should support different label styles', () => {
      const styles = [
        'label_up', 'label_down', 'arrowup', 'arrowdown',
        'circle', 'square', 'diamond', 'triangleup', 'triangledown'
      ] as const;

      styles.forEach(style => {
        const lbl = label.new(50, 155.5, 'Test', 'bar_index', 'price', undefined, style);
        expect(lbl.style).toBe(style);
      });
    });

    it('should support bar_time xloc', () => {
      const lbl = label.new(1609459200000, 155.5, 'Pivot', 'bar_time');

      expect(lbl.xloc).toBe('bar_time');
      expect(lbl.x).toBe(1609459200000);
    });
  });

  describe('label.get_x', () => {
    it('should return x coordinate', () => {
      const lbl = label.new(50, 155.5);
      expect(label.get_x(lbl)).toBe(50);
    });

    it('should work with timestamp', () => {
      const lbl = label.new(1609459200000, 155.5, 'Test', 'bar_time');
      expect(label.get_x(lbl)).toBe(1609459200000);
    });
  });

  describe('label.get_y', () => {
    it('should return y coordinate', () => {
      const lbl = label.new(50, 155.5);
      expect(label.get_y(lbl)).toBe(155.5);
    });

    it('should work with decimal prices', () => {
      const lbl = label.new(50, 123.456);
      expect(label.get_y(lbl)).toBe(123.456);
    });
  });

  describe('label.get_text', () => {
    it('should return text content', () => {
      const lbl = label.new(50, 155.5, 'Pivot High');
      expect(label.get_text(lbl)).toBe('Pivot High');
    });

    it('should return undefined if no text', () => {
      const lbl = label.new(50, 155.5);
      expect(label.get_text(lbl)).toBeUndefined();
    });
  });

  describe('label.copy', () => {
    it('should create an independent copy', () => {
      const original = label.new(50, 155.5, 'Pivot', 'bar_index', 'price', '#FF0000');
      const copied = label.copy(original);

      expect(copied.x).toBe(original.x);
      expect(copied.y).toBe(original.y);
      expect(copied.text).toBe(original.text);
      expect(copied.color).toBe(original.color);
    });

    it('should not modify original when copy is changed', () => {
      const original = label.new(50, 155.5, 'Pivot');
      const copied = label.copy(original);

      copied.text = 'Modified';
      copied.x = 60;

      expect(original.text).toBe('Pivot');
      expect(original.x).toBe(50);
      expect(copied.text).toBe('Modified');
      expect(copied.x).toBe(60);
    });
  });

  describe('Position setters', () => {
    it('should set x coordinate', () => {
      const lbl = label.new(50, 155.5);
      label.set_x(lbl, 60);

      expect(lbl.x).toBe(60);
    });

    it('should set y coordinate', () => {
      const lbl = label.new(50, 155.5);
      label.set_y(lbl, 160);

      expect(lbl.y).toBe(160);
    });

    it('should set both x and y coordinates', () => {
      const lbl = label.new(50, 155.5);
      label.set_xy(lbl, 60, 160);

      expect(lbl.x).toBe(60);
      expect(lbl.y).toBe(160);
    });

    it('should set xloc and x coordinate', () => {
      const lbl = label.new(50, 155.5);
      label.set_xloc(lbl, 1609459200000, 'bar_time');

      expect(lbl.x).toBe(1609459200000);
      expect(lbl.xloc).toBe('bar_time');
    });

    it('should set yloc and y coordinate', () => {
      const lbl = label.new(50, 155.5);
      label.set_yloc(lbl, 0, 'abovebar');

      expect(lbl.y).toBe(0);
      expect(lbl.yloc).toBe('abovebar');
    });
  });

  describe('Content setters', () => {
    it('should set text', () => {
      const lbl = label.new(50, 155.5);
      label.set_text(lbl, 'Updated Text');

      expect(lbl.text).toBe('Updated Text');
    });

    it('should set tooltip', () => {
      const lbl = label.new(50, 155.5);
      label.set_tooltip(lbl, 'Resistance level');

      expect(lbl.tooltip).toBe('Resistance level');
    });
  });

  describe('Styling setters', () => {
    it('should set color', () => {
      const lbl = label.new(50, 155.5);
      label.set_color(lbl, '#FF0000');

      expect(lbl.color).toBe('#FF0000');
    });

    it('should set text color', () => {
      const lbl = label.new(50, 155.5);
      label.set_textcolor(lbl, '#FFFFFF');

      expect(lbl.textcolor).toBe('#FFFFFF');
    });

    it('should set style', () => {
      const lbl = label.new(50, 155.5);
      label.set_style(lbl, 'label_down');

      expect(lbl.style).toBe('label_down');
    });

    it('should set size', () => {
      const lbl = label.new(50, 155.5);
      label.set_size(lbl, 'large');

      expect(lbl.size).toBe('large');
    });

    it('should set text align', () => {
      const lbl = label.new(50, 155.5);
      label.set_textalign(lbl, 'center');

      expect(lbl.textalign).toBe('center');
    });

    it('should set text font family', () => {
      const lbl = label.new(50, 155.5);
      label.set_text_font_family(lbl, 'monospace');

      expect(lbl.text_font_family).toBe('monospace');
    });
  });

  describe('Method chaining', () => {
    it('should allow chaining setters', () => {
      const lbl = label.new(50, 155.5);

      label.set_text(lbl, 'Pivot');
      label.set_color(lbl, '#FF0000');
      label.set_textcolor(lbl, '#FFFFFF');
      label.set_size(lbl, 'large');

      expect(lbl.text).toBe('Pivot');
      expect(lbl.color).toBe('#FF0000');
      expect(lbl.textcolor).toBe('#FFFFFF');
      expect(lbl.size).toBe('large');
    });
  });

  describe('Real-world use cases', () => {
    it('should mark pivot points', () => {
      // Mark pivot high
      const pivotHigh = label.new(50, 155.5, 'H', 'bar_index', 'abovebar', '#FF0000', 'label_down');

      expect(label.get_x(pivotHigh)).toBe(50);
      expect(label.get_y(pivotHigh)).toBe(155.5);
      expect(label.get_text(pivotHigh)).toBe('H');
      expect(pivotHigh.yloc).toBe('abovebar');
    });

    it('should annotate breakouts', () => {
      const breakout = label.new(100, 160, 'Breakout!', 'bar_index', 'price', '#00FF00', 'arrowup');

      expect(breakout.text).toBe('Breakout!');
      expect(breakout.style).toBe('arrowup');
      expect(breakout.color).toBe('#00FF00');
    });

    it('should display price levels', () => {
      const support = label.new(0, 100, '100 Support', 'bar_index', 'price');
      label.set_tooltip(support, 'Strong support level established');

      expect(label.get_text(support)).toBe('100 Support');
      expect(support.tooltip).toBe('Strong support level established');
    });

    it('should update dynamically', () => {
      const dynamicLabel = label.new(50, 155.5, 'Forming...');

      // Update as pattern develops
      label.set_text(dynamicLabel, 'Confirmed!');
      label.set_color(dynamicLabel, '#00FF00');
      label.set_style(dynamicLabel, 'circle');

      expect(dynamicLabel.text).toBe('Confirmed!');
      expect(dynamicLabel.color).toBe('#00FF00');
      expect(dynamicLabel.style).toBe('circle');
    });
  });

  describe('label.delete', () => {
    it('should exist for API compatibility', () => {
      const lbl = label.new(50, 155.5);

      // Should not throw
      expect(() => label.delete_label(lbl)).not.toThrow();
    });
  });

  describe('Edge cases', () => {
    it('should handle negative coordinates', () => {
      const lbl = label.new(-10, -50.5, 'Negative');

      expect(lbl.x).toBe(-10);
      expect(lbl.y).toBe(-50.5);
    });

    it('should handle zero coordinates', () => {
      const lbl = label.new(0, 0);

      expect(lbl.x).toBe(0);
      expect(lbl.y).toBe(0);
    });

    it('should handle empty text', () => {
      const lbl = label.new(50, 155.5, '');

      expect(lbl.text).toBe('');
    });

    it('should handle very large coordinates', () => {
      const lbl = label.new(1000000, 999999.99);

      expect(lbl.x).toBe(1000000);
      expect(lbl.y).toBe(999999.99);
    });
  });
});
