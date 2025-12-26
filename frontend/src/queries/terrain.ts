import { gql } from '@apollo/client';

export const GENERATE_TERRAIN_MUTATION = gql`
  mutation GenerateTerrain($roomId: ID!) {
    generateTerrain(roomId: $roomId)
  }
`;
