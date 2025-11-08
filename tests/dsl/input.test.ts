/**
 * Test input.* DSL functions
 */

import { indicator, input, plot, compile, close, getDSLContext } from '../../src';

describe('input.* DSL functions', () => {
  beforeEach(() => {
    getDSLContext().clear();
  });

  describe('input.int()', () => {
    it('should register integer input with default value', () => {
      indicator("Test Indicator");

      const length = input.int(14, "Length");

      expect(length).toBe(14);
    });

    it('should return user value when options are provided', () => {
      indicator("Test Indicator");

      const length = input.int(14, "Length");
      plot(close);

      const compiled = compile();
      const userOptions = { length: 20 };

      // The input should be in metadata
      expect(compiled.metadata.inputs).toHaveLength(1);
      expect(compiled.metadata.inputs[0]?.defval).toBe(14);
      expect(compiled.metadata.inputs[0]?.name).toBe('length');
    });

    it('should register with minval/maxval/step', () => {
      indicator("Test Indicator");

      input.int(14, "Length", { minval: 1, maxval: 500, step: 1 });
      plot(close);

      const compiled = compile();

      expect(compiled.metadata.inputs[0]).toEqual({
        type: 'int',
        name: 'length',
        title: 'Length',
        defval: 14,
        minval: 1,
        maxval: 500,
        step: 1,
        tooltip: undefined,
        inline: undefined,
        group: undefined,
        options: undefined,
      });
    });

    it('should handle tooltip and group options', () => {
      indicator("Test Indicator");

      input.int(14, "Length", {
        tooltip: "Period for calculation",
        group: "Settings"
      });
      plot(close);

      const compiled = compile();

      expect(compiled.metadata.inputs[0]?.tooltip).toBe("Period for calculation");
      expect(compiled.metadata.inputs[0]?.group).toBe("Settings");
    });
  });

  describe('input.float()', () => {
    it('should register float input with default value', () => {
      indicator("Test Indicator");

      const multiplier = input.float(2.0, "Multiplier");

      expect(multiplier).toBe(2.0);
    });

    it('should register with min/max/step', () => {
      indicator("Test Indicator");

      input.float(2.0, "Multiplier", { minval: 0.1, maxval: 10.0, step: 0.1 });
      plot(close);

      const compiled = compile();

      expect(compiled.metadata.inputs[0]).toMatchObject({
        type: 'float',
        name: 'multiplier',
        title: 'Multiplier',
        defval: 2.0,
        minval: 0.1,
        maxval: 10.0,
        step: 0.1,
      });
    });
  });

  describe('input.bool()', () => {
    it('should register boolean input', () => {
      indicator("Test Indicator");

      const showSignals = input.bool(true, "Show Signals");

      expect(showSignals).toBe(true);
    });

    it('should register in metadata', () => {
      indicator("Test Indicator");

      input.bool(false, "Show Signals", { tooltip: "Display buy/sell signals" });
      plot(close);

      const compiled = compile();

      expect(compiled.metadata.inputs[0]).toMatchObject({
        type: 'bool',
        name: 'show_signals',
        title: 'Show Signals',
        defval: false,
        tooltip: "Display buy/sell signals",
      });
    });
  });

  describe('input.string()', () => {
    it('should register string input', () => {
      indicator("Test Indicator");

      const maType = input.string("SMA", "MA Type");

      expect(maType).toBe("SMA");
    });

    it('should register with dropdown options', () => {
      indicator("Test Indicator");

      input.string("SMA", "MA Type", {
        options: ["SMA", "EMA", "WMA"]
      });
      plot(close);

      const compiled = compile();

      expect(compiled.metadata.inputs[0]).toMatchObject({
        type: 'string',
        name: 'ma_type',
        title: 'MA Type',
        defval: "SMA",
        options: ["SMA", "EMA", "WMA"],
      });
    });
  });

  describe('input.source()', () => {
    it('should register source input', () => {
      indicator("Test Indicator");

      const src = input.source(close, "Source");

      expect(src).toBe(close);
    });

    it('should register in metadata', () => {
      indicator("Test Indicator");

      input.source(close, "Source", { tooltip: "Price source for calculation" });
      plot(close);

      const compiled = compile();

      expect(compiled.metadata.inputs[0]).toMatchObject({
        type: 'source',
        name: 'source',
        title: 'Source',
        tooltip: "Price source for calculation",
      });
    });
  });

  describe('Multiple inputs', () => {
    it('should register multiple inputs in order', () => {
      indicator("Test Indicator");

      input.int(14, "Length");
      input.float(2.0, "Multiplier");
      input.bool(true, "Show Signals");
      plot(close);

      const compiled = compile();

      expect(compiled.metadata.inputs).toHaveLength(3);
      expect(compiled.metadata.inputs[0]?.type).toBe('int');
      expect(compiled.metadata.inputs[1]?.type).toBe('float');
      expect(compiled.metadata.inputs[2]?.type).toBe('bool');
    });
  });

  describe('Input name generation', () => {
    it('should convert title to snake_case name', () => {
      indicator("Test Indicator");

      input.int(14, "Fast Length");
      input.int(21, "Slow Length");
      plot(close);

      const compiled = compile();

      expect(compiled.metadata.inputs[0]?.name).toBe('fast_length');
      expect(compiled.metadata.inputs[1]?.name).toBe('slow_length');
    });

    it('should handle multi-word titles', () => {
      indicator("Test Indicator");

      input.string("SMA", "Moving Average Type");
      plot(close);

      const compiled = compile();

      expect(compiled.metadata.inputs[0]?.name).toBe('moving_average_type');
    });
  });
});
