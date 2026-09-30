import { color } from '../../src';

// PineScript v6 colour constants, (pinerules-check/doc/README.md)
const PINE_V6: Record<string, [string, number, number, number]> = {
  aqua: ['#00BCD4', 0, 188, 212],
  black: ['#363A45', 54, 58, 69],
  blue: ['#2962FF', 41, 98, 255],
  fuchsia: ['#E040FB', 224, 64, 251],
  gray: ['#787B86', 120, 123, 134],
  green: ['#4CAF50', 76, 175, 80],
  lime: ['#00E676', 0, 230, 118],
  maroon: ['#880E4F', 136, 14, 79],
  navy: ['#311B92', 49, 27, 146],
  olive: ['#808000', 128, 128, 0],
  orange: ['#FF9800', 255, 152, 0],
  purple: ['#9C27B0', 156, 39, 176],
  red: ['#F23645', 242, 54, 69],
  silver: ['#B2B5BE', 178, 181, 190],
  teal: ['#089981', 8, 153, 129],
  white: ['#FFFFFF', 255, 255, 255],
  yellow: ['#FDD835', 253, 216, 53],
};

describe('color constants', () => {
  it.each(Object.entries(PINE_V6))('%s is the PineScript v6 colour', (name, [hex, r, g, b]) => {
    const c = (color as unknown as Record<string, string>)[name]!;
    expect(c).toBe(hex);
    expect(color.from_hex(c)).toBe(`rgb(${r}, ${g}, ${b})`);
    expect([color.r(c), color.g(c), color.b(c), color.t(c)]).toEqual([r, g, b, 0]);
  });

  it('should be able to add transparency to constants', () => {
    expect(color.from_hex(color.red, 50)).toBe('rgba(242, 54, 69, 0.5)');
    expect(color.new_color(color.blue, 60)).toBe('rgba(41, 98, 255, 0.4)');
    expect(color.new_color(color.from_hex(color.green), 75)).toBe('rgba(76, 175, 80, 0.25)');
  });
});
