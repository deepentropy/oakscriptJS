import { time } from '../../src';

const NY = 'America/New_York';

describe('time calendar functions', () => {
  // 02/01/2024 14:30 UTC = 09:30 EST (UTC-5)
  const winterOpen = Date.UTC(2024, 0, 2, 14, 30, 15);
  // 01/07/2024 13:30 UTC = 09:30 EDT (UTC-4)
  const summerOpen = Date.UTC(2024, 6, 1, 13, 30);

  it('reads the fields in an IANA time zone, with daylight saving time', () => {
    expect(time.hour(winterOpen, NY)).toBe(9);
    expect(time.minute(winterOpen, NY)).toBe(30);
    expect(time.second(winterOpen, NY)).toBe(15);
    expect(time.hour(summerOpen, NY)).toBe(9);
    expect(time.minute(summerOpen, NY)).toBe(30);
  });

  it('changes the date when the time zone crosses midnight', () => {
    // 01/01/2024 03:00 UTC = 31/12/2023 22:00 in New York
    const t = Date.UTC(2024, 0, 1, 3, 0);
    expect(time.year(t, NY)).toBe(2023);
    expect(time.month(t, NY)).toBe(12);
    expect(time.dayofmonth(t, NY)).toBe(31);
    expect(time.dayofweek(t, NY)).toBe(1); // Sunday
    expect(time.year(t, 'UTC')).toBe(2024);
    expect(time.dayofweek(t, 'UTC')).toBe(2); // Monday
  });

  it('accepts UTC/GMT offset notation', () => {
    expect(time.hour(summerOpen, 'UTC-5')).toBe(8);
    expect(time.hour(summerOpen, 'UTC')).toBe(13);
    expect(time.hour(summerOpen, 'GMT')).toBe(13);
    expect(time.hour(summerOpen, 'GMT+0')).toBe(13);
    // +05:30 in three notations and as an IANA name
    const t = Date.UTC(2024, 0, 2, 0, 0);
    for (const tz of ['GMT+0530', 'UTC+05:30', 'UTC+5:30', 'Asia/Kolkata']) {
      expect([time.hour(t, tz), time.minute(t, tz)]).toEqual([5, 30]);
    }
  });

  it('numbers the days of the week from Sunday = 1', () => {
    // 07/01/2024 is a Sunday, 13/01/2024 a Saturday
    expect(time.dayofweek(Date.UTC(2024, 0, 7, 12), 'UTC')).toBe(1);
    expect(time.dayofweek(Date.UTC(2024, 0, 8, 12), 'UTC')).toBe(2);
    expect(time.dayofweek(Date.UTC(2024, 0, 13, 12), 'UTC')).toBe(7);
  });

  it('starts weeks on Monday (ISO 8601 week numbers)', () => {
    expect(time.weekofyear(Date.UTC(2024, 0, 1, 12), 'UTC')).toBe(1); // Monday
    expect(time.weekofyear(Date.UTC(2024, 0, 7, 12), 'UTC')).toBe(1); // Sunday
    expect(time.weekofyear(Date.UTC(2024, 0, 8, 12), 'UTC')).toBe(2); // Monday
    expect(time.weekofyear(Date.UTC(2023, 0, 1, 12), 'UTC')).toBe(52); // Sunday, week 52 of 2022
    expect(time.weekofyear(Date.UTC(2020, 11, 31, 12), 'UTC')).toBe(53);
    expect(time.weekofyear(Date.UTC(2021, 0, 3, 12), 'UTC')).toBe(53);
    expect(time.weekofyear(Date.UTC(2024, 11, 30, 12), 'UTC')).toBe(1); // Monday, week 1 of 2025
  });

  it('keeps a Sunday 17:00 New York bar in the week of the previous Friday', () => {
    const friday = Date.UTC(2024, 0, 12, 22, 0); // Friday 17:00 EST
    const sunday = Date.UTC(2024, 0, 14, 22, 0); // Sunday 17:00 EST
    const monday = Date.UTC(2024, 0, 15, 22, 0); // Monday 17:00 EST
    expect(time.weekofyear(sunday, NY)).toBe(time.weekofyear(friday, NY));
    expect(time.weekofyear(monday, NY)).toBe(time.weekofyear(friday, NY) + 1);
  });

  it('returns NaN for a NaN time', () => {
    expect(time.hour(NaN, NY)).toBeNaN();
    expect(time.weekofyear(NaN, 'UTC')).toBeNaN();
  });

  // Accepted and rejected spellings (checked 30/09/2026)
  it('accepts offsets up to 18 hours, with optional seconds', () => {
    const t = Date.UTC(2024, 0, 2, 14, 30);
    expect(time.hour(t, 'UTC+15')).toBe(5);
    expect(time.hour(t, 'GMT+18')).toBe(8);
    expect(time.hour(t, 'GMT-18')).toBe(20);
    expect(time.hour(t, 'UTC-13')).toBe(1);
    expect([time.hour(t, 'GMT+05:30:00'), time.minute(t, 'GMT+05:30:00')]).toEqual([20, 0]);
    expect([time.hour(t, 'GMT+530'), time.minute(t, 'GMT+530')]).toEqual([20, 0]);
  });

  it('accepts time zone database names and aliases', () => {
    const t = Date.UTC(2024, 0, 2, 14, 30);
    expect(time.hour(t, 'US/Eastern')).toBe(9);
    expect(time.hour(t, 'EST5EDT')).toBe(9);
    expect(time.hour(t, 'CET')).toBe(15);
    expect(time.hour(t, 'Japan')).toBe(23);
    expect(time.hour(t, 'Etc/GMT-14')).toBe(4);
  });

  it('rejects invalid time zones', () => {
    for (const tz of ['Mars/Olympus', 'UTC+24', 'GMT+18:01', 'UTC+5:75', 'UTC+5:3', 'UTC+5:30:15', 'UTC+',
      'utc+2', 'Utc+2', ' UTC+2', 'UTC +2', 'america/new_york', 'America/New_york', 'EST', 'MST', 'HST']) {
      expect(() => time.hour(winterOpen, tz)).toThrow(RangeError);
    }
  });
});
