# Function Inventory - OakScriptJS

This document tracks the implementation status of all PineScript v6 functions for included namespaces.

**Last Updated:** 2025-01-03

## Summary

| Namespace | Total Functions | Implemented | Not Implemented | Completion % |
|-----------|----------------|-------------|-----------------|--------------|
| **ta** | 58 | 43 | 15 | 74% |
| **math** | 24 | 24 | 0 | 100% |
| **array** | 57 | 34 | 23 | 60% |
| **matrix** | 49 | 1 | 48 | 2% |
| **str** | 18 | 18 | 0 | 100% |
| **time** | 1 | 1 | 0 | 100% |
| **color** | 8 | 8 | 0 | 100% |
| **TOTAL** | **215** | **129** | **86** | **60%** |

---

## ta (Technical Analysis)

### ✅ Implemented (43 functions)

1. `atr()` - Average True Range
2. `barssince()` - Number of bars since condition was true ✨ NEW
3. `bb()` - Bollinger Bands
4. `bbw()` - Bollinger Bands Width ✨ NEW
5. `cci()` - Commodity Channel Index ✨ NEW
6. `change()` - Difference between current and previous value
7. `cmo()` - Chande Momentum Oscillator ✨ NEW
8. `correlation()` - Correlation coefficient between two series
9. `cross()` - Detects when two series cross
10. `crossover()` - Detects when series1 crosses over series2
11. `crossunder()` - Detects when series1 crosses under series2
12. `cum()` - Cumulative sum
13. `dev()` - Mean absolute deviation
14. `dmi()` - Directional Movement Index ✨ NEW
15. `ema()` - Exponential Moving Average
16. `falling()` - Tests if series is falling
17. `highest()` - Highest value over a period
18. `hma()` - Hull Moving Average ✨ NEW
19. `kc()` - Keltner Channels ✨ NEW
20. `linreg()` - Linear regression
21. `lowest()` - Lowest value over a period
22. `macd()` - Moving Average Convergence Divergence
23. `median()` - Median value over a period
24. `mfi()` - Money Flow Index ✨ NEW
25. `mom()` - Momentum
26. `percentrank()` - Percent rank over a period
27. `pivothigh()` - Detects pivot high points ✨ NEW
28. `pivotlow()` - Detects pivot low points ✨ NEW
29. `rising()` - Tests if series is rising
30. `rma()` - Relative Moving Average (exponential moving average with alpha = 1 / length)
31. `roc()` - Rate of Change
32. `rsi()` - Relative Strength Index
33. `sar()` - Parabolic SAR ✨ NEW
34. `sma()` - Simple Moving Average
35. `stdev()` - Standard deviation
36. `stoch()` - Stochastic oscillator ✨ NEW
37. `supertrend()` - SuperTrend indicator
38. `swma()` - Symmetrically Weighted Moving Average
39. `tr()` - True Range
40. `tsi()` - True Strength Index ✨ NEW
41. `valuewhen()` - Returns value when condition was true ✨ NEW
42. `variance()` - Variance
43. `vwma()` - Volume Weighted Moving Average
44. `wma()` - Weighted Moving Average

### ❌ Not Implemented (15 functions)

1. `alma()` - Arnaud Legoux Moving Average
2. `cog()` - Center of Gravity
3. `highestbars()` - Offset to the highest value
4. `kcw()` - Keltner Channels Width
5. `lowestbars()` - Offset to the lowest value
6. `max()` - Maximum value (different from highest - works with two values)
7. `min()` - Minimum value (different from lowest - works with two values)
8. `mode()` - Mode (most frequently occurring value)
9. `percentile_linear_interpolation()` - Percentile using linear interpolation
10. `percentile_nearest_rank()` - Percentile using nearest rank
11. `pivot_point_levels()` - Pivot point levels
12. `range()` - Difference between highest and lowest values
13. `rci()` - Rank Correlation Index
14. `vwap()` - Volume Weighted Average Price
15. `wpr()` - Williams %R

---

## math (Mathematics)

### ✅ Implemented (24 functions)

