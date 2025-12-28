import { RoomRuneGenerator } from './src/utils/room-rune-generator';

const generator = new RoomRuneGenerator();

function test(id: number) {
  const rune = generator.encode(id);
  const decoded = generator.decode(rune);
  console.log(`ID: ${id} -> Rune: ${rune} -> Decoded: ${decoded}`);
  if (id !== decoded) {
    throw new Error(`Mismatch! Expected ${id}, got ${decoded}`);
  }
}

test(1);
test(12345);
test(999999);

console.log('All tests passed!');
