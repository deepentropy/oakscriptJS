# Function Inventory - OakScriptJS

This document tracks the implementation status of all PineScript v6 functions against the official language reference (`docs/official/language-reference/functions/`).

**Last Updated:** February 2026 (v0.2.1)

## Architecture Overview

OakScriptJS is a **simplified PineScript-like library** providing:

1. **Core Functions** (array-based): Pure calculation functions from `ta.*`, `math.*`, `array.*`, etc.
2. **Series Class**: Lazy evaluation with operator chaining for native PineScript-like syntax
   - **BarData**: Versioned wrapper for automatic cache invalidation
   - **materialize()**: Breaks closure chains for memory efficiency
3. **TA-Series Wrappers**: Series-based wrappers around core TA functions
4. **Metadata Types**: Type definitions for indicator results (plots, hlines, fills)

**No DSL Layer**: This library focuses on the computational core. For ready-to-use indicators, see the `@oakscript/indicators` package.

## Summary

**Official PineScript v6 reference:** 457 function doc files across ~20 namespaces.

### In-Scope Namespaces

| Namespace | Official Functions | Implemented | Not Implemented | Completion % |
|-----------|-------------------|-------------|-----------------|--------------|
| **ta** | 59 | 59 (+2 custom) | 0 | 100% |
| **math** | 24 | 24 | 0 | 100% |
| **array** | 55 | 54 (+1 custom) | 1 | 98.2% |
| **matrix** | 50 | 50 (+1 custom) | 0 | 100% |
| **str** | 18 | 18 (+4 custom) | 0 | 100% |
| **time + timeframe** | 5 | 1 (+2 custom) | 4 | 20% |
| **color** | 7 | 7 (+1 custom) | 0 | 100% |
| **line** | 21 | 19 | 2 | 90.5% |
| **box** | 29 | 27 | 2 | 93.1% |
| **label** | 21 | 19 | 2 | 90.5% |
| **linefill** | 5 | 5 | 0 | 100% |
| **chartPoint** | 5 | 4 | 1 | 80% |
| **polyline** | 2 | 2 (+1 custom) | 0 | 100% |
| **map** | 11 | 0 | 11 | 0% |
| **TOTAL** | **312** | **289** | **23** | **92.6%** |

### Out-of-Scope Namespaces (Platform/Rendering/Data)

These namespaces exist in the official PineScript v6 reference but are outside the library's computational scope:

| Namespace | Official Functions | Reason |
|-----------|-------------------|--------|
| **strategy** | 47 | Trading execution engine |
| **table** | 22 | Rendering-only (no getters) |
| **input** | 13 | UI/platform interaction |
| **request** | 10 | External data fetching |
| **ticker** | 9 | Symbol/ticker construction |
| **log** | 3 | Runtime logging |
| **syminfo** | 2 | Platform symbol metadata |
| **Standalone** | ~34 | Mixed: `plot`, `indicator`, `alert`, `na`, `nz`, `fill`, time helpers, type constructors, etc. |
| **TOTAL** | **~140** | -- |

---

## ta (Technical Analysis)

### Implemented (59 official + 2 custom = 61 functions)

