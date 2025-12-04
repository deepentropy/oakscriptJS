import * as chartPoint from '../../src/chartpoint';
import { ChartPoint } from '../../src/types';

describe('chartPoint Functions', () => {
  describe('chartPoint.new', () => {
    it('should create a point with all coordinates', () => {
      const point = chartPoint.new(1609459200000, 100, 150.5);

      expect(point.time).toBe(1609459200000);
      expect(point.index).toBe(100);
      expect(point.price).toBe(150.5);
    });

    it('should create a point with only index (time is null)', () => {
      const point = chartPoint.new(null, 50, 200);

      expect(point.time).toBeNull();
      expect(point.index).toBe(50);
      expect(point.price).toBe(200);
    });

    it('should create a point with only time (index is null)', () => {
      const point = chartPoint.new(1609459200000, null, 175);

      expect(point.time).toBe(1609459200000);
      expect(point.index).toBeNull();
      expect(point.price).toBe(175);
    });

    it('should create a point with both null (only price)', () => {
      const point = chartPoint.new(null, null, 100);

      expect(point.time).toBeNull();
      expect(point.index).toBeNull();
      expect(point.price).toBe(100);
    });

    it('should handle negative price values', () => {
      const point = chartPoint.new(null, 10, -50.25);

      expect(point.price).toBe(-50.25);
    });

    it('should handle zero values', () => {
      const point = chartPoint.new(0, 0, 0);

      expect(point.time).toBe(0);
      expect(point.index).toBe(0);
      expect(point.price).toBe(0);
    });
  });

  describe('chartPoint.from_time', () => {
    it('should create a point from time and price', () => {
      const point = chartPoint.from_time(1609459200000, 150.5);

      expect(point.time).toBe(1609459200000);
      expect(point.index).toBeNull();
      expect(point.price).toBe(150.5);
    });

    it('should handle various timestamps', () => {
      const point1 = chartPoint.from_time(0, 100);
      const point2 = chartPoint.from_time(1700000000000, 200);

      expect(point1.time).toBe(0);
      expect(point2.time).toBe(1700000000000);
    });
  });

  describe('chartPoint.from_index', () => {
    it('should create a point from index and price', () => {
      const point = chartPoint.from_index(50, 150.5);

      expect(point.time).toBeNull();
      expect(point.index).toBe(50);
      expect(point.price).toBe(150.5);
    });

    it('should handle negative bar indices', () => {
      const point = chartPoint.from_index(-10, 100);

      expect(point.index).toBe(-10);
    });

    it('should handle zero index', () => {
      const point = chartPoint.from_index(0, 100);

      expect(point.index).toBe(0);
    });
  });

  describe('chartPoint.copy', () => {
    it('should create an independent copy', () => {
      const original = chartPoint.from_index(10, 100);
      const copied = chartPoint.copy(original);

      expect(copied.time).toBe(original.time);
      expect(copied.index).toBe(original.index);
      expect(copied.price).toBe(original.price);
    });

    it('should copy point with all coordinates', () => {
      const original = chartPoint.new(1609459200000, 50, 150);
      const copied = chartPoint.copy(original);

      expect(copied.time).toBe(1609459200000);
      expect(copied.index).toBe(50);
      expect(copied.price).toBe(150);
    });

    it('should create a separate object', () => {
      const original = chartPoint.from_index(10, 100);
      const copied = chartPoint.copy(original);

      // They should not be the same object reference
      expect(copied).not.toBe(original);
    });
  });

  describe('ChartPoint immutability', () => {
    it('should have readonly properties', () => {
      const point: ChartPoint = chartPoint.from_index(10, 100);

      // TypeScript will prevent modification at compile time
      // At runtime, the object is a plain object with readonly intent
      expect(point.time).toBeNull();
      expect(point.index).toBe(10);
      expect(point.price).toBe(100);
    });
  });

  describe('Real-world use cases', () => {
    it('should create points for a trend line', () => {
      const points = [
        chartPoint.from_index(0, 100),
        chartPoint.from_index(10, 120),
        chartPoint.from_index(20, 110),
        chartPoint.from_index(30, 130),
      ];

      expect(points.length).toBe(4);
      expect(points[0].index).toBe(0);
      expect(points[0].price).toBe(100);
      expect(points[3].index).toBe(30);
      expect(points[3].price).toBe(130);
    });

    it('should create points using timestamps', () => {
      const baseTime = 1609459200000; // 2021-01-01
      const hourMs = 3600000;

      const points = [
        chartPoint.from_time(baseTime, 100),
        chartPoint.from_time(baseTime + hourMs, 105),
        chartPoint.from_time(baseTime + 2 * hourMs, 110),
      ];

      expect(points.length).toBe(3);
      expect(points[0].time).toBe(baseTime);
      expect(points[1].time).toBe(baseTime + hourMs);
      expect(points[2].time).toBe(baseTime + 2 * hourMs);
    });
  });
});
