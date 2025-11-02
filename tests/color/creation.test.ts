import { color } from '../../src';

describe('color.rgb', () => {
  it('should create RGB color without transparency', () => {
    expect(color.rgb(255, 0, 0)).toBe('rgb(255, 0, 0)');
    expect(color.rgb(0, 255, 0)).toBe('rgb(0, 255, 0)');
    expect(color.rgb(0, 0, 255)).toBe('rgb(0, 0, 255)');
    expect(color.rgb(128, 128, 128)).toBe('rgb(128, 128, 128)');
  });

  it('should create RGBA color with transparency', () => {
    expect(color.rgb(255, 0, 0, 50)).toBe('rgba(255, 0, 0, 0.5)');
    expect(color.rgb(0, 255, 0, 25)).toBe('rgba(0, 255, 0, 0.75)');
    expect(color.rgb(0, 0, 255, 75)).toBe('rgba(0, 0, 255, 0.25)');
    expect(color.rgb(128, 128, 128, 100)).toBe('rgba(128, 128, 128, 0)');
  });

  it('should create RGB color when transparency is 0', () => {
    expect(color.rgb(255, 0, 0, 0)).toBe('rgb(255, 0, 0)');
    expect(color.rgb(0, 255, 0, 0)).toBe('rgb(0, 255, 0)');
  });

  it('should clamp values to valid range (0-255)', () => {
    expect(color.rgb(300, 0, 0)).toBe('rgb(255, 0, 0)');
    expect(color.rgb(-10, 0, 0)).toBe('rgb(0, 0, 0)');
    expect(color.rgb(0, 300, -10)).toBe('rgb(0, 255, 0)');
    expect(color.rgb(256, 256, 256)).toBe('rgb(255, 255, 255)');
  });

  it('should handle black color', () => {
    expect(color.rgb(0, 0, 0)).toBe('rgb(0, 0, 0)');
    expect(color.rgb(0, 0, 0, 0)).toBe('rgb(0, 0, 0)');
  });

  it('should handle white color', () => {
    expect(color.rgb(255, 255, 255)).toBe('rgb(255, 255, 255)');
    expect(color.rgb(255, 255, 255, 0)).toBe('rgb(255, 255, 255)');
  });

  it('should handle edge transparency values', () => {
    expect(color.rgb(255, 0, 0, 0)).toBe('rgb(255, 0, 0)'); // 0% transparent = fully opaque
    expect(color.rgb(255, 0, 0, 100)).toBe('rgba(255, 0, 0, 0)'); // 100% transparent = fully transparent
    expect(color.rgb(255, 0, 0, 50)).toBe('rgba(255, 0, 0, 0.5)'); // 50% transparent
  });

  it('should handle decimal transparency values', () => {
    expect(color.rgb(255, 0, 0, 33.33)).toContain('rgba(255, 0, 0,');
    expect(color.rgb(0, 255, 0, 66.67)).toContain('rgba(0, 255, 0,');
  });

  it('should create common colors', () => {
    expect(color.rgb(255, 0, 0)).toBe('rgb(255, 0, 0)'); // red
    expect(color.rgb(0, 255, 0)).toBe('rgb(0, 255, 0)'); // green
    expect(color.rgb(0, 0, 255)).toBe('rgb(0, 0, 255)'); // blue
    expect(color.rgb(255, 255, 0)).toBe('rgb(255, 255, 0)'); // yellow
    expect(color.rgb(255, 0, 255)).toBe('rgb(255, 0, 255)'); // magenta
    expect(color.rgb(0, 255, 255)).toBe('rgb(0, 255, 255)'); // cyan
  });
});

describe('color.from_hex', () => {
  it('should create color from hex string with #', () => {
    expect(color.from_hex('#FF0000')).toBe('rgb(255, 0, 0)');
    expect(color.from_hex('#00FF00')).toBe('rgb(0, 255, 0)');
    expect(color.from_hex('#0000FF')).toBe('rgb(0, 0, 255)');
  });

  it('should create color from hex string without #', () => {
    expect(color.from_hex('FF0000')).toBe('rgb(255, 0, 0)');
    expect(color.from_hex('00FF00')).toBe('rgb(0, 255, 0)');
    expect(color.from_hex('0000FF')).toBe('rgb(0, 0, 255)');
  });

  it('should create color with transparency', () => {
    expect(color.from_hex('#FF0000', 50)).toBe('rgba(255, 0, 0, 0.5)');
    expect(color.from_hex('00FF00', 25)).toBe('rgba(0, 255, 0, 0.75)');
    expect(color.from_hex('#0000FF', 75)).toBe('rgba(0, 0, 255, 0.25)');
  });

  it('should handle black and white', () => {
    expect(color.from_hex('#000000')).toBe('rgb(0, 0, 0)');
    expect(color.from_hex('#FFFFFF')).toBe('rgb(255, 255, 255)');
    expect(color.from_hex('000000')).toBe('rgb(0, 0, 0)');
    expect(color.from_hex('FFFFFF')).toBe('rgb(255, 255, 255)');
  });

  it('should handle lowercase hex', () => {
    expect(color.from_hex('#ff0000')).toBe('rgb(255, 0, 0)');
    expect(color.from_hex('00ff00')).toBe('rgb(0, 255, 0)');
    expect(color.from_hex('#0000ff')).toBe('rgb(0, 0, 255)');
  });

  it('should handle mixed case hex', () => {
    expect(color.from_hex('#Ff0000')).toBe('rgb(255, 0, 0)');
    expect(color.from_hex('00Ff00')).toBe('rgb(0, 255, 0)');
    expect(color.from_hex('#0000fF')).toBe('rgb(0, 0, 255)');
  });

  it('should create common colors from hex', () => {
    expect(color.from_hex('#FF0000')).toBe('rgb(255, 0, 0)'); // red
    expect(color.from_hex('#00FF00')).toBe('rgb(0, 255, 0)'); // green
    expect(color.from_hex('#0000FF')).toBe('rgb(0, 0, 255)'); // blue
    expect(color.from_hex('#FFFF00')).toBe('rgb(255, 255, 0)'); // yellow
    expect(color.from_hex('#FF00FF')).toBe('rgb(255, 0, 255)'); // magenta
    expect(color.from_hex('#00FFFF')).toBe('rgb(0, 255, 255)'); // cyan
  });

  it('should handle various color values', () => {
    expect(color.from_hex('#FFA500')).toBe('rgb(255, 165, 0)'); // orange
    expect(color.from_hex('#800080')).toBe('rgb(128, 0, 128)'); // purple
    expect(color.from_hex('#808080')).toBe('rgb(128, 128, 128)'); // gray
    expect(color.from_hex('#C0C0C0')).toBe('rgb(192, 192, 192)'); // silver
  });

  it('should combine with transparency', () => {
    expect(color.from_hex('#FF0000', 0)).toBe('rgb(255, 0, 0)');
    expect(color.from_hex('#FF0000', 100)).toBe('rgba(255, 0, 0, 0)');
  });
});
