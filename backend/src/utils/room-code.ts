/**
 * Room code generation utilities
 */

/**
 * Characters allowed in room codes (exclude ambiguous chars)
 */
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Generate a random 6-character room code
 * @returns Random room code
 */
export function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return code;
}

/**
 * Validate room code format
 * @param code - Code to validate
 * @returns True if valid format
 */
export function isValidRoomCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code);
}
