/**
 * PineScript type system definitions
 */

export type PineType =
  | { kind: 'int' }
  | { kind: 'float' }
  | { kind: 'bool' }
  | { kind: 'string' }
  | { kind: 'color' }
  | { kind: 'series'; elementType: PineType }
  | { kind: 'array'; elementType: PineType }
  | { kind: 'matrix'; elementType: PineType }
  | { kind: 'tuple'; elements: PineType[] }
  | { kind: 'function'; params: ParamType[]; returnType: PineType }
  | { kind: 'userDefined'; name: string }
  | { kind: 'na' }       // The na type (compatible with optionals)
  | { kind: 'unknown' }  // For inference failures
  | { kind: 'void' };    // For statements/no return

export interface ParamType {
  name?: string;
  type: PineType;
  optional?: boolean;
  defaultValue?: unknown;
}

/**
 * Helper functions to create PineScript types
 */
export const PineTypes = {
  int: (): PineType => ({ kind: 'int' }),
  float: (): PineType => ({ kind: 'float' }),
  bool: (): PineType => ({ kind: 'bool' }),
  string: (): PineType => ({ kind: 'string' }),
  color: (): PineType => ({ kind: 'color' }),
  series: (elementType: PineType): PineType => ({ kind: 'series', elementType }),
  array: (elementType: PineType): PineType => ({ kind: 'array', elementType }),
  matrix: (elementType: PineType): PineType => ({ kind: 'matrix', elementType }),
  tuple: (elements: PineType[]): PineType => ({ kind: 'tuple', elements }),
  function: (params: ParamType[], returnType: PineType): PineType => ({ 
    kind: 'function', 
    params, 
    returnType 
  }),
  userDefined: (name: string): PineType => ({ kind: 'userDefined', name }),
  na: (): PineType => ({ kind: 'na' }),
  unknown: (): PineType => ({ kind: 'unknown' }),
  void: (): PineType => ({ kind: 'void' }),
};

/**
 * Check if two types are compatible for assignment
 */
export function isAssignable(source: PineType, target: PineType): boolean {
  // Exact match
  if (source.kind === target.kind) {
    if (source.kind === 'series' && target.kind === 'series') {
      return isAssignable(source.elementType, target.elementType);
    }
    if (source.kind === 'array' && target.kind === 'array') {
      return isAssignable(source.elementType, target.elementType);
    }
    return true;
  }
  
  // na is compatible with any type
  if (source.kind === 'na') {
    return true;
  }
  
  // int is compatible with float
  if (source.kind === 'int' && target.kind === 'float') {
    return true;
  }
  
  // Series<T> is compatible with T (implicit conversion)
  if (source.kind === 'series') {
    return isAssignable(source.elementType, target);
  }
  
  // unknown is compatible with everything (fallback)
  if (source.kind === 'unknown' || target.kind === 'unknown') {
    return true;
  }
  
  return false;
}

/**
 * Get the string representation of a type
 */
export function typeToString(type: PineType): string {
  switch (type.kind) {
    case 'int':
    case 'float':
    case 'bool':
    case 'string':
    case 'color':
    case 'na':
    case 'unknown':
    case 'void':
      return type.kind;
    
    case 'series':
      return `series<${typeToString(type.elementType)}>`;
    
    case 'array':
      return `array<${typeToString(type.elementType)}>`;
    
    case 'matrix':
      return `matrix<${typeToString(type.elementType)}>`;
    
    case 'tuple':
      return `[${type.elements.map(typeToString).join(', ')}]`;
    
    case 'function':
      const params = type.params.map(p => typeToString(p.type)).join(', ');
      return `(${params}) => ${typeToString(type.returnType)}`;
    
    case 'userDefined':
      return type.name;
  }
}
