/**
 * Helper Utilities
 */

function assertSafeIdentifier(value, field) {
  if (!value || !/^[a-zA-Z0-9_-]{3,64}$/.test(value)) {
    const err = new Error(`${field} contains invalid characters or has invalid length`);
    err.status = 400;
    throw err;
  }
  return value;
}

/**
 * Merge only defined (not `undefined`) fields from `source` into `target`.
 * Avoids repetitive `if (x !== undefined) target.x = x;` blocks.
 */
function mergeFields(target, source, keys) {
  for (const key of keys) {
    if (source[key] !== undefined) {
      target[key] = source[key];
    }
  }
}

module.exports = {
  assertSafeIdentifier,
  mergeFields,
};
