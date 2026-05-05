/**
 * Conflict Detection
 *
 * Compares local pending data with server-side data to identify conflicting
 * fields and decide which can be auto-merged versus require manual resolution.
 *
 * **Validates: Requirements 12.1, 12.2, 12.7**
 */

export interface ConflictInfo {
  /** Field name where the values diverge */
  field: string;
  /** Value in the local pending payload */
  localValue: unknown;
  /** Value currently on the server */
  serverValue: unknown;
  /** Whether this field can be auto-merged without user input */
  canAutoMerge: boolean;
  /** If auto-merge is possible, the merged value */
  mergedValue?: unknown;
}

const IMAGE_FIELD_PATTERN = /(^|_)(url|foto|gambar|image)([A-Z]|_|$)/i;
const TIMESTAMP_FIELD_PATTERN = /(at|date|time|timestamp)$/i;

function isImageField(field: string): boolean {
  return IMAGE_FIELD_PATTERN.test(field);
}

function isTimestampField(field: string, value: unknown): boolean {
  if (TIMESTAMP_FIELD_PATTERN.test(field)) return true;
  if (typeof value === "number" && value > 1_000_000_000_000) return true;
  if (typeof value === "string") {
    // ISO 8601 quick check
    return /^\d{4}-\d{2}-\d{2}T/.test(value);
  }
  return false;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const ak = Object.keys(a);
    const bk = Object.keys(b);
    if (ak.length !== bk.length) return false;
    return ak.every((k) => deepEqual(a[k], b[k]));
  }
  return false;
}

function compareTimestamps(a: unknown, b: unknown): number {
  const av =
    typeof a === "number" ? a : typeof a === "string" ? Date.parse(a) : NaN;
  const bv =
    typeof b === "number" ? b : typeof b === "string" ? Date.parse(b) : NaN;
  if (Number.isNaN(av) || Number.isNaN(bv)) return 0;
  return av - bv;
}

/**
 * Decide whether a single field can be auto-merged. Returns the merged value
 * when possible, otherwise returns `undefined` and the caller should treat the
 * field as requiring manual resolution.
 *
 * Rules:
 * - Image fields: always keep local (technician's offline-captured image wins).
 * - Arrays: combine without duplicates (set union by JSON identity).
 * - Timestamps: keep the newer of the two.
 * - Otherwise: requires manual resolution.
 *
 * **Validates: Requirements 12.7**
 */
export function canAutoMergeField(
  field: string,
  localValue: unknown,
  serverValue: unknown,
): { canAutoMerge: boolean; mergedValue?: unknown } {
  if (isImageField(field)) {
    return { canAutoMerge: true, mergedValue: localValue };
  }

  if (Array.isArray(localValue) && Array.isArray(serverValue)) {
    const seen = new Set<string>();
    const merged: unknown[] = [];
    for (const v of [...serverValue, ...localValue]) {
      const key = JSON.stringify(v);
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(v);
      }
    }
    return { canAutoMerge: true, mergedValue: merged };
  }

  if (
    isTimestampField(field, localValue) ||
    isTimestampField(field, serverValue)
  ) {
    const cmp = compareTimestamps(localValue, serverValue);
    return { canAutoMerge: true, mergedValue: cmp >= 0 ? localValue : serverValue };
  }

  return { canAutoMerge: false };
}

/**
 * Compare local payload to the server-side data and return one ConflictInfo per
 * differing field. Fields present on only one side are also reported as
 * conflicts (with the missing side recorded as `undefined`).
 *
 * **Validates: Requirements 12.1, 12.2**
 */
export function detectConflicts(
  localData: Record<string, unknown>,
  serverData: Record<string, unknown>,
): ConflictInfo[] {
  const conflicts: ConflictInfo[] = [];
  const fields = new Set<string>([
    ...Object.keys(localData),
    ...Object.keys(serverData),
  ]);

  for (const field of fields) {
    const localValue = localData[field];
    const serverValue = serverData[field];

    if (deepEqual(localValue, serverValue)) continue;

    const { canAutoMerge, mergedValue } = canAutoMergeField(
      field,
      localValue,
      serverValue,
    );

    conflicts.push({
      field,
      localValue,
      serverValue,
      canAutoMerge,
      mergedValue,
    });
  }

  return conflicts;
}

/**
 * Apply a merge resolution to produce the final payload. For fields not
 * present in `selections`, falls back to localValue (default: keep local).
 */
export function applyMergeResolution(
  conflicts: ConflictInfo[],
  selections: Record<string, "local" | "server">,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const conflict of conflicts) {
    const choice = selections[conflict.field] ?? "local";
    result[conflict.field] =
      choice === "server" ? conflict.serverValue : conflict.localValue;
  }
  return result;
}
