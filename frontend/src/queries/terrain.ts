import { gql } from '@apollo/client';

export const GENERATE_TERRAIN_MUTATION = gql`
  mutation GenerateTerrain($roomId: ID!) {
    generateTerrain(roomId: $roomId)
  }
`;

export const GENERATE_TERRAIN_CHUNK_MUTATION = gql`
  mutation GenerateTerrainChunk($roomId: ID!, $chunkX: Int!, $chunkY: Int!, $chunkSize: Int) {
    generateTerrainChunk(roomId: $roomId, chunkX: $chunkX, chunkY: $chunkY, chunkSize: $chunkSize)
  }
`;
