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
  it('should match simple patterns', () => {
    expect(str.match('hello', 'hello')).toBe(true);
    expect(str.match('test123', 'test')).toBe(true);
    expect(str.match('world', 'world')).toBe(true);
  });

  it('should match regex patterns', () => {
    expect(str.match('hello123', '\\d+')).toBe(true);
    expect(str.match('test', '[a-z]+')).toBe(true);
    expect(str.match('ABC', '[A-Z]+')).toBe(true);
  });

  it('should return false for non-matches', () => {
    expect(str.match('hello', 'world')).toBe(false);
    expect(str.match('test', '\\d+')).toBe(false);
    expect(str.match('abc', '[A-Z]+')).toBe(false);
  });

  it('should handle special regex characters', () => {
    expect(str.match('hello.world', '\\.')).toBe(true);
    expect(str.match('test@example.com', '@')).toBe(true);
    expect(str.match('$100', '\\$')).toBe(true);
  });

  it('should handle complex patterns', () => {
    expect(str.match('test@example.com', '^[a-z]+@[a-z]+\\.[a-z]+$')).toBe(true);
    expect(str.match('123-456-7890', '^\\d{3}-\\d{3}-\\d{4}$')).toBe(true);
    expect(str.match('hello world', '^hello\\s+world$')).toBe(true);
  });

  it('should handle empty string', () => {
    expect(str.match('', '')).toBe(true);
    expect(str.match('', 'test')).toBe(false);
  });

  it('should handle anchors', () => {
    expect(str.match('hello', '^hello$')).toBe(true);
    expect(str.match('hello world', '^hello')).toBe(true);
    expect(str.match('hello world', 'world$')).toBe(true);
    expect(str.match('hello', '^world$')).toBe(false);
  });

  it('should handle character classes', () => {
    expect(str.match('hello', '[helo]+')).toBe(true);
    expect(str.match('123', '[0-9]+')).toBe(true);
    expect(str.match('ABC', '[^a-z]+')).toBe(true);
  });

  it('should handle quantifiers', () => {
    expect(str.match('hello', 'l{2}')).toBe(true);
    expect(str.match('test', 't.*t')).toBe(true);
    expect(str.match('123', '\\d+')).toBe(true);
    expect(str.match('abc', '[a-z]{3}')).toBe(true);
  });

  it('should be case sensitive by default', () => {
    expect(str.match('hello', 'HELLO')).toBe(false);
    expect(str.match('HELLO', 'hello')).toBe(false);
    expect(str.match('hello', 'hello')).toBe(true);
  });
});
