import crypto from "crypto";

/**
 * Canonical string dari payload — harus identik dengan backend.
 * Sort keys secara rekursif, lalu JSON.stringify.
 */
const canonicalize = (obj: unknown): string => {
  if (obj === null || obj === undefined) return "null";
  if (typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    return "[" + obj.map(canonicalize).join(",") + "]";
  }

  const sorted = Object.keys(obj as Record<string, unknown>)
    .sort()
    .reduce(
      (acc, key) => {
        acc[key] = (obj as Record<string, unknown>)[key];
        return acc;
      },
      {} as Record<string, unknown>,
    );

  const entries = Object.entries(sorted).map(
    ([k, v]) => `${JSON.stringify(k)}:${canonicalize(v)}`,
  );
  return "{" + entries.join(",") + "}";
};

/**
 * Generate HMAC-SHA256 signature hash dari payload.
 * Menggunakan INTERNAL_API_SECRET sebagai shared secret (sama dengan backend).
 */
export function generateSignatureHash(payload: unknown): string {
  const secret = process.env.INTERNAL_API_SECRET || "";
  const canonical = canonicalize(payload);
  return crypto.createHmac("sha256", secret).update(canonical).digest("hex");
}
