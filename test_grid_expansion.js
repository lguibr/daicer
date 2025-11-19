
// Mock mergeChunkIntoGrid since we can't import TS directly easily without setup
// I will copy the function body here for testing
function mergeChunkIntoGridMock(existingGrid, chunk, currentOffset, chunkSize) {
    let newGrid = existingGrid.map((row) => [...row]);
    let newOffsetX = currentOffset.x;
    let newOffsetY = currentOffset.y;

    if (chunk.worldOffsetX < currentOffset.x) {
        const extraCols = currentOffset.x - chunk.worldOffsetX;
        newGrid = newGrid.map((row) => [...Array(extraCols).fill('plains'), ...row]);
        newOffsetX = chunk.worldOffsetX;
    }

    if (chunk.worldOffsetY < currentOffset.y) {
        const extraRows = currentOffset.y - chunk.worldOffsetY;
        const currentWidth = newGrid[0]?.length || 0;
        const topRows = Array(extraRows)
            .fill(null)
            .map(() => Array(currentWidth).fill('plains'));
        newGrid = [...topRows, ...newGrid];
        newOffsetY = chunk.worldOffsetY;
    }

    const gridX = chunk.worldOffsetX - newOffsetX;
    const gridY = chunk.worldOffsetY - newOffsetY;

    const requiredWidth = Math.max(newGrid[0]?.length || 0, gridX + chunkSize);
    if (requiredWidth > (newGrid[0]?.length || 0)) {
        const widthDiff = requiredWidth - (newGrid[0]?.length || 0);
        newGrid = newGrid.map((row) => [...row, ...Array(widthDiff).fill('plains')]);
    }

    const requiredHeight = Math.max(newGrid.length, gridY + chunkSize);
    if (requiredHeight > newGrid.length) {
        const heightDiff = requiredHeight - newGrid.length;
        const currentWidth = newGrid[0]?.length || 0;
        const bottomRows = Array(heightDiff)
            .fill(null)
            .map(() => Array(currentWidth).fill('plains'));
        newGrid = [...newGrid, ...bottomRows];
    }

    for (let y = 0; y < chunk.biomes.length; y++) {
        const biomeRow = chunk.biomes[y];
        if (!biomeRow) continue;

        for (let x = 0; x < biomeRow.length; x++) {
            const targetX = gridX + x;
            const targetY = gridY + y;
            const biomeTile = biomeRow[x];

            if (
                targetY >= 0 &&
                targetY < newGrid.length &&
                targetX >= 0 &&
                newGrid[targetY] &&
                targetX < newGrid[targetY].length &&
                biomeTile
            ) {
                newGrid[targetY][targetX] = biomeTile;
            }
        }
    }

    return {
        newGrid,
        newOffset: { x: newOffsetX, y: newOffsetY },
    };
}

// Test Case 1: Initial Grid
const initialGrid = [['A']];
const offset = { x: 0, y: 0 };
const chunkSize = 2;

// Add chunk to the LEFT (-2, 0)
const chunkLeft = {
    chunkX: -1,
    chunkY: 0,
    worldOffsetX: -2,
    worldOffsetY: 0,
    biomes: [['L1', 'L2'], ['L3', 'L4']],
    structures: []
};

const result1 = mergeChunkIntoGridMock(initialGrid, chunkLeft, offset, chunkSize);
console.log('Test 1 (Expand Left):');
console.log('New Offset:', result1.newOffset);
console.log('New Grid:', result1.newGrid);

// Test Case 2: Add chunk to RIGHT (2, 0)
const chunkRight = {
    chunkX: 1,
    chunkY: 0,
    worldOffsetX: 2,
    worldOffsetY: 0,
    biomes: [['R1', 'R2'], ['R3', 'R4']],
    structures: []
};
// Use result1 as base
const result2 = mergeChunkIntoGridMock(result1.newGrid, chunkRight, result1.newOffset, chunkSize);
console.log('\nTest 2 (Expand Right):');
console.log('New Offset:', result2.newOffset);
// Test Case 3: Add chunk to TOP (0, -1)
// Use result2 as base
const chunkTop = {
    chunkX: 0,
    chunkY: -1,
    worldOffsetX: 0,
    worldOffsetY: -2,
    biomes: [['T1', 'T2'], ['T3', 'T4']],
    structures: []
};

const result3 = mergeChunkIntoGridMock(result2.newGrid, chunkTop, result2.newOffset, chunkSize);
console.log('\nTest 3 (Expand Top):');
console.log('New Offset:', result3.newOffset);
console.log('New Grid:', result3.newGrid);

