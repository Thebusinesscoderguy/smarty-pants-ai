// Cryptographic token helpers for invite links.
//
// SECURITY: the raw token is what goes in the email link; only its SHA-256 hash
// is ever stored in the DB (invites.token_hash). Lookups hash the incoming token
// and compare, so a database leak does not expose usable invite links.

/** Generate a URL-safe random token (32 bytes of entropy → base64url). */
export function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

/** SHA-256 hash of a token, hex-encoded. Deterministic for lookup/compare. */
export async function hashToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Generate a strong, human-distributable random password (used for student auto-provisioning). */
export function generatePassword(length = 14): string {
  // Avoid ambiguous chars (0/O, 1/l/I) for hand-distributed credentials.
  const charset = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#%";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) out += charset[bytes[i] % charset.length];
  return out;
}
