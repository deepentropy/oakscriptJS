import { color } from '../../src';

describe('color.new_color', () => {
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
