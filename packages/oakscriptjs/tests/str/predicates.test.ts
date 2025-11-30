import { str } from '../../src';

describe('str.startswith', () => {
  it('should return true when string starts with prefix', () => {
    expect(str.startswith('hello world', 'hello')).toBe(true);
    expect(str.startswith('test', 'test')).toBe(true);
    expect(str.startswith('testing', 'test')).toBe(true);
    expect(str.startswith('abc123', 'abc')).toBe(true);
  });

  it('should return false when string does not start with prefix', () => {
    expect(str.startswith('hello world', 'world')).toBe(false);
    expect(str.startswith('test', 'testing')).toBe(false);
    expect(str.startswith('hello', 'goodbye')).toBe(false);
  });

  it('should be case sensitive', () => {
    expect(str.startswith('hello world', 'Hello')).toBe(false);
    expect(str.startswith('Test', 'test')).toBe(false);
    expect(str.startswith('hello world', 'hello')).toBe(true);
  });

  it('should handle empty prefix', () => {
    expect(str.startswith('hello', '')).toBe(true);
    expect(str.startswith('test', '')).toBe(true);
    expect(str.startswith('', '')).toBe(true);
  });

  it('should handle empty source string', () => {
    expect(str.startswith('', 'hello')).toBe(false);
    expect(str.startswith('', 'test')).toBe(false);
  });

  it('should handle prefix longer than source', () => {
    expect(str.startswith('hi', 'hello')).toBe(false);
    expect(str.startswith('test', 'testing')).toBe(false);
  });

  it('should handle special characters', () => {
    expect(str.startswith('$100', '$')).toBe(true);
    expect(str.startswith('@user', '@')).toBe(true);
    expect(str.startswith('hello@world', 'hello')).toBe(true);
  });
});

describe('str.endswith', () => {
  it('should return true when string ends with suffix', () => {
    expect(str.endswith('hello world', 'world')).toBe(true);
    expect(str.endswith('test', 'test')).toBe(true);
    expect(str.endswith('testing', 'ing')).toBe(true);
    expect(str.endswith('abc123', '123')).toBe(true);
  });

  it('should return false when string does not end with suffix', () => {
    expect(str.endswith('hello world', 'hello')).toBe(false);
    expect(str.endswith('testing', 'test')).toBe(false);
    expect(str.endswith('hello', 'goodbye')).toBe(false);
  });

  it('should be case sensitive', () => {
    expect(str.endswith('hello world', 'World')).toBe(false);
    expect(str.endswith('Test', 'TEST')).toBe(false);
    expect(str.endswith('hello world', 'world')).toBe(true);
  });

  it('should handle empty suffix', () => {
    expect(str.endswith('hello', '')).toBe(true);
    expect(str.endswith('test', '')).toBe(true);
    expect(str.endswith('', '')).toBe(true);
  });

  it('should handle empty source string', () => {
    expect(str.endswith('', 'hello')).toBe(false);
    expect(str.endswith('', 'test')).toBe(false);
  });

  it('should handle suffix longer than source', () => {
    expect(str.endswith('hi', 'hello')).toBe(false);
    expect(str.endswith('ing', 'testing')).toBe(false);
  });

  it('should handle special characters', () => {
    expect(str.endswith('price$', '$')).toBe(true);
    expect(str.endswith('user@', '@')).toBe(true);
    expect(str.endswith('hello@world.com', '.com')).toBe(true);
  });
});

describe('str.charAt', () => {
  it('should return character at position', () => {
    expect(str.charAt('hello', 0)).toBe('h');
    expect(str.charAt('hello', 1)).toBe('e');
    expect(str.charAt('hello', 4)).toBe('o');
    expect(str.charAt('world', 2)).toBe('r');
  });

  it('should return empty string for out of bounds index', () => {
    expect(str.charAt('hello', 5)).toBe('');
    expect(str.charAt('hello', 10)).toBe('');
    expect(str.charAt('test', -1)).toBe('');
  });

  it('should handle empty string', () => {
    expect(str.charAt('', 0)).toBe('');
    expect(str.charAt('', 5)).toBe('');
  });

  it('should handle special characters', () => {
    expect(str.charAt('hello@world', 5)).toBe('@');
    expect(str.charAt('$100', 0)).toBe('$');
    expect(str.charAt('a-b-c', 1)).toBe('-');
  });

  it('should handle whitespace', () => {
    expect(str.charAt('hello world', 5)).toBe(' ');
    expect(str.charAt('a b c', 1)).toBe(' ');
  });

  it('should handle unicode characters', () => {
    expect(str.charAt('café', 3)).toBe('é');
    // Note: charAt returns single UTF-16 code unit, emoji may span multiple units
    const result = str.charAt('hello 👋', 6);
    expect(result.length).toBeGreaterThan(0); // Just verify it returns something
  });

  it('should handle first and last positions', () => {
    const text = 'testing';
    expect(str.charAt(text, 0)).toBe('t');
    expect(str.charAt(text, text.length - 1)).toBe('g');
  });
});
