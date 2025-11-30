import { str } from '../../src';

describe('str.contains', () => {
  it('should return true when string contains substring', () => {
    expect(str.contains('hello world', 'hello')).toBe(true);
    expect(str.contains('hello world', 'world')).toBe(true);
    expect(str.contains('hello world', 'lo wo')).toBe(true);
    expect(str.contains('test', 'test')).toBe(true);
  });

  it('should return false when string does not contain substring', () => {
    expect(str.contains('hello world', 'goodbye')).toBe(false);
    expect(str.contains('hello world', 'xyz')).toBe(false);
    expect(str.contains('test', 'testing')).toBe(false);
  });

  it('should be case sensitive', () => {
    expect(str.contains('hello world', 'Hello')).toBe(false);
    expect(str.contains('hello world', 'WORLD')).toBe(false);
    expect(str.contains('hello world', 'hello')).toBe(true);
  });

  it('should handle empty substring', () => {
    expect(str.contains('hello', '')).toBe(true);
    expect(str.contains('', '')).toBe(true);
  });

  it('should handle empty source string', () => {
    expect(str.contains('', 'hello')).toBe(false);
  });

  it('should handle special characters', () => {
    expect(str.contains('hello@world.com', '@')).toBe(true);
    expect(str.contains('price: $100', '$100')).toBe(true);
    expect(str.contains('a-b-c', '-')).toBe(true);
  });
});

describe('str.pos', () => {
  it('should return the index of first occurrence', () => {
    expect(str.pos('hello world', 'hello')).toBe(0);
    expect(str.pos('hello world', 'world')).toBe(6);
    expect(str.pos('hello world', 'o')).toBe(4);
  });

  it('should return -1 when substring not found', () => {
    expect(str.pos('hello world', 'goodbye')).toBe(-1);
    expect(str.pos('hello world', 'xyz')).toBe(-1);
    expect(str.pos('test', 'testing')).toBe(-1);
  });

  it('should be case sensitive', () => {
    expect(str.pos('hello world', 'Hello')).toBe(-1);
    expect(str.pos('hello world', 'WORLD')).toBe(-1);
    expect(str.pos('hello world', 'hello')).toBe(0);
  });

  it('should handle empty substring', () => {
    expect(str.pos('hello', '')).toBe(0);
    expect(str.pos('', '')).toBe(0);
  });

  it('should handle empty source string', () => {
    expect(str.pos('', 'hello')).toBe(-1);
  });

  it('should find first occurrence when substring appears multiple times', () => {
    expect(str.pos('hello hello', 'hello')).toBe(0);
    expect(str.pos('test test test', 'test')).toBe(0);
    expect(str.pos('abcabc', 'abc')).toBe(0);
  });

  it('should handle special characters', () => {
    expect(str.pos('hello@world.com', '@')).toBe(5);
    expect(str.pos('price: $100', '$')).toBe(7);
    expect(str.pos('a-b-c', '-')).toBe(1);
  });
});

describe('str.replace', () => {
  it('should replace first occurrence when occurrence is 0', () => {
    expect(str.replace('hello world hello', 'hello', 'goodbye', 0)).toBe('goodbye world hello');
    expect(str.replace('test test test', 'test', 'exam', 0)).toBe('exam test test');
  });

  it('should replace all occurrences when occurrence is not 0', () => {
    expect(str.replace('hello world hello', 'hello', 'goodbye', 1)).toBe('goodbye world goodbye');
    expect(str.replace('test test test', 'test', 'exam', 1)).toBe('exam exam exam');
    expect(str.replace('hello world hello', 'hello', 'goodbye')).toBe('goodbye world goodbye');
  });

  it('should handle no matches', () => {
    expect(str.replace('hello world', 'goodbye', 'hello', 0)).toBe('hello world');
    expect(str.replace('hello world', 'xyz', 'abc', 1)).toBe('hello world');
  });

  it('should be case sensitive', () => {
    expect(str.replace('hello world', 'Hello', 'goodbye', 0)).toBe('hello world');
    expect(str.replace('hello world', 'WORLD', 'earth', 1)).toBe('hello world');
  });

  it('should handle empty strings', () => {
    expect(str.replace('', 'hello', 'goodbye', 0)).toBe('');
    expect(str.replace('hello', '', 'x', 0)).toBe('xhello');
  });

  it('should handle special characters', () => {
    expect(str.replace('hello@world.com', '@', ' at ', 0)).toBe('hello at world.com');
    expect(str.replace('$100 + $200', '$', 'USD', 1)).toBe('USD100 + USD200');
  });

  it('should handle replacement with empty string', () => {
    expect(str.replace('hello world', 'hello ', '', 0)).toBe('world');
    expect(str.replace('a-b-c', '-', '', 1)).toBe('abc');
  });

  it('should handle same source and target', () => {
    expect(str.replace('hello', 'hello', 'hello', 0)).toBe('hello');
    expect(str.replace('test', 'test', 'test', 1)).toBe('test');
  });
});
