import { str } from '../../src';

describe('str.split', () => {
  it('should split string by separator', () => {
    expect(str.split('hello world', ' ')).toEqual(['hello', 'world']);
    expect(str.split('a,b,c', ',')).toEqual(['a', 'b', 'c']);
    expect(str.split('one-two-three', '-')).toEqual(['one', 'two', 'three']);
  });

  it('should handle empty separator', () => {
    expect(str.split('abc', '')).toEqual(['a', 'b', 'c']);
    expect(str.split('hello', '')).toEqual(['h', 'e', 'l', 'l', 'o']);
  });

  it('should handle separator not in string', () => {
    expect(str.split('hello', ',')).toEqual(['hello']);
    expect(str.split('test', '|')).toEqual(['test']);
  });

  it('should handle empty string', () => {
    expect(str.split('', ',')).toEqual(['']);
    expect(str.split('', '')).toEqual(['']); // PineScript
  });

  it('should handle multiple consecutive separators', () => {
    expect(str.split('a,,b', ',')).toEqual(['a', '', 'b']);
    expect(str.split('hello  world', ' ')).toEqual(['hello', '', 'world']);
  });

  it('should handle separator at start or end', () => {
    expect(str.split(',a,b,', ',')).toEqual(['', 'a', 'b', '']);
    expect(str.split(' hello ', ' ')).toEqual(['', 'hello', '']);
  });

  it('should handle multi-character separator', () => {
    expect(str.split('hello::world', '::')).toEqual(['hello', 'world']);
    expect(str.split('a<->b<->c', '<->')).toEqual(['a', 'b', 'c']);
  });
});

describe('str.concat', () => {
  it('should concatenate two strings', () => {
    expect(str.concat('hello', 'world')).toBe('helloworld');
    expect(str.concat('test', '123')).toBe('test123');
  });

  it('should concatenate multiple strings', () => {
    expect(str.concat('a', 'b', 'c')).toBe('abc');
    expect(str.concat('hello', ' ', 'world')).toBe('hello world');
    expect(str.concat('one', 'two', 'three', 'four')).toBe('onetwothreefour');
  });

  it('should handle empty strings', () => {
    expect(str.concat('', '')).toBe('');
    expect(str.concat('hello', '')).toBe('hello');
    expect(str.concat('', 'world')).toBe('world');
    expect(str.concat('', 'hello', '')).toBe('hello');
  });

  it('should handle single string', () => {
    expect(str.concat('hello')).toBe('hello');
    expect(str.concat('')).toBe('');
  });

  it('should handle special characters', () => {
    expect(str.concat('hello', '@', 'world')).toBe('hello@world');
    expect(str.concat('$', '100')).toBe('$100');
    expect(str.concat('a', '-', 'b', '-', 'c')).toBe('a-b-c');
  });
});

describe('str.format', () => {
  it('should replace single placeholder', () => {
    expect(str.format('Hello {0}', 'world')).toBe('Hello world');
    expect(str.format('Test {0}', '123')).toBe('Test 123');
  });

  it('should replace multiple placeholders', () => {
    expect(str.format('{0} {1}', 'hello', 'world')).toBe('hello world');
    expect(str.format('{0} + {1} = {2}', '1', '2', '3')).toBe('1 + 2 = 3');
    expect(str.format('{0}, {1}, {2}', 'a', 'b', 'c')).toBe('a, b, c');
  });

  it('should handle placeholders in any order', () => {
    expect(str.format('{1} {0}', 'world', 'hello')).toBe('hello world');
    expect(str.format('{2} {1} {0}', 'a', 'b', 'c')).toBe('c b a');
  });

  it('should handle repeated placeholders', () => {
    expect(str.format('{0} {0} {0}', 'test')).toBe('test test test');
    expect(str.format('{0} and {1} and {0}', 'A', 'B')).toBe('A and B and A');
  });

  it('should handle missing arguments', () => {
    expect(str.format('{0} {1}', 'hello')).toBe('hello {1}');
    expect(str.format('{0} {1} {2}', 'a', 'b')).toBe('a b {2}');
  });

  it('should handle no placeholders', () => {
    expect(str.format('hello world', 'test')).toBe('hello world');
    expect(str.format('no placeholders', 'a', 'b')).toBe('no placeholders');
  });

  it('should convert non-string arguments', () => {
    expect(str.format('Value: {0}', 123)).toBe('Value: 123');
    expect(str.format('Flag: {0}', true)).toBe('Flag: true');
    expect(str.format('{0} + {1}', 1, 2)).toBe('1 + 2');
  });

  it('should handle empty format string', () => {
    expect(str.format('', 'test')).toBe('');
    expect(str.format('', 'a', 'b', 'c')).toBe('');
  });

  it('should handle special characters in arguments', () => {
    expect(str.format('Email: {0}', 'test@example.com')).toBe('Email: test@example.com');
    expect(str.format('Price: {0}', '$100')).toBe('Price: $100');
  });
});

// Expected values: PineScript results
describe('str.format number and date patterns', () => {
  it('formats numbers like PineScript', () => {
    expect(str.format('{0}', 1234.5678)).toBe('1,234.568');
    expect(str.format('{0,number,#.##}', 1234.5678)).toBe('1234.57');
    expect(str.format('{0,number,integer}', 0.5)).toBe('0');
    expect(str.format('{0,number,percent}', 1234.5678)).toBe('123,457%');
    expect(str.format('{0,number,currency}', -7)).toBe('-$7.00');
    expect(str.format('{0,number,#.##} / {1,number,#.#}', 1234.5678, 0.25)).toBe('1234.57 / 0.2');
    expect(str.format("'{0}' {0}", 0.5)).toBe('{0} 0.5');
    expect(str.format("it''s {0}", -7)).toBe("it's -7");
    expect(str.format('{0,choice,0#zero|1#one|1<many}', 1234.5)).toBe('many');
  });

  it('arrays, negative subpatterns and the 16-decimal cap (PineScript)', () => {
    expect(str.format('{0}', ['Hello', 'World!'])).toBe('[Hello, World!]');
    expect(str.format('{0,number,#.####################}', 0.1)).toBe('0.1');
    expect(str.format('{0,number,#.##;(#.##)}', -3.5)).toBe('(3.5)');
    expect(str.format('{0}', 1234.5678)).toBe('1,234.568');
  });

  it('formats dates in UTC', () => {
    const t = Date.UTC(2024, 2, 5, 14, 7, 9, 123);
    expect(str.format('{0,date,yyyy-MM-dd}', t)).toBe('2024-03-05');
    expect(str.format('{0,date}', t)).toBe('Mar 5, 2024');
    expect(str.format('{0,time}', t)).toBe('2:07:09\u202FPM');
  });
});

describe('str.format_time with a time zone', () => {
  const t = Date.UTC(2024, 2, 5, 14, 7, 9, 123);
  it.each([
    ['yyyy-MM-dd HH:mm:ss', 'America/New_York', '2024-03-05 09:07:09'],
    ['hh:mm a', 'Asia/Kolkata', '07:37 PM'],
    ["yyyy-MM-dd'T'HH:mm:ssZ", 'America/New_York', '2024-03-05T09:07:09-0500'],
    ['z', 'GMT+5', 'GMT+05:00'],
    ['z', 'UTC', 'GMT'],
    ['D w u k K S', 'UTC', '65 10 2 14 2 123'],
  ])('%s in %s', (pattern, tz, expected) => {
    expect(str.format_time(t, pattern, tz)).toBe(expected);
  });
});
