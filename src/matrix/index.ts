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
  if (row < 0 || row >= id.rows || column < 0 || column >= id.columns) {
    throw new Error(`Matrix index out of bounds: [${row}, ${column}] for matrix of size [${id.rows}, ${id.columns}]`);
  }
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
  if (row < 0 || row >= id.rows || column < 0 || column >= id.columns) {
    throw new Error(`Matrix index out of bounds: [${row}, ${column}] for matrix of size [${id.rows}, ${id.columns}]`);
  }
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
  if (row_index < 0 || row_index >= id.rows) {
    throw new Error(`Row index out of bounds: ${row_index} for matrix with ${id.rows} rows`);
  }
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
  if (column_index < 0 || column_index >= id.columns) {
    throw new Error(`Column index out of bounds: ${column_index} for matrix with ${id.columns} columns`);
  }
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

// ==========================================
// Row/Column Operations
// ==========================================

/**
 * Add row to matrix
 *
 * Inserts a new row at the specified index of the matrix.
 *
 * @param id - A matrix object
 * @param row - Optional. The index of the new row. Must be a value from 0 to matrix.rows(id).
 *              All existing rows with indices >= this value increase their index by one.
 *              Default is matrix.rows(id) (append at end).
 * @param array_id - Optional. An array to use as the new row. If the matrix is empty, the array
 *                   can be of any size. Otherwise, its size must equal matrix.columns(id).
 *                   By default, inserts a row of undefined values.
 *
 * @remarks
 * Indexing of rows starts at zero.
 * Rather than add rows to an empty matrix, it is far more efficient to declare a matrix
 * with explicit dimensions and fill it with values.
 *
 * @example
 * ```typescript
 * // Create a 2x3 matrix with zeros
 * const m = matrix.new_matrix(2, 3, 0);
 *
 * // Add a row at the end with default values
 * matrix.add_row(m);
 *
 * // Add an array as the first row
 * const arr = [1, 2, 3];
 * matrix.add_row(m, 0, arr);
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.add_row | PineScript matrix.add_row}
 */
export function add_row<T>(id: PineMatrix<T>, row?: simple_int, array_id?: PineArray<T>): void {
  const insertIndex = row ?? id.rows;

  if (insertIndex < 0 || insertIndex > id.rows) {
    throw new Error(`Row index out of bounds: ${insertIndex} for matrix with ${id.rows} rows`);
  }

  let newRow: T[];

  if (array_id !== undefined) {
    // If matrix is not empty, array size must match columns
    if (id.columns > 0 && array_id.length !== id.columns) {
      throw new Error(`Array size ${array_id.length} does not match matrix columns ${id.columns}`);
    }
    newRow = [...array_id];
    // If matrix was empty, set columns based on array
    if (id.rows === 0 && id.columns === 0) {
      id.columns = array_id.length;
    }
  } else {
    // Create row with undefined values
    newRow = new Array(id.columns).fill(undefined) as T[];
  }

  // Insert row at specified index
  id.data.splice(insertIndex, 0, newRow);
  id.rows++;
}

/**
 * Add column to matrix
 *
 * Inserts a new column at the specified index of the matrix.
 *
 * @param id - A matrix object
 * @param column - Optional. The index of the new column. Must be a value from 0 to matrix.columns(id).
 *                 All existing columns with indices >= this value increase their index by one.
 *                 Default is matrix.columns(id) (append at end).
 * @param array_id - Optional. An array to use as the new column. If the matrix is empty, the array
 *                   can be of any size. Otherwise, its size must equal matrix.rows(id).
 *                   By default, inserts a column of undefined values.
 *
 * @remarks
 * Rather than add columns to an empty matrix, it is far more efficient to declare a matrix
 * with explicit dimensions and fill it with values. Adding a column is also much slower
 * than adding a row with matrix.add_row().
 *
 * @example
 * ```typescript
 * // Create a 2x3 matrix with zeros
 * const m = matrix.new_matrix(2, 3, 0);
 *
 * // Add a column at the end with default values
 * matrix.add_col(m);
 *
 * // Add an array as the first column
 * const arr = [1, 2];
 * matrix.add_col(m, 0, arr);
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.add_col | PineScript matrix.add_col}
 */
export function add_col<T>(id: PineMatrix<T>, column?: simple_int, array_id?: PineArray<T>): void {
  const insertIndex = column ?? id.columns;

  if (insertIndex < 0 || insertIndex > id.columns) {
    throw new Error(`Column index out of bounds: ${insertIndex} for matrix with ${id.columns} columns`);
  }

  if (array_id !== undefined) {
    // If matrix is not empty, array size must match rows
    if (id.rows > 0 && array_id.length !== id.rows) {
      throw new Error(`Array size ${array_id.length} does not match matrix rows ${id.rows}`);
    }
    // If matrix was empty, set rows based on array and create empty rows
    if (id.rows === 0 && id.columns === 0) {
      id.rows = array_id.length;
      for (let i = 0; i < array_id.length; i++) {
        id.data.push([]);
      }
    }
    // Insert value at specified column index for each row
    for (let i = 0; i < id.rows; i++) {
      id.data[i]!.splice(insertIndex, 0, array_id[i]!);
    }
  } else {
    // Insert undefined value at specified column index for each row
    for (let i = 0; i < id.rows; i++) {
      id.data[i]!.splice(insertIndex, 0, undefined as T);
    }
  }

  id.columns++;
}

/**
 * Remove row from matrix
 *
 * Removes the row at the specified index and returns an array containing the removed row's values.
 *
 * @param id - A matrix object
 * @param row - Optional. The index of the row to be deleted.
 *              Default is matrix.rows(id) - 1 (last row).
 * @returns An array containing the elements of the removed row
 *
 * @remarks
 * Indexing of rows starts at zero.
 * It is far more efficient to declare matrices with explicit dimensions than to build them
 * by adding or removing rows.
 *
 * @example
 * ```typescript
 * // Create a 2x2 matrix
 * const m = matrix.new_matrix(2, 2, 1);
 * matrix.set(m, 0, 1, 2);
 * matrix.set(m, 1, 0, 3);
 * matrix.set(m, 1, 1, 4);
 *
 * // Remove the first row
 * const arr = matrix.remove_row(m, 0); // Returns: [1, 2]
 * // Matrix now has 1 row
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.remove_row | PineScript matrix.remove_row}
 */
export function remove_row<T>(id: PineMatrix<T>, row?: simple_int): PineArray<T> {
  const removeIndex = row ?? (id.rows - 1);

  if (removeIndex < 0 || removeIndex >= id.rows) {
    throw new Error(`Row index out of bounds: ${removeIndex} for matrix with ${id.rows} rows`);
  }

  const removedRow = id.data.splice(removeIndex, 1)[0]!;
  id.rows--;

  return removedRow as PineArray<T>;
}

/**
 * Remove column from matrix
 *
 * Removes the column at the specified index and returns an array containing the removed column's values.
 *
 * @param id - A matrix object
 * @param column - Optional. The index of the column to be removed.
 *                 Default is matrix.columns(id) - 1 (last column).
 * @returns An array containing the elements of the removed column
 *
 * @remarks
 * Indexing of columns starts at zero.
 * It is far more efficient to declare matrices with explicit dimensions than to build them
 * by adding or removing columns. Deleting a column is also much slower than deleting a row
 * with matrix.remove_row().
 *
 * @example
 * ```typescript
 * // Create a 2x2 matrix
 * const m = matrix.new_matrix(2, 2, 1);
 * matrix.set(m, 0, 1, 2);
 * matrix.set(m, 1, 0, 3);
 * matrix.set(m, 1, 1, 4);
 *
 * // Remove the first column
 * const arr = matrix.remove_col(m, 0); // Returns: [1, 3]
 * // Matrix now has 1 column
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.remove_col | PineScript matrix.remove_col}
 */
export function remove_col<T>(id: PineMatrix<T>, column?: simple_int): PineArray<T> {
  const removeIndex = column ?? (id.columns - 1);

  if (removeIndex < 0 || removeIndex >= id.columns) {
    throw new Error(`Column index out of bounds: ${removeIndex} for matrix with ${id.columns} columns`);
  }

  const removedCol: T[] = [];
  for (let i = 0; i < id.rows; i++) {
    removedCol.push(id.data[i]!.splice(removeIndex, 1)[0]!);
  }
  id.columns--;

  return removedCol as PineArray<T>;
}

/**
 * Swap two rows
 *
 * Swaps the rows at the index row1 and row2 in the matrix.
 *
 * @param id - A matrix object
 * @param row1 - Index of the first row to be swapped
 * @param row2 - Index of the second row to be swapped
 *
 * @remarks
 * Indexing of rows starts at zero.
 *
 * @example
 * ```typescript
 * // Create a 3x2 matrix
 * const m = matrix.new_matrix(3, 2, 0);
 * matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 2);
 * matrix.set(m, 1, 0, 3); matrix.set(m, 1, 1, 4);
 * matrix.set(m, 2, 0, 5); matrix.set(m, 2, 1, 6);
 *
 * // Swap first and second rows
 * matrix.swap_rows(m, 0, 1);
 * // Now row 0 is [3, 4] and row 1 is [1, 2]
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.swap_rows | PineScript matrix.swap_rows}
 */