1. `abs()` - Absolute value
2. `acos()` - Arc cosine (inverse cosine)
3. `asin()` - Arc sine (inverse sine)
4. `atan()` - Arc tangent (inverse tangent)
5. `avg()` - Average of arguments
6. `ceil()` - Ceiling (round up)
7. `cos()` - Cosine
8. `exp()` - Exponential (e^x)
9. `floor()` - Floor (round down)
10. `log()` - Natural logarithm (ln)
11. `log10()` - Base-10 logarithm
12. `max()` - Maximum of arguments
13. `min()` - Minimum of arguments
14. `pow()` - Power (x^y)
15. `random()` - Random number (NOTE: seed parameter not implemented)
16. `round()` - Round to nearest integer or precision
17. `round_to_mintick()` - Round to nearest tick size ✨ NEW
18. `sign()` - Sign of number (-1, 0, 1)
19. `sin()` - Sine
20. `sqrt()` - Square root
21. `sum()` - Sum over a series/window
22. `tan()` - Tangent
23. `todegrees()` - Convert radians to degrees
24. `toradians()` - Convert degrees to radians

**Constants:**
- `pi` - π (3.14159...)
- `e` - Euler's number (2.71828...)
- `phi` - Golden ratio (1.618...)
- `rphi` - Reciprocal of golden ratio (0.618...)

### ❌ Not Implemented (0 functions)

**All math functions are now implemented!** 🎉

---

## array (Array Operations)

### ✅ Implemented (34 functions)

1. `avg()` - Average of array elements
2. `clear()` - Remove all elements
3. `concat()` - Concatenate two arrays
4. `copy()` - Create a shallow copy
5. `every()` - Test if all elements satisfy condition ✨ NEW
6. `fill()` - Fill array with value
7. `first()` - Get first element ✨ NEW
8. `from()` - Create array from existing one
9. `get()` - Get element at index
10. `includes()` - Check if array contains value
11. `indexof()` - Find first index of value
12. `insert()` - Insert value at index
13. `join()` - Join elements into string
14. `last()` - Get last element ✨ NEW
15. `lastindexof()` - Find last index of value
16. `max()` - Maximum value in array
17. `median()` - Median value in array
18. `min()` - Minimum value in array
19. `mode()` - Most frequent value in array
20. `new_array()` - Create new array (aliased as `new_<type>` variants)
21. `pop()` - Remove and return last element
22. `push()` - Add element to end
23. `remove()` - Remove element at index
24. `reverse()` - Reverse array in place
25. `set()` - Set element at index
26. `shift()` - Remove and return first element
27. `size()` - Get array length
28. `slice()` - Get sub-array
29. `some()` - Test if any element satisfies condition ✨ NEW
30. `sort()` - Sort array in place
31. `stdev()` - Standard deviation of array
32. `sum()` - Sum of array elements
33. `unshift()` - Add element to beginning
34. `variance()` - Variance of array

### ❌ Not Implemented (23 functions)

1. `abs()` - Absolute values of elements
2. `binary_search()` - Binary search for value
3. `binary_search_leftmost()` - Binary search returning leftmost index
4. `binary_search_rightmost()` - Binary search returning rightmost index
5. `covariance()` - Covariance of two arrays
6. `new_bool()` - Create new boolean array
7. `new_box()` - Create new box array (excluded - rendering)
8. `new_color()` - Create new color array
9. `new_float()` - Create new float array
10. `new_int()` - Create new int array
11. `new_label()` - Create new label array (excluded - rendering)
12. `new_line()` - Create new line array (excluded - rendering)
13. `new_linefill()` - Create new linefill array (excluded - rendering)
14. `new_string()` - Create new string array
15. `new_table()` - Create new table array (excluded - rendering)
16. `newtype()` - Create array of user-defined type
17. `percentile_linear_interpolation()` - Percentile using linear interpolation
18. `percentile_nearest_rank()` - Percentile using nearest rank
19. `percentrank()` - Percent rank of value in array
20. `range()` - Difference between max and min
21. `sort_indices()` - Get indices that would sort the array
22. `standardize()` - Standardize array (z-score normalization)

---

## matrix (Matrix Operations)

### ✅ Implemented (1 function)

1. `new_matrix()` - Create new matrix (basic implementation)

### ❌ Not Implemented (48 functions)

