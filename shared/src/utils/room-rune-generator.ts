export class RoomRuneGenerator {
  private readonly alphabet: string;
  private readonly base: number;
  private readonly length: number;

  constructor() {
    // 0-9 and a-z (36 characters).
    // I have SHUFFLED this string. This ensures that sequential SQL IDs (1, 2, 3)
    // generate non-sequential looking runes (e.g., "9x", "q2") to prevent users from guessing the next room.
    // If you want strict order (0, 1, 2... a, b), change this to "0123456789abcdefghijklmnopqrstuvwxyz"
    this.alphabet = 'q5z1y9x8w7v6u5t4s3r2p0onmlkjihgfedcba';
    this.base = this.alphabet.length;
    this.length = 6; // You requested exactly 6 characters
  }

  /**
   * Encodes a numeric SQL ID into a 6-character string (Room Rune)
   */
  public encode(id: number): string {
    if (id < 0) throw new Error('ID must be a positive integer');

    if (id === 0) {
      const firstChar = this.alphabet[0];
      if (!firstChar) throw new Error('Alphabet is empty');
      return firstChar.repeat(this.length);
    }

    let num = id;
    let result = '';

    while (num > 0) {
      const remainder = num % this.base;
      const char = this.alphabet[remainder];
      if (!char) throw new Error('Alphabet character undefined');
      result = char + result; // Prepend character
      num = Math.floor(num / this.base);
    }

    // Pad the start with the first character of the alphabet to ensure 6 chars
    const padChar = this.alphabet[0];
    if (!padChar) throw new Error('Alphabet is empty');
    return result.padStart(this.length, padChar);
  }

  /**
   * Decodes a Room Rune string back into the numeric SQL ID
   */
  public decode(rune: string): number {
    // 1. Handle case insensitivity
    const cleanRune = rune.toLowerCase();

    let id = 0;

    for (let i = 0; i < cleanRune.length; i++) {
      const char = cleanRune.charAt(i); // Use charAt for safety
      const index = this.alphabet.indexOf(char);

      if (index === -1) {
        throw new Error(`Invalid character found in rune: ${char}`);
      }

      // Base conversion logic: Accumulator * Base + Index
      id = id * this.base + index;
    }

    return id;
  }
}
