/**
 * Color mapping utilities for PineScript to TypeScript
 */

/**
 * Color name to hex value mapping
 */
const COLOR_MAP: Record<string, string> = {
  'blue': '#2962FF',
  'red': '#FF0000',
  'green': '#00FF00',
  'yellow': '#FFFF00',
  'orange': '#FF6D00',
  'purple': '#9C27B0',
  'gray': '#787B86',
  'white': '#FFFFFF',
  'black': '#000000',
  'color.green': '#00FF00',
  'color.red': '#FF0000',
  'color.blue': '#0000FF',
  'color.white': '#FFFFFF',
  'color.black': '#000000',
  'color.yellow': '#FFFF00',
  'color.orange': '#FFA500',
  'color.purple': '#800080',
  'color.gray': '#808080',
  'color.silver': '#C0C0C0',
  'color.aqua': '#00FFFF',
  'color.lime': '#00FF00',
  'color.maroon': '#800000',
  'color.navy': '#000080',
  'color.olive': '#808000',
  'color.teal': '#008080',
  'color.fuchsia': '#FF00FF',
};

/**
 * Convert color constant to hex value
 */
export function colorToHex(color: string | undefined): string {
  if (!color) return '#000000';
  return COLOR_MAP[color] || color;
}

/**
 * Extract color value from an AST node (e.g., color.blue, #2962FF)
 */
export function getColorValue(node: any): string {
  if (node.type === 'StringLiteral') {
    // Direct hex color like #2962FF
    return String(node.value || '#2962FF');
  }
  if (node.type === 'MemberExpression') {
    // color.blue represented as MemberExpression with value "color.blue"
    const fullPath = String(node.value || '');
    const parts = fullPath.split('.');
    if (parts.length === 2 && parts[0] === 'color') {
      const colorName = parts[1];
      return COLOR_MAP[colorName] || '#2962FF';
    }
  }
  if (node.type === 'MemberAccess' && node.children && node.children.length >= 1) {
    const obj = node.children[0];
    const prop = String(node.value || '');
    if (obj?.type === 'Identifier' && obj.value === 'color') {
      // Map color.blue to actual hex values
      return COLOR_MAP[prop] || '#2962FF';
    }
  }
  return '#2962FF';
}
