import { useState, useCallback, useRef, useEffect } from 'react';

interface Position {
    x: number;
    y: number;
    z: number;
}

interface Chunk {
    x: number;
    y: number;
    z: number;
    data: string[][];
}

interface UseExplorationMapOptions {
    visionRadius?: number;
    chunkSize?: number;
    initialPosition?: Position;
}

export function useExplorationMap(options: UseExplorationMapOptions = {}) {
    const {
        visionRadius = 40,
        chunkSize = 16,
        initialPosition = { x: 64, y: 64, z: 0 },
    } = options;

    const [position, setPosition] = useState<Position>(initialPosition);
    const [chunks, setChunks] = useState<Map<string, Chunk>>(new Map());
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Session ID for tracking explored areas
    const sessionId = useRef(`session-${Date.now()}-${Math.random()}`);

    // Track which chunks are currently loading to prevent duplicates
    const loadingChunks = useRef<Set<string>>(new Set());

    /**
     * Fetch a single chunk from the backend
     */
    const fetchChunk = useCallback(async (chunkX: number, chunkY: number, z: number) => {
        const key = `${chunkX},${chunkY},${z}`;

        // Skip if already loaded or loading
        if (chunks.has(key) || loadingChunks.current.has(key)) {
            return;
        }

        loadingChunks.current.add(key);

        try {
            const worldX = chunkX * chunkSize;
            const worldY = chunkY * chunkSize;

            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/explore/chunk/${worldX}/${worldY}/${z}`
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch chunk: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.success && result.data) {
                const chunk: Chunk = {
                    x: chunkX,
                    y: chunkY,
                    z,
                    data: result.data.chunk,
                };

                setChunks((prev) => {
                    const next = new Map(prev);
                    next.set(key, chunk);
                    return next;
                });
            }
        } catch (err) {
            console.error(`[ExplorationMap] Failed to load chunk ${key}:`, err);
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            loadingChunks.current.delete(key);
        }
    }, [chunks, chunkSize]);

    /**
     * Load chunks around current position
     */
    const loadVisibleChunks = useCallback(async () => {
        const playerChunkX = Math.floor(position.x / chunkSize);
        const playerChunkY = Math.floor(position.y / chunkSize);
        const chunkRadius = Math.ceil(visionRadius / chunkSize) + 1; // +1 for buffer

        setIsLoading(true);

        const promises: Promise<void>[] = [];

        for (let dy = -chunkRadius; dy <= chunkRadius; dy++) {
            for (let dx = -chunkRadius; dx <= chunkRadius; dx++) {
                const chunkX = playerChunkX + dx;
                const chunkY = playerChunkY + dy;
                promises.push(fetchChunk(chunkX, chunkY, position.z));
            }
        }

        await Promise.all(promises);
        setIsLoading(false);

        // Optionally track explored area
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/explore/reveal`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: sessionId.current,
                    position,
                    radius: visionRadius,
                }),
            });
        } catch (err) {
            console.warn('[ExplorationMap] Failed to track exploration:', err);
        }
    }, [position, visionRadius, chunkSize, fetchChunk]);

    /**
     * Move player and load new chunks
     */
    const move = useCallback((dx: number, dy: number) => {
        setPosition((prev) => ({
            ...prev,
            x: prev.x + dx,
            y: prev.y + dy,
        }));
    }, []);

    /**
     * Change z-level
     */
    const changeLevel = useCallback((newZ: number) => {
        if (newZ < -3 || newZ > 3) return;
        setPosition((prev) => ({
            ...prev,
            z: newZ,
        }));
    }, []);

    /**
     * Get merged grid for rendering
     */
    const getVisibleGrid = useCallback((): string[][] => {
        // Calculate visible area
        const playerChunkX = Math.floor(position.x / chunkSize);
        const playerChunkY = Math.floor(position.y / chunkSize);
        const chunkRadius = Math.ceil(visionRadius / chunkSize) + 1;

        // Find bounds
        const minChunkX = playerChunkX - chunkRadius;
        const maxChunkX = playerChunkX + chunkRadius;
        const minChunkY = playerChunkY - chunkRadius;
        const maxChunkY = playerChunkY + chunkRadius;

        const gridWidth = (maxChunkX - minChunkX + 1) * chunkSize;
        const gridHeight = (maxChunkY - minChunkY + 1) * chunkSize;

        // Create empty grid
        const grid: string[][] = Array(gridHeight)
            .fill(null)
            .map(() => Array(gridWidth).fill('plains'));

        // Fill with chunks
        for (const [key, chunk] of chunks.entries()) {
            if (chunk.z !== position.z) continue;

            const localChunkX = chunk.x - minChunkX;
            const localChunkY = chunk.y - minChunkY;

            for (let y = 0; y < chunkSize && y < chunk.data.length; y++) {
                const row = chunk.data[y];
                if (!row) continue;
                for (let x = 0; x < chunkSize && x < row.length; x++) {
                    const gridX = localChunkX * chunkSize + x;
                    const gridY = localChunkY * chunkSize + y;
                    if (gridY >= 0 && gridY < gridHeight && gridX >= 0 && gridX < gridWidth) {
                        grid[gridY][gridX] = row[x] || 'plains';
                    }
                }
            }
        }

        return grid;
    }, [chunks, position, visionRadius, chunkSize]);

    // Load chunks when position changes
    useEffect(() => {
        loadVisibleChunks();
    }, [loadVisibleChunks]);

    return {
        position,
        chunks,
        visibleGrid: getVisibleGrid(),
        isLoading,
        error,
        move,
        changeLevel,
        visionRadius,
    };
}
