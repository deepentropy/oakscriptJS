import { math } from '../../src';

describe('math namespace', () => {
  describe('math.abs', () => {
    it('should return absolute value', () => {
      expect(math.abs(-5)).toBe(5);
      expect(math.abs(5)).toBe(5);
      expect(math.abs(0)).toBe(0);
    });
  });

  describe('math.round', () => {
    it('should round to nearest integer', () => {
      expect(math.round(4.5)).toBe(5);
      expect(math.round(4.4)).toBe(4);
      expect(math.round(-4.5)).toBe(-4);
    });

    it('should round to specified precision', () => {
      expect(math.round(4.567, 2)).toBe(4.57);
      expect(math.round(4.564, 2)).toBe(4.56);
      expect(math.round(4.5, 0)).toBe(5);
    });
  });

  describe('math.max', () => {
    it('should return maximum value', () => {
      expect(math.max(1, 2, 3, 4, 5)).toBe(5);
      expect(math.max(-1, -2, -3)).toBe(-1);
      expect(math.max(0)).toBe(0);
    });
  });

  describe('math.min', () => {
    it('should return minimum value', () => {
      expect(math.min(1, 2, 3, 4, 5)).toBe(1);
      expect(math.min(-1, -2, -3)).toBe(-3);
      expect(math.min(0)).toBe(0);
    });
  });

  describe('math.avg', () => {
    it('should calculate average', () => {
      expect(math.avg(1, 2, 3, 4, 5)).toBe(3);
      expect(math.avg(10, 20)).toBe(15);
    });
  });

  describe('math.sqrt', () => {
    it('should calculate square root', () => {
      expect(math.sqrt(4)).toBe(2);
      expect(math.sqrt(9)).toBe(3);
      expect(math.sqrt(2)).toBeCloseTo(1.414, 3);
    });
  });

  describe('math.pow', () => {
    it('should calculate power', () => {
      expect(math.pow(2, 3)).toBe(8);
      expect(math.pow(5, 2)).toBe(25);
      expect(math.pow(10, 0)).toBe(1);
    });
  });
});
