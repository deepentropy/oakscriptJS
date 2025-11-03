/**
 * Table namespace
 * Mirrors PineScript's table.* functions
 *
 * TODO: Implement table rendering and manipulation
 */

import { Table, simple_int, simple_string } from '../types';

/**
 * Creates a new table
 * @param position - Table position
 * @param columns - Number of columns
 * @param rows - Number of rows
 */
export function new_table(
  position: simple_string,
  columns: simple_int,
  rows: simple_int
): Table {
  return {
    id: Math.random().toString(36),
    columns,
    rows,
    position,
  };
}

// TODO: Add table functions
// - cell(), set_cell()
// - set_bgcolor(), set_frame_color()
// - set_border_color(), set_border_width()
// - clear()
// - etc.
