export function parseSpeed(speed: number | string | Record<string, string | number>): number {
  // Case 1: Number (feet)
  if (typeof speed === 'number') {
    return speed;
  }

  // Case 2: String (e.g., "30 ft." or just "30")
  if (typeof speed === 'string') {
    return parseSpeedString(speed);
  }

  // Case 3: Object (e.g., { walk: "30 ft.", fly: "60 ft." })
  if (typeof speed === 'object' && speed !== null) {
    // Prioritize 'walk', then 'fly', then 'swim', then any found
    const walk = speed['walk'];
    if (walk !== undefined) return parseSpeed(walk);

    const fly = speed['fly'];
    if (fly !== undefined) return parseSpeed(fly);

    // If no standard keys, take the first value
    const firstValue = Object.values(speed)[0];
    if (firstValue !== undefined) return parseSpeed(firstValue);
  }

  return 30; // Default fallback
}

function parseSpeedString(str: string): number {
  // Extract first number found
  const match = str.match(/(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return 30; // Default
}
