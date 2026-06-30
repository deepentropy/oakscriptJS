import { color, str } from '../src';

describe('New Functions', () => {
  describe('color.new (alias)', () => {
    it('should work as alias for new_color', () => {
      const redColor = color.rgb(255, 0, 0);
      const transparentRed = color.new(redColor, 50);

      expect(transparentRed).toContain('rgba');
      expect(transparentRed).toContain('255');
      expect(transparentRed).toContain('0.5'); // 50% transparency = 0.5 alpha
    });

    it('should create fully transparent color', () => {
      const blueColor = color.rgb(0, 0, 255);
      const invisible = color.new(blueColor, 100);

      expect(invisible).toContain('0'); // alpha = 0
    });

    it('should create fully opaque color', () => {
      const greenColor = color.rgb(0, 255, 0);
      const opaque = color.new(greenColor, 0);

      expect(opaque).toBe('rgb(0, 255, 0)'); // No alpha channel
    });
  });

  describe('str.replace_all', () => {
    it('should replace all occurrences', () => {
      const result = str.replace_all('hello world hello', 'hello', 'hi');
      expect(result).toBe('hi world hi');
    });

    it('should replace special characters', () => {
      const result = str.replace_all('a-b-c-d', '-', '_');
      expect(result).toBe('a_b_c_d');
    });

    it('should return original if no match', () => {
      const result = str.replace_all('test', 'x', 'y');
      expect(result).toBe('test');
    });

    it('should handle empty replacement', () => {
      const result = str.replace_all('a1b2c3', '1', '');
      expect(result).toBe('ab2c3'); // Only removes '1'
    });
  });

  describe('str.format_time', () => {
    it('should format date as "dd MMM yyyy"', () => {
      const timestamp = Date.UTC(2021, 0, 1, 0, 0, 0); // Jan 1, 2021
      const result = str.format_time(timestamp, 'dd MMM yyyy');
      expect(result).toBe('01 Jan 2021');
    });

    it('should format full datetime', () => {
      const timestamp = Date.UTC(2021, 0, 1, 15, 30, 45); // Jan 1, 2021 15:30:45
      const result = str.format_time(timestamp, 'yyyy-MM-dd HH:mm:ss');
      expect(result).toBe('2021-01-01 15:30:45');
    });

    it('should format with month names', () => {
      const timestamp = Date.UTC(2021, 2, 15); // March 15, 2021
      const result = str.format_time(timestamp, 'MMM d, yyyy');
      expect(result).toBe('Mar 15, 2021');
    });

    it('should format with full month name', () => {
      const timestamp = Date.UTC(2021, 11, 25); // December 25, 2021
      const result = str.format_time(timestamp, 'MMMM dd, yyyy');
      expect(result).toBe('December 25, 2021');
    });

    it('should format 12-hour time with AM/PM', () => {
      const timestamp1 = Date.UTC(2021, 0, 1, 9, 15, 0); // 9:15 AM
      const result1 = str.format_time(timestamp1, 'hh:mm a');
      expect(result1).toBe('09:15 AM');

      const timestamp2 = Date.UTC(2021, 0, 1, 21, 30, 0); // 9:30 PM
      const result2 = str.format_time(timestamp2, 'hh:mm a');
      expect(result2).toBe('09:30 PM');
    });

    it('should format 24-hour time', () => {
      const timestamp = Date.UTC(2021, 0, 1, 23, 59, 59);
      const result = str.format_time(timestamp, 'HH:mm:ss');
      expect(result).toBe('23:59:59');
    });

    it('should handle 2-digit year', () => {
      const timestamp = Date.UTC(2024, 5, 10); // June 10, 2024
      const result = str.format_time(timestamp, 'MM/dd/yy');
      expect(result).toBe('06/10/24');
    });

    it('should handle single-digit formats', () => {
      const timestamp = Date.UTC(2021, 0, 5, 7, 8, 9); // Jan 5, 2021 07:08:09
      const result = str.format_time(timestamp, 'M/d/yyyy H:m:s');
      expect(result).toBe('1/5/2021 7:8:9');
    });
  });
});
