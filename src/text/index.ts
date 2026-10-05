/**
 * Text namespace
 * PineScript `text.format_*` constants for `label.set_text_formatting` and `box.set_text_formatting`, and the
 * `text.align_*` / `text.wrap_*` constants.
 *
 * The format values are flags that add up, as in PineScript (`text.format_bold + text.format_italic`).
 * They are the values PineScript uses for drawn labels and boxes.
 */

/** No formatting. */
export const format_none = 0;
/** Bold text. */
export const format_bold = 1;
/** Italic text. */
export const format_italic = 2;

/** Text aligned to the left (`table.cell`, `box.new`, `label.new` textalign). */
export const align_left = 'left' as const;
/** Text centred horizontally or vertically. */
export const align_center = 'center' as const;
/** Text aligned to the right. */
export const align_right = 'right' as const;
/** Text aligned to the top (`table.cell`, `box.new` text_valign). */
export const align_top = 'top' as const;
/** Text aligned to the bottom. */
export const align_bottom = 'bottom' as const;
/** Text wrapped to the box width (`box.new` text_wrap). */
export const wrap_auto = 'auto' as const;
/** Text not wrapped. */
export const wrap_none = 'none' as const;