export function swap_rows<T>(id: PineMatrix<T>, row1: simple_int, row2: simple_int): void {
  if (row1 < 0 || row1 >= id.rows) {
    throw new Error(`Row1 index out of bounds: ${row1} for matrix with ${id.rows} rows`);
  }
  if (row2 < 0 || row2 >= id.rows) {
    throw new Error(`Row2 index out of bounds: ${row2} for matrix with ${id.rows} rows`);
  }

  const temp = id.data[row1]!;
  id.data[row1] = id.data[row2]!;
  id.data[row2] = temp;
}

/**
 * Swap two columns
 *
 * Swaps the columns at the index column1 and column2 in the matrix.
 *
 * @param id - A matrix object
 * @param column1 - Index of the first column to be swapped
 * @param column2 - Index of the second column to be swapped
 *
 * @remarks
 * Indexing of columns starts at zero.
 *
 * @example
 * ```typescript
 * // Create a 2x2 matrix
 * const m = matrix.new_matrix(2, 2, 0);
 * matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 2);
 * matrix.set(m, 1, 0, 3); matrix.set(m, 1, 1, 4);
 *
 * // Swap first and second columns
 * matrix.swap_columns(m, 0, 1);
 * // Now column 0 is [2, 4] and column 1 is [1, 3]
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.swap_columns | PineScript matrix.swap_columns}
 */
export function swap_columns<T>(id: PineMatrix<T>, column1: simple_int, column2: simple_int): void {
  if (column1 < 0 || column1 >= id.columns) {
    throw new Error(`Column1 index out of bounds: ${column1} for matrix with ${id.columns} columns`);
  }
  if (column2 < 0 || column2 >= id.columns) {
    throw new Error(`Column2 index out of bounds: ${column2} for matrix with ${id.columns} columns`);
  }

  for (let i = 0; i < id.rows; i++) {
    const temp = id.data[i]![column1]!;
    id.data[i]![column1] = id.data[i]![column2]!;
    id.data[i]![column2] = temp;
  }
}

// ==========================================
// Matrix Transformations
// ==========================================

/**
 * Matrix transpose
 *
 * Creates a new, transposed version of the matrix. This interchanges the row and column
 * index of each element.
 *
 * @param id - A matrix object
 * @returns A new matrix containing the transposed version
 *
 * @example
 * ```typescript
 * // Create a 2x3 matrix
 * const m1 = matrix.new_matrix(2, 3, 0);
 * matrix.set(m1, 0, 0, 1); matrix.set(m1, 0, 1, 2); matrix.set(m1, 0, 2, 3);
 * matrix.set(m1, 1, 0, 4); matrix.set(m1, 1, 1, 5); matrix.set(m1, 1, 2, 6);
 *
 * // Transpose to get a 3x2 matrix
 * const m2 = matrix.transpose(m1);
 * // m2 = [[1, 4], [2, 5], [3, 6]]
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.transpose | PineScript matrix.transpose}
 */
export function transpose<T>(id: PineMatrix<T>): PineMatrix<T> {
  const newData: T[][] = [];
  for (let j = 0; j < id.columns; j++) {
    const newRow: T[] = [];
    for (let i = 0; i < id.rows; i++) {
      newRow.push(id.data[i]![j]!);
    }
    newData.push(newRow);
  }
  return {
    rows: id.columns,
    columns: id.rows,
    data: newData
  };
}

/**
 * Concatenate matrices
 *
 * Appends the rows of m2 matrix to m1 matrix (vertical concatenation).
 *
 * @param id1 - Matrix object to concatenate into
 * @param id2 - Matrix object whose rows will be appended to id1
 * @returns Returns the id1 matrix concatenated with the id2 matrix
 *
 * @remarks
 * The number of columns in both matrices must be identical.
 *
 * @example
 * ```typescript
 * // Create two 2x4 matrices
 * const m1 = matrix.new_matrix(2, 4, 0);
 * const m2 = matrix.new_matrix(2, 4, 1);
 *
 * // Append m2 to m1
 * matrix.concat(m1, m2);
 * // m1 is now 4x4
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.concat | PineScript matrix.concat}
 */
export function concat<T>(id1: PineMatrix<T>, id2: PineMatrix<T>): PineMatrix<T> {
  if (id1.columns !== id2.columns) {
    throw new Error(`Column count mismatch: ${id1.columns} vs ${id2.columns}`);
  }

  // Append all rows from id2 to id1
  for (let i = 0; i < id2.rows; i++) {
    id1.data.push([...id2.data[i]!]);
  }
  id1.rows += id2.rows;

  return id1;
}

/**
 * Extract submatrix
 *
 * Extracts a submatrix from the matrix within the specified indices.
 *
 * @param id - A matrix object
 * @param from_row - Row index from which extraction begins (inclusive). Default: 0
 * @param to_row - Row index where extraction ends (exclusive). Default: matrix.rows(id)
 * @param from_column - Column index from which extraction begins (inclusive). Default: 0
 * @param to_column - Column index where extraction ends (exclusive). Default: matrix.columns(id)
 * @returns A new matrix object containing the submatrix
 *
 * @remarks
 * Indexing of rows and columns starts at zero.
 *
 * @example
 * ```typescript
 * // Create a 2x3 matrix
 * const m1 = matrix.new_matrix(2, 3, 0);
 * matrix.set(m1, 0, 0, 1); matrix.set(m1, 0, 1, 2); matrix.set(m1, 0, 2, 3);
 * matrix.set(m1, 1, 0, 4); matrix.set(m1, 1, 1, 5); matrix.set(m1, 1, 2, 6);
 *
 * // Extract a 2x2 submatrix (columns 1-2)
 * const m2 = matrix.submatrix(m1, 0, 2, 1, 3);
 * // m2 = [[2, 3], [5, 6]]
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.submatrix | PineScript matrix.submatrix}
 */
export function submatrix<T>(
  id: PineMatrix<T>,
  from_row: simple_int = 0,
  to_row?: simple_int,
  from_column: simple_int = 0,
  to_column?: simple_int
): PineMatrix<T> {
  const endRow = to_row ?? id.rows;
  const endCol = to_column ?? id.columns;

  if (from_row < 0 || from_row > id.rows) {
    throw new Error(`from_row index out of bounds: ${from_row}`);
  }
  if (endRow < 0 || endRow > id.rows) {
    throw new Error(`to_row index out of bounds: ${endRow}`);
  }
  if (from_column < 0 || from_column > id.columns) {
    throw new Error(`from_column index out of bounds: ${from_column}`);
  }
  if (endCol < 0 || endCol > id.columns) {
    throw new Error(`to_column index out of bounds: ${endCol}`);
  }

  const newRows = endRow - from_row;
  const newCols = endCol - from_column;
  const newData: T[][] = [];

  for (let i = from_row; i < endRow; i++) {
    const newRow: T[] = [];
    for (let j = from_column; j < endCol; j++) {
      newRow.push(id.data[i]![j]!);
    }
    newData.push(newRow);
  }

  return {
    rows: newRows,
    columns: newCols,
    data: newData
  };
}

/**
 * Reshape matrix
 *
 * Rebuilds the matrix to new dimensions. The total number of elements must remain the same.
 *
 * @param id - A matrix object
 * @param rows - The number of rows of the reshaped matrix
 * @param columns - The number of columns of the reshaped matrix
 *
 * @remarks
 * The product of rows * columns must equal the current element count.
 * Elements are read row by row and placed in the new shape row by row.
 *
 * @example
 * ```typescript
 * // Create a 2x3 matrix
 * const m = matrix.new_matrix(2, 3, 0);
 * matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 2); matrix.set(m, 0, 2, 3);
 * matrix.set(m, 1, 0, 4); matrix.set(m, 1, 1, 5); matrix.set(m, 1, 2, 6);
 *
 * // Reshape to 3x2
 * matrix.reshape(m, 3, 2);
 * // m = [[1, 2], [3, 4], [5, 6]]
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.reshape | PineScript matrix.reshape}
 */
export function reshape<T>(id: PineMatrix<T>, rows: simple_int, columns: simple_int): void {
  const totalElements = id.rows * id.columns;
  const newTotalElements = rows * columns;

  if (totalElements !== newTotalElements) {
    throw new Error(`Cannot reshape ${id.rows}x${id.columns} (${totalElements} elements) to ${rows}x${columns} (${newTotalElements} elements)`);
  }

  // Flatten the matrix
  const flat: T[] = [];
  for (let i = 0; i < id.rows; i++) {
    for (let j = 0; j < id.columns; j++) {
      flat.push(id.data[i]![j]!);
    }
  }

  // Rebuild with new dimensions
  const newData: T[][] = [];
  let index = 0;
  for (let i = 0; i < rows; i++) {
    const newRow: T[] = [];
    for (let j = 0; j < columns; j++) {
      newRow.push(flat[index++]!);
    }
    newData.push(newRow);
  }

  id.rows = rows;
  id.columns = columns;
  id.data = newData;
}

