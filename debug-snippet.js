(async () => {
  const getGrid = () => window.__TERRAIN_GRID__;
  const getSeed = () => {
    // Try to find seed in React state or window
    // This is tricky from outside, but we can look for specific elements or global vars if available
    // For now, let's just dump the Grid signature
    const grid = getGrid();
    if (!grid) return 'No Grid';
    return JSON.stringify(grid.slice(0, 5).map((r) => r.slice(0, 5).map((c) => (typeof c === 'string' ? c : c.biome))));
  };

  console.log('--- DEBUGGER STARTED ---');

  // We will run this in browser console
})();
