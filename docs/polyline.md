# Polyline Documentation

This document describes the polyline functionality in OakScriptJS, including chart points and polyline creation.

## Overview

Polylines allow connecting multiple points with line segments, enabling complex chart drawings like trend channels, patterns, and custom shapes. This implementation focuses on basic polylines (straight lines).

## Chart Points

Chart points represent specific locations on a chart with time, index, and price coordinates.

### ChartPoint Interface

```typescript
interface ChartPoint {
  readonly time: number | null;   // UNIX timestamp in milliseconds
  readonly index: number | null;  // Bar index
  readonly price: number;         // Y-axis price value
}
```

### Creating Chart Points

```typescript
import { chartPoint } from '@deepentropy/oakscriptjs';

// Create a point with all coordinates
const point1 = chartPoint.new(1609459200000, 100, 150.5);

// Create a point from bar index and price (most common)
const point2 = chartPoint.from_index(50, 120);

// Create a point from timestamp and price
const point3 = chartPoint.from_time(1609459200000, 130);

// Copy a point
const point4 = chartPoint.copy(point2);
```

### chartPoint Functions

| Function | Description |
|----------|-------------|
| `chartPoint.new(time, index, price)` | Create a point with all coordinates |
| `chartPoint.from_time(time, price)` | Create a point from timestamp and price |
| `chartPoint.from_index(index, price)` | Create a point from bar index and price |
| `chartPoint.copy(point)` | Create a copy of a chart point |

## Polylines

Polylines connect multiple chart points with line segments.

### Polyline Interface

```typescript
interface Polyline {
  readonly id: string;
  readonly points: readonly ChartPoint[];
  readonly curved: boolean;
  readonly closed: boolean;
  readonly xloc: 'bar_index' | 'bar_time';
  readonly line_color: string | number;
  readonly fill_color: string | number | null;
  readonly line_style: 'solid' | 'dotted' | 'dashed';
  readonly line_width: number;
  readonly force_overlay: boolean;
}
```

### Creating Polylines

```typescript
import { chartPoint, polyline, xloc } from '@deepentropy/oakscriptjs';

// Create points
const points = [
  chartPoint.from_index(0, 100),
  chartPoint.from_index(10, 120),
  chartPoint.from_index(20, 110),
  chartPoint.from_index(30, 130)
];

// Create a basic polyline
const myPolyline = polyline.new(points);

// Create a polyline with custom styling
const styledPolyline = polyline.new(
  points,
  false,           // curved (not supported in basic version)
  false,           // closed
  xloc.bar_index,  // xloc
  '#2196F3',       // line_color
  null,            // fill_color
  'solid',         // line_style
  2                // line_width
);

// Create a closed polygon with fill
const polygon = polyline.new(
  points,
  false,
  true,            // closed = true
  xloc.bar_index,
  '#FF5722',
  'rgba(255, 87, 34, 0.3)',  // semi-transparent fill
  'solid',
  1
);
```

### polyline Functions

| Function | Description |
|----------|-------------|
| `polyline.new(points, curved?, closed?, xloc?, line_color?, fill_color?, line_style?, line_width?, force_overlay?)` | Create a new polyline |
| `polyline.delete(polyline)` | Delete a polyline |
| `polyline.get_all()` | Get all active polylines |
| `polyline.clear_all()` | Clear all polylines (helper function) |

### polyline.new Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `points` | `ChartPoint[]` | required | Array of chart.point objects to connect |
| `curved` | `boolean` | `false` | If true, use curved line segments (NOT YET SUPPORTED) |
| `closed` | `boolean` | `false` | If true, connect first point to last point |
| `xloc` | `string` | `'bar_index'` | X-coordinate mode: `xloc.bar_index` or `xloc.bar_time` |
| `line_color` | `string` | `'#2196F3'` | Color of line segments |
| `fill_color` | `string \| null` | `null` | Fill color for closed polylines |
| `line_style` | `string` | `'solid'` | Line style: 'solid', 'dotted', 'dashed' |
| `line_width` | `number` | `1` | Line width in pixels |
| `force_overlay` | `boolean` | `false` | Force display on main pane |

## xloc Constants

```typescript
import { xloc } from '@deepentropy/oakscriptjs';

xloc.bar_index  // X-coordinates are bar indices
xloc.bar_time   // X-coordinates are UNIX timestamps in milliseconds
```

## Examples

### Trend Channel

```typescript
import { chartPoint, polyline } from '@deepentropy/oakscriptjs';

// Upper channel line
const upperPoints = [
  chartPoint.from_index(0, 110),
  chartPoint.from_index(50, 160),
];

// Lower channel line
const lowerPoints = [
  chartPoint.from_index(0, 90),
  chartPoint.from_index(50, 140),
];

const upperLine = polyline.new(upperPoints, false, false, 'bar_index', '#2196F3');
const lowerLine = polyline.new(lowerPoints, false, false, 'bar_index', '#2196F3');
```

### Triangle Pattern

```typescript
import { chartPoint, polyline } from '@deepentropy/oakscriptjs';

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
  'rgba(233, 30, 99, 0.1)' // semi-transparent fill
);
```

### Managing Polylines

```typescript
import { polyline } from '@deepentropy/oakscriptjs';

// Check total polylines
console.log('Total polylines:', polyline.get_all().length);

// Iterate through all polylines
for (const p of polyline.get_all()) {
  console.log('Polyline ID:', p.id, 'Points:', p.points.length);
}

// Delete a specific polyline
polyline.delete(myPolyline);

// Clear all polylines (useful for reset)
polyline.clear_all();
```

## Implementation Notes

1. **Curved polylines**: The `curved` parameter is accepted but currently logs a warning as curved lines are not yet supported. Straight-line connections are used instead.

2. **Immutability**: ChartPoint and Polyline objects have readonly properties to encourage immutable patterns.

3. **Memory management**: Use `polyline.delete()` to remove polylines you no longer need. The `polyline.clear_all()` helper function is useful for resetting state.

4. **ID generation**: Polylines are automatically assigned unique IDs.

5. **Validation**: 
   - `line_width` values less than 1 are automatically corrected to 1
   - Points array can be empty or contain a single point, but at least 2 points are needed for visible line segments

## Future Enhancements

The following features may be added in future iterations:

- Curved polylines (Catmull-Rom or Bézier splines)
- Setter functions: `set_points()`, `set_line_color()`, etc.
- Getter functions: `get_line_color()`, `get_points()`, etc.
- Integration with chart rendering engine