/**
 * Reverse matrix
 *
 * Reverses the order of rows and columns in the matrix. The first row and first column
 * become the last, and the last become the first.
 *
 * @param id - A matrix object
 *
 * @remarks
 * This modifies the matrix in place. Both rows and columns are reversed.
 *
 * @example
 * ```typescript
 * // Create a 2x2 matrix
 * const m = matrix.new_matrix(2, 2, 0);
 * matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 2);
 * matrix.set(m, 1, 0, 3); matrix.set(m, 1, 1, 4);
 *
 * // Reverse the matrix
 * matrix.reverse(m);
 * // m = [[4, 3], [2, 1]]
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.reverse | PineScript matrix.reverse}
 */
export function reverse<T>(id: PineMatrix<T>): void {
  // Reverse the order of rows
  id.data.reverse();
  // Reverse each row (columns)
  for (let i = 0; i < id.rows; i++) {
    id.data[i]!.reverse();
  }
}

/**
 * Sort matrix by column
 *
 * Rearranges the rows in the matrix following the sorted order of values in the specified column.
 *
 * @param id - A matrix object to be sorted
 * @param column - Index of the column whose values determine the new order of rows. Default: 0
 * @param order - The sort order: 'ascending' or 'descending'. Default: 'ascending'
 *
 * @remarks
 * This modifies the matrix in place.
 *
 * @example
 * ```typescript
 * // Create a 2x2 matrix
 * const m = matrix.new_matrix(2, 2, 0);
 * matrix.set(m, 0, 0, 3); matrix.set(m, 0, 1, 4);
 * matrix.set(m, 1, 0, 1); matrix.set(m, 1, 1, 2);
 *
 * // Sort by first column (ascending)
 * matrix.sort(m);
 * // m = [[1, 2], [3, 4]]
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.sort | PineScript matrix.sort}
 */
export function sort<T extends number | string>(id: PineMatrix<T>, column: simple_int = 0, order: 'ascending' | 'descending' = 'ascending'): void {
  if (column < 0 || column >= id.columns) {
    throw new Error(`Column index out of bounds: ${column} for matrix with ${id.columns} columns`);
  }

  id.data.sort((a, b) => {
    const valA = a[column]!;
    const valB = b[column]!;
    if (typeof valA === 'number' && typeof valB === 'number') {
      return order === 'ascending' ? valA - valB : valB - valA;
    }
    // String comparison
    if (order === 'ascending') {
      return valA < valB ? -1 : valA > valB ? 1 : 0;
    } else {
      return valB < valA ? -1 : valB > valA ? 1 : 0;
    }
  });
}

// ==========================================
// Element-wise Arithmetic
// ==========================================

/**
 * Matrix addition (sum)
 *
 * Returns a new matrix resulting from the element-wise sum of two matrices,
 * or of a matrix and a scalar.
 *
 * @param id1 - First matrix object
 * @param id2 - Second matrix object, or scalar value
 * @returns A new matrix containing the sum
 *
 * @remarks
 * When adding two matrices, they must have the same dimensions.
 *
 * @example
 * ```typescript
 * // Sum of two matrices
 * const m1 = matrix.new_matrix(2, 3, 5);
 * const m2 = matrix.new_matrix(2, 3, 4);
 * const m3 = matrix.sum(m1, m2); // All elements are 9
 *
 * // Sum of matrix and scalar
 * const m4 = matrix.new_matrix(2, 3, 4);
 * const m5 = matrix.sum(m4, 1); // All elements are 5
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.sum | PineScript matrix.sum}
 */
export function sum(id1: PineMatrix<float>, id2: PineMatrix<float> | float): PineMatrix<float> {
  const newData: float[][] = [];

  if (typeof id2 === 'number') {
    // Add scalar to each element
    for (let i = 0; i < id1.rows; i++) {
      const newRow: float[] = [];
      for (let j = 0; j < id1.columns; j++) {
        newRow.push(id1.data[i]![j]! + id2);
      }
      newData.push(newRow);
    }
    return {
      rows: id1.rows,
      columns: id1.columns,
      data: newData
    };
  } else {
    // Add two matrices element-wise
    if (id1.rows !== id2.rows || id1.columns !== id2.columns) {
      throw new Error(`Matrix dimensions must match: ${id1.rows}x${id1.columns} vs ${id2.rows}x${id2.columns}`);
    }

    for (let i = 0; i < id1.rows; i++) {
      const newRow: float[] = [];
      for (let j = 0; j < id1.columns; j++) {
        newRow.push(id1.data[i]![j]! + id2.data[i]![j]!);
      }
      newData.push(newRow);
    }
    return {
      rows: id1.rows,
      columns: id1.columns,
      data: newData
    };
  }
}

/**
 * Matrix subtraction (diff)
 *
 * Returns a new matrix resulting from the element-wise subtraction between two matrices,
 * or of a matrix and a scalar.
 *
 * @param id1 - Matrix to subtract from
 * @param id2 - Matrix object or scalar value to be subtracted
 * @returns A new matrix containing the difference
 *
 * @remarks
 * When subtracting two matrices, they must have the same dimensions.
 *
 * @example
 * ```typescript
 * // Difference between two matrices
 * const m1 = matrix.new_matrix(2, 3, 5);
 * const m2 = matrix.new_matrix(2, 3, 4);
 * const m3 = matrix.diff(m1, m2); // All elements are 1
 *
 * // Difference between matrix and scalar
 * const m4 = matrix.new_matrix(2, 3, 4);
 * const m5 = matrix.diff(m4, 1); // All elements are 3
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.diff | PineScript matrix.diff}
 */
export function diff(id1: PineMatrix<float>, id2: PineMatrix<float> | float): PineMatrix<float> {
  const newData: float[][] = [];

  if (typeof id2 === 'number') {
    // Subtract scalar from each element
    for (let i = 0; i < id1.rows; i++) {
      const newRow: float[] = [];
      for (let j = 0; j < id1.columns; j++) {
        newRow.push(id1.data[i]![j]! - id2);
      }
      newData.push(newRow);
    }
    return {
      rows: id1.rows,
      columns: id1.columns,
      data: newData
    };
  } else {
    // Subtract two matrices element-wise
    if (id1.rows !== id2.rows || id1.columns !== id2.columns) {
      throw new Error(`Matrix dimensions must match: ${id1.rows}x${id1.columns} vs ${id2.rows}x${id2.columns}`);
    }

    for (let i = 0; i < id1.rows; i++) {
      const newRow: float[] = [];
      for (let j = 0; j < id1.columns; j++) {
        newRow.push(id1.data[i]![j]! - id2.data[i]![j]!);
      }
      newData.push(newRow);
    }
    return {
      rows: id1.rows,
      columns: id1.columns,
      data: newData
    };
  }
}

// ==========================================
// Statistical Functions
// ==========================================

/**
 * Average of all elements
 *
 * Calculates the average of all elements in the matrix.
 *
 * @param id - A matrix object
 * @returns The average value from the matrix
 *
 * @example
 * ```typescript
 * // Create a 2x2 matrix
 * const m = matrix.new_matrix(2, 2, 0);
 * matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 2);
 * matrix.set(m, 1, 0, 3); matrix.set(m, 1, 1, 4);
 *
 * const avg = matrix.avg(m); // Returns: 2.5
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.avg | PineScript matrix.avg}
 */
export function avg(id: PineMatrix<float>): float {
  if (id.rows === 0 || id.columns === 0) {
    return NaN;
  }

  let total = 0;
  let count = 0;
  for (let i = 0; i < id.rows; i++) {
    for (let j = 0; j < id.columns; j++) {
      const val = id.data[i]![j];
      if (val !== null && val !== undefined && !isNaN(val)) {
        total += val;
        count++;
      }
    }
  }

  return count === 0 ? NaN : total / count;
}

/**
 * Minimum element
 *
 * Returns the smallest value from the matrix elements.
 *
 * @param id - A matrix object
 * @returns The smallest value from the matrix
 *
 * @example
 * ```typescript
 * // Create a 2x2 matrix
 * const m = matrix.new_matrix(2, 2, 0);
 * matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 2);
 * matrix.set(m, 1, 0, 3); matrix.set(m, 1, 1, 4);
 *
 * const minVal = matrix.min(m); // Returns: 1
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.min | PineScript matrix.min}
 */
export function min(id: PineMatrix<float>): float {
  if (id.rows === 0 || id.columns === 0) {
    return NaN;
  }

  let minVal = Infinity;
  for (let i = 0; i < id.rows; i++) {
    for (let j = 0; j < id.columns; j++) {
      const val = id.data[i]![j];
      if (val !== null && val !== undefined && !isNaN(val) && val < minVal) {
        minVal = val;
      }
    }
  }

  return minVal === Infinity ? NaN : minVal;
}

