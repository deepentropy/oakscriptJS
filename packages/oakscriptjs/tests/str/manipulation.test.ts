import { str } from '../../src';

describe('str.substring', () => {
  it('should extract substring with begin and end', () => {
    expect(str.substring('hello world', 0, 5)).toBe('hello');
    expect(str.substring('hello world', 6, 11)).toBe('world');
    expect(str.substring('test', 1, 3)).toBe('es');
  });

  it('should extract substring from begin to end when end is omitted', () => {
    expect(str.substring('hello world', 6)).toBe('world');
    expect(str.substring('test', 2)).toBe('st');
    expect(str.substring('hello', 0)).toBe('hello');
  });

  it('should handle edge cases', () => {
    expect(str.substring('test', 0, 0)).toBe('');
    expect(str.substring('test', 4)).toBe('');
    expect(str.substring('test', 10)).toBe('');
  });

  it('should handle negative indices like JavaScript substring', () => {
    // JavaScript substring treats negative as 0
    expect(str.substring('hello', -1, 3)).toBe('hel');
    expect(str.substring('hello', 1, -1)).toBe('h');
  });

  it('should swap indices if begin > end', () => {
    // JavaScript substring swaps if begin > end
    expect(str.substring('hello', 3, 1)).toBe('el');
  });
});

describe('str.upper', () => {
  it('should convert lowercase to uppercase', () => {
    expect(str.upper('hello')).toBe('HELLO');
    expect(str.upper('world')).toBe('WORLD');
    expect(str.upper('test')).toBe('TEST');
  });

  it('should handle already uppercase strings', () => {
    expect(str.upper('HELLO')).toBe('HELLO');
    expect(str.upper('WORLD')).toBe('WORLD');
  });

  it('should handle mixed case strings', () => {
    expect(str.upper('Hello World')).toBe('HELLO WORLD');
    expect(str.upper('TeSt')).toBe('TEST');
  });

  it('should handle empty string', () => {
    expect(str.upper('')).toBe('');
  });

  it('should handle strings with numbers and special characters', () => {
    expect(str.upper('hello123')).toBe('HELLO123');
    expect(str.upper('test@example.com')).toBe('TEST@EXAMPLE.COM');
    expect(str.upper('a-b-c')).toBe('A-B-C');
  });

  it('should handle unicode characters', () => {
    expect(str.upper('café')).toBe('CAFÉ');
    expect(str.upper('naïve')).toBe('NAÏVE');
  });
});

describe('str.lower', () => {
  it('should convert uppercase to lowercase', () => {
    expect(str.lower('HELLO')).toBe('hello');
    expect(str.lower('WORLD')).toBe('world');
    expect(str.lower('TEST')).toBe('test');
  });

  it('should handle already lowercase strings', () => {
    expect(str.lower('hello')).toBe('hello');
    expect(str.lower('world')).toBe('world');
  });

  it('should handle mixed case strings', () => {
    expect(str.lower('Hello World')).toBe('hello world');
    expect(str.lower('TeSt')).toBe('test');
  });

  it('should handle empty string', () => {
    expect(str.lower('')).toBe('');
  });

  it('should handle strings with numbers and special characters', () => {
    expect(str.lower('HELLO123')).toBe('hello123');
    expect(str.lower('TEST@EXAMPLE.COM')).toBe('test@example.com');
    expect(str.lower('A-B-C')).toBe('a-b-c');
  });

  it('should handle unicode characters', () => {
    expect(str.lower('CAFÉ')).toBe('café');
    expect(str.lower('NAÏVE')).toBe('naïve');
  });
});
