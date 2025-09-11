/**
 * A custom merge function for es-toolkit's `mergeWith` that concatenates arrays.
 */
export const concatArrays = (objValue: unknown, srcValue: unknown) =>
  Array.isArray(objValue) ? objValue.concat(srcValue) : undefined