/**
 * Maximum element
 *
 * Returns the largest value from the matrix elements.
 *
 * @param id - A matrix object
 * @returns The largest value from the matrix
 *
 * @example
 * ```typescript
 * // Create a 2x2 matrix
 * const m = matrix.new_matrix(2, 2, 0);
 * matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 2);
 * matrix.set(m, 1, 0, 3); matrix.set(m, 1, 1, 4);
 *
 * const maxVal = matrix.max(m); // Returns: 4
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.max | PineScript matrix.max}
 */
export function max(id: PineMatrix<float>): float {
  if (id.rows === 0 || id.columns === 0) {
    return NaN;
  }

  let maxVal = -Infinity;
  for (let i = 0; i < id.rows; i++) {
    for (let j = 0; j < id.columns; j++) {
      const val = id.data[i]![j];
      if (val !== null && val !== undefined && !isNaN(val) && val > maxVal) {
        maxVal = val;
      }
    }
  }

  return maxVal === -Infinity ? NaN : maxVal;
}

/**
 * Median element
 *
 * Calculates the median ("the middle" value) of matrix elements.
 *
 * @param id - A matrix object
 * @returns The median value from the matrix
 *
 * @remarks
 * NA elements of the matrix are not considered when calculating the median.
 *
 * @example
 * ```typescript
 * // Create a 2x2 matrix
 * const m = matrix.new_matrix(2, 2, 0);
 * matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 2);
 * matrix.set(m, 1, 0, 3); matrix.set(m, 1, 1, 4);
 *
 * const medianVal = matrix.median(m); // Returns: 2.5
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.median | PineScript matrix.median}
 */
export function median(id: PineMatrix<float>): float {
  if (id.rows === 0 || id.columns === 0) {
    return NaN;
  }

  // Flatten and filter out NaN/null/undefined
  const values: float[] = [];
  for (let i = 0; i < id.rows; i++) {
    for (let j = 0; j < id.columns; j++) {
      const val = id.data[i]![j];
      if (val !== null && val !== undefined && !isNaN(val)) {
        values.push(val);
      }
    }
  }

  if (values.length === 0) {
    return NaN;
  }

  values.sort((a, b) => a - b);
  const mid = Math.floor(values.length / 2);

  if (values.length % 2 === 0) {
    return (values[mid - 1]! + values[mid]!) / 2;
  } else {
    return values[mid]!;
  }
}

/**
 * Mode (most frequent element)
 *
 * Calculates the mode of the matrix, which is the most frequently occurring value.
 * When there are multiple values occurring equally frequently, returns the smallest.
 *
 * @param id - A matrix object
 * @returns The most frequently occurring value, or the smallest if tie
 *
 * @remarks
 * NA elements of the matrix are not considered when calculating the mode.
 *
 * @example
 * ```typescript
 * // Create a 2x2 matrix
 * const m = matrix.new_matrix(2, 2, 0);
 * matrix.set(m, 0, 0, 0); matrix.set(m, 0, 1, 0);
 * matrix.set(m, 1, 0, 1); matrix.set(m, 1, 1, 1);
 *
 * const modeVal = matrix.mode(m); // Returns: 0 (tie, so smallest)
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.mode | PineScript matrix.mode}
 */
export function mode(id: PineMatrix<float>): float {
  if (id.rows === 0 || id.columns === 0) {
    return NaN;
  }

  const frequency = new Map<float, int>();
  let maxFreq = 0;
  let modeValue: float = NaN;

  for (let i = 0; i < id.rows; i++) {
    for (let j = 0; j < id.columns; j++) {
      const val = id.data[i]![j];
      if (val !== null && val !== undefined && !isNaN(val)) {
        const freq = (frequency.get(val) || 0) + 1;
        frequency.set(val, freq);

        // Update mode if higher frequency, or same frequency but smaller value
        if (freq > maxFreq || (freq === maxFreq && val < modeValue)) {
          maxFreq = freq;
          modeValue = val;
        }
      }
    }
  }

  return modeValue;
}

/**
 * Matrix trace
 *
 * Calculates the trace of a matrix (the sum of the main diagonal's elements).
 *
 * @param id - A matrix object (must be square)
 * @returns The trace of the matrix
 *
 * @remarks
 * The matrix must be square. Throws an error for non-square matrices.
 *
 * @example
 * ```typescript
 * // Create a 2x2 matrix
 * const m = matrix.new_matrix(2, 2, 0);
 * matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 2);
 * matrix.set(m, 1, 0, 3); matrix.set(m, 1, 1, 4);
 *
 * const tr = matrix.trace(m); // Returns: 5 (1 + 4)
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.trace | PineScript matrix.trace}
 */
export function trace(id: PineMatrix<float>): float {
  if (!is_square(id)) {
    throw new Error(`Matrix must be square for trace calculation: ${id.rows}x${id.columns}`);
  }

  if (id.rows === 0) {
    return 0;
  }

  let sum = 0;
  for (let i = 0; i < id.rows; i++) {
    const val = id.data[i]![i];
    if (val !== null && val !== undefined && !isNaN(val)) {
      sum += val;
    }
  }

  return sum;
}

// ==========================================
// Boolean Checks
// ==========================================

/**
 * Test if diagonal matrix
 *
 * Determines if the matrix is diagonal (all elements outside the main diagonal are zero).
 *
 * @param id - Matrix object to test
 * @returns true if the matrix is diagonal, false otherwise
 *
 * @remarks
 * Returns false with non-square matrices.
 *
 * @example
 * ```typescript
 * // Create a diagonal matrix
 * const m = matrix.new_matrix(3, 3, 0);
 * matrix.set(m, 0, 0, 1);
 * matrix.set(m, 1, 1, 2);
 * matrix.set(m, 2, 2, 3);
 *
 * const isDiag = matrix.is_diagonal(m); // Returns: true
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.is_diagonal | PineScript matrix.is_diagonal}
 */
