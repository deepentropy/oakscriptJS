import { color } from '../../src';

describe('color constants', () => {
  it('should define aqua color', () => {
    expect(color.aqua).toBe('#00FFFF');
    expect(color.from_hex(color.aqua)).toBe('rgb(0, 255, 255)');
  });

  it('should define black color', () => {
    expect(color.black).toBe('#000000');
    expect(color.from_hex(color.black)).toBe('rgb(0, 0, 0)');
  });

  it('should define blue color', () => {
    expect(color.blue).toBe('#0000FF');
    expect(color.from_hex(color.blue)).toBe('rgb(0, 0, 255)');
  });

  it('should define fuchsia color', () => {
    expect(color.fuchsia).toBe('#FF00FF');
    expect(color.from_hex(color.fuchsia)).toBe('rgb(255, 0, 255)');
  });

  it('should define gray color', () => {
    expect(color.gray).toBe('#808080');
    expect(color.from_hex(color.gray)).toBe('rgb(128, 128, 128)');
  });

  it('should define green color', () => {
    expect(color.green).toBe('#00FF00');
    expect(color.from_hex(color.green)).toBe('rgb(0, 255, 0)');
  });

  it('should define lime color', () => {
    expect(color.lime).toBe('#00FF00');
    expect(color.from_hex(color.lime)).toBe('rgb(0, 255, 0)');
  });

  it('should define maroon color', () => {
    expect(color.maroon).toBe('#800000');
    expect(color.from_hex(color.maroon)).toBe('rgb(128, 0, 0)');
  });

  it('should define navy color', () => {
    expect(color.navy).toBe('#000080');
    expect(color.from_hex(color.navy)).toBe('rgb(0, 0, 128)');
  });

  it('should define olive color', () => {
    expect(color.olive).toBe('#808000');
    expect(color.from_hex(color.olive)).toBe('rgb(128, 128, 0)');
  });

  it('should define orange color', () => {
    expect(color.orange).toBe('#FFA500');
    expect(color.from_hex(color.orange)).toBe('rgb(255, 165, 0)');
  });

  it('should define purple color', () => {
    expect(color.purple).toBe('#800080');
    expect(color.from_hex(color.purple)).toBe('rgb(128, 0, 128)');
  });

  it('should define red color', () => {
    expect(color.red).toBe('#FF0000');
    expect(color.from_hex(color.red)).toBe('rgb(255, 0, 0)');
  });

  it('should define silver color', () => {
    expect(color.silver).toBe('#C0C0C0');
    expect(color.from_hex(color.silver)).toBe('rgb(192, 192, 192)');
  });

  it('should define teal color', () => {
    expect(color.teal).toBe('#008080');
    expect(color.from_hex(color.teal)).toBe('rgb(0, 128, 128)');
  });

  it('should define white color', () => {
    expect(color.white).toBe('#FFFFFF');
    expect(color.from_hex(color.white)).toBe('rgb(255, 255, 255)');
  });

  it('should define yellow color', () => {
    expect(color.yellow).toBe('#FFFF00');
    expect(color.from_hex(color.yellow)).toBe('rgb(255, 255, 0)');
  });

  it('should have lime and green as same color', () => {
    expect(color.lime).toBe(color.green);
  });

  it('should be able to add transparency to constants', () => {
    expect(color.from_hex(color.red, 50)).toBe('rgba(255, 0, 0, 0.5)');
    expect(color.from_hex(color.blue, 25)).toBe('rgba(0, 0, 255, 0.75)');
    expect(color.from_hex(color.green, 75)).toBe('rgba(0, 255, 0, 0.25)');
  });

  it('should be able to use constants with new_color', () => {
    const redColor = color.from_hex(color.red);
    expect(color.new_color(redColor, 40)).toBe('rgba(255, 0, 0, 0.6)');

    const blueColor = color.from_hex(color.blue);
    expect(color.new_color(blueColor, 60)).toBe('rgba(0, 0, 255, 0.4)');
  });

  it('should be able to extract components from constants', () => {
    // Red
    const redColor = color.from_hex(color.red);
    expect(color.r(redColor)).toBe(255);
    expect(color.g(redColor)).toBe(0);
    expect(color.b(redColor)).toBe(0);

    // Green
    const greenColor = color.from_hex(color.green);
    expect(color.r(greenColor)).toBe(0);
    expect(color.g(greenColor)).toBe(255);
    expect(color.b(greenColor)).toBe(0);

    // Blue
    const blueColor = color.from_hex(color.blue);
    expect(color.r(blueColor)).toBe(0);
    expect(color.g(blueColor)).toBe(0);
    expect(color.b(blueColor)).toBe(255);

    // Orange
    const orangeColor = color.from_hex(color.orange);
    expect(color.r(orangeColor)).toBe(255);
    expect(color.g(orangeColor)).toBe(165);
    expect(color.b(orangeColor)).toBe(0);

    // Purple
    const purpleColor = color.from_hex(color.purple);
    expect(color.r(purpleColor)).toBe(128);
    expect(color.g(purpleColor)).toBe(0);
    expect(color.b(purpleColor)).toBe(128);

    // Gray
    const grayColor = color.from_hex(color.gray);
    expect(color.r(grayColor)).toBe(128);
    expect(color.g(grayColor)).toBe(128);
    expect(color.b(grayColor)).toBe(128);
  });
});
