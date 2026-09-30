import { time } from '../../src';

const NY = 'America/New_York';
/** UNIX time of a New York wall-clock time in January 2024 (EST, UTC-5). */
const ny = (day: number, hour: number, minute = 0) => Date.UTC(2024, 0, day, hour + 5, minute);
// January 2024: 5 = Friday, 6 = Saturday, 7 = Sunday, 8 = Monday

describe('time.inSession', () => {
  it('includes the start and excludes the end of a period', () => {
    expect(time.inSession(ny(8, 9, 29), '0930-1600', NY)).toBe(false);
    expect(time.inSession(ny(8, 9, 30), '0930-1600', NY)).toBe(true);
    expect(time.inSession(ny(8, 15, 59), '0930-1600', NY)).toBe(true);
    expect(time.inSession(ny(8, 16, 0), '0930-1600', NY)).toBe(false);
  });

  it('reads the session hours in the time zone argument', () => {
    // 09:30 New York is 14:30 UTC
    expect(time.inSession(ny(8, 9, 30), '0930-1400', 'UTC')).toBe(false);
    expect(time.inSession(ny(8, 9, 30), '1430-1500', 'UTC')).toBe(true);
    expect(time.inSession(ny(8, 9, 30), '1430-1500', 'UTC+0')).toBe(true);
  });

  it('filters days (1 = Sunday ... 7 = Saturday)', () => {
    expect(time.inSession(ny(5, 10), '0930-1600:23456', NY)).toBe(true);
    expect(time.inSession(ny(6, 10), '0930-1600:23456', NY)).toBe(false);
    expect(time.inSession(ny(6, 10), '0930-1600:7', NY)).toBe(true);
  });

  it('supports several periods', () => {
    const s = '1000-1100,1400-1500:23456';
    expect(time.inSession(ny(8, 10, 30), s, NY)).toBe(true);
    expect(time.inSession(ny(8, 12, 0), s, NY)).toBe(false);
    expect(time.inSession(ny(8, 14, 59), s, NY)).toBe(true);
    expect(time.inSession(ny(7, 10, 30), s, NY)).toBe(false);
  });

  it('uses Monday to Friday for several periods without days (as in PineScript)', () => {
    const s = '1000-1100,1400-1500';
    expect(time.inSession(ny(8, 10, 30), s, NY)).toBe(true); // Monday
    expect(time.inSession(ny(6, 10, 30), s, NY)).toBe(false); // Saturday
    expect(time.inSession(ny(7, 14, 30), s, NY)).toBe(false); // Sunday
    expect(time.inSession(ny(7, 14, 30), `${s}:1234567`, NY)).toBe(true);
    // a single period without days covers every day
    expect(time.inSession(ny(7, 10, 30), '1000-1100', NY)).toBe(true);
    // days after each period are invalid
    expect(() => time.inSession(ny(8, 10), '1000-1100:1234567,1400-1500', NY)).toThrow(SyntaxError);
  });

  it('treats "0000-0000" and "24x7" as the whole day', () => {
    expect(time.inSession(ny(7, 0), '0000-0000', NY)).toBe(true);
    expect(time.inSession(ny(7, 23, 59), '24x7', NY)).toBe(true);
    // Sunday excluded, from its first to its last minute
    expect(time.inSession(ny(7, 0), '0000-0000:23456', NY)).toBe(false);
    expect(time.inSession(ny(7, 23, 59), '0000-0000:23456', NY)).toBe(false);
    expect(time.inSession(ny(8, 0), '0000-0000:23456', NY)).toBe(true);
  });

  it('assigns an overnight period to the day it ends', () => {
    const s = '1700-1600:23456'; // Sunday 17:00 to Friday 16:00
    expect(time.inSession(ny(7, 17, 30), s, NY)).toBe(true); // Sunday evening = Monday session
    expect(time.inSession(ny(7, 15, 0), s, NY)).toBe(false); // Sunday afternoon
    expect(time.inSession(ny(8, 16, 30), s, NY)).toBe(false); // daily break
    expect(time.inSession(ny(5, 10), s, NY)).toBe(true); // Friday morning
    expect(time.inSession(ny(5, 17, 30), s, NY)).toBe(false); // Friday evening = Saturday session
  });

  it('returns false for a NaN time and rejects invalid sessions', () => {
    expect(time.inSession(NaN, '0930-1600', NY)).toBe(false);
    expect(() => time.inSession(ny(8, 10), '930-1600', NY)).toThrow(SyntaxError);
    expect(() => time.inSession(ny(8, 10), '0930-2500', NY)).toThrow(SyntaxError);
    expect(() => time.inSession(ny(8, 10), '0930-1600:8', NY)).toThrow(SyntaxError);
  });
});
