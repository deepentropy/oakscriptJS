# Function Inventory - OakScriptJS

This document tracks the implementation status of all PineScript v6 functions for included namespaces.

**Last Updated:** 2025-01-06 (v0.1.3)

## Summary

| Namespace | Total Functions | Implemented | Not Implemented | Completion % |
|-----------|----------------|-------------|-----------------|--------------|
| **ta** | 59 | 59 | 0 | 100% |
| **math** | 24 | 24 | 0 | 100% |
| **array** | 63 | 62 | 1 | 98.4% |
| **matrix** | 49 | 1 | 48 | 2% |
| **str** | 20 | 20 | 0 | 100% |
| **time** | 1 | 1 | 0 | 100% |
| **color** | 8 | 8 | 0 | 100% |
| **line** | 20 | 20 | 0 | 100% |
| **box** | 28 | 28 | 0 | 100% |
| **label** | 17 | 17 | 0 | 100% |
| **linefill** | 5 | 5 | 0 | 100% |
| **TOTAL** | **294** | **245** | **49** | **83%** |

---

## ta (Technical Analysis)

### ✅ Implemented (59 functions)

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
43. `vwap()` - Volume Weighted Average Price ✨ NEW
44. `vwma()` - Volume Weighted Moving Average
45. `wma()` - Weighted Moving Average
46. `wpr()` - Williams %R ✨ NEW
47. `alma()` - Arnaud Legoux Moving Average ✨ NEW
48. `kcw()` - Keltner Channels Width ✨ NEW
49. `range()` - High-Low Range ✨ NEW
50. `highestbars()` - Offset to the highest value ✨ NEW
51. `lowestbars()` - Offset to the lowest value ✨ NEW
52. `max()` - Maximum of two values ✨ NEW
53. `min()` - Minimum of two values ✨ NEW
54. `cog()` - Center of Gravity ✨ NEW
55. `mode()` - Mode (most frequently occurring value) ✨ NEW
56. `percentile_linear_interpolation()` - Percentile using linear interpolation ✨ NEW
57. `percentile_nearest_rank()` - Percentile using nearest rank ✨ NEW
58. `pivot_point_levels()` - Pivot point levels (Traditional, Fibonacci, Woodie, Classic, DM, Camarilla) ✨ NEW
59. `rci()` - Rank Correlation Index (Spearman's rank correlation) ✨ NEW

### ❌ Not Implemented (0 functions)

**All ta functions are now implemented!** 🎉

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

### ✅ Implemented (62 functions)

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
25. `new_array()` - Create new array (generic type)
26. `new_bool()` - Create new boolean array
27. `new_box()` - Create new box array 🎨 PHASE 5
28. `new_color()` - Create new color array
29. `new_float()` - Create new float array
30. `new_int()` - Create new int array
31. `new_label()` - Create new label array 🎨 PHASE 5
32. `new_line()` - Create new line array 🎨 PHASE 5
33. `new_linefill()` - Create new linefill array 🎨 PHASE 5
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

### ❌ Not Implemented (1 function)

**⚠️ Design Constraint - No Computational Value:**

1. `new_table()` - Create new table array (no computational value - tables have no getters in PineScript)

**Note on Drawing Object Arrays:**
The functions `new_line()`, `new_box()`, `new_label()`, and `new_linefill()` were previously excluded as "rendering functions" but are now **implemented (Phase 5)** following the implementation of drawing objects (Phases 1-4). These arrays enable systematic management of drawing object collections for gap tracking, trend line management, and pattern recognition.

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

### ✅ Implemented (20 functions)

1. `charAt()` - Get character at index (custom addition)
2. `concat()` - Concatenate strings (custom addition)
3. `contains()` - Check if string contains substring
4. `endswith()` - Check if string ends with suffix
5. `format()` - Format string with arguments
6. `format_time()` - Format timestamp with PineScript format specifiers ✨ NEW
7. `length()` - Get string length
8. `lower()` - Convert to lowercase
9. `match()` - Match regular expression
10. `pos()` - Find position of substring
11. `replace()` - Replace first occurrence (custom - PineScript has replace_all)
12. `replace_all()` - Replace all occurrences ✨ NEW
13. `split()` - Split string into array
14. `startswith()` - Check if string starts with prefix
15. `substring()` - Extract substring
16. `tonumber()` - Convert string to number
17. `tostring()` - Convert value to string
18. `trim()` - Remove whitespace from both ends
19. `trimLeft()` - Remove whitespace from left (custom addition)
20. `trimRight()` - Remove whitespace from right (custom addition)
21. `upper()` - Convert to uppercase

### ❌ Not Implemented (0 functions)

**All PineScript v6 string functions are now implemented!** 🎉

**Note:** All PineScript v6 string functions are implemented, including `format_time()` and `replace_all()`. Some custom additions (charAt, concat, trimLeft, trimRight) are included for developer convenience beyond the PineScript API.

The only missing PineScript string function is:
- `repeat()` - Repeat string n times (not commonly used in indicators)

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
5. `new_color()` - Create new color with transparency (aliased as `color()` and `new`) ✨ NEW
6. `r()` - Extract red component
7. `rgb()` - Create RGB color
8. `t()` - Extract transparency component

**Constants:** All standard PineScript color constants are implemented (red, green, blue, yellow, etc.)

**Note:** The `color.new()` alias is now available to match PineScript v6 syntax.

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
6. ~~`vwap()` - Volume Weighted Average Price - institutional favorite~~ ✅ IMPLEMENTED
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
4. ~~`kc()` - Keltner Channels~~ ✅ IMPLEMENTED / ~~`kcw()` - Keltner Channels Width~~ ✅ IMPLEMENTED
5. ~~`bbw()` - Bollinger Bands Width~~ ✅ IMPLEMENTED
6. ~~`wpr()` - Williams %R~~ ✅ IMPLEMENTED
7. ~~`alma()` - Arnaud Legoux Moving Average~~ ✅ IMPLEMENTED
8. ~~`range()` - High-Low Range~~ ✅ IMPLEMENTED

**array namespace:**
6. `covariance()` - Statistical analysis
7. `percentile_*()` - Percentile calculations
8. `standardize()` - Data normalization

**math namespace:**
9. ~~`round_to_mintick()` - Trading-specific rounding~~ ✅ IMPLEMENTED

### Low Priority (Specialized)

**ta namespace:**
1. ~~`cog()` - Center of Gravity - niche~~ ✅ IMPLEMENTED
2. ~~`rci()` - Rank Correlation Index - niche~~ ✅ IMPLEMENTED
3. ~~`pivot_point_levels()` - Can be calculated manually~~ ✅ IMPLEMENTED
4. ~~`mode()` - Mode (most frequently occurring value)~~ ✅ IMPLEMENTED
5. ~~`percentile_linear_interpolation()` - Percentile using linear interpolation~~ ✅ IMPLEMENTED
6. ~~`percentile_nearest_rank()` - Percentile using nearest rank~~ ✅ IMPLEMENTED

**matrix namespace:**
- Most advanced matrix operations (eigenvalues, inverse, etc.) - specialized use cases

---

## line (Line Drawing Objects) 🎨 PHASES 1-2

### ✅ Implemented (20 functions)

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

### ❌ Not Implemented (0 functions)

**All line functions are implemented!** 🎉

---

## box (Box Drawing Objects) 🎨 PHASES 1-2

### ✅ Implemented (28 functions)

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

### ❌ Not Implemented (0 functions)

**All box functions are implemented!** 🎉

---

## label (Label Drawing Objects) 🎨 PHASE 3

### ✅ Implemented (17 functions)

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

### ❌ Not Implemented (0 functions)

**All label functions are implemented!** 🎉

---

## linefill (Linefill Drawing Objects) 🎨 PHASE 3

### ✅ Implemented (5 functions)

1. `new()` - Create new linefill between two lines
2. `get_line1()` - Get first line reference
3. `get_line2()` - Get second line reference
4. `set_color()` - Set fill color
5. `delete()` - Delete linefill (no-op in JS)

### ❌ Not Implemented (0 functions)

**All linefill functions are implemented!** 🎉

---

## Notes

1. **Drawing Objects Implemented**: Line, box, label, and linefill namespaces are **fully implemented** (Phases 1-5) with focus on computational features. These enable trend analysis, gap detection, pattern recognition, and systematic object management.

2. **Context API**: Some functions (like `ta.atr()`, `ta.tr()`, `ta.supertrend()`, `line.get_price()`) require chart data. Use `createContext()` for cleaner API that matches PineScript with implicit current bar support.

3. **Deterministic Random**: `math.random()` accepts a seed parameter but doesn't implement deterministic randomness yet.

4. **Type-Specific Arrays**: Array functions like `new_bool()`, `new_int()`, `new_float()`, `new_string()`, and drawing object arrays (`new_line()`, `new_box()`, `new_label()`, `new_linefill()`) are implemented as type-specific wrappers around `new_array()`.

5. **Matrix Implementation**: The matrix namespace has minimal implementation (2%) and represents the largest opportunity for expansion.

6. **String Functions**: Fully implemented (100%)! All PineScript string manipulation functions are available.

7. **Drawing Object Arrays**: Phase 5 added `array.new_line()`, `array.new_box()`, `array.new_label()`, and `array.new_linefill()` for systematic collection management.

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