export function is_diagonal(id: PineMatrix<float>): bool {
  if (!is_square(id)) {
    return false;
  }

  for (let i = 0; i < id.rows; i++) {
    for (let j = 0; j < id.columns; j++) {
      if (i !== j && id.data[i]![j] !== 0) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Test if identity matrix
 *
 * Determines if a matrix is an identity matrix (elements with ones on the main diagonal
 * and zeros elsewhere).
 *
 * @param id - Matrix object to test
 * @returns true if id is an identity matrix, false otherwise
 *
 * @remarks
 * Returns false with non-square matrices.
 *
 * @example
 * ```typescript
 * // Create an identity matrix
 * const m = matrix.new_matrix(3, 3, 0);
 * matrix.set(m, 0, 0, 1);
 * matrix.set(m, 1, 1, 1);
 * matrix.set(m, 2, 2, 1);
 *
 * const isIdent = matrix.is_identity(m); // Returns: true
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.is_identity | PineScript matrix.is_identity}
 */
export function is_identity(id: PineMatrix<float>): bool {
  if (!is_square(id)) {
    return false;
  }

  for (let i = 0; i < id.rows; i++) {
    for (let j = 0; j < id.columns; j++) {
      const val = id.data[i]![j];
      if (i === j) {
        if (val !== 1) {
          return false;
        }
      } else {
        if (val !== 0) {
          return false;
        }
      }
    }
  }

  return true;
}

/**
 * Test if symmetric matrix
 *
 * Determines if a square matrix is symmetric (elements are symmetric with respect
 * to the main diagonal, i.e., matrix equals its transpose).
 *
 * @param id - Matrix object to test
 * @returns true if the matrix is symmetric, false otherwise
 *
 * @remarks
 * Returns false with non-square matrices.
 *
 * @example
 * ```typescript
 * // Create a symmetric matrix
 * const m = matrix.new_matrix(3, 3, 0);
 * matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 2); matrix.set(m, 0, 2, 3);
 * matrix.set(m, 1, 0, 2); matrix.set(m, 1, 1, 4); matrix.set(m, 1, 2, 5);
 * matrix.set(m, 2, 0, 3); matrix.set(m, 2, 1, 5); matrix.set(m, 2, 2, 6);
 *
 * const isSym = matrix.is_symmetric(m); // Returns: true
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.is_symmetric | PineScript matrix.is_symmetric}
 */
export function is_symmetric(id: PineMatrix<float>): bool {
  if (!is_square(id)) {
    return false;
  }

  for (let i = 0; i < id.rows; i++) {
    for (let j = i + 1; j < id.columns; j++) {
      if (id.data[i]![j] !== id.data[j]![i]) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Test if antisymmetric (skew-symmetric) matrix
 *
 * Determines if a matrix is antisymmetric (its transpose equals its negative).
 * A[i][j] = -A[j][i] for all i, j, and diagonal elements must be 0.
 *
 * @param id - Matrix object to test
 * @returns true if the matrix is antisymmetric, false otherwise
 *
 * @remarks
 * Returns false with non-square matrices.
 *
 * @example
 * ```typescript
 * // Create an antisymmetric matrix
 * const m = matrix.new_matrix(3, 3, 0);
 * matrix.set(m, 0, 1, 2);  matrix.set(m, 0, 2, -1);
 * matrix.set(m, 1, 0, -2); matrix.set(m, 1, 2, 3);
 * matrix.set(m, 2, 0, 1);  matrix.set(m, 2, 1, -3);
 *
 * const isAntiSym = matrix.is_antisymmetric(m); // Returns: true
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.is_antisymmetric | PineScript matrix.is_antisymmetric}
 */
export function is_antisymmetric(id: PineMatrix<float>): bool {
  if (!is_square(id)) {
    return false;
  }

  for (let i = 0; i < id.rows; i++) {
    // Diagonal elements must be 0
    if (id.data[i]![i] !== 0) {
      return false;
    }

    for (let j = i + 1; j < id.columns; j++) {
      const upperVal = id.data[i]![j]!;
      const lowerVal = id.data[j]![i]!;
      if (upperVal !== -lowerVal) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Test if triangular matrix
 *
 * Determines if the matrix is triangular (if all elements above or below the main
 * diagonal are zero).
 *
 * @param id - Matrix object to test
 * @returns true if the matrix is triangular (upper or lower), false otherwise
 *
 * @remarks
 * Returns false with non-square matrices.
 * Returns true if the matrix is either upper triangular or lower triangular.
 *
 * @example
 * ```typescript
 * // Create an upper triangular matrix
 * const m = matrix.new_matrix(3, 3, 0);
 * matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 2); matrix.set(m, 0, 2, 3);
 * matrix.set(m, 1, 1, 4); matrix.set(m, 1, 2, 5);
 * matrix.set(m, 2, 2, 6);
 *
 * const isTri = matrix.is_triangular(m); // Returns: true
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.is_triangular | PineScript matrix.is_triangular}
 */
export function is_triangular(id: PineMatrix<float>): bool {
  if (!is_square(id)) {
    return false;
  }

  // Check if upper triangular (all elements below diagonal are 0)
  let isUpper = true;
  for (let i = 1; i < id.rows && isUpper; i++) {
    for (let j = 0; j < i && isUpper; j++) {
      if (id.data[i]![j] !== 0) {
        isUpper = false;
      }
    }
  }

  if (isUpper) {
    return true;
  }

  // Check if lower triangular (all elements above diagonal are 0)
  let isLower = true;
  for (let i = 0; i < id.rows - 1 && isLower; i++) {
    for (let j = i + 1; j < id.columns && isLower; j++) {
      if (id.data[i]![j] !== 0) {
        isLower = false;
      }
    }
  }

  return isLower;
}

/**
 * Test if antidiagonal matrix
 *
 * Determines if the matrix is anti-diagonal (all elements outside the secondary
 * diagonal are zero).
 *
 * @param id - Matrix object to test
 * @returns true if the matrix is anti-diagonal, false otherwise
 *
 * @remarks
 * Returns false with non-square matrices.
 * The anti-diagonal runs from top-right to bottom-left.
 *
 * @example
 * ```typescript
 * // Create an antidiagonal matrix
 * const m = matrix.new_matrix(3, 3, 0);
 * matrix.set(m, 0, 2, 1);
 * matrix.set(m, 1, 1, 2);
 * matrix.set(m, 2, 0, 3);
 *
 * const isAntiDiag = matrix.is_antidiagonal(m); // Returns: true
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.is_antidiagonal | PineScript matrix.is_antidiagonal}
 */
export function is_antidiagonal(id: PineMatrix<float>): bool {
  if (!is_square(id)) {
    return false;
  }

  const n = id.rows;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      // Anti-diagonal position: i + j === n - 1
      const isAntiDiag = (i + j === n - 1);
      if (!isAntiDiag && id.data[i]![j] !== 0) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Test if stochastic matrix
 *
 * Determines if the matrix is stochastic (all elements are non-negative and all
 * row sums equal 1).
 *
 * @param id - Matrix object to test
 * @returns true if the matrix is stochastic, false otherwise
 *
 * @remarks
 * A right stochastic matrix has rows that sum to 1.
 *
 * @example
 * ```typescript
 * // Create a stochastic matrix
 * const m = matrix.new_matrix(2, 2, 0);
 * matrix.set(m, 0, 0, 0.5); matrix.set(m, 0, 1, 0.5);
 * matrix.set(m, 1, 0, 0.3); matrix.set(m, 1, 1, 0.7);
 *
 * const isStoch = matrix.is_stochastic(m); // Returns: true
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.is_stochastic | PineScript matrix.is_stochastic}
 */
export function is_stochastic(id: PineMatrix<float>): bool {
  if (id.rows === 0 || id.columns === 0) {
    return false;
  }

  const tolerance = 1e-10;

  for (let i = 0; i < id.rows; i++) {
    let rowSum = 0;
    for (let j = 0; j < id.columns; j++) {
      const val = id.data[i]![j]!;
      // All elements must be non-negative
      if (val < 0) {
        return false;
      }
      rowSum += val;
    }
    // Row sum must equal 1 (with tolerance for floating point errors)
    if (Math.abs(rowSum - 1) > tolerance) {
      return false;
    }
  }

  return true;
}

// ==========================================
// Linear Algebra Functions (Phase 3)
// ==========================================

/**
 * Epsilon for floating-point comparisons
 */
const EPSILON = 1e-10;

/**
 * Helper: Create identity matrix of given size
 */
function createIdentity(n: simple_int): PineMatrix<float> {
  const m = new_matrix<float>(n, n, 0);
  for (let i = 0; i < n; i++) {
    m.data[i]![i] = 1;
  }
  return m;
}

/**
 * Matrix multiplication
 *
 * Returns a new matrix resulting from the product between two matrices,
 * or between a matrix and a scalar, or between a matrix and a vector (array).
 *
 * @param id1 - First matrix object
 * @param id2 - Second matrix object, scalar value, or array (vector)
 * @returns A new matrix containing the product, or array for matrix × vector
 *
 * @remarks
 * For matrix × matrix: id1's columns must equal id2's rows.
 * For matrix × vector: the array length must equal id1's columns.
 * Time complexity: O(n³) for n×n matrices.
 *
 * @example
 * ```typescript
 * // Product of two matrices
 * const m1 = matrix.new_matrix(6, 2, 5);
 * const m2 = matrix.new_matrix(2, 3, 4);
 * const m3 = matrix.mult(m1, m2); // 6x3 matrix with values 40
 *
 * // Product of matrix and scalar
 * const m4 = matrix.new_matrix(2, 3, 4);
 * const m5 = matrix.mult(m4, 5); // All elements are 20
 *
 * // Product of matrix and vector
 * const m6 = matrix.new_matrix(2, 3, 4);
 * const arr = [1, 1, 1];
 * const result = matrix.mult(m6, arr); // [12, 12]
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.mult | PineScript matrix.mult}
 */
export function mult(id1: PineMatrix<float>, id2: PineMatrix<float> | float | PineArray<float>): PineMatrix<float> | PineArray<float> {
  // Matrix × Scalar
  if (typeof id2 === 'number') {
    const newData: float[][] = [];
    for (let i = 0; i < id1.rows; i++) {
      const newRow: float[] = [];
      for (let j = 0; j < id1.columns; j++) {
        newRow.push(id1.data[i]![j]! * id2);
      }
      newData.push(newRow);
    }
    return {
      rows: id1.rows,
      columns: id1.columns,
      data: newData
    };
  }

  // Matrix × Vector (array)
  if (Array.isArray(id2) && !('rows' in id2)) {
    const vec = id2 as float[];
    if (vec.length !== id1.columns) {
      throw new Error(`Vector length ${vec.length} must equal matrix columns ${id1.columns}`);
    }
    const result: float[] = [];
    for (let i = 0; i < id1.rows; i++) {
      let sum = 0;
      for (let j = 0; j < id1.columns; j++) {
        sum += id1.data[i]![j]! * vec[j]!;
      }
      result.push(sum);
    }
    return result as PineArray<float>;
  }

  // Matrix × Matrix
  const m2 = id2 as PineMatrix<float>;
  if (id1.columns !== m2.rows) {
    throw new Error(`Matrix multiplication dimension mismatch: ${id1.rows}x${id1.columns} × ${m2.rows}x${m2.columns}. First matrix columns (${id1.columns}) must equal second matrix rows (${m2.rows})`);
  }

  const newRows = id1.rows;
  const newCols = m2.columns;
  const newData: float[][] = [];

  for (let i = 0; i < newRows; i++) {
    const newRow: float[] = [];
    for (let j = 0; j < newCols; j++) {
      let sum = 0;
      for (let k = 0; k < id1.columns; k++) {
        sum += id1.data[i]![k]! * m2.data[k]![j]!;
      }
      newRow.push(sum);
    }
    newData.push(newRow);
  }

  return {
    rows: newRows,
    columns: newCols,
    data: newData
  };
}

/**
 * Matrix power
 *
 * Calculates the product of the matrix by itself 'power' times.
 * Uses repeated squaring for efficiency: O(n³ log p) for n×n matrix and power p.
 *
 * @param id - A matrix object (must be square)
 * @param power - The number of times the matrix will be multiplied by itself
 * @returns A new matrix that is id raised to the specified power
 *
 * @remarks
 * The matrix must be square.
 * power=0 returns the identity matrix.
 * Negative powers compute the inverse first, then raise to the positive power.
 *
 * @example
 * ```typescript
 * // Create a 2x2 matrix
 * const m1 = matrix.new_matrix(2, 2, 2);
 * // Calculate the power of three
 * const m2 = matrix.pow(m1, 3);
 * // m2 = m1 × m1 × m1
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.pow | PineScript matrix.pow}
 */
export function pow(id: PineMatrix<float>, power: int): PineMatrix<float> {
  if (!is_square(id)) {
    throw new Error(`Matrix must be square for power calculation: ${id.rows}x${id.columns}`);
  }

  const n = id.rows;

  // Handle power = 0: return identity matrix
  if (power === 0) {
    return createIdentity(n);
  }

  // Handle negative powers: compute inverse then raise to positive power
  let base: PineMatrix<float>;
  let p = power;
  if (power < 0) {
    const inverse = inv(id);
    if (inverse === null) {
      throw new Error('Cannot compute negative power of singular matrix');
    }
    base = inverse;
    p = -power;
  } else {
    base = copy(id);
  }

  // Repeated squaring algorithm
  let result = createIdentity(n);

  while (p > 0) {
    if (p % 2 === 1) {
      result = mult(result, base) as PineMatrix<float>;
    }
    base = mult(base, base) as PineMatrix<float>;
    p = Math.floor(p / 2);
  }

  return result;
}

/**
 * Matrix determinant
 *
 * Computes the determinant of a square matrix using LU decomposition
 * with partial pivoting.
 *
 * @param id - A matrix object (must be square)
 * @returns The determinant value
 *
 * @remarks
 * Function calculation based on the LU decomposition algorithm.
 * Time complexity: O(n³)
 *
 * @example
 * ```typescript
 * // Create a 2x2 matrix
 * const m = matrix.new_matrix(2, 2, NaN);
 * matrix.set(m, 0, 0, 3);
 * matrix.set(m, 0, 1, 7);
 * matrix.set(m, 1, 0, 1);
 * matrix.set(m, 1, 1, -4);
 *
 * const d = matrix.det(m); // Returns: -19
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.det | PineScript matrix.det}
 */
export function det(id: PineMatrix<float>): float {
  if (!is_square(id)) {
    throw new Error(`Matrix must be square for determinant calculation: ${id.rows}x${id.columns}`);
  }

  const n = id.rows;

  if (n === 0) {
    return 1; // Empty matrix has determinant 1 by convention
  }

  if (n === 1) {
    return id.data[0]![0]!;
  }

  if (n === 2) {
    return id.data[0]![0]! * id.data[1]![1]! - id.data[0]![1]! * id.data[1]![0]!;
  }

  // LU decomposition with partial pivoting
  // Make a copy to work with
  const a: float[][] = id.data.map(row => [...row]);
  let determinant = 1;
  let swapCount = 0;

  for (let col = 0; col < n; col++) {
    // Find pivot (partial pivoting)
    let maxRow = col;
    let maxVal = Math.abs(a[col]![col]!);
    for (let row = col + 1; row < n; row++) {
      const absVal = Math.abs(a[row]![col]!);
      if (absVal > maxVal) {
        maxVal = absVal;
        maxRow = row;
      }
    }

    // Swap rows if needed
    if (maxRow !== col) {
      const temp = a[col]!;
      a[col] = a[maxRow]!;
      a[maxRow] = temp;
      swapCount++;
    }

    // If pivot is zero, determinant is zero
    const pivot = a[col]![col]!;
    if (Math.abs(pivot) < EPSILON) {
      return 0;
    }

    determinant *= pivot;

    // Eliminate below pivot
    for (let row = col + 1; row < n; row++) {
      const factor = a[row]![col]! / pivot;
      for (let j = col; j < n; j++) {
        a[row]![j] = a[row]![j]! - factor * a[col]![j]!;
      }
    }
  }

  // Adjust sign based on row swaps
  if (swapCount % 2 === 1) {
    determinant = -determinant;
  }

  return determinant;
}

/**
 * Matrix inverse
 *
 * Computes the inverse of a square matrix using Gauss-Jordan elimination
 * with partial pivoting.
 *
 * @param id - A matrix object (must be square and non-singular)
 * @returns A new matrix that is the inverse, or null if singular
 *
 * @remarks
 * Function calculation based on the LU decomposition algorithm.
 * Returns null for singular matrices (det = 0).
 * Time complexity: O(n³)
 *
 * @example
 * ```typescript
 * // Create a 2x2 matrix
 * const m1 = matrix.new_matrix(2, 2, NaN);
 * matrix.set(m1, 0, 0, 1);
 * matrix.set(m1, 0, 1, 2);
 * matrix.set(m1, 1, 0, 3);
 * matrix.set(m1, 1, 1, 4);
 *
 * const m2 = matrix.inv(m1);
 * // m2 = [[-2, 1], [1.5, -0.5]]
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.inv | PineScript matrix.inv}
 */
export function inv(id: PineMatrix<float>): PineMatrix<float> | null {
  if (!is_square(id)) {
    throw new Error(`Matrix must be square for inverse calculation: ${id.rows}x${id.columns}`);
  }

  const n = id.rows;

  if (n === 0) {
    return new_matrix<float>(0, 0, 0);
  }

  // Create augmented matrix [A | I]
  const aug: float[][] = [];
  for (let i = 0; i < n; i++) {
    const row: float[] = [];
    for (let j = 0; j < n; j++) {
      row.push(id.data[i]![j]!);
    }
    for (let j = 0; j < n; j++) {
      row.push(i === j ? 1 : 0);
    }
    aug.push(row);
  }

  // Gauss-Jordan elimination with partial pivoting
  for (let col = 0; col < n; col++) {
    // Find pivot
    let maxRow = col;
    let maxVal = Math.abs(aug[col]![col]!);
    for (let row = col + 1; row < n; row++) {
      const absVal = Math.abs(aug[row]![col]!);
      if (absVal > maxVal) {
        maxVal = absVal;
        maxRow = row;
      }
    }

    // Swap rows if needed
    if (maxRow !== col) {
      const temp = aug[col]!;
      aug[col] = aug[maxRow]!;
      aug[maxRow] = temp;
    }

    // Check for singular matrix
    const pivot = aug[col]![col]!;
    if (Math.abs(pivot) < EPSILON) {
      return null; // Singular matrix
    }

    // Scale pivot row
    for (let j = 0; j < 2 * n; j++) {
      aug[col]![j] = aug[col]![j]! / pivot;
    }

    // Eliminate column in all other rows
    for (let row = 0; row < n; row++) {
      if (row !== col) {
        const factor = aug[row]![col]!;
        for (let j = 0; j < 2 * n; j++) {
          aug[row]![j] = aug[row]![j]! - factor * aug[col]![j]!;
        }
      }
    }
  }

  // Extract inverse from augmented matrix
  const inverse: float[][] = [];
  for (let i = 0; i < n; i++) {
    const row: float[] = [];
    for (let j = 0; j < n; j++) {
      row.push(aug[i]![n + j]!);
    }
    inverse.push(row);
  }

  return {
    rows: n,
    columns: n,
    data: inverse
  };
}

/**
 * Matrix pseudo-inverse (Moore-Penrose)
 *
 * Computes the pseudo-inverse of a matrix. For non-singular square matrices,
 * this returns the same result as inv().
 *
 * @param id - A matrix object (can be any shape)
 * @returns A new matrix containing the pseudo-inverse
 *
 * @remarks
 * Uses the formula: A⁺ = (AᵀA)⁻¹Aᵀ for full column rank matrices,
 * or Aᵀ(AAᵀ)⁻¹ for full row rank matrices.
 * For singular matrices, uses iterative refinement approach.
 *
 * @example
 * ```typescript
 * // Create a 2x2 matrix
 * const m1 = matrix.new_matrix(2, 2, NaN);
 * matrix.set(m1, 0, 0, 1);
 * matrix.set(m1, 0, 1, 2);
 * matrix.set(m1, 1, 0, 3);
 * matrix.set(m1, 1, 1, 4);
 *
 * const m2 = matrix.pinv(m1);
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.pinv | PineScript matrix.pinv}
 */
export function pinv(id: PineMatrix<float>): PineMatrix<float> {
  const m = id.rows;
  const n = id.columns;

  if (m === 0 || n === 0) {
    return new_matrix<float>(n, m, 0);
  }

  // For square non-singular matrices, use regular inverse
  if (m === n) {
    const inverse = inv(id);
    if (inverse !== null) {
      return inverse;
    }
  }

  const At = transpose(id);

  // If matrix has more rows than columns (m >= n), use (AᵀA)⁻¹Aᵀ
  if (m >= n) {
    const AtA = mult(At, id) as PineMatrix<float>;
    const AtA_inv = inv(AtA);
    if (AtA_inv !== null) {
      return mult(AtA_inv, At) as PineMatrix<float>;
    }
  }

  // If matrix has more columns than rows (n > m), use Aᵀ(AAᵀ)⁻¹
  const AAt = mult(id, At) as PineMatrix<float>;
  const AAt_inv = inv(AAt);
  if (AAt_inv !== null) {
    return mult(At, AAt_inv) as PineMatrix<float>;
  }

  // Fallback: Use regularization for rank-deficient matrices
  // Add small regularization term: (AᵀA + λI)⁻¹Aᵀ
  const lambda = 1e-10;
  const AtA = mult(At, id) as PineMatrix<float>;

  // Add regularization
  for (let i = 0; i < AtA.rows; i++) {
    AtA.data[i]![i] = AtA.data[i]![i]! + lambda;
  }

  const AtA_inv = inv(AtA);
  if (AtA_inv !== null) {
    return mult(AtA_inv, At) as PineMatrix<float>;
  }

  // If all else fails, return zero matrix of appropriate dimensions
  return new_matrix<float>(n, m, 0);
}

/**
 * Matrix rank
 *
 * Calculates the rank of a matrix (number of linearly independent rows/columns)
 * using Gaussian elimination to row echelon form.
 *
 * @param id - A matrix object
 * @returns The rank of the matrix
 *
 * @remarks
 * Uses row reduction with partial pivoting.
 * Time complexity: O(n³)
 *
 * @example
 * ```typescript
 * // Create a 2x2 matrix
 * const m1 = matrix.new_matrix(2, 2, NaN);
 * matrix.set(m1, 0, 0, 1);
 * matrix.set(m1, 0, 1, 2);
 * matrix.set(m1, 1, 0, 3);
 * matrix.set(m1, 1, 1, 4);
 *
 * const r = matrix.rank(m1); // Returns: 2
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.rank | PineScript matrix.rank}
 */
export function rank(id: PineMatrix<float>): int {
  if (id.rows === 0 || id.columns === 0) {
    return 0;
  }

  // Make a copy to work with
  const a: float[][] = id.data.map(row => [...row]);
  const m = id.rows;
  const n = id.columns;

  let r = 0; // Current rank (and current pivot row)

  for (let col = 0; col < n && r < m; col++) {
    // Find pivot
    let maxRow = r;
    let maxVal = Math.abs(a[r]![col]!);
    for (let row = r + 1; row < m; row++) {
      const absVal = Math.abs(a[row]![col]!);
      if (absVal > maxVal) {
        maxVal = absVal;
        maxRow = row;
      }
    }

    // Skip column if all values below are effectively zero
    if (maxVal < EPSILON) {
      continue;
    }

    // Swap rows if needed
    if (maxRow !== r) {
      const temp = a[r]!;
      a[r] = a[maxRow]!;
      a[maxRow] = temp;
    }

    // Eliminate below pivot
    const pivot = a[r]![col]!;
    for (let row = r + 1; row < m; row++) {
      const factor = a[row]![col]! / pivot;
      for (let j = col; j < n; j++) {
        a[row]![j] = a[row]![j]! - factor * a[r]![j]!;
      }
    }

    r++;
  }

  return r;
}

/**
 * Matrix eigenvalues
 *
 * Computes the eigenvalues of a square matrix using the QR algorithm.
 *
 * @param id - A matrix object (must be square)
 * @returns An array containing the eigenvalues
 *
 * @remarks
 * Uses the Implicit QL Algorithm with shifts.
 * For non-symmetric matrices, only real eigenvalues are returned accurately.
 * Complex eigenvalues return their real part for 2x2 matrices.
 * Time complexity: O(n³) per iteration, typically converges in O(n) iterations.
 *
 * @example
 * ```typescript
 * // Create a 2x2 matrix
 * const m1 = matrix.new_matrix(2, 2, NaN);
 * matrix.set(m1, 0, 0, 2);
 * matrix.set(m1, 0, 1, 4);
 * matrix.set(m1, 1, 0, 6);
 * matrix.set(m1, 1, 1, 8);
 *
 * const ev = matrix.eigenvalues(m1); // Returns eigenvalues
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.eigenvalues | PineScript matrix.eigenvalues}
 */
export function eigenvalues(id: PineMatrix<float>): PineArray<float> {
  if (!is_square(id)) {
    throw new Error(`Matrix must be square for eigenvalue calculation: ${id.rows}x${id.columns}`);
  }

  const n = id.rows;

  if (n === 0) {
    return [] as PineArray<float>;
  }

  if (n === 1) {
    return [id.data[0]![0]!] as PineArray<float>;
  }

  // For 2x2 matrices, use quadratic formula
  if (n === 2) {
    const a = id.data[0]![0]!;
    const b = id.data[0]![1]!;
    const c = id.data[1]![0]!;
    const d = id.data[1]![1]!;

    // Characteristic polynomial: λ² - (a+d)λ + (ad-bc) = 0
    const trace = a + d;
    const determinant = a * d - b * c;
    const discriminant = trace * trace - 4 * determinant;

    if (discriminant >= 0) {
      const sqrtDisc = Math.sqrt(discriminant);
      return [(trace + sqrtDisc) / 2, (trace - sqrtDisc) / 2] as PineArray<float>;
    } else {
      // Complex eigenvalues - return real parts
      return [trace / 2, trace / 2] as PineArray<float>;
    }
  }

  // For larger matrices, use QR algorithm
  // First, reduce to Hessenberg form (more efficient for QR)
  const h = toHessenberg(id);
  const result = qrAlgorithm(h, 100); // Max 100 iterations

  return result as PineArray<float>;
}

/**
 * Helper: Convert matrix to upper Hessenberg form
 */
function toHessenberg(m: PineMatrix<float>): PineMatrix<float> {
  const n = m.rows;
  const h: float[][] = m.data.map(row => [...row]);

  for (let k = 0; k < n - 2; k++) {
    // Find the largest element in column k below diagonal
    let maxVal = 0;
    for (let i = k + 1; i < n; i++) {
      maxVal = Math.max(maxVal, Math.abs(h[i]![k]!));
    }

    if (maxVal < EPSILON) continue;

    // Compute Householder vector
    let sigma = 0;
    for (let i = k + 1; i < n; i++) {
      sigma += h[i]![k]! * h[i]![k]!;
    }
    sigma = Math.sqrt(sigma);

    if (h[k + 1]![k]! < 0) sigma = -sigma;

    const u: float[] = new Array(n).fill(0);
    u[k + 1] = h[k + 1]![k]! + sigma;
    for (let i = k + 2; i < n; i++) {
      u[i] = h[i]![k]!;
    }

    let uTu = 0;
    for (let i = k + 1; i < n; i++) {
      uTu += u[i]! * u[i]!;
    }

    if (uTu < EPSILON) continue;

    // Apply H = I - 2*u*u'/u'u from left and right
    // H * A
    for (let j = k; j < n; j++) {
      let dot = 0;
      for (let i = k + 1; i < n; i++) {
        dot += u[i]! * h[i]![j]!;
      }
      const factor = 2 * dot / uTu;
      for (let i = k + 1; i < n; i++) {
        h[i]![j] = h[i]![j]! - factor * u[i]!;
      }
    }

    // A * H
    for (let i = 0; i < n; i++) {
      let dot = 0;
      for (let j = k + 1; j < n; j++) {
        dot += h[i]![j]! * u[j]!;
      }
      const factor = 2 * dot / uTu;
      for (let j = k + 1; j < n; j++) {
        h[i]![j] = h[i]![j]! - factor * u[j]!;
      }
    }
  }

  return { rows: n, columns: n, data: h };
}

/**
 * Helper: QR algorithm for eigenvalues
 */
function qrAlgorithm(h: PineMatrix<float>, maxIter: int): float[] {
  const n = h.rows;
  const a: float[][] = h.data.map(row => [...row]);
  const eigenvals: float[] = [];

  let remaining = n;

  for (let iter = 0; iter < maxIter && remaining > 1; iter++) {
    // Check for convergence (subdiagonal element near zero)
    let converged = false;
    for (let i = remaining - 1; i >= 1; i--) {
      if (Math.abs(a[i]![i - 1]!) < EPSILON * (Math.abs(a[i - 1]![i - 1]!) + Math.abs(a[i]![i]!))) {
        a[i]![i - 1] = 0;
        if (i === remaining - 1) {
          eigenvals.push(a[remaining - 1]![remaining - 1]!);
          remaining--;
          converged = true;
          break;
        }
      }
    }

    if (converged) continue;
    if (remaining <= 1) break;

    // Wilkinson shift
    const d = (a[remaining - 2]![remaining - 2]! - a[remaining - 1]![remaining - 1]!) / 2;
    const sign = d >= 0 ? 1 : -1;
    const mu = a[remaining - 1]![remaining - 1]! -
      sign * a[remaining - 1]![remaining - 2]! * a[remaining - 1]![remaining - 2]! /
      (Math.abs(d) + Math.sqrt(d * d + a[remaining - 1]![remaining - 2]! * a[remaining - 1]![remaining - 2]!));

    // QR step with shift
    let x = a[0]![0]! - mu;
    let z = a[1]![0]!;

    for (let k = 0; k < remaining - 1; k++) {
      // Givens rotation
      let r = Math.sqrt(x * x + z * z);
      if (r < EPSILON) {
        r = EPSILON;
      }
      const c = x / r;
      const s = z / r;

      // Apply rotation from left
      for (let j = Math.max(0, k - 1); j < remaining; j++) {
        const temp = c * a[k]![j]! + s * a[k + 1]![j]!;
        a[k + 1]![j] = -s * a[k]![j]! + c * a[k + 1]![j]!;
        a[k]![j] = temp;
      }

      // Apply rotation from right
      for (let i = 0; i < Math.min(k + 3, remaining); i++) {
        const temp = c * a[i]![k]! + s * a[i]![k + 1]!;
        a[i]![k + 1] = -s * a[i]![k]! + c * a[i]![k + 1]!;
        a[i]![k] = temp;
      }

      if (k < remaining - 2) {
        x = a[k + 1]![k]!;
        z = a[k + 2]![k]!;
      }
    }
  }

  // Extract remaining eigenvalues from diagonal
  for (let i = 0; i < remaining; i++) {
    eigenvals.push(a[i]![i]!);
  }

  // Sort eigenvalues in descending order by absolute value
  eigenvals.sort((a, b) => Math.abs(b) - Math.abs(a));

  return eigenvals;
}

/**
 * Matrix eigenvectors
 *
 * Returns a matrix of eigenvectors, where each column is an eigenvector
 * corresponding to an eigenvalue.
 *
 * @param id - A matrix object (must be square)
 * @returns A new matrix where columns are eigenvectors
 *
 * @remarks
 * Uses inverse iteration method to compute eigenvectors from eigenvalues.
 * Eigenvectors are normalized to unit length.
 * Time complexity: O(n³)
 *
 * @example
 * ```typescript
 * // Create a 2x2 matrix
 * const m1 = matrix.new_matrix(2, 2, 1);
 * matrix.set(m1, 0, 0, 2);
 * matrix.set(m1, 0, 1, 4);
 * matrix.set(m1, 1, 0, 6);
 * matrix.set(m1, 1, 1, 8);
 *
 * const evecs = matrix.eigenvectors(m1);
 * // Each column is an eigenvector
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.eigenvectors | PineScript matrix.eigenvectors}
 */
export function eigenvectors(id: PineMatrix<float>): PineMatrix<float> {
  if (!is_square(id)) {
    throw new Error(`Matrix must be square for eigenvector calculation: ${id.rows}x${id.columns}`);
  }

  const n = id.rows;

  if (n === 0) {
    return new_matrix<float>(0, 0, 0);
  }

  // Get eigenvalues first
  const evals = eigenvalues(id);

  // For each eigenvalue, compute eigenvector using inverse iteration
  const vectors: float[][] = [];

  for (let i = 0; i < n; i++) {
    const lambda = evals[i]!;
    const vec = inverseIteration(id, lambda);
    vectors.push(vec);
  }

  // Transpose to get eigenvectors as columns
  const result: float[][] = [];
  for (let i = 0; i < n; i++) {
    const row: float[] = [];
    for (let j = 0; j < n; j++) {
      row.push(vectors[j]![i]!);
    }
    result.push(row);
  }

  return {
    rows: n,
    columns: n,
    data: result
  };
}

/**
 * Helper: Inverse iteration for eigenvector computation
 */
function inverseIteration(m: PineMatrix<float>, lambda: float): float[] {
  const n = m.rows;

  // Create (A - λI)
  const shifted: float[][] = m.data.map((row, i) =>
    row.map((val, j) => i === j ? val - lambda : val)
  );

  // Add small perturbation to avoid singular matrix
  for (let i = 0; i < n; i++) {
    if (Math.abs(shifted[i]![i]!) < EPSILON) {
      shifted[i]![i] = EPSILON;
    }
  }

  // Initialize random vector
  let v: float[] = new Array(n).fill(1);

  // Iterate
  for (let iter = 0; iter < 50; iter++) {
    // Solve (A - λI) * w = v using LU decomposition
    const w = solveLinearSystem(shifted, v);

    // Normalize
    let norm = 0;
    for (let i = 0; i < n; i++) {
      norm += w[i]! * w[i]!;
    }
    norm = Math.sqrt(norm);

    if (norm < EPSILON) {
      return v;
    }

    const newV: float[] = [];
    for (let i = 0; i < n; i++) {
      newV.push(w[i]! / norm);
    }

    // Check convergence
    let diff = 0;
    for (let i = 0; i < n; i++) {
      diff += Math.abs(Math.abs(newV[i]!) - Math.abs(v[i]!));
    }

    v = newV;

    if (diff < EPSILON) {
      break;
    }
  }

  return v;
}

/**
 * Helper: Solve linear system Ax = b using Gaussian elimination
 */
function solveLinearSystem(a: float[][], b: float[]): float[] {
  const n = a.length;

  // Create augmented matrix
  const aug: float[][] = a.map((row, i) => [...row, b[i]!]);

  // Forward elimination with partial pivoting
  for (let col = 0; col < n; col++) {
    // Find pivot
    let maxRow = col;
    let maxVal = Math.abs(aug[col]![col]!);
    for (let row = col + 1; row < n; row++) {
      const absVal = Math.abs(aug[row]![col]!);
      if (absVal > maxVal) {
        maxVal = absVal;
        maxRow = row;
      }
    }

    // Swap rows
    if (maxRow !== col) {
      const temp = aug[col]!;
      aug[col] = aug[maxRow]!;
      aug[maxRow] = temp;
    }

    const pivot = aug[col]![col]!;
    if (Math.abs(pivot) < EPSILON) {
      continue;
    }

    // Eliminate
    for (let row = col + 1; row < n; row++) {
      const factor = aug[row]![col]! / pivot;
      for (let j = col; j <= n; j++) {
        aug[row]![j] = aug[row]![j]! - factor * aug[col]![j]!;
      }
    }
  }

  // Back substitution
  const x: float[] = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = aug[i]![n]!;
    for (let j = i + 1; j < n; j++) {
      sum -= aug[i]![j]! * x[j]!;
    }
    const diag = aug[i]![i]!;
    x[i] = Math.abs(diag) < EPSILON ? 0 : sum / diag;
  }

  return x;
}

/**
 * Kronecker product
 *
 * Computes the Kronecker (tensor) product of two matrices.
 * Each element of id1 is multiplied by the entire id2 matrix.
 *
 * @param id1 - First matrix object
 * @param id2 - Second matrix object
 * @returns A new matrix containing the Kronecker product
 *
 * @remarks
 * Result size: (m₁×m₂) rows by (n₁×n₂) columns.
 * Time complexity: O(m₁×m₂×n₁×n₂)
 *
 * @example
 * ```typescript
 * // Create two 2x2 matrices
 * const m1 = matrix.new_matrix(2, 2, 1);
 * const m2 = matrix.new_matrix(2, 2, 2);
 *
 * const m3 = matrix.kron(m1, m2);
 * // Result is a 4x4 matrix
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.kron | PineScript matrix.kron}
 */
export function kron(id1: PineMatrix<float>, id2: PineMatrix<float>): PineMatrix<float> {
  const m1 = id1.rows;
  const n1 = id1.columns;
  const m2 = id2.rows;
  const n2 = id2.columns;

  const resultRows = m1 * m2;
  const resultCols = n1 * n2;
  const data: float[][] = [];

  for (let i = 0; i < resultRows; i++) {
    data.push(new Array(resultCols).fill(0));
  }

  for (let i1 = 0; i1 < m1; i1++) {
    for (let j1 = 0; j1 < n1; j1++) {
      const a = id1.data[i1]![j1]!;
      for (let i2 = 0; i2 < m2; i2++) {
        for (let j2 = 0; j2 < n2; j2++) {
          const row = i1 * m2 + i2;
          const col = j1 * n2 + j2;
          data[row]![col] = a * id2.data[i2]![j2]!;
        }
      }
    }
  }

  return {
    rows: resultRows,
    columns: resultCols,
    data
  };
}

/**
 * Create matrix of user-defined type
 *
 * Creates a new matrix that can hold user-defined types.
 * This is a placeholder that functions identically to new_matrix() for now,
 * as JavaScript doesn't have the same type system as PineScript.
 *
 * @param rows - Initial row count
 * @param columns - Initial column count
 * @param initial_value - Initial value for all elements
 * @returns A new matrix object
 *
 * @remarks
 * In PineScript, this is used for matrices containing user-defined types (UDTs).
 * In JavaScript, this behaves the same as new_matrix() since type handling
 * is done at runtime.
 *
 * @example
 * ```typescript
 * // Create a 2x2 matrix that could hold any type
 * const m = matrix.newtype(2, 2, { name: 'default', value: 0 });
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_matrix.new<type> | PineScript matrix.new<type>}
 */
export function newtype<T>(
  rows: simple_int = 0,
  columns: simple_int = 0,
  initial_value?: T
): PineMatrix<T> {
  return new_matrix(rows, columns, initial_value);
}
