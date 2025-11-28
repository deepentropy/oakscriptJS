/**
 * Matrix namespace
 * Mirrors PineScript's matrix.* functions
 */

import { PineMatrix, PineArray, simple_int, int, bool, float } from '../types';

/**
 * Creates a new matrix
 *
 * @param rows - Number of rows
 * @param columns - Number of columns
 * @param initial_value - Initial value for all elements
 * @returns A new matrix object
 *
 * @example
 * ```typescript
 * // Create a 2x3 matrix filled with zeros
 * const m = matrix.new_matrix(2, 3, 0);
 *
 * // Create a 3x3 identity-like matrix
 * const m2 = matrix.new_matrix(3, 3, 1);
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.new<type> | PineScript matrix.new<type>}
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

/**
 * Get element at position
 *
 * The function returns the element with the specified index of the matrix.
 *
 * @param id - A matrix object
 * @param row - Index of the required row
 * @param column - Index of the required column
 * @returns The value of the element at the row and column index
 *
 * @remarks
 * Indexing of the rows and columns starts at zero.
 *
 * @example
 * ```typescript
 * // Create a 2x3 matrix with value 5
 * const m = matrix.new_matrix(2, 3, 5);
 *
 * // Get element at row 0, column 0
 * const x = matrix.get(m, 0, 0); // Returns: 5
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.get | PineScript matrix.get}
 */
export function get<T>(id: PineMatrix<T>, row: simple_int, column: simple_int): T {
  return id.data[row]![column]!;
}

/**
 * Set element at position
 *
 * The function assigns value to the element at the row and column of the matrix.
 *
 * @param id - A matrix object
 * @param row - The row index of the element to be modified
 * @param column - The column index of the element to be modified
 * @param value - The new value to be set
 *
 * @remarks
 * Indexing of the rows and columns starts at zero.
 *
 * @example
 * ```typescript
 * // Create a 2x3 matrix with value 4
 * const m = matrix.new_matrix(2, 3, 4);
 *
 * // Replace value at row 0, column 1 with 3
 * matrix.set(m, 0, 1, 3);
 *
 * // Now m[0][1] === 3
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.set | PineScript matrix.set}
 */
export function set<T>(id: PineMatrix<T>, row: simple_int, column: simple_int, value: T): void {
  id.data[row]![column] = value;
}

/**
 * Get number of rows
 *
 * The function returns the number of rows in the matrix.
 *
 * @param id - A matrix object
 * @returns The number of rows in the matrix
 *
 * @example
 * ```typescript
 * // Create a 2x6 matrix
 * const m = matrix.new_matrix(2, 6, 0);
 *
 * // Get the quantity of rows
 * const x = matrix.rows(m); // Returns: 2
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.rows | PineScript matrix.rows}
 */
export function rows<T>(id: PineMatrix<T>): int {
  return id.rows;
}

/**
 * Get number of columns
 *
 * The function returns the number of columns in the matrix.
 *
 * @param id - A matrix object
 * @returns The number of columns in the matrix
 *
 * @example
 * ```typescript
 * // Create a 2x6 matrix
 * const m = matrix.new_matrix(2, 6, 0);
 *
 * // Get the quantity of columns
 * const x = matrix.columns(m); // Returns: 6
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.columns | PineScript matrix.columns}
 */
export function columns<T>(id: PineMatrix<T>): int {
  return id.columns;
}

/**
 * Get total number of elements
 *
 * The function returns the total number of all matrix elements.
 *
 * @param id - A matrix object
 * @returns The total number of elements (rows * columns)
 *
 * @example
 * ```typescript
 * // Create a 3x4 matrix
 * const m = matrix.new_matrix(3, 4, 0);
 *
 * // Get total element count
 * const count = matrix.elements_count(m); // Returns: 12
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.elements_count | PineScript matrix.elements_count}
 */
export function elements_count<T>(id: PineMatrix<T>): int {
  return id.rows * id.columns;
}

/**
 * Get row as array
 *
 * The function creates a one-dimensional array from the elements of a matrix row.
 *
 * @param id - A matrix object
 * @param row_index - Index of the required row
 * @returns An array containing the values of the specified row
 *
 * @remarks
 * Indexing of rows starts at 0.
 * Returns a copy of the row data.
 *
 * @example
 * ```typescript
 * // Create a 2x3 matrix
 * const m = matrix.new_matrix(2, 3, 5);
 * matrix.set(m, 0, 0, 1);
 * matrix.set(m, 0, 1, 2);
 * matrix.set(m, 0, 2, 3);
 *
 * // Get the first row as an array
 * const a = matrix.row(m, 0); // Returns: [1, 2, 3]
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.row | PineScript matrix.row}
 */
export function row<T>(id: PineMatrix<T>, row_index: simple_int): PineArray<T> {
  return [...id.data[row_index]!] as PineArray<T>;
}

/**
 * Get column as array
 *
 * The function creates a one-dimensional array from the elements of a matrix column.
 *
 * @param id - A matrix object
 * @param column_index - Index of the required column
 * @returns An array containing the values of the specified column
 *
 * @remarks
 * Indexing of columns starts at 0.
 * Returns a copy of the column data.
 *
 * @example
 * ```typescript
 * // Create a 3x2 matrix
 * const m = matrix.new_matrix(3, 2, 0);
 * matrix.set(m, 0, 0, 1);
 * matrix.set(m, 1, 0, 2);
 * matrix.set(m, 2, 0, 3);
 *
 * // Get the first column as an array
 * const a = matrix.col(m, 0); // Returns: [1, 2, 3]
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.col | PineScript matrix.col}
 */
