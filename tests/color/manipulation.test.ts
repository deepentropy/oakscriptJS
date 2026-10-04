import { color } from '../../src';

describe('color.new_color', () => {
  it('clamps the transparency to 0..100; na is fully transparent (PineScript)', () => {
    expect(color.new('#DD1A1A', 101)).toBe('rgba(221, 26, 26, 0)');
    expect(color.new('#DD1A1A', 140)).toBe('rgba(221, 26, 26, 0)');
    expect(color.new('#DD1A1A', -5)).toBe('rgb(221, 26, 26)');
    expect(color.new('#DD1A1A', NaN)).toBe('rgba(221, 26, 26, 0)');
    expect(color.t(color.new(color.rgb(255, 0, 0, 20), 150))).toBe(100);
  });

  it('an na colour stays na; color.t(na) is 100 (PineScript)', () => {
    expect(color.new(null, 50)).toBeNull();
    expect(color.t(color.new(null, 50))).toBe(100);
    expect(color.t(null)).toBe(100);
  });

  it('should set transparency on RGB color', () => {
    const red = color.rgb(255, 0, 0);
    expect(color.new_color(red, 50)).toBe('rgba(255, 0, 0, 0.5)');
    expect(color.new_color(red, 25)).toBe('rgba(255, 0, 0, 0.75)');
    expect(color.new_color(red, 75)).toBe('rgba(255, 0, 0, 0.25)');
  });

  it('should set transparency on RGBA color', () => {
    const semiRed = color.rgb(255, 0, 0, 30);
    expect(color.new_color(semiRed, 50)).toBe('rgba(255, 0, 0, 0.5)');
    expect(color.new_color(semiRed, 0)).toBe('rgb(255, 0, 0)');
    expect(color.new_color(semiRed, 100)).toBe('rgba(255, 0, 0, 0)');
  });

  it('should handle 0% transparency (fully opaque)', () => {
    const blue = color.rgb(0, 0, 255);
    expect(color.new_color(blue, 0)).toBe('rgb(0, 0, 255)');
  });

  it('should handle 100% transparency (fully transparent)', () => {
    const green = color.rgb(0, 255, 0);
    expect(color.new_color(green, 100)).toBe('rgba(0, 255, 0, 0)');
  });

  it('should preserve RGB values while changing transparency', () => {
    const purple = color.rgb(128, 0, 128);
    const result = color.new_color(purple, 40);
    expect(result).toBe('rgba(128, 0, 128, 0.6)');

    // Verify RGB values are preserved
    expect(color.r(result)).toBe(128);
    expect(color.g(result)).toBe(0);
    expect(color.b(result)).toBe(128);
  });

  it('should work with colors created from hex', () => {
    const orange = color.from_hex('#FFA500');
    expect(color.new_color(orange, 50)).toBe('rgba(255, 165, 0, 0.5)');
  });

  it('should handle various transparency values', () => {
    const white = color.rgb(255, 255, 255);
    expect(color.new_color(white, 10)).toBe('rgba(255, 255, 255, 0.9)');
    expect(color.new_color(white, 33.33)).toContain('rgba(255, 255, 255,');
    expect(color.new_color(white, 66.67)).toContain('rgba(255, 255, 255,');
    // 90% transparency = 0.1 alpha (with possible floating point imprecision)
    const result90 = color.new_color(white, 90);
    expect(result90).toContain('rgba(255, 255, 255, 0.');
    expect(color.t(result90)).toBeCloseTo(90, 1);
  });

  it('should work with black and white', () => {
    const black = color.rgb(0, 0, 0);
    const white = color.rgb(255, 255, 255);

    expect(color.new_color(black, 50)).toBe('rgba(0, 0, 0, 0.5)');
    expect(color.new_color(white, 50)).toBe('rgba(255, 255, 255, 0.5)');
  });

  it('should override existing transparency', () => {
    const semiTransparent = color.rgb(255, 0, 0, 30); // 30% transparent
    const newTransparent = color.new_color(semiTransparent, 70); // change to 70% transparent

    expect(newTransparent).toContain('rgba(255, 0, 0, 0.3');
    expect(color.t(newTransparent)).toBeCloseTo(70, 1);
  });

  it('should handle grayscale colors', () => {
    const gray = color.rgb(128, 128, 128);
    expect(color.new_color(gray, 25)).toBe('rgba(128, 128, 128, 0.75)');
    expect(color.new_color(gray, 75)).toBe('rgba(128, 128, 128, 0.25)');
  });
});

describe('color.from_gradient at the ends (#146)', () => {
  it('k = 0 / 1: floor(x * a / a) with the alpha as byte / 255, as PineScript', () => {
    // maroon with transparency 20 (#880E4F): 14 * 0.8 / 0.8 = 14.000000000000002 -> 14
    expect(color.from_gradient(0, 5, 15, color.new(color.maroon, 20), '#FF0000')).toBe('rgba(136, 14, 79, 0.8)');
    // rgb(37, 98, 56) with transparency 7 (alpha byte 237): 98 * a / a = 97.99999999999999 -> 97
    const bottom = color.rgb(37, 98, 56, 7);
    const top = color.rgb(111, 79, 80, 18);
    expect([0, 5].map((v) => color.g(color.from_gradient(v, 5, 15, bottom, top)))).toEqual([97, 97]);
    expect([15, 20].map((v) => color.r(color.from_gradient(v, 5, 15, top, bottom)))).toEqual([37, 37]);
  });
});
