/**
 * Table namespace
 * Functions for creating and filling table drawing objects.
 *
 * @remarks
 * A table is drawn at a fixed position of the pane (`position.*`), not at a bar. Tables have no getters in
 * PineScript; the script API returns the live tables in `result.tables`.
 *
 * PineScript rules:
 * - `table.cell` defines a cell: the arguments it does not give get their default, a previous definition of the
 *   cell is replaced
 * - `table.cell_set_*` changes one property of a cell (a cell that was not defined is created)
 * - a column or row outside the table is a runtime error
 * - a deleted table is `na`: its functions do nothing
 *
 * @version 6
 */

import { all as allDrawings, isDeleted, register, remove } from '../drawing/registry.js';
import type { Table, TableCell, color } from '../types/index.js';

type TablePosition = Table['position'];
type HAlign = 'left' | 'center' | 'right';
type VAlign = 'top' | 'center' | 'bottom';
type FontFamily = 'default' | 'monospace';

/**
 * Creates a new table (PineScript `table.new`).
 *
 * @example
 * ```typescript
 * const t = table.new(position.top_right, 2, 3, '#131722', '#787B86', 1);
 * table.cell(t, 0, 0, 'RSI', 0, 0, '#FFFFFF');
 * ```
 */
export function new_table(
  position: TablePosition,
  columns: number,
  rows: number,
  bgcolor?: color,
  frame_color?: color,
  frame_width?: number,
  border_color?: color,
  border_width?: number,
  force_overlay?: boolean
): Table {
  return register('table', {
    position,
    columns,
    rows,
    bgcolor,
    frame_color,
    frame_width,
    border_color,
    border_width,
    force_overlay: force_overlay ?? false,
    cells: new Map(),
    merges: [],
  });
}

function checkCell(caller: string, id: Table, column: number, row: number): void {
  if (!(column >= 0 && column < id.columns && row >= 0 && row < id.rows)) {
    throw new RangeError(
      `${caller}: column ${column}, row ${row} is outside the table (${id.columns} columns, ${id.rows} rows).`
    );
  }
}

const key = (column: number, row: number): string => `${column},${row}`;

/** The cell at column / row, created when it was not defined. */
function cellOf(caller: string, id: Table, column: number, row: number): TableCell {
  checkCell(caller, id, column, row);
  const cells = (id.cells ??= new Map());
  let cell = cells.get(key(column, row));
  if (!cell) cells.set(key(column, row), (cell = { text: '' }));
  return cell;
}

/**
 * Defines a cell (PineScript `table.cell`): its text and properties. Omitted properties get their default.
 */
export function cell(
  table_id: Table,
  column: number,
  row: number,
  text?: string,
  width?: number,
  height?: number,
  text_color?: color,
  text_halign?: HAlign,
  text_valign?: VAlign,
  text_size?: string | number,
  bgcolor?: color,
  tooltip?: string,
  text_font_family?: FontFamily,
  text_formatting?: number
): void {
  if (isDeleted(table_id)) return;
  checkCell('table.cell()', table_id, column, row);
  (table_id.cells ??= new Map()).set(key(column, row), {
    text: text ?? '',
    width,
    height,
    text_color,
    text_halign,
    text_valign,
    text_size,
    bgcolor,
    tooltip,
    text_font_family,
    text_formatting,
  });
}

function setCell<K extends keyof TableCell>(name: string, field: K) {
  return (table_id: Table, column: number, row: number, value: TableCell[K]): void => {
    if (isDeleted(table_id)) return;
    cellOf(`table.${name}()`, table_id, column, row)[field] = value;
  };
}

/** Sets the text of a cell. */
export const cell_set_text = setCell('cell_set_text', 'text');
/** Sets the width of a cell (% of the chart width; 0 fits the text). */
export const cell_set_width = setCell('cell_set_width', 'width');
/** Sets the height of a cell (% of the chart height; 0 fits the text). */
export const cell_set_height = setCell('cell_set_height', 'height');
/** Sets the text colour of a cell. */
export const cell_set_text_color = setCell('cell_set_text_color', 'text_color');
/** Sets the horizontal text alignment of a cell. */
export const cell_set_text_halign = setCell('cell_set_text_halign', 'text_halign');
/** Sets the vertical text alignment of a cell. */
export const cell_set_text_valign = setCell('cell_set_text_valign', 'text_valign');
/** Sets the text size of a cell. */
export const cell_set_text_size = setCell('cell_set_text_size', 'text_size');
/** Sets the background colour of a cell. */
export const cell_set_bgcolor = setCell('cell_set_bgcolor', 'bgcolor');
/** Sets the tooltip of a cell. */
export const cell_set_tooltip = setCell('cell_set_tooltip', 'tooltip');
/** Sets the font family of a cell. */
export const cell_set_text_font_family = setCell('cell_set_text_font_family', 'text_font_family');
/** Sets the text formatting of a cell (`text.format_*` flags). */
export const cell_set_text_formatting = setCell('cell_set_text_formatting', 'text_formatting');

/**
 * Merges the cells from start_column / start_row to end_column / end_row (PineScript `table.merge_cells`). The
 * merged cell shows the content of the start cell.
 */
export function merge_cells(
  table_id: Table,
  start_column: number,
  start_row: number,
  end_column: number,
  end_row: number
): void {
  if (isDeleted(table_id)) return;
  checkCell('table.merge_cells()', table_id, start_column, start_row);
  checkCell('table.merge_cells()', table_id, end_column, end_row);
  if (end_column < start_column || end_row < start_row) {
    throw new RangeError('table.merge_cells(): the end cell is before the start cell.');
  }
  (table_id.merges ??= []).push({ start_column, start_row, end_column, end_row });
}

/**
 * Removes the cells from start_column / start_row to end_column / end_row (PineScript `table.clear`; default end:
 * the start cell), and the merges that start in that range.
 */
export function clear(
  table_id: Table,
  start_column: number,
  start_row: number,
  end_column: number = start_column,
  end_row: number = start_row
): void {
  if (isDeleted(table_id)) return;
  checkCell('table.clear()', table_id, start_column, start_row);
  checkCell('table.clear()', table_id, end_column, end_row);
  const inside = (column: number, row: number): boolean =>
    column >= start_column && column <= end_column && row >= start_row && row <= end_row;
  for (let column = start_column; column <= end_column; column++) {
    for (let row = start_row; row <= end_row; row++) table_id.cells?.delete(key(column, row));
  }
  if (table_id.merges) table_id.merges = table_id.merges.filter((m) => !inside(m.start_column, m.start_row));
}

function setTable<K extends keyof Table>(field: K) {
  return (table_id: Table, value: Table[K]): void => {
    if (isDeleted(table_id)) return;
    table_id[field] = value;
  };
}

/** Moves the table to another position (`position.*`). */
export const set_position = setTable('position');
/** Sets the background colour of the table. */
export const set_bgcolor = setTable('bgcolor');
/** Sets the colour of the outer frame. */
export const set_frame_color = setTable('frame_color');
/** Sets the width of the outer frame. */
export const set_frame_width = setTable('frame_width');
/** Sets the colour of the cell borders. */
export const set_border_color = setTable('border_color');
/** Sets the width of the cell borders. */
export const set_border_width = setTable('border_width');

/** Deletes the table (PineScript `table.delete`). */
export function delete_table(table_id: Table): void {
  remove('table', table_id);
}

/** All live tables, in creation order (PineScript `table.all`). A new array. */
export function all(): Table[] {
  return allDrawings('table');
}

// Alias to match PineScript API
export { new_table as new };
export { delete_table as delete };