export function col<T>(id: PineMatrix<T>, column_index: simple_int): PineArray<T> {
  return id.data.map(r => r[column_index]!) as PineArray<T>;
}

/**
 * Create a deep copy of a matrix
 *
 * The function creates a new matrix which is a copy of the original.
 *
 * @param id - A matrix object to copy
 * @returns A new matrix object that is a deep copy of the original
 *
 * @remarks
 * Unlike a simple assignment operation which would only copy the reference,
 * this function creates an actual copy of the matrix data.
 *
 * @example
 * ```typescript
 * // Create a 2x3 matrix with value 1
 * const m1 = matrix.new_matrix(2, 3, 1);
 *
 * // Copy the matrix
 * const m2 = matrix.copy(m1);
 *
 * // Modifying m2 will not affect m1
 * matrix.set(m2, 0, 0, 99);
 * // m1[0][0] is still 1
 * // m2[0][0] is now 99
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.copy | PineScript matrix.copy}
 */
export function copy<T>(id: PineMatrix<T>): PineMatrix<T> {
  const newData: T[][] = id.data.map(r => [...r]);
  return {
    rows: id.rows,
    columns: id.columns,
    data: newData
  };
}

/**
 * Fill matrix with value
 *
 * The function fills a rectangular area of the matrix defined by the indices
 * from_row to to_row (not including it) and from_column to to_column (not including it)
 * with the specified value.
 *
 * @param id - A matrix object
 * @param value - The value to fill with
 * @param from_row - Row index from which the fill will begin (inclusive). Default: 0
 * @param to_row - Row index where the fill will end (not inclusive). Default: matrix.rows
 * @param from_column - Column index from which the fill will begin (inclusive). Default: 0
 * @param to_column - Column index where the fill will end (not inclusive). Default: matrix.columns
 *
 * @example
 * ```typescript
 * // Create a 4x5 matrix with value 0
 * const m = matrix.new_matrix(4, 5, 0);
 *
 * // Fill rows 0-1 and columns 1-2 with value 9
 * matrix.fill(m, 9, 0, 2, 1, 3);
 *
 * // Result: positions [0,1], [0,2], [1,1], [1,2] are now 9
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.fill | PineScript matrix.fill}
 */
export function fill<T>(
  id: PineMatrix<T>,
  value: T,
  from_row: simple_int = 0,
  to_row?: simple_int,
  from_column: simple_int = 0,
  to_column?: simple_int
): void {
  const endRow = to_row ?? id.rows;
  const endCol = to_column ?? id.columns;

  for (let i = from_row; i < endRow; i++) {
    for (let j = from_column; j < endCol; j++) {
      id.data[i]![j] = value;
    }
  }
}

/**
 * Test if matrix is square
 *
 * The function determines if the matrix is square (it has the same number of rows and columns).
 *
 * @param id - Matrix object to test
 * @returns true if the matrix is square, false otherwise
 *
 * @example
 * ```typescript
 * // Create a 3x3 square matrix
 * const m1 = matrix.new_matrix(3, 3, 0);
 * const isSquare1 = matrix.is_square(m1); // Returns: true
 *
 * // Create a 2x3 non-square matrix
 * const m2 = matrix.new_matrix(2, 3, 0);
 * const isSquare2 = matrix.is_square(m2); // Returns: false
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.is_square | PineScript matrix.is_square}
 */
export function is_square<T>(id: PineMatrix<T>): bool {
  return id.rows === id.columns;
}

/**
 * Test if matrix is a zero matrix
 *
 * The function determines if all elements of the matrix are zero.
 *
 * @param id - Matrix object to check (int/float)
 * @returns true if all elements are zero, false otherwise
 *
 * @example
 * ```typescript
 * // Create a 2x2 zero matrix
 * const m1 = matrix.new_matrix(2, 2, 0);
 * const isZero1 = matrix.is_zero(m1); // Returns: true
 *
 * // Create a matrix with non-zero element
 * const m2 = matrix.new_matrix(2, 2, 0);
 * matrix.set(m2, 0, 0, 1);
 * const isZero2 = matrix.is_zero(m2); // Returns: false
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.is_zero | PineScript matrix.is_zero}
 */
export function is_zero(id: PineMatrix<float>): bool {
  for (let i = 0; i < id.rows; i++) {
    for (let j = 0; j < id.columns; j++) {
      if (id.data[i]![j] !== 0) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Test if matrix is binary
 *
 * The function determines if the matrix is binary (when all elements are 0 or 1).
 *
 * @param id - Matrix object to test (int/float)
 * @returns true if the matrix is binary, false otherwise
 *
 * @example
 * ```typescript
 * // Create a binary matrix
 * const m1 = matrix.new_matrix(2, 2, 0);
 * matrix.set(m1, 0, 0, 1);
 * matrix.set(m1, 1, 1, 1);
 * const isBinary1 = matrix.is_binary(m1); // Returns: true
 *
 * // Create a non-binary matrix
 * const m2 = matrix.new_matrix(2, 2, 0);
 * matrix.set(m2, 0, 0, 2);
 * const isBinary2 = matrix.is_binary(m2); // Returns: false
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.is_binary | PineScript matrix.is_binary}
 */
export function is_binary(id: PineMatrix<float>): bool {
  for (let i = 0; i < id.rows; i++) {
    for (let j = 0; j < id.columns; j++) {
      const val = id.data[i]![j];
      if (val !== 0 && val !== 1) {
        return false;
      }
    }
  }
  return true;
}
