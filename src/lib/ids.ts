import { randomBytes } from "node:crypto";

/** Id aleatorio corto y seguro para URLs (16 caracteres). */
export function newId(): string {
  return randomBytes(12).toString("base64url");
}

// Sin 0/O ni 1/I para que no se confundan al dictarlo
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Código de invitación tipo "K7M3QX". */
export function newInviteCode(length = 6): string {
  const bytes = randomBytes(length);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}
