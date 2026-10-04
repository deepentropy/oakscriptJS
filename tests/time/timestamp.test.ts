import { time } from '../../src';

describe('time.timestamp', () => {
  // Expected values: PineScript results
  describe('date string form (GMT+0 when no time zone is given)', () => {
    it.each([
      ['2020-02-20', Date.UTC(2020, 1, 20)],
      ['2024-1-5', Date.UTC(2024, 0, 5)],
      ['2011-10-10T14:48:00', Date.UTC(2011, 9, 10, 14, 48)],
      ['2011-10-10T14:48', Date.UTC(2011, 9, 10, 14, 48)],
      ['2024-01-01 09:30', Date.UTC(2024, 0, 1, 9, 30)],
      ['2024-01-01 09:30:15', Date.UTC(2024, 0, 1, 9, 30, 15)],
      ['2024-01-01T09:30:00.250', Date.UTC(2024, 0, 1, 9, 30, 0, 250)],
      ['2024-01-01T09:30:00.250+0000', Date.UTC(2024, 0, 1, 9, 30, 0, 250)],
      ['2024-01-01T24:00:00', Date.UTC(2024, 0, 2)],
      ['2024-01-01 9:30', Date.UTC(2024, 0, 1, 9, 30)],
      ['2024/1/5 09:30', Date.UTC(2024, 0, 5, 9, 30)],
      ['2024/01/05 09:30 +0100', Date.UTC(2024, 0, 5, 8, 30)],
      ['2024-01-01 09:30 UTC', Date.UTC(2024, 0, 1, 9, 30)],
      ['2024-01-01 09:30 UTC+2', Date.UTC(2024, 0, 1, 7, 30)],
      ['5-Jan-2024', Date.UTC(2024, 0, 5)],
      ['Jan 5, 2024 09:30', Date.UTC(2024, 0, 5, 9, 30)],
      ['01 Jan 2024 09:30 PST', Date.UTC(2024, 0, 1, 17, 30)],
      ['2024-01-01 09:30 +0000', Date.UTC(2024, 0, 1, 9, 30)],
      ['2024-01-01 09:30:00-0500', Date.UTC(2024, 0, 1, 14, 30)],
      ['2024-01-01T09:30:00+05:30', Date.UTC(2024, 0, 1, 4, 0)],
      ['20 Feb 2020', Date.UTC(2020, 1, 20)],
      ['5 Jan 2024', Date.UTC(2024, 0, 5)],
      ['01 Jan 2024 00:00 -0500', Date.UTC(2024, 0, 1, 5, 0)],
      ['04 Dec 1995 00:12:00 GMT+5', Date.UTC(1995, 11, 3, 19, 12)],
      ['Thu, 20 Feb 2020 14:48:00 GMT', Date.UTC(2020, 1, 20, 14, 48)],
      ['12 Feb 2024 09:30:00 EST', Date.UTC(2024, 1, 12, 14, 30)],
      ['15 July 2024 09:30:00 EDT', Date.UTC(2024, 6, 15, 13, 30)],
      ['03 Sept 2024 09:30:00 EDT', Date.UTC(2024, 8, 3, 13, 30)],
      ['Feb 01 2020 22:10:05', Date.UTC(2020, 1, 1, 22, 10, 5)],
    ])('%s', (dateString, expected) => {
      expect(time.timestamp(dateString)).toBe(expected);
    });

    it('rejects strings in other forms', () => {
      expect(() => time.timestamp('yesterday')).toThrow(SyntaxError);
      expect(() => time.timestamp('2024-13-01')).toThrow(SyntaxError);
      expect(() => time.timestamp('2024-01-01 25:00')).toThrow(SyntaxError);
      expect(() => time.timestamp('01 Foo 2024')).toThrow(SyntaxError);
      // compile errors in PineScript
      expect(() => time.timestamp('2024-01-01T09:30:00Z')).toThrow(SyntaxError);
      expect(() => time.timestamp('2024-01-01T09:30:00 GMT')).toThrow(SyntaxError);
      expect(() => time.timestamp('2024-01-01 24:30')).toThrow(SyntaxError);
      expect(() => time.timestamp('2024-01-01T09:30:60')).toThrow(SyntaxError);
    });
  });

  describe('time zone form', () => {
    it('reads the fields in the time zone', () => {
      expect(time.timestamp('America/New_York', 2024, 1, 2, 9, 30)).toBe(Date.UTC(2024, 0, 2, 14, 30));
      expect(time.timestamp('America/New_York', 2024, 7, 1, 9, 30)).toBe(Date.UTC(2024, 6, 1, 13, 30));
      expect(time.timestamp('GMT+6', 2016, 1, 19, 9, 30)).toBe(Date.UTC(2016, 0, 19, 3, 30));
      expect(time.timestamp('GMT+3', 2019, 6, 19, 9, 30, 15)).toBe(Date.UTC(2019, 5, 19, 6, 30, 15));
      expect(time.timestamp('UTC', 2024, 3, 1)).toBe(Date.UTC(2024, 2, 1));
    });

    it('rolls over out-of-range fields', () => {
      expect(time.timestamp('UTC', 2023, 13, 1)).toBe(Date.UTC(2024, 0, 1));
      expect(time.timestamp('UTC', 2024, 1, 32)).toBe(Date.UTC(2024, 1, 1));
    });

    it('resolves repeated wall-clock times to the later instant', () => {
      // 01:30 happens twice in New York on 03/11/2024, 02:30 in Paris on 27/10/2024 and in Sydney on 07/04/2024
      expect(time.timestamp('America/New_York', 2024, 11, 3, 1, 30)).toBe(Date.UTC(2024, 10, 3, 6, 30));
      expect(time.timestamp('Europe/Paris', 2024, 10, 27, 2, 30)).toBe(Date.UTC(2024, 9, 27, 1, 30));
      expect(time.timestamp('Australia/Sydney', 2024, 4, 7, 2, 30)).toBe(Date.UTC(2024, 3, 6, 16, 30));
      // just before and after the repeated hour
      expect(time.timestamp('America/New_York', 2024, 11, 3, 0, 59)).toBe(Date.UTC(2024, 10, 3, 4, 59));
      expect(time.timestamp('America/New_York', 2024, 11, 3, 2, 0)).toBe(Date.UTC(2024, 10, 3, 7, 0));
    });

    it('shifts missing wall-clock times forward by the gap', () => {
      // 02:30 does not exist in New York on 10/03/2024 nor in Paris on 31/03/2024
      expect(time.timestamp('America/New_York', 2024, 3, 10, 2, 30)).toBe(Date.UTC(2024, 2, 10, 7, 30));
      expect(time.timestamp('Europe/Paris', 2024, 3, 31, 2, 30)).toBe(Date.UTC(2024, 2, 31, 1, 30));
    });
  });

  it('keeps the numeric form in the host time zone', () => {
    expect(time.timestamp(2024, 1, 2, 9, 30)).toBe(new Date(2024, 0, 2, 9, 30).getTime());
  });
});

describe('timestamp: forms measured on PineScript (PyneCore gap audit)', () => {
  it('"2025" and "2025-06" are the first day of the year / month (UTC)', () => {
    expect(time.timestamp('2025')).toBe(1735689600000);
    expect(time.timestamp('2025-06')).toBe(1748736000000);
  });

  it('a day-first date with a time zone but no time gives na', () => {
    expect(time.timestamp('01 Jan 2022 GMT+3')).toBeNaN();
    expect(time.timestamp('01 Jan 2022 00:00 GMT+3')).toBe(1640984400000);
  });

  it('dates before 1582-10-15 use the Julian calendar', () => {
    expect(time.timestamp('UTC', 1582, 10, 5, 0, 0)).toBe(time.timestamp('UTC', 1582, 10, 15, 0, 0));
    expect(time.timestamp('UTC', 1582, 10, 15, 0, 0)).toBe(-12219292800000);
  });
});
