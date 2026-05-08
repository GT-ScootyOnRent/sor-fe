// Helpers for controlled <input type="number"> fields where users may type
// leading zeros like "01". Without these helpers React's bailout (state stays
// numerically equal) means the DOM keeps the literal "01" instead of normalizing.

/**
 * Strip leading zeros from a numeric string while preserving meaningful values.
 *
 *  "01"  → "1"
 *  "001" → "1"
 *  "0"   → "0"   (lone zero is meaningful)
 *  "10"  → "10"
 *  ""    → ""    (empty stays empty)
 */
export const stripLeadingZeros = (raw: string): string =>
  raw === '' ? '' : raw.replace(/^0+(?=\d)/, '');

/**
 * Run inside a `<input type="number">` onChange handler to normalize the
 * displayed value AND return the parsed number to commit to state.
 *
 * Why two steps:
 *  1. React's controlled-input bailout: if the parsed number equals the previous
 *     state value, React skips the re-render and the DOM keeps the user's
 *     "01" literal. Mutating `e.target.value` here forces a DOM-side fix even
 *     when state doesn't change.
 *  2. Returns the canonical number so the caller can `setState(handled)`.
 *
 * Empty input resolves to `0` (callers typically default-zero numeric fields).
 *
 * Returns `null` if the input was non-numeric (e.g. "abc"); caller should skip
 * setState in that case.
 */
export function handleNumberInputChange(
  e: React.ChangeEvent<HTMLInputElement>,
): number | null {
  const stripped = stripLeadingZeros(e.target.value);
  if (stripped !== e.target.value) {
    e.target.value = stripped;
  }
  if (stripped === '') return 0;
  const n = Number(stripped);
  return Number.isNaN(n) ? null : n;
}
