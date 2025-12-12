/**
 * Room code generation utilities
 * Ported from backend
 */

// Constants for Linear Congruential Generator / Affine Cipher on the set size
const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const ALPHABET_LENGTH = BigInt(ALPHABET.length); // 36
const CODE_LENGTH = 6;
const MODULUS = ALPHABET_LENGTH ** BigInt(CODE_LENGTH); // 36^6 = 2,176,782,336

// Parameters for the affine transformation: (x * PRIME + OFFSET) % MODULUS
// PRIME must be coprime to MODULUS. Since MODULUS = 36^6 = 2^12 * 3^12,
// PRIME must not be divisible by 2 or 3.
// We pick a large prime near sqrt(MODULUS) or just a large random prime.
const PRIME = BigInt(920419823);

// OFFSET can be anything, but using a large number helps scramble small initial values.
// User requested "offsetted to its half", half of MODULUS is appropriate.
const OFFSET = MODULUS / BigInt(2); // 1,088,391,168

export function generateRoomCode(counter: number | bigint): string {
  const x = BigInt(counter);

  // Apply obfuscation
  const obfuscated = (x * PRIME + OFFSET) % MODULUS;

  // Encode to Base36
  let code = '';
  let temp = obfuscated;

  for (let i = 0; i < CODE_LENGTH; i++) {
    const index = temp % ALPHABET_LENGTH;
    code = ALPHABET[Number(index)] + code;
    temp /= ALPHABET_LENGTH;
  }

  return code;
}

export function isValidRoomCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code);
}
