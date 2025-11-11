export function generateRandomDieColor(): string {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 60 + Math.floor(Math.random() * 40);
  const lightness = 45 + Math.floor(Math.random() * 15);
  return `hsl(${hue}deg ${saturation}% ${lightness}%)`;
}
