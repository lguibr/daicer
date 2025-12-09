const fs = require('fs');

try {
  const preview = JSON.parse(fs.readFileSync('map-debug-PREVIEW-1765312103764.json', 'utf8'));
  const game = JSON.parse(fs.readFileSync('map-debug-GAME-1765312186312.json', 'utf8'));

  console.log('--- Metadata ---');
  console.log('Preview Seed:', preview.seed);
  console.log('Game Seed:   ', game.seed);

  const previewOffset = preview.params.offset || { x: 0, y: 0 };
  const gameOffset = game.params.offset || { x: 0, y: 0 };

  console.log('Preview Offset:', previewOffset);
  console.log('Game Offset:   ', gameOffset);

  // Compare at World (0, 0)
  // Internal array index = WorldCoord - Offset

  const pX = 0 - previewOffset.x;
  const pY = 0 - previewOffset.y;

  const gX = 0 - gameOffset.x;
  const gY = 0 - gameOffset.y;

  console.log(`\nChecking World (0,0):`);
  console.log(`Preview Internal [${pY}][${pX}]:`, preview.fullGridMap[pY]?.[pX]);
  console.log(`Game Internal    [${gY}][${gX}]:`, game.fullGridMap[gY]?.[gX]);

  // Check 5x5 block around 0,0
  console.log('\nChecking 5x5 Block at (0,0):');
  let matches = 0;
  let mismatches = 0;

  for (let y = 0; y < 5; y++) {
    let rowLine = '';
    for (let x = 0; x < 5; x++) {
      const pBiome = preview.fullGridMap[pY + y]?.[pX + x];
      const gBiome = game.fullGridMap[gY + y]?.[gX + x];
      const match = pBiome === gBiome ? 'OK' : 'XX';
      rowLine += `(${pBiome}/${gBiome} ${match}) `;
      if (pBiome === gBiome) matches++;
      else mismatches++;
    }
    console.log(rowLine);
  }

  console.log(`\nMatches: ${matches}, Mismatches: ${mismatches}`);
} catch (e) {
  console.error(e);
}