1. `add_col()` - Add column to matrix
2. `add_row()` - Add row to matrix
3. `avg()` - Average of matrix elements
4. `col()` - Get column as array
5. `columns()` - Get number of columns
6. `concat()` - Concatenate matrices
7. `copy()` - Create a copy
8. `det()` - Determinant
9. `diff()` - Difference between matrices
10. `eigenvalues()` - Eigenvalues of matrix
11. `eigenvectors()` - Eigenvectors of matrix
12. `elements_count()` - Total number of elements
13. `fill()` - Fill matrix with value
14. `get()` - Get element at position
15. `inv()` - Matrix inverse
16. `is_antidiagonal()` - Test if antidiagonal
17. `is_antisymmetric()` - Test if antisymmetric
18. `is_binary()` - Test if binary
19. `is_diagonal()` - Test if diagonal
20. `is_identity()` - Test if identity matrix
21. `is_square()` - Test if square
22. `is_stochastic()` - Test if stochastic
23. `is_symmetric()` - Test if symmetric
24. `is_triangular()` - Test if triangular
25. `is_zero()` - Test if zero matrix
26. `kron()` - Kronecker product
27. `max()` - Maximum element
28. `median()` - Median element
29. `min()` - Minimum element
30. `mode()` - Mode (most frequent element)
31. `mult()` - Matrix multiplication
32. `newtype()` - Create matrix of user-defined type
33. `pinv()` - Pseudo-inverse
34. `pow()` - Matrix power
35. `rank()` - Matrix rank
36. `remove_col()` - Remove column
37. `remove_row()` - Remove row
38. `reshape()` - Reshape matrix
39. `reverse()` - Reverse matrix
40. `row()` - Get row as array
41. `rows()` - Get number of rows
42. `set()` - Set element at position
43. `sort()` - Sort matrix
44. `submatrix()` - Extract submatrix
45. `sum()` - Sum of elements
46. `swap_columns()` - Swap two columns
47. `swap_rows()` - Swap two rows
48. `trace()` - Matrix trace
49. `transpose()` - Matrix transpose

---

## str (String Operations)

### ✅ Implemented (18 functions)

1. `charAt()` - Get character at index (custom addition)
2. `concat()` - Concatenate strings (custom addition)
3. `contains()` - Check if string contains substring
4. `endswith()` - Check if string ends with suffix
5. `format()` - Format string with arguments
6. `length()` - Get string length
7. `lower()` - Convert to lowercase
8. `match()` - Match regular expression
9. `pos()` - Find position of substring
10. `replace()` - Replace first occurrence (custom - PineScript has replace_all)
11. `split()` - Split string into array
12. `startswith()` - Check if string starts with prefix
13. `substring()` - Extract substring
14. `tonumber()` - Convert string to number
15. `tostring()` - Convert value to string
16. `trim()` - Remove whitespace from both ends
17. `trimLeft()` - Remove whitespace from left (custom addition)
18. `trimRight()` - Remove whitespace from right (custom addition)
19. `upper()` - Convert to uppercase

### ❌ Not Implemented (0 functions)

**Note:** All PineScript v6 string functions are implemented. Some custom additions (charAt, concat, trimLeft, trimRight) are included for developer convenience beyond the PineScript API.

However, there are 2 PineScript functions with slightly different implementations:
- `replace_all()` - We have `replace()` which replaces first occurrence
- `format_time()` - Not implemented (time formatting)
- `repeat()` - Not implemented (repeat string n times)

---

## time (Time Operations)

### ✅ Implemented (1 function)

1. `time()` - Convert time components to timestamp (basic implementation)

**Note:** The `time` namespace in PineScript v6 has only 1 function. We also implemented:
- `timestamp()` - Custom addition for convenience
- `now()` - Custom addition for convenience

### ❌ Not Implemented (0 functions)

All core time functions are implemented. Extended time operations are typically done through the `time()` built-in function in PineScript (not in the `time` namespace).

---

## color (Color Operations)

### ✅ Implemented (8 functions)

1. `b()` - Extract blue component
2. `from_gradient()` - Create color from gradient between two colors ✨ NEW
3. `from_hex()` - Create color from hex string
4. `g()` - Extract green component
5. `new_color()` - Create new color with transparency (aliased as `color()`)
6. `r()` - Extract red component
7. `rgb()` - Create RGB color
8. `t()` - Extract transparency component

**Constants:** All standard PineScript color constants are implemented (red, green, blue, yellow, etc.)

