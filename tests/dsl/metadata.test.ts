/**
 * Test metadata exposure in compile()
 */

import { indicator, input, plot, compile, close, high, low, ta, getDSLContext } from '../../src';

describe('Metadata exposure', () => {
  beforeEach(() => {
    getDSLContext().clear();
  });

  it('should expose metadata on compiled indicator', () => {
    indicator("Test Indicator", { overlay: false, precision: 2 });
    plot(close);

    const compiled = compile();

    expect(compiled.metadata).toBeDefined();
    expect(compiled.metadata.title).toBe("Test Indicator");
    expect(compiled.metadata.overlay).toBe(false);
    expect(compiled.metadata.precision).toBe(2);
  });

  it('should include indicator options in metadata', () => {
    indicator("Moving Average", {
      overlay: true,
      precision: 4,
      shorttitle: "MA"
    });
    plot(close);

    const compiled = compile();

    expect(compiled.metadata.title).toBe("Moving Average");
    expect(compiled.metadata.shorttitle).toBe("MA");
    expect(compiled.metadata.overlay).toBe(true);
    expect(compiled.metadata.precision).toBe(4);
  });

  it('should include plot metadata', () => {
    indicator("Test Indicator");

    plot(close, { title: "Close Price", color: "#2962FF" });
    const adr = ta.sma(high.sub(low), 14);
    plot(adr, { title: "ADR", color: "#FF6D00" });

    const compiled = compile();

    expect(compiled.metadata.plots).toHaveLength(2);
    expect(compiled.metadata.plots[0]).toMatchObject({
      varName: "plot0",
      title: "Close Price",
    });
    expect(compiled.metadata.plots[1]).toMatchObject({
      varName: "plot1",
      title: "ADR",
    });
  });

  it('should include input metadata', () => {
    indicator("Moving Average Cross");

    const fastLength = input.int(9, "Fast Length", { minval: 1, maxval: 200 });
    const slowLength = input.int(21, "Slow Length", { minval: 1, maxval: 200 });

    const fastMA = ta.sma(close, fastLength);
    const slowMA = ta.sma(close, slowLength);

    plot(fastMA, { title: "Fast MA" });
    plot(slowMA, { title: "Slow MA" });

    const compiled = compile();

    expect(compiled.metadata.inputs).toHaveLength(2);

    expect(compiled.metadata.inputs[0]).toEqual({
      type: 'int',
      name: 'fast_length',
      title: 'Fast Length',
      defval: 9,
      minval: 1,
      maxval: 200,
      step: 1,
      tooltip: undefined,
      inline: undefined,
      group: undefined,
      options: undefined,
    });

    expect(compiled.metadata.inputs[1]).toEqual({
      type: 'int',
      name: 'slow_length',
      title: 'Slow Length',
      defval: 21,
      minval: 1,
      maxval: 200,
      step: 1,
      tooltip: undefined,
      inline: undefined,
      group: undefined,
      options: undefined,
    });
  });

  it('should expose empty arrays when no inputs or plots', () => {
    indicator("Minimal Indicator");

    const compiled = compile();

    expect(compiled.metadata.inputs).toEqual([]);
    expect(compiled.metadata.plots).toEqual([]);
  });

  it('should be accessible before binding', () => {
    indicator("Average Day Range", { overlay: false });

    const lengthInput = input.int(14, "Length", { minval: 1, maxval: 500 });
    const adr = ta.sma(high.sub(low), lengthInput);
    plot(adr, { title: "ADR" });

    const compiled = compile();

    // Access metadata without binding
    expect(compiled.metadata.title).toBe("Average Day Range");
    expect(compiled.metadata.overlay).toBe(false);
    expect(compiled.metadata.inputs).toHaveLength(1);
    expect(compiled.metadata.inputs[0]?.name).toBe('length');
    expect(compiled.metadata.inputs[0]?.defval).toBe(14);
    expect(compiled.metadata.plots).toHaveLength(1);
    expect(compiled.metadata.plots[0]?.title).toBe("ADR");
  });

  it('should include all input types in metadata', () => {
    indicator("Multi-Input Indicator");

    input.int(14, "Length");
    input.float(2.0, "Multiplier");
    input.bool(true, "Show Signals");
    input.string("SMA", "MA Type", { options: ["SMA", "EMA"] });
    input.source(close, "Source");

    plot(close);

    const compiled = compile();

    expect(compiled.metadata.inputs).toHaveLength(5);
    expect(compiled.metadata.inputs[0]?.type).toBe('int');
    expect(compiled.metadata.inputs[1]?.type).toBe('float');
    expect(compiled.metadata.inputs[2]?.type).toBe('bool');
    expect(compiled.metadata.inputs[3]?.type).toBe('string');
    expect(compiled.metadata.inputs[4]?.type).toBe('source');
  });

  it('should include input options and validation constraints', () => {
    indicator("Constrained Inputs");

    input.int(14, "Period", {
      minval: 1,
      maxval: 500,
      step: 1,
      tooltip: "Calculation period",
      group: "Settings"
    });

    input.string("SMA", "Type", {
      options: ["SMA", "EMA", "WMA"],
      tooltip: "Moving average type"
    });

    plot(close);

    const compiled = compile();

    expect(compiled.metadata.inputs[0]).toMatchObject({
      minval: 1,
      maxval: 500,
      step: 1,
      tooltip: "Calculation period",
      group: "Settings",
    });

    expect(compiled.metadata.inputs[1]).toMatchObject({
      options: ["SMA", "EMA", "WMA"],
      tooltip: "Moving average type",
    });
  });

  it('should ensure metadata fields are primitives not Series objects', () => {
    indicator("Test Indicator", {
      shorttitle: "TI",
      overlay: false,
      precision: 2,
      format: 'price',
      timeframe: '1D'
    });

    plot(close);

    const compiled = compile();

    // Title should be a string, not an object
    expect(typeof compiled.metadata.title).toBe('string');
    expect(compiled.metadata.title).toBe("Test Indicator");

    // Shorttitle should be a string or undefined
    expect(typeof compiled.metadata.shorttitle).toBe('string');
    expect(compiled.metadata.shorttitle).toBe("TI");

    // Overlay should be a boolean
    expect(typeof compiled.metadata.overlay).toBe('boolean');
    expect(compiled.metadata.overlay).toBe(false);

    // Precision should be a number
    expect(typeof compiled.metadata.precision).toBe('number');
    expect(compiled.metadata.precision).toBe(2);

    // Format should be a string
    expect(typeof compiled.metadata.format).toBe('string');
    expect(compiled.metadata.format).toBe('price');

    // Timeframe should be a string
    expect(typeof compiled.metadata.timeframe).toBe('string');
    expect(compiled.metadata.timeframe).toBe('1D');
  });
});
