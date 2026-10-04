import { str } from '../../src';

describe('str.trim', () => {
  it('should trim whitespace from both ends', () => {
    expect(str.trim('  hello  ')).toBe('hello');
    expect(str.trim('  world  ')).toBe('world');
    expect(str.trim('\ttest\t')).toBe('test');
    expect(str.trim('\n\nhello\n\n')).toBe('hello');
  });

  it('should handle no whitespace', () => {
    expect(str.trim('hello')).toBe('hello');
    expect(str.trim('world')).toBe('world');
  });

  it('should handle only leading whitespace', () => {
    expect(str.trim('  hello')).toBe('hello');
    expect(str.trim('\tworld')).toBe('world');
  });

  it('should handle only trailing whitespace', () => {
    expect(str.trim('hello  ')).toBe('hello');
    expect(str.trim('world\t')).toBe('world');
  });

  it('should handle empty string', () => {
    expect(str.trim('')).toBe('');
  });

  it('should handle string with only whitespace', () => {
    expect(str.trim('   ')).toBe('');
    expect(str.trim('\t\t\t')).toBe('');
    expect(str.trim('\n\n\n')).toBe('');
    expect(str.trim('  \t\n  ')).toBe('');
  });

  it('should preserve internal whitespace', () => {
    expect(str.trim('  hello world  ')).toBe('hello world');
    expect(str.trim('  a  b  c  ')).toBe('a  b  c');
  });

  it('should handle mixed whitespace characters', () => {
    expect(str.trim(' \t\nhello\n\t ')).toBe('hello');
    expect(str.trim('\r\n\tworld\t\n\r')).toBe('world');
  });
});

describe('str.trimLeft', () => {
  it('should trim whitespace from left only', () => {
    expect(str.trimLeft('  hello')).toBe('hello');
    expect(str.trimLeft('  world  ')).toBe('world  ');
    expect(str.trimLeft('\ttest')).toBe('test');
    expect(str.trimLeft('\n\nhello\n\n')).toBe('hello\n\n');
  });

  it('should handle no leading whitespace', () => {
    expect(str.trimLeft('hello')).toBe('hello');
    expect(str.trimLeft('hello  ')).toBe('hello  ');
  });

  it('should handle empty string', () => {
    expect(str.trimLeft('')).toBe('');
  });

  it('should handle string with only whitespace', () => {
    expect(str.trimLeft('   ')).toBe('');
    expect(str.trimLeft('\t\t\t')).toBe('');
    expect(str.trimLeft('\n\n\n')).toBe('');
  });

  it('should preserve internal and trailing whitespace', () => {
    expect(str.trimLeft('  hello world  ')).toBe('hello world  ');
    expect(str.trimLeft('  a  b  c')).toBe('a  b  c');
  });

  it('should handle mixed whitespace characters', () => {
    expect(str.trimLeft(' \t\nhello')).toBe('hello');
    expect(str.trimLeft('\r\n\tworld\t\n\r')).toBe('world\t\n\r');
  });
});

describe('str.trimRight', () => {
  it('should trim whitespace from right only', () => {
    expect(str.trimRight('hello  ')).toBe('hello');
    expect(str.trimRight('  world  ')).toBe('  world');
    expect(str.trimRight('test\t')).toBe('test');
    expect(str.trimRight('\n\nhello\n\n')).toBe('\n\nhello');
  });

  it('should handle no trailing whitespace', () => {
    expect(str.trimRight('hello')).toBe('hello');
    expect(str.trimRight('  hello')).toBe('  hello');
  });

  it('should handle empty string', () => {
    expect(str.trimRight('')).toBe('');
  });

  it('should handle string with only whitespace', () => {
    expect(str.trimRight('   ')).toBe('');
    expect(str.trimRight('\t\t\t')).toBe('');
    expect(str.trimRight('\n\n\n')).toBe('');
  });

  it('should preserve leading and internal whitespace', () => {
    expect(str.trimRight('  hello world  ')).toBe('  hello world');
    expect(str.trimRight('a  b  c  ')).toBe('a  b  c');
  });

  it('should handle mixed whitespace characters', () => {
    expect(str.trimRight('hello \t\n')).toBe('hello');
    expect(str.trimRight('\r\n\tworld\t\n\r')).toBe('\r\n\tworld');
  });
});

describe('str.match', () => {
  it('returns the first match, searched anywhere (PineScript)', () => {
    expect(str.match('Hello World!', 'o')).toBe('o');
    expect(str.match('Hello World!', '[a-z]+')).toBe('ello');
    expect(str.match('Hello World!', '[A-Za-z]+')).toBe('Hello');
    expect(str.match('Hello World!', '^Hello')).toBe('Hello');
    expect(str.match('hello123', '\\d+')).toBe('123');
    expect(str.match('test@example.com', '^[a-z]+@[a-z]+\\.[a-z]+$')).toBe('test@example.com');
    expect(str.match('hello', 'l{2}')).toBe('ll');
  });

  it('returns na (null) when nothing matches or the match is empty', () => {
    expect(str.match('Hello World!', 'xyz')).toBeNull();
    expect(str.match('hello', 'HELLO')).toBeNull();
    expect(str.match('abc123def', '')).toBeNull();
    expect(str.match('', 'test')).toBeNull();
  });
});
