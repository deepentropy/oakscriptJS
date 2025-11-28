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
export function sort<T>(id: PineMatrix<T>, column: simple_int = 0, order: 'ascending' | 'descending' = 'ascending'): void {
  if (column < 0 || column >= id.columns) {
    throw new Error(`Column index out of bounds: ${column} for matrix with ${id.columns} columns`);
  }

  id.data.sort((a, b) => {
    const valA = a[column] as any;
    const valB = b[column] as any;
    if (order === 'ascending') {
      return valA - valB;
    } else {
      return valB - valA;
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
      if (id.data[i]![j] !== -id.data[j]![i]!) {
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
