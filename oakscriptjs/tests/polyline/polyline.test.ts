import * as polyline from '../../src/polyline';
import * as chartPoint from '../../src/chartpoint';
import { xloc } from '../../src/types';

describe('Polyline Functions', () => {
  beforeEach(() => {
    // Reset state before each test
    polyline.clear_all();
    polyline.reset_id_counter();
  });

  describe('polyline.new', () => {
    it('should create a basic polyline with points', () => {
      const points = [
        chartPoint.from_index(0, 100),
        chartPoint.from_index(10, 120),
        chartPoint.from_index(20, 110),
      ];

      const pl = polyline.new(points);

      expect(pl.id).toBe('polyline_1');
      expect(pl.points.length).toBe(3);
      expect(pl.curved).toBe(false);
      expect(pl.closed).toBe(false);
      expect(pl.xloc).toBe('bar_index');
      expect(pl.line_color).toBe('#2196F3');
      expect(pl.fill_color).toBeNull();
      expect(pl.line_style).toBe('solid');
      expect(pl.line_width).toBe(1);
      expect(pl.force_overlay).toBe(false);
    });

    it('should create a closed polyline', () => {
      const points = [
        chartPoint.from_index(0, 100),
        chartPoint.from_index(10, 120),
        chartPoint.from_index(20, 110),
      ];

      const pl = polyline.new(points, false, true);

      expect(pl.closed).toBe(true);
    });

    it('should create a polyline with custom styling', () => {
      const points = [
        chartPoint.from_index(0, 100),
        chartPoint.from_index(10, 120),
      ];

      const pl = polyline.new(
        points,
        false,
        true,
        'bar_index',
        '#FF5722',
        'rgba(255, 87, 34, 0.3)',
        'dashed',
        2,
        true
      );

      expect(pl.line_color).toBe('#FF5722');
      expect(pl.fill_color).toBe('rgba(255, 87, 34, 0.3)');
      expect(pl.line_style).toBe('dashed');
      expect(pl.line_width).toBe(2);
      expect(pl.force_overlay).toBe(true);
    });

    it('should use xloc.bar_time mode', () => {
      const points = [
        chartPoint.from_time(1609459200000, 100),
        chartPoint.from_time(1609545600000, 120),
      ];

      const pl = polyline.new(points, false, false, 'bar_time');

      expect(pl.xloc).toBe('bar_time');
    });

    it('should use xloc constants', () => {
      const points = [
        chartPoint.from_index(0, 100),
        chartPoint.from_index(10, 120),
      ];

      const pl1 = polyline.new(points, false, false, xloc.bar_index);
      const pl2 = polyline.new(points, false, false, xloc.bar_time);

      expect(pl1.xloc).toBe('bar_index');
      expect(pl2.xloc).toBe('bar_time');
    });

    it('should handle empty points array', () => {
      const pl = polyline.new([]);

      expect(pl.points.length).toBe(0);
    });

    it('should handle single point', () => {
      const points = [chartPoint.from_index(0, 100)];

      const pl = polyline.new(points);

      expect(pl.points.length).toBe(1);
    });

    it('should create independent copy of points array', () => {
      const points = [
        chartPoint.from_index(0, 100),
        chartPoint.from_index(10, 120),
      ];

      const pl = polyline.new(points);

      // Modify original array
      points.push(chartPoint.from_index(20, 140));

      // Polyline should not be affected
      expect(pl.points.length).toBe(2);
    });

    it('should generate unique IDs', () => {
      const points = [chartPoint.from_index(0, 100)];

      const pl1 = polyline.new(points);
      const pl2 = polyline.new(points);
      const pl3 = polyline.new(points);

      expect(pl1.id).toBe('polyline_1');
      expect(pl2.id).toBe('polyline_2');
      expect(pl3.id).toBe('polyline_3');
    });

    it('should warn about curved polylines', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const points = [
        chartPoint.from_index(0, 100),
        chartPoint.from_index(10, 120),
      ];

      const pl = polyline.new(points, true);

      expect(consoleSpy).toHaveBeenCalledWith(
        'polyline.new(): curved polylines are not yet supported. Using straight-line connections.'
      );
      expect(pl.curved).toBe(true); // Flag is stored even though not supported

      consoleSpy.mockRestore();
    });

    it('should handle line_width less than 1', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const points = [chartPoint.from_index(0, 100)];

      const pl = polyline.new(
        points,
        false,
        false,
        'bar_index',
        '#2196F3',
        null,
        'solid',
        0 // Invalid width
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'polyline.new(): line_width must be at least 1. Using 1.'
      );
      expect(pl.line_width).toBe(1);

      consoleSpy.mockRestore();
    });

    it('should support dotted line style', () => {
      const points = [chartPoint.from_index(0, 100)];

      const pl = polyline.new(
        points,
        false,
        false,
        'bar_index',
        '#2196F3',
        null,
        'dotted'
      );

      expect(pl.line_style).toBe('dotted');
    });
  });

  describe('polyline.all (get_all)', () => {
    it('should return empty array initially', () => {
      expect(polyline.get_all().length).toBe(0);
    });

    it('should track created polylines', () => {
      const points = [chartPoint.from_index(0, 100)];

      polyline.new(points);
      polyline.new(points);
      polyline.new(points);

      expect(polyline.get_all().length).toBe(3);
    });

    it('should return a copy of the array', () => {
      const points = [chartPoint.from_index(0, 100)];

      polyline.new(points);

      const all1 = polyline.get_all();
      const all2 = polyline.get_all();

      // Should be different array references
      expect(all1).not.toBe(all2);

      // But contain same polylines
      expect(all1.length).toBe(all2.length);
      expect(all1[0].id).toBe(all2[0].id);
    });
  });

  describe('polyline.delete', () => {
    it('should delete a polyline', () => {
      const points = [chartPoint.from_index(0, 100)];

      const pl1 = polyline.new(points);
      const pl2 = polyline.new(points);

      expect(polyline.get_all().length).toBe(2);

      polyline.delete(pl1);

      expect(polyline.get_all().length).toBe(1);
      expect(polyline.get_all()[0].id).toBe(pl2.id);
    });

    it('should handle deleting non-existent polyline', () => {
      const points = [chartPoint.from_index(0, 100)];

      const pl = polyline.new(points);
      polyline.delete(pl);

      // Delete again - should not throw
      expect(() => polyline.delete(pl)).not.toThrow();
    });

    it('should not affect other polylines', () => {
      const points = [chartPoint.from_index(0, 100)];

      const pl1 = polyline.new(points);
      const pl2 = polyline.new(points);
      const pl3 = polyline.new(points);

      polyline.delete(pl2);

      const all = polyline.get_all();
      expect(all.length).toBe(2);
      expect(all.map((p) => p.id)).toContain(pl1.id);
      expect(all.map((p) => p.id)).toContain(pl3.id);
      expect(all.map((p) => p.id)).not.toContain(pl2.id);
    });
  });

  describe('polyline.clear_all', () => {
    it('should clear all polylines', () => {
      const points = [chartPoint.from_index(0, 100)];

      polyline.new(points);
      polyline.new(points);
      polyline.new(points);

      expect(polyline.get_all().length).toBe(3);

      polyline.clear_all();

      expect(polyline.get_all().length).toBe(0);
    });
  });

  describe('Real-world use cases', () => {
    it('should create a trend channel', () => {
      // Upper line
      const upperPoints = [
        chartPoint.from_index(0, 110),
        chartPoint.from_index(50, 160),
      ];

      // Lower line
      const lowerPoints = [
        chartPoint.from_index(0, 90),
        chartPoint.from_index(50, 140),
      ];

      const upperLine = polyline.new(upperPoints, false, false, 'bar_index', '#2196F3');
      const lowerLine = polyline.new(lowerPoints, false, false, 'bar_index', '#2196F3');

      expect(upperLine.points[0].price).toBe(110);
      expect(lowerLine.points[0].price).toBe(90);
    });

    it('should create a closed polygon with fill', () => {
      const points = [
        chartPoint.from_index(0, 100),
        chartPoint.from_index(10, 120),
        chartPoint.from_index(20, 120),
        chartPoint.from_index(30, 100),
      ];

      const polygon = polyline.new(
        points,
        false,
        true,
        'bar_index',
        '#4CAF50',
        'rgba(76, 175, 80, 0.2)'
      );

      expect(polygon.closed).toBe(true);
      expect(polygon.fill_color).toBe('rgba(76, 175, 80, 0.2)');
    });

    it('should create a triangle pattern', () => {
      const points = [
        chartPoint.from_index(0, 100),
        chartPoint.from_index(10, 130),
        chartPoint.from_index(20, 100),
      ];

      const triangle = polyline.new(
        points,
        false,
        true, // closed to form a triangle
        'bar_index',
        '#E91E63',
        'rgba(233, 30, 99, 0.1)'
      );

      expect(triangle.points.length).toBe(3);
      expect(triangle.closed).toBe(true);
    });
  });

  describe('Polyline immutability', () => {
    it('should have readonly properties', () => {
      const points = [chartPoint.from_index(0, 100)];
      const pl = polyline.new(points);

      // TypeScript will prevent modification at compile time
      // Verifying the object structure
      expect(pl.id).toBeDefined();
      expect(pl.points).toBeDefined();
      expect(Array.isArray(pl.points)).toBe(true);
    });
  });
});
