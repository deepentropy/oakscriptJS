/**
 * time.inSession: runs ending at 0000 and the days around a clock change (#162). Each expected value is the
 * PineScript result of `time(timeframe.period, session, timezone)` on a bar that opens at that time.
 */
import { time } from '../../src';

const at = (iso: string): number => Date.parse(iso);
const NY = 'America/New_York';
const SYDNEY = 'Australia/Sydney';

describe('a run that ends at 0000 belongs to the day it starts (#162)', () => {
  it('"2000-0000:23456" is Monday to Friday 20:00 to midnight', () => {
    // Friday 24/07/2026 22:00 UTC is in the session; Sunday 26/07/2026 20:00 UTC is not
    expect(time.inSession(at('2026-07-24T22:00Z'), '2000-0000:23456', 'Etc/UTC')).toBe(true);
    expect(time.inSession(at('2026-07-26T20:00Z'), '2000-0000:23456', 'Etc/UTC')).toBe(false);
    expect(time.inSession(at('2026-07-24T19:59Z'), '2000-0000:23456', 'Etc/UTC')).toBe(false);
    // without days it runs every day, as "2000-2359"
    expect(time.inSession(at('2026-07-26T20:00Z'), '2000-0000', 'Etc/UTC')).toBe(true);
  });

  it('an overnight run still belongs to the day it ends', () => {
    // "1800-0300:23456": Sunday 18:00 to Monday 03:00 is Monday's run
    expect(time.inSession(at('2026-07-26T19:00Z'), '1800-0300:23456', 'Etc/UTC')).toBe(true);
    expect(time.inSession(at('2026-07-24T19:00Z'), '1800-0300:23456', 'Etc/UTC')).toBe(false); // Friday evening: Saturday's run
  });
});

describe('clocks going forward (#162)', () => {
  it('New York 09/03/2025 (02:00 -> 03:00 at 07:00 UTC): 60-minute bars', () => {
    // "0100-0200" is placed with the offset after the change: 05:00 UTC, the bar of 00:00 on the wall clock
    expect(time.inSession(at('2025-03-09T05:00Z'), '0100-0200', NY)).toBe(true);
    expect(time.inSession(at('2025-03-09T06:00Z'), '0100-0200', NY)).toBe(false);
    // "0200-0500" starts at 06:00 UTC, one hour before the wall clock shows 03:00
    expect(time.inSession(at('2025-03-09T06:00Z'), '0200-0500', NY)).toBe(true);
    expect(time.inSession(at('2025-03-09T05:00Z'), '0200-0500', NY)).toBe(false);
    // "0000-0200" and the overnight "2200-0200" end on the wall time of the change: one hour early at both ends
    expect(time.inSession(at('2025-03-09T04:00Z'), '0000-0200', NY)).toBe(true);
    expect(time.inSession(at('2025-03-09T06:00Z'), '0000-0200', NY)).toBe(false);
    expect(time.inSession(at('2025-03-09T02:00Z'), '2200-0200', NY)).toBe(true);
    expect(time.inSession(at('2025-03-09T06:00Z'), '2200-0200', NY)).toBe(false);
  });

  it('Sydney 04/10/2026 (02:00 -> 03:00 at 03/10 16:00 UTC): 5-minute bars', () => {
    const inside = (session: string, from: string, to: string) => {
      const out: string[] = [];
      for (let t = at('2026-10-03T12:00Z'); t < at('2026-10-03T19:00Z'); t += 300_000) {
        if (time.inSession(t, session, SYDNEY)) out.push(new Date(t).toISOString().slice(11, 16));
      }
      expect([out[0], out.length]).toEqual([from, to === from ? 0 : (Date.parse(`2026-10-03T${to}Z`) - Date.parse(`2026-10-03T${from}Z`)) / 300_000]);
    };
    inside('0000-0100', '14:00', '15:00'); // before the change: the wall clock
    inside('0100-0200', '14:00', '15:00'); // ends on the wall time of the change: one hour early
    inside('0100-0300', '15:00', '16:00'); // one real hour
    inside('0100-0230', '15:00', '15:30');
    inside('0200-0300', '15:00', '16:00'); // the hour that the wall clock skips
    inside('0230-0330', '15:30', '16:30');
    inside('2300-0200', '12:00', '15:00');
    // "0130-0230" and "0150-0210" are empty on that day
    for (let t = at('2026-10-03T12:00Z'); t < at('2026-10-03T19:00Z'); t += 300_000) {
      expect(time.inSession(t, '0130-0230', SYDNEY)).toBe(false);
      expect(time.inSession(t, '0150-0210', SYDNEY)).toBe(false);
    }
  });
});

