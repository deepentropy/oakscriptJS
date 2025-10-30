/**
 * Matrix namespace
 * Mirrors PineScript's matrix.* functions
 *
 * TODO: Implement matrix operations
 */

import { PineMatrix, int, float, simple_int } from '../types';

/**
 * Creates a new matrix
 * @param rows - Number of rows
 * @param columns - Number of columns
 * @param initial_value - Initial value for all elements
 */
export function new_matrix<T>(
  rows: simple_int,
  columns: simple_int,
  initial_value?: T
): PineMatrix<T> {
  const data: T[][] = [];
  for (let i = 0; i < rows; i++) {
    const row: T[] = [];
    for (let j = 0; j < columns; j++) {
      row.push(initial_value as T);
    }
    data.push(row);
  }
  return { rows, columns, data };
}

// TODO: Add more matrix functions
// - get(), set()
// - add_row(), add_col()
// - remove_row(), remove_col()
// - transpose()
// - mult()
// - etc.
