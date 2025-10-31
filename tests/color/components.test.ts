import { color } from '../../src';

describe('color.r', () => {
  it('should return red component from RGB color', () => {
    expect(color.r(color.rgb(255, 0, 0))).toBe(255);
    expect(color.r(color.rgb(128, 0, 0))).toBe(128);
    expect(color.r(color.rgb(0, 0, 0))).toBe(0);
    expect(color.r(color.rgb(255, 128, 64))).toBe(255);
  });

  it('should return red component from RGBA color', () => {
    expect(color.r(color.rgb(255, 0, 0, 50))).toBe(255);
    expect(color.r(color.rgb(128, 128, 128, 75))).toBe(128);
  });

  it('should return red component from hex color', () => {
    expect(color.r(color.from_hex('#FF0000'))).toBe(255);
    expect(color.r(color.from_hex('#800000'))).toBe(128);
    expect(color.r(color.from_hex('#FFA500'))).toBe(255); // orange
  });

  it('should handle edge cases', () => {
    expect(color.r(color.rgb(0, 255, 255))).toBe(0);
    expect(color.r(color.rgb(255, 255, 255))).toBe(255);
  });
});

describe('color.g', () => {
  it('should return green component from RGB color', () => {
    expect(color.g(color.rgb(0, 255, 0))).toBe(255);
    expect(color.g(color.rgb(0, 128, 0))).toBe(128);
    expect(color.g(color.rgb(0, 0, 0))).toBe(0);
    expect(color.g(color.rgb(64, 128, 255))).toBe(128);
  });

  it('should return green component from RGBA color', () => {
    expect(color.g(color.rgb(0, 255, 0, 50))).toBe(255);
    expect(color.g(color.rgb(128, 128, 128, 75))).toBe(128);
  });

  it('should return green component from hex color', () => {
    expect(color.g(color.from_hex('#00FF00'))).toBe(255);
    expect(color.g(color.from_hex('#008000'))).toBe(128);
    expect(color.g(color.from_hex('#FFA500'))).toBe(165); // orange
  });

  it('should handle edge cases', () => {
    expect(color.g(color.rgb(255, 0, 255))).toBe(0);
    expect(color.g(color.rgb(255, 255, 255))).toBe(255);
  });
});

describe('color.b', () => {
  it('should return blue component from RGB color', () => {
    expect(color.b(color.rgb(0, 0, 255))).toBe(255);
    expect(color.b(color.rgb(0, 0, 128))).toBe(128);
    expect(color.b(color.rgb(0, 0, 0))).toBe(0);
    expect(color.b(color.rgb(255, 64, 128))).toBe(128);
  });

  it('should return blue component from RGBA color', () => {
    expect(color.b(color.rgb(0, 0, 255, 50))).toBe(255);
    expect(color.b(color.rgb(128, 128, 128, 75))).toBe(128);
  });

  it('should return blue component from hex color', () => {
    expect(color.b(color.from_hex('#0000FF'))).toBe(255);
    expect(color.b(color.from_hex('#000080'))).toBe(128);
    expect(color.b(color.from_hex('#FFA500'))).toBe(0); // orange
  });

  it('should handle edge cases', () => {
    expect(color.b(color.rgb(255, 255, 0))).toBe(0);
    expect(color.b(color.rgb(255, 255, 255))).toBe(255);
  });
});

describe('color.t', () => {
  it('should return 0 for opaque RGB colors', () => {
    expect(color.t(color.rgb(255, 0, 0))).toBe(0);
    expect(color.t(color.rgb(0, 255, 0))).toBe(0);
    expect(color.t(color.rgb(0, 0, 255))).toBe(0);
  });

  it('should return transparency value for RGBA colors', () => {
    expect(color.t(color.rgb(255, 0, 0, 50))).toBeCloseTo(50, 1);
    expect(color.t(color.rgb(0, 255, 0, 25))).toBeCloseTo(25, 1);
    expect(color.t(color.rgb(0, 0, 255, 75))).toBeCloseTo(75, 1);
  });

  it('should return 0 for 0% transparency', () => {
    expect(color.t(color.rgb(255, 0, 0, 0))).toBe(0);
  });

  it('should return 100 for 100% transparency', () => {
    expect(color.t(color.rgb(255, 0, 0, 100))).toBeCloseTo(100, 1);
  });

  it('should work with hex colors with transparency', () => {
    expect(color.t(color.from_hex('#FF0000', 50))).toBeCloseTo(50, 1);
    expect(color.t(color.from_hex('#00FF00', 0))).toBe(0);
  });

  it('should return correct transparency after new_color', () => {
    const baseColor = color.rgb(255, 0, 0);
    const newColor = color.new_color(baseColor, 33);
    expect(color.t(newColor)).toBeCloseTo(33, 1);
  });

  it('should handle various transparency levels', () => {
    expect(color.t(color.rgb(0, 0, 0, 10))).toBeCloseTo(10, 1);
    expect(color.t(color.rgb(0, 0, 0, 90))).toBeCloseTo(90, 1);
  });
});

describe('color components - integration', () => {
  it('should correctly extract all components from a color', () => {
    const clr = color.rgb(255, 128, 64, 30);

    expect(color.r(clr)).toBe(255);
    expect(color.g(clr)).toBe(128);
    expect(color.b(clr)).toBe(64);
    expect(color.t(clr)).toBeCloseTo(30, 1);
  });

  it('should extract components from hex color', () => {
    const clr = color.from_hex('#FFA500', 40); // orange with transparency

    expect(color.r(clr)).toBe(255);
    expect(color.g(clr)).toBe(165);
    expect(color.b(clr)).toBe(0);
    expect(color.t(clr)).toBeCloseTo(40, 1);
  });

  it('should extract components from common colors', () => {
    const red = color.rgb(255, 0, 0);
    expect(color.r(red)).toBe(255);
    expect(color.g(red)).toBe(0);
    expect(color.b(red)).toBe(0);
    expect(color.t(red)).toBe(0);

    const green = color.rgb(0, 255, 0);
    expect(color.r(green)).toBe(0);
    expect(color.g(green)).toBe(255);
    expect(color.b(green)).toBe(0);
    expect(color.t(green)).toBe(0);

    const blue = color.rgb(0, 0, 255);
    expect(color.r(blue)).toBe(0);
    expect(color.g(blue)).toBe(0);
    expect(color.b(blue)).toBe(255);
    expect(color.t(blue)).toBe(0);
  });

  it('should handle black and white', () => {
    const black = color.rgb(0, 0, 0);
    expect(color.r(black)).toBe(0);
    expect(color.g(black)).toBe(0);
    expect(color.b(black)).toBe(0);
    expect(color.t(black)).toBe(0);

    const white = color.rgb(255, 255, 255);
    expect(color.r(white)).toBe(255);
    expect(color.g(white)).toBe(255);
    expect(color.b(white)).toBe(255);
    expect(color.t(white)).toBe(0);
  });

  it('should allow reconstructing a color from components', () => {
    const original = color.rgb(123, 45, 67, 20);

    const r = color.r(original);
    const g = color.g(original);
    const b = color.b(original);
    const t = color.t(original);

    const reconstructed = color.rgb(r, g, b, t);

    expect(color.r(reconstructed)).toBe(123);
    expect(color.g(reconstructed)).toBe(45);
    expect(color.b(reconstructed)).toBe(67);
    expect(color.t(reconstructed)).toBeCloseTo(20, 1);
  });
});
