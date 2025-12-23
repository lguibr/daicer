import type { ChunkDTO } from '@daicer/shared';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:1337';

export const TerrainAPI = {
  /**
   * Fetch a single chunk by grid coordinates.
   */
  async getChunk(roomId: string, x: number, y: number, token?: string): Promise<ChunkDTO> {
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}/api/map/${roomId}/chunk?x=${x}&y=${y}`, {
      headers,
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch chunk ${x},${y}: ${res.statusText}`);
    }
    const json = await res.json();
    // The backend returns { data: chunk }
    return json.data;
  },

  /**
   * Send terraform updates (deltas) to the server.
   */
  async terraform(roomId: string, x: number, y: number, deltas: Record<string, unknown>): Promise<void> {
    const res = await fetch(`${API_URL}/api/map/${roomId}/terraform`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        x,
        y,
        deltas,
      }),
    });

    if (!res.ok) {
      throw new Error(`Failed to terraform ${x},${y}: ${res.statusText}`);
    }
  },

  /**
   * Generate or regenerate the world map with specific parameters.
   */
  async generateWorld(
    roomId: string,
    params: { seed?: string; preset?: string; biomeConfig?: unknown; generationParams?: unknown },
    token?: string
  ): Promise<{ data: { success: boolean; mapId?: string } }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}/api/map/${roomId}/generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      throw new Error(`Failed to generate world: ${res.statusText}`);
    }
    return res.json();
  },
};
