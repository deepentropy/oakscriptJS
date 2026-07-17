/**
 * Minimal reference renderer for the Tier 1 outputs on lightweight-charts v5:
 * - result.markers  → createSeriesMarkers on the main candlestick series
 * - result.bgcolors → a series primitive drawing full-height rectangles
 */
import {
  createSeriesMarkers,
  type ISeriesApi,
  type ISeriesPrimitive,
  type SeriesAttachedParameter,
  type SeriesType,
  type Time,
  type UTCTimestamp,
  type SeriesMarker,
} from 'lightweight-charts';
import type { MarkerData, BarColorData } from '../../../src/script';

const POSITION_MAP: Record<string, SeriesMarker<Time>['position']> = {
  abovebar: 'aboveBar',
  belowbar: 'belowBar',
  top: 'aboveBar',
  bottom: 'belowBar',
  absolute: 'inBar',
};

function shapeOf(m: MarkerData): SeriesMarker<Time>['shape'] {
  switch (m.style) {
    case 'triangleup':
    case 'arrowup':
      return 'arrowUp';
    case 'triangledown':
    case 'arrowdown':
      return 'arrowDown';
    case 'circle':
    case 'labelup':
    case 'labeldown':
      return 'circle';
    default:
      return 'square';
  }
}

/** Maps MarkerData[] to lightweight-charts markers (merged and time-sorted). */
export function applyMarkers(series: ISeriesApi<SeriesType>, markers: MarkerData[]): void {
  const mapped: SeriesMarker<Time>[] = markers
    .map((m) => ({
      time: m.time as UTCTimestamp,
      position: POSITION_MAP[m.location] ?? 'aboveBar',
      shape: shapeOf(m),
      color: m.color ?? '#2962FF',
      text: m.text ?? m.char,
    }))
    .sort((a, b) => (a.time as number) - (b.time as number));
  createSeriesMarkers(series, mapped);
}

/** Structural view of lightweight-charts' CanvasRenderingTarget2D (fancy-canvas). */
interface BitmapTarget {
  useBitmapCoordinateSpace(
    fn: (scope: {
      context: CanvasRenderingContext2D;
      horizontalPixelRatio: number;
      bitmapSize: { width: number; height: number };
    }) => void
  ): void;
}

/** Series primitive that paints result.bgcolors as full-height bar backgrounds. */
export class BgColorPrimitive implements ISeriesPrimitive<Time> {
  private param: SeriesAttachedParameter<Time> | null = null;

  constructor(private bgcolors: BarColorData[]) {}

  attached(param: SeriesAttachedParameter<Time>): void {
    this.param = param;
  }

  detached(): void {
    this.param = null;
  }

  paneViews() {
    return [
      {
        renderer: () => ({
          draw: (target: unknown) => {
            const param = this.param;
            if (!param) return;
            const timeScale = param.chart.timeScale();
            const spacing = timeScale.options().barSpacing;
            (target as BitmapTarget).useBitmapCoordinateSpace((scope) => {
              const ctx = scope.context;
              const ratio = scope.horizontalPixelRatio;
              for (const bg of this.bgcolors) {
                const x = timeScale.timeToCoordinate(bg.time as UTCTimestamp);
                if (x === null) continue;
                ctx.fillStyle = bg.color;
                ctx.fillRect((x - spacing / 2) * ratio, 0, spacing * ratio, scope.bitmapSize.height);
              }
            });
          },
        }),
      },
    ];
  }
}
