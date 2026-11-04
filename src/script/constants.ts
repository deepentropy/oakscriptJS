/**
 * @fileoverview PineScript constant namespaces of the script API: `shape.*`, `location.*`, `size.*`, `xloc.*`,
 * `yloc.*`, `extend.*`, `display.*`, `format.*`, `font.*`, `scale.*`, `order.*`, `currency.*`, `adjustment.*`, and the
 * `label.style_*`, `line.style_*`, `dayofweek.*` members. Each constant is the string (or number) the functions take,
 * so `plotshape(cond, "Buy", { style: shape.triangleup })` and `{ style: "triangleup" }` are the same.
 *
 * @module script/constants
 */

/** PineScript `shape.*`: the shapes of plotshape(). */
export const shape = {
  xcross: 'xcross',
  cross: 'cross',
  triangleup: 'triangleup',
  triangledown: 'triangledown',
  flag: 'flag',
  circle: 'circle',
  arrowup: 'arrowup',
  arrowdown: 'arrowdown',
  labelup: 'labelup',
  labeldown: 'labeldown',
  square: 'square',
  diamond: 'diamond',
} as const;

/** PineScript `location.*`: where plotshape() / plotchar() draw. */
export const location = {
  abovebar: 'abovebar',
  belowbar: 'belowbar',
  top: 'top',
  bottom: 'bottom',
  absolute: 'absolute',
} as const;

/** PineScript `size.*`: sizes of shapes, characters, labels and table texts. */
export const size = {
  auto: 'auto',
  tiny: 'tiny',
  small: 'small',
  normal: 'normal',
  large: 'large',
  huge: 'huge',
} as const;

/** PineScript `xloc.*`: the x coordinate of drawings (bar index or UNIX time in ms). */
export const xloc = {
  bar_index: 'bar_index',
  bar_time: 'bar_time',
} as const;

/** PineScript `yloc.*`: the y position of labels. */
export const yloc = {
  price: 'price',
  abovebar: 'abovebar',
  belowbar: 'belowbar',
} as const;

/** PineScript `extend.*`: line extension. */
export const extend = {
  none: 'none',
  left: 'left',
  right: 'right',
  both: 'both',
} as const;

/** PineScript `display.*`: where a plot or input is shown. */
export const display = {
  none: 'none',
  all: 'all',
  data_window: 'data_window',
  status_line: 'status_line',
  pane: 'pane',
} as const;

/** PineScript `format.*`: the number format of indicator() and str.tostring(). */
export const format = {
  inherit: 'inherit',
  price: 'price',
  volume: 'volume',
  percent: 'percent',
  mintick: 'mintick',
} as const;

/** PineScript `font.*`: font families of labels, boxes and table cells. */
export const font = {
  family_default: 'default',
  family_monospace: 'monospace',
} as const;

/** PineScript `scale.*`: the price scale of indicator() (`scale` option). */
export const scale = {
  right: 'right',
  left: 'left',
  none: 'none',
} as const;

/** PineScript `order.*`: sort order of array.sort() / array.sort_indices() / matrix.sort(). */
export const order = {
  ascending: 'ascending',
  descending: 'descending',
} as const;

/** PineScript `adjustment.*`: price adjustment of a ticker. */
export const adjustment = {
  none: 'none',
  splits: 'splits',
  dividends: 'dividends',
} as const;

const CURRENCIES = [
  'AED', 'ARS', 'AUD', 'BDT', 'BHD', 'BRL', 'BTC', 'CAD', 'CHF', 'CLP', 'CNY', 'COP', 'CZK', 'DKK', 'EGP', 'ETH',
  'EUR', 'GBP', 'GEL', 'HKD', 'HUF', 'IDR', 'ILS', 'INR', 'ISK', 'JPY', 'KES', 'KRW', 'KWD', 'LKR', 'MAD', 'MXN',
  'MYR', 'NGN', 'NOK', 'NZD', 'PEN', 'PHP', 'PKR', 'PLN', 'QAR', 'RON', 'RSD', 'RUB', 'SAR', 'SEK', 'SGD', 'THB',
  'TND', 'TRY', 'TWD', 'USD', 'USDT', 'VES', 'VND', 'ZAR',
] as const;

type CurrencyCode = (typeof CURRENCIES)[number];

/** PineScript `currency.*`: currency codes (`strategy(..., { currency })`, `syminfo.currency`); `currency.NONE` is na. */
export const currency = {
  ...(Object.fromEntries(CURRENCIES.map((c) => [c, c])) as { readonly [K in CurrencyCode]: K }),
  NONE: 'NONE',
} as const;

/** PineScript `label.style_*`. */
export const labelStyles = {
  style_none: 'none',
  style_xcross: 'xcross',
  style_cross: 'cross',
  style_triangleup: 'triangleup',
  style_triangledown: 'triangledown',
  style_flag: 'flag',
  style_circle: 'circle',
  style_arrowup: 'arrowup',
  style_arrowdown: 'arrowdown',
  style_label_up: 'label_up',
  style_label_down: 'label_down',
  style_label_left: 'label_left',
  style_label_right: 'label_right',
  style_label_lower_left: 'label_lower_left',
  style_label_lower_right: 'label_lower_right',
  style_label_upper_left: 'label_upper_left',
  style_label_upper_right: 'label_upper_right',
  style_label_center: 'label_center',
  style_square: 'square',
  style_diamond: 'diamond',
  style_text_outline: 'text_outline',
} as const;

/** PineScript `line.style_*` (lines, boxes, polylines). */
export const lineStyles = {
  style_solid: 'solid',
  style_dotted: 'dotted',
  style_dashed: 'dashed',
  style_arrow_left: 'arrow_left',
  style_arrow_right: 'arrow_right',
  style_arrow_both: 'arrow_both',
} as const;

/** PineScript `dayofweek.*`: the values of `dayofweek` (1 = Sunday ... 7 = Saturday). */
export const daysOfWeek = {
  sunday: 1,
  monday: 2,
  tuesday: 3,
  wednesday: 4,
  thursday: 5,
  friday: 6,
  saturday: 7,
} as const;