describe('clocks going back (#162)', () => {
  const trueBars = (session: string, timezone: string, from: string, to: string, step = 900_000): string[] => {
    const out: string[] = [];
    for (let t = at(from); t < at(to); t += step) if (time.inSession(t, session, timezone)) out.push(new Date(t).toISOString().slice(11, 16));
    return out;
  };
  const span = (from: string, to: string): string[] => {
    const out: string[] = [];
    for (let t = at(`2026-04-04T${from}Z`); t < at(`2026-04-04T${to}Z`); t += 900_000) out.push(new Date(t).toISOString().slice(11, 16));
    return out;
  };

  it('Sydney 05/04/2026 (03:00 -> 02:00 at 04/04 16:00 UTC): 15-minute bars', () => {
    const day = (session: string) => trueBars(session, SYDNEY, '2026-04-04T11:00Z', '2026-04-04T19:00Z');
    expect(day('0100-0200')).toEqual(span('14:00', '15:00'));
    // a run that ends inside the repeated hour covers both passes
    expect(day('0130-0230')).toEqual([...span('14:30', '15:30'), ...span('16:00', '16:30')]);
    expect(day('0200-0230')).toEqual([...span('15:00', '15:30'), ...span('16:00', '16:30')]);
    // a run that ends on the wall time of the change is placed with the offset after it at both ends
    expect(day('0200-0300')).toEqual(span('16:00', '17:00'));
    expect(day('0100-0300')).toEqual(span('15:00', '17:00'));
    // a run that ends after it goes from the first pass to the end
    expect(day('0230-0330')).toEqual(span('15:30', '17:30'));
    expect(day('0200-0400')).toEqual(span('15:00', '18:00'));
  });

  it('New York 03/11/2024 (02:00 -> 01:00 at 06:00 UTC): 60-minute bars', () => {
    expect(time.inSession(at('2024-11-03T05:00Z'), '0100-0200', NY)).toBe(false);
    expect(time.inSession(at('2024-11-03T06:00Z'), '0100-0200', NY)).toBe(true);
    expect(time.inSession(at('2024-11-03T04:00Z'), '0000-0200', NY)).toBe(false);
    expect(time.inSession(at('2024-11-03T05:00Z'), '0000-0200', NY)).toBe(true);
  });

  it('away from a clock change it is the wall clock', () => {
    expect(time.inSession(at('2026-07-15T13:30Z'), '0930-1600', NY)).toBe(true);
    expect(time.inSession(at('2026-07-15T20:00Z'), '0930-1600', NY)).toBe(false);
  });
});

describe('the day before the clocks go back (#162)', () => {
  // Sydney, Friday-to-Saturday 04/04/2026 local (the change is on 05/04 at 03:00); 15-minute bars
  const bar = 900_000;
  const trueBars = (session: string, from: string, to: string, barMs?: number): string[] => {
    const out: string[] = [];
    for (let t = at(from); t < at(to); t += bar) if (time.inSession(t, session, SYDNEY, barMs)) out.push(new Date(t).toISOString().slice(11, 16));
    return out;
  };

  it('a run with an end or a start at 03:00 is also true one hour later, from one bar after its usual end', () => {
    // "0200-0300": 15:00 to 16:00 UTC, then 16:15 to 17:00 (not the bar of 16:00)
    expect(trueBars('0200-0300', '2026-04-03T14:00Z', '2026-04-03T19:00Z', bar)).toEqual(['15:00', '15:15', '15:30', '15:45', '16:15', '16:30', '16:45']);
    // "0300-0400": 16:00 to 17:00, then 17:15 to 18:00
    expect(trueBars('0300-0400', '2026-04-03T14:00Z', '2026-04-03T19:00Z', bar)).toEqual(['16:00', '16:15', '16:30', '16:45', '17:15', '17:30', '17:45']);
    // "0300-0330": 16:00 to 16:30, then 17:00 to 17:30
    expect(trueBars('0300-0330', '2026-04-03T14:00Z', '2026-04-03T19:00Z', bar)).toEqual(['16:00', '16:15', '17:00', '17:15']);
  });

  it('other runs are not repeated', () => {
    expect(trueBars('0230-0330', '2026-04-03T14:00Z', '2026-04-03T19:00Z', bar)).toEqual(['15:30', '15:45', '16:00', '16:15']);
    expect(trueBars('0400-0500', '2026-04-03T14:00Z', '2026-04-03T21:00Z', bar)).toEqual(['17:00', '17:15', '17:30', '17:45']);
  });

  it('without the bar duration the rule is not applied', () => {
    expect(trueBars('0200-0300', '2026-04-03T14:00Z', '2026-04-03T19:00Z')).toEqual(['15:00', '15:15', '15:30', '15:45']);
  });
});
