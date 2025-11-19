/**
 * Exploration Service
 * Handles procedural chunk generation and per-session exploration tracking
 * FOR PROTOTYPE: Using simple noise-based generation
 */
class ExplorationService {
    // In-memory storage for explored areas per session
    private exploredAreas: Map<string, Set<string>> = new Map();

    // World seed for deterministic generation
    private readonly worldSeed = 'exploration-prototype-2024';

    // Chunk size (matches frontend)
    private readonly chunkSize = 16;

    /**
     * Simple hash function for deterministic noise
     */
    private hash(x: number, y: number, seed: string): number {
        let str = `${seed}:${x}:${y}`;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash) / 2147483647;
    }

    /**
     * Generate a chunk at world coordinates using simple noise
     */
    async generateChunk(worldX: number, worldY: number, zLevel: number): Promise<string[][]> {
        const chunkData: string[][] = [];

        // Simple biomes based on noise
        const biomes = ['ocean', 'plains', 'forest', 'mountains', 'desert', 'swamp'];

        for (let y = 0; y < this.chunkSize; y++) {
            const row: string[] = [];
            for (let x = 0; x < this.chunkSize; x++) {
                const worldTileX = worldX + x;
                const worldTileY = worldY + y;

                // Use hash for deterministic "noise"
                const noise = this.hash(worldTileX, worldTileY, `${this.worldSeed}:${zLevel}`);

                // Pick biome based on noise value
                const biomeIndex = Math.floor(noise * biomes.length);
                row.push(biomes[biomeIndex]);
            }
            chunkData.push(row);
        }

        return chunkData;
    }

    /**
     * Reveal explored area around position
     * Returns set of chunk keys that are now visible
     */
    revealArea(sessionId: string, x: number, y: number, z: number, radius: number): Set<string> {
        // Get or create explored set for this session
        if (!this.exploredAreas.has(sessionId)) {
            this.exploredAreas.set(sessionId, new Set());
        }

        const explored = this.exploredAreas.get(sessionId)!;

        // Calculate which chunks are within vision radius
        const chunkX = Math.floor(x / this.chunkSize);
        const chunkY = Math.floor(y / this.chunkSize);
        const chunkRadius = Math.ceil(radius / this.chunkSize);

        for (let dy = -chunkRadius; dy <= chunkRadius; dy++) {
            for (let dx = -chunkRadius; dx <= chunkRadius; dx++) {
                const cx = chunkX + dx;
                const cy = chunkY + dy;
                const key = `${cx},${cy},${z}`;
                explored.add(key);
            }
        }

        return explored;
    }

    /**
     * Get explored chunks for a session
     */
    getExploredChunks(sessionId: string): Set<string> {
        return this.exploredAreas.get(sessionId) || new Set();
    }

    /**
     * Clear session data (for cleanup)
     */
    clearSession(sessionId: string): void {
        this.exploredAreas.delete(sessionId);
    }
}

export const explorationService = new ExplorationService();