### ❌ Not Implemented (0 functions)

**All color functions are now implemented!** 🎉

---

## Priority Recommendations

Based on the inventory, here are recommended priorities for implementation:

### High Priority (Common & Essential)

**ta namespace:**
1. ~~`cci()` - Commodity Channel Index - widely used oscillator~~ ✅ IMPLEMENTED
2. ~~`stoch()` - Stochastic oscillator - essential indicator~~ ✅ IMPLEMENTED
3. ~~`mfi()` - Money Flow Index - volume-based indicator~~ ✅ IMPLEMENTED
4. ~~`sar()` - Parabolic SAR - popular trend indicator~~ ✅ IMPLEMENTED
5. ~~`hma()` - Hull Moving Average - modern MA variant~~ ✅ IMPLEMENTED
6. `vwap()` - Volume Weighted Average Price - institutional favorite
7. ~~`pivothigh()` / `pivotlow()` - Pivot detection - very useful for trading~~ ✅ IMPLEMENTED
8. ~~`barssince()` - Bar counting - useful for many strategies~~ ✅ IMPLEMENTED
9. ~~`valuewhen()` - Historical value lookup - very useful utility~~ ✅ IMPLEMENTED

**array namespace:**
10. ~~`first()` / `last()` - Common array accessors~~ ✅ IMPLEMENTED
11. ~~`some()` / `every()` - Logical tests on arrays~~ ✅ IMPLEMENTED
12. `binary_search()` - Efficient searching
13. `range()` - Quick max-min calculation

**matrix namespace:**
14. `mult()` - Matrix multiplication - fundamental operation
15. `transpose()` - Matrix transpose - fundamental operation
16. `add()` / `diff()` - Basic matrix arithmetic
17. `get()` / `set()` - Element access

### Medium Priority (Useful)

**ta namespace:**
1. ~~`dmi()` - Directional Movement Index~~ ✅ IMPLEMENTED
2. ~~`tsi()` - True Strength Index~~ ✅ IMPLEMENTED
3. ~~`cmo()` - Chande Momentum Oscillator~~ ✅ IMPLEMENTED
4. ~~`kc()` - Keltner Channels~~ ✅ IMPLEMENTED / `kcw()` - Keltner Channels Width
5. ~~`bbw()` - Bollinger Bands Width~~ ✅ IMPLEMENTED

**array namespace:**
6. `covariance()` - Statistical analysis
7. `percentile_*()` - Percentile calculations
8. `standardize()` - Data normalization

**math namespace:**
9. ~~`round_to_mintick()` - Trading-specific rounding~~ ✅ IMPLEMENTED

### Low Priority (Specialized)

**ta namespace:**
1. `alma()` - Arnaud Legoux MA - less common
2. `cog()` - Center of Gravity - niche
3. `rci()` - Rank Correlation Index - niche
4. `pivot_point_levels()` - Can be calculated manually

**matrix namespace:**
- Most advanced matrix operations (eigenvalues, inverse, etc.) - specialized use cases

---

## Notes

1. **Rendering Functions Excluded**: Functions related to plotting, labels, lines, boxes, and tables are intentionally excluded as they require a rendering engine.

2. **Context API**: Some functions (like `ta.atr()`, `ta.tr()`, `ta.supertrend()`) require chart data (high, low, close). Use `createContext()` for cleaner API that matches PineScript.

3. **Deterministic Random**: `math.random()` accepts a seed parameter but doesn't implement deterministic randomness yet.

4. **Type-Specific Arrays**: Array functions like `new_bool()`, `new_int()`, `new_float()`, `new_string()` can be implemented as type-specific wrappers around `new_array()`.

5. **Matrix Implementation**: The matrix namespace has minimal implementation (2%) and represents the largest opportunity for expansion.

6. **String Functions**: Fully implemented (100%)! All PineScript string manipulation functions are available.

---

## Contributing

When implementing new functions:

1. Match PineScript v6 API signatures exactly
2. Add comprehensive JSDoc comments
3. Include examples in documentation
4. Add unit tests with expected outputs from PineScript
5. Update this inventory file
6. Consider adding the function to context API if it requires chart data

For questions about priorities or implementation details, see the PineScript v6 reference documentation in `docs/reference/functions/`.