1. `alma()` - Arnaud Legoux Moving Average
2. `atr()` - Average True Range
3. `barssince()` - Number of bars since condition was true
4. `bb()` - Bollinger Bands
5. `bbw()` - Bollinger Bands Width
6. `cci()` - Commodity Channel Index
7. `change()` - Difference between current and previous value
8. `cmo()` - Chande Momentum Oscillator
9. `cog()` - Center of Gravity
10. `correlation()` - Correlation coefficient between two series
11. `cross()` - Detects when two series cross
12. `crossover()` - Detects when series1 crosses over series2
13. `crossunder()` - Detects when series1 crosses under series2
14. `cum()` - Cumulative sum
15. `dev()` - Mean absolute deviation
16. `dmi()` - Directional Movement Index
17. `ema()` - Exponential Moving Average
18. `falling()` - Tests if series is falling
19. `highest()` - Highest value over a period
20. `highestbars()` - Offset to the highest value
21. `hma()` - Hull Moving Average
22. `ichimoku()` - Ichimoku Kinko Hyo (custom, not in official PineScript v6)
23. `kc()` - Keltner Channels
24. `kcw()` - Keltner Channels Width
25. `linreg()` - Linear regression
26. `lowest()` - Lowest value over a period
27. `lowestbars()` - Offset to the lowest value
28. `macd()` - Moving Average Convergence Divergence
29. `max()` - Maximum of two values
30. `median()` - Median value over a period
31. `mfi()` - Money Flow Index
32. `min()` - Minimum of two values
33. `mode()` - Mode (most frequently occurring value)
34. `mom()` - Momentum
35. `percentile_linear_interpolation()` - Percentile using linear interpolation
36. `percentile_nearest_rank()` - Percentile using nearest rank
37. `percentrank()` - Percent rank over a period
38. `pivot_point_levels()` - Pivot point levels (Traditional, Fibonacci, Woodie, Classic, DM, Camarilla)
39. `pivothigh()` - Detects pivot high points
40. `pivotlow()` - Detects pivot low points
41. `range()` - High-Low Range
42. `rci()` - Rank Correlation Index (Spearman's rank correlation)
43. `rising()` - Tests if series is rising
44. `rma()` - Relative Moving Average (exponential moving average with alpha = 1 / length)
45. `roc()` - Rate of Change
46. `rsi()` - Relative Strength Index
47. `sar()` - Parabolic SAR
48. `sma()` - Simple Moving Average
49. `stdev()` - Standard deviation
50. `stoch()` - Stochastic oscillator
51. `supertrend()` - SuperTrend indicator
52. `swma()` - Symmetrically Weighted Moving Average
53. `tr()` - True Range
54. `tsi()` - True Strength Index
55. `valuewhen()` - Returns value when condition was true
56. `variance()` - Variance
57. `vwap()` - Volume Weighted Average Price
58. `vwma()` - Volume Weighted Moving Average
59. `wma()` - Weighted Moving Average
60. `wpr()` - Williams %R
61. `zigzag()` - ZigZag indicator (custom, not in official PineScript v6)

### Not Implemented (0 official functions)

All 59 official ta functions are implemented. `ichimoku()` and `zigzag()` are custom additions beyond the official API.

---

## math (Mathematics)

### Implemented (24 functions)

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
17. `round_to_mintick()` - Round to nearest tick size
18. `sign()` - Sign of number (-1, 0, 1)
19. `sin()` - Sine
20. `sqrt()` - Square root
21. `sum()` - Sum over a series/window
22. `tan()` - Tangent
23. `todegrees()` - Convert radians to degrees
24. `toradians()` - Convert degrees to radians

**Constants:** `pi`, `e`, `phi`, `rphi`

### Not Implemented (0 functions)

All 24 official math functions are implemented.

---

## array (Array Operations)

### Implemented (54 official + 1 custom = 55 functions)

1. `abs()` - Absolute values of elements
2. `avg()` - Average of array elements
3. `binary_search()` - Binary search for value
4. `binary_search_leftmost()` - Binary search returning leftmost index
5. `binary_search_rightmost()` - Binary search returning rightmost index
6. `clear()` - Remove all elements
7. `concat()` - Concatenate two arrays
8. `copy()` - Create a shallow copy
9. `covariance()` - Covariance of two arrays
10. `every()` - Test if all elements satisfy condition
11. `fill()` - Fill array with value
12. `first()` - Get first element
13. `from()` - Create array from existing one
14. `get()` - Get element at index
15. `includes()` - Check if array contains value
16. `indexof()` - Find first index of value
17. `insert()` - Insert value at index
18. `join()` - Join elements into string
19. `last()` - Get last element
20. `lastindexof()` - Find last index of value
21. `max()` - Maximum value in array
22. `median()` - Median value in array
23. `min()` - Minimum value in array
24. `mode()` - Most frequent value in array
25. `new_array()` - Create new array (custom generic wrapper, not in official API)
26. `new_bool()` - Create new boolean array
27. `new_box()` - Create new box array
28. `new_color()` - Create new color array
29. `new_float()` - Create new float array
30. `new_int()` - Create new int array
31. `new_label()` - Create new label array
32. `new_line()` - Create new line array
33. `new_linefill()` - Create new linefill array
34. `new_string()` - Create new string array
35. `newtype()` - Create array of user-defined type (placeholder)
36. `percentile_linear_interpolation()` - Percentile using linear interpolation
37. `percentile_nearest_rank()` - Percentile using nearest rank
38. `percentrank()` - Percent rank of value in array
39. `pop()` - Remove and return last element
40. `push()` - Add element to end
41. `range()` - Difference between max and min
42. `remove()` - Remove element at index
43. `reverse()` - Reverse array in place
44. `set()` - Set element at index
45. `shift()` - Remove and return first element
46. `size()` - Get array length
47. `slice()` - Get sub-array
48. `some()` - Test if any element satisfies condition
49. `sort()` - Sort array in place
50. `sort_indices()` - Get indices that would sort the array
51. `standardize()` - Standardize array (z-score normalization)
52. `stdev()` - Standard deviation of array
53. `sum()` - Sum of array elements
54. `unshift()` - Add element to beginning
55. `variance()` - Variance of array

### Not Implemented (1 function)

1. `new_table()` - Create new table array (no computational value - tables have no getters in PineScript)

---

## matrix (Matrix Operations)

### Implemented (50 official + 1 custom = 51 functions)

**Phase 1 - Foundation:**
1. `new_matrix()` - Create new matrix (custom wrapper, official API uses `matrix.newtype`)
2. `get()` - Get element at position
3. `set()` - Set element at position
4. `rows()` - Get number of rows
5. `columns()` - Get number of columns
6. `elements_count()` - Total number of elements
7. `row()` - Get row as array
8. `col()` - Get column as array
9. `copy()` - Create a deep copy
10. `fill()` - Fill matrix with value
11. `is_square()` - Test if square
12. `is_zero()` - Test if zero matrix
13. `is_binary()` - Test if binary

**Phase 2 - Manipulation (Row/Column Operations):**
14. `add_row()` - Add row to matrix
15. `add_col()` - Add column to matrix
16. `remove_row()` - Remove row from matrix
17. `remove_col()` - Remove column from matrix
18. `swap_rows()` - Swap two rows
19. `swap_columns()` - Swap two columns

**Phase 2 - Manipulation (Matrix Transformations):**
20. `transpose()` - Matrix transpose
21. `concat()` - Concatenate matrices
22. `submatrix()` - Extract submatrix
23. `reshape()` - Reshape matrix
24. `reverse()` - Reverse matrix
25. `sort()` - Sort matrix by column

**Phase 2 - Manipulation (Element-wise Arithmetic):**
26. `sum()` - Matrix addition (matrix or scalar)
27. `diff()` - Matrix subtraction (matrix or scalar)

**Phase 2 - Manipulation (Statistical Functions):**
28. `avg()` - Average of all elements
29. `min()` - Minimum element
30. `max()` - Maximum element
31. `median()` - Median element
32. `mode()` - Mode (most frequent element)
33. `trace()` - Matrix trace (sum of diagonal)

**Phase 2 - Manipulation (Boolean Checks):**
34. `is_diagonal()` - Test if diagonal matrix
35. `is_identity()` - Test if identity matrix
36. `is_symmetric()` - Test if symmetric
37. `is_antisymmetric()` - Test if antisymmetric (skew-symmetric)
38. `is_triangular()` - Test if triangular
39. `is_antidiagonal()` - Test if antidiagonal
40. `is_stochastic()` - Test if stochastic

**Phase 3 - Linear Algebra:**
41. `mult()` - Matrix multiplication (matrix x matrix, matrix x scalar, matrix x vector)
42. `pow()` - Matrix power using repeated squaring
43. `det()` - Determinant using LU decomposition with partial pivoting
44. `inv()` - Matrix inverse using Gauss-Jordan elimination
45. `pinv()` - Moore-Penrose pseudo-inverse for any matrix shape
46. `rank()` - Matrix rank via row echelon form
47. `eigenvalues()` - Eigenvalues using QR algorithm
48. `eigenvectors()` - Eigenvectors using inverse iteration
49. `kron()` - Kronecker (tensor) product
50. `newtype()` - Create matrix of user-defined type

### Not Implemented (0 official functions)

All 50 official matrix functions are implemented. `new_matrix()` is a custom convenience wrapper.

---

## str (String Operations)

### Implemented (18 official + 4 custom = 22 functions)

1. `charAt()` - Get character at index (custom addition)
2. `concat()` - Concatenate strings (custom addition)
3. `contains()` - Check if string contains substring
4. `endswith()` - Check if string ends with suffix
5. `format()` - Format string with arguments
6. `format_time()` - Format timestamp with PineScript format specifiers
7. `length()` - Get string length
8. `lower()` - Convert to lowercase
9. `match()` - Match regular expression
10. `pos()` - Find position of substring
11. `repeat()` - Repeat string N times with optional separator
12. `replace()` - Replace first occurrence
13. `replace_all()` - Replace all occurrences
14. `split()` - Split string into array
15. `startswith()` - Check if string starts with prefix
16. `substring()` - Extract substring
17. `tonumber()` - Convert string to number
18. `tostring()` - Convert value to string
19. `trim()` - Remove whitespace from both ends
20. `trimLeft()` - Remove whitespace from left (custom addition)
21. `trimRight()` - Remove whitespace from right (custom addition)
22. `upper()` - Convert to uppercase

### Not Implemented (0 functions)

All 18 official str functions are implemented.

---

## time + timeframe (Time Operations)

### Implemented (1 official + 2 custom = 3 functions)

1. `time()` - Convert time components to timestamp (basic implementation)
2. `timestamp()` - Custom addition for convenience
3. `now()` - Custom addition for convenience

### Not Implemented (4 functions)

1. `time_close()` - Returns UNIX time of the current bar's close for a given timeframe/session
2. `timeframe.change()` - Detects changes in a specified timeframe (returns bool on first bar of new timeframe)
3. `timeframe.from_seconds()` - Converts a number of seconds into a valid timeframe string
4. `timeframe.in_seconds()` - Converts a timeframe string into seconds

---

## color (Color Operations)

### Implemented (7 official + 1 custom = 8 functions)

1. `b()` - Extract blue component
2. `from_gradient()` - Create color from gradient between two colors
3. `from_hex()` - Create color from hex string (custom addition, not in official API)
4. `g()` - Extract green component
5. `new()` - Create new color with transparency (aliased as `new_color`)
6. `r()` - Extract red component
7. `rgb()` - Create RGB color
8. `t()` - Extract transparency component

**Constants:** All standard PineScript color constants are implemented (red, green, blue, yellow, etc.)

### Not Implemented (0 official functions)

All 7 official color functions are implemented.

---

## line (Line Drawing Objects)

### Implemented (19 functions)

**Core Functions:**
1. `new()` - Create new line with coordinates
2. `get_price()` - Get price at bar index via linear interpolation
3. `get_x1()` - Get first x coordinate
4. `get_y1()` - Get first y coordinate
5. `get_x2()` - Get second x coordinate
6. `get_y2()` - Get second y coordinate
7. `copy()` - Create copy of line
8. `delete()` - Delete line (no-op in JS)

**Setters:**
9. `set_x1()` - Set first x coordinate
10. `set_y1()` - Set first y coordinate
11. `set_x2()` - Set second x coordinate
12. `set_y2()` - Set second y coordinate
13. `set_xy1()` - Set first point coordinates
14. `set_xy2()` - Set second point coordinates
15. `set_xloc()` - Set x location mode and coordinate
16. `set_extend()` - Set line extension mode
17. `set_color()` - Set line color
18. `set_style()` - Set line style
19. `set_width()` - Set line width

### Not Implemented (2 functions)

1. `set_first_point()` - Set first point via chart.point object
2. `set_second_point()` - Set second point via chart.point object

---

## box (Box Drawing Objects)

### Implemented (27 functions)

**Core Functions:**
1. `new()` - Create new box with coordinates
2. `get_left()` - Get left border coordinate
3. `get_top()` - Get top border price
4. `get_right()` - Get right border coordinate
5. `get_bottom()` - Get bottom border price
6. `copy()` - Create copy of box
7. `delete()` - Delete box (no-op in JS)

**Coordinate Setters:**
8. `set_left()` - Set left border
9. `set_top()` - Set top border
10. `set_right()` - Set right border
11. `set_bottom()` - Set bottom border
12. `set_lefttop()` - Set left-top corner
13. `set_rightbottom()` - Set right-bottom corner
14. `set_top_left_point()` - Set top-left point
15. `set_bottom_right_point()` - Set bottom-right point
16. `set_extend()` - Set extension mode

**Styling Setters:**
17. `set_border_color()` - Set border color
18. `set_border_width()` - Set border width
19. `set_border_style()` - Set border style
20. `set_bgcolor()` - Set background color

**Text Setters:**
21. `set_text()` - Set box text content
22. `set_text_size()` - Set text size
23. `set_text_color()` - Set text color
24. `set_text_halign()` - Set horizontal alignment
25. `set_text_valign()` - Set vertical alignment
26. `set_text_wrap()` - Set text wrapping
27. `set_text_font_family()` - Set text font

### Not Implemented (2 functions)

1. `set_text_formatting()` - Set text formatting (bold/italic via `text.format_bold`, `text.format_italic`)
2. `set_xloc()` - Set x-location mode and update left/right borders

---

## label (Label Drawing Objects)

### Implemented (19 functions)

**Core Functions:**
1. `new()` - Create new label
2. `get_x()` - Get x coordinate
3. `get_y()` - Get y coordinate
4. `get_text()` - Get text content
5. `copy()` - Create copy of label
6. `delete()` - Delete label (no-op in JS)

**Position Setters:**
7. `set_x()` - Set x coordinate
8. `set_y()` - Set y coordinate
9. `set_xy()` - Set both coordinates
10. `set_xloc()` - Set x location mode
11. `set_yloc()` - Set y location mode

**Content Setters:**
12. `set_text()` - Set text content
13. `set_tooltip()` - Set tooltip text

**Styling Setters:**
14. `set_color()` - Set label color
15. `set_textcolor()` - Set text color
16. `set_style()` - Set label style
17. `set_size()` - Set label size
18. `set_textalign()` - Set text alignment
19. `set_text_font_family()` - Set text font

### Not Implemented (2 functions)

1. `set_point()` - Set label position via chart.point object
2. `set_text_formatting()` - Set text formatting (bold/italic via `text.format_bold`, `text.format_italic`)

---

## linefill (Linefill Drawing Objects)

### Implemented (5 functions)

1. `new()` - Create new linefill between two lines
2. `get_line1()` - Get first line reference
3. `get_line2()` - Get second line reference
4. `set_color()` - Set fill color
5. `delete()` - Delete linefill (no-op in JS)

### Not Implemented (0 functions)

All 5 official linefill functions are implemented.

---

## chartPoint (Chart Point Objects)

### Implemented (4 functions)

1. `new()` - Create a new chart point with time, index, and price coordinates
2. `from_time()` - Create a chart point from timestamp and price
3. `from_index()` - Create a chart point from bar index and price
4. `copy()` - Create a copy of a chart point

### Not Implemented (1 function)

1. `now()` - Create a chart point at the current bar with `index` and `time` auto-filled (price defaults to `close`)

---

## polyline (Polyline Drawing Objects)

### Implemented (2 official + 1 custom = 3 functions)

1. `new()` - Create a new polyline connecting multiple chart points
2. `delete()` - Delete a polyline
3. `get_all()` - Get all active polylines (custom addition, not in official API)

### Not Implemented (0 official functions)

All 2 official polyline functions are implemented.

**Note:** `curved` parameter is accepted but curved polylines are not yet supported.

---

## map (Map/Dictionary Operations) -- NEW

### Implemented (0 functions)

No map functions are implemented yet.

### Not Implemented (11 functions)

1. `clear()` - Remove all key-value pairs
2. `contains()` - Check if map contains a key
3. `copy()` - Create a shallow copy
4. `get()` - Get value by key
5. `keys()` - Get array of all keys
6. `new()` (newtypetype) - Create a new map with specified key/value types
7. `put()` - Add or update a key-value pair
8. `put_all()` - Add all key-value pairs from another map
9. `remove()` - Remove a key-value pair
10. `size()` - Get number of entries
11. `values()` - Get array of all values

**Note:** Maps are a core data structure in PineScript v6, useful for key-value lookups in computational contexts (e.g., symbol-to-weight mappings, level tracking).

---

## All Not-Implemented Functions (Summary)

| # | Namespace | Function | Description |
|---|-----------|----------|-------------|
| 1 | array | `new_table()` | Table array (no computational value) |
| ~~2~~ | ~~str~~ | ~~`repeat()`~~ | ~~Implemented~~ |
| 3 | time | `time_close()` | Bar close time for timeframe/session |
| 4 | timeframe | `change()` | Detect timeframe boundary changes |
| 5 | timeframe | `from_seconds()` | Seconds to timeframe string |
| 6 | timeframe | `in_seconds()` | Timeframe string to seconds |
| 7 | line | `set_first_point()` | Set first point via chart.point |
| 8 | line | `set_second_point()` | Set second point via chart.point |
| 9 | box | `set_text_formatting()` | Bold/italic text formatting |
| 10 | box | `set_xloc()` | Set x-location mode with borders |
| 11 | label | `set_point()` | Set position via chart.point |
| 12 | label | `set_text_formatting()` | Bold/italic text formatting |
| 13 | chartPoint | `now()` | Chart point at current bar |
| 14 | map | `clear()` | Clear all entries |
| 15 | map | `contains()` | Check key existence |
| 16 | map | `copy()` | Shallow copy |
| 17 | map | `get()` | Get value by key |
| 18 | map | `keys()` | Get all keys |
| 19 | map | `new()` | Create typed map |
| 20 | map | `put()` | Set key-value |
| 21 | map | `put_all()` | Merge maps |
| 22 | map | `remove()` | Remove entry |
| 23 | map | `size()` | Entry count |
| 24 | map | `values()` | Get all values |

**Total: 23 official functions not yet implemented across in-scope namespaces.**

---

## Custom Additions (Not in Official PineScript v6 API)

These functions are implemented in OakScriptJS but do not exist in the official PineScript v6 reference:

| Namespace | Function | Purpose |
|-----------|----------|---------|
| ta | `ichimoku()` | Ichimoku Kinko Hyo indicator |
| ta | `zigzag()` | ZigZag trend reversal indicator |
| array | `new_array()` | Generic array constructor |
| str | `charAt()` | Get character at index |
| str | `concat()` | Concatenate strings |
| str | `trimLeft()` | Trim left whitespace |
| str | `trimRight()` | Trim right whitespace |
| color | `from_hex()` | Create color from hex string |
| matrix | `new_matrix()` | Generic matrix constructor |
| polyline | `get_all()` | Get all active polylines |
| time | `timestamp()` | Convenience timestamp helper |
| time | `now()` | Current time helper |

---

## Notes

1. **Two API Levels**:
   - **Core TA** (`taCore`): Array-based functions like `taCore.sma(priceArray, 14)`
   - **TA-Series** (`ta`): Series-based wrappers like `ta.sma(closeSeries, 14)`

2. **Series Class**: The `Series` class provides lazy evaluation and operator chaining. When used with the Babel plugin, it enables native PineScript-like syntax: `(close - open) / (high - low)`.

3. **Deterministic Random**: `math.random()` accepts a seed parameter but doesn't implement deterministic randomness yet.

4. **Type-Specific Arrays**: `new_bool()`, `new_int()`, `new_float()`, `new_string()`, and drawing object arrays are type-specific wrappers around `new_array()`.

---

## Contributing

When implementing new functions:

1. Match PineScript v6 API signatures exactly
2. Add comprehensive JSDoc comments
3. Include examples in documentation
4. Add unit tests with expected outputs from PineScript
5. Update this inventory file
6. If the function accepts arrays, implement it in the core namespace (e.g., `src/ta/`)
7. Add a Series-based wrapper in `src/ta-series.ts` if the function is commonly used with Series

For questions about priorities or implementation details, see the PineScript v6 reference documentation in `docs/official/language-reference/`.
