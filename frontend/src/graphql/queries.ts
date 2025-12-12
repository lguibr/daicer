import { gql } from '@apollo/client';

export const GET_ROOM_QUERY = gql`
  query GetRoom($filters: RoomFiltersInput) {
    rooms(filters: $filters) {
      documentId
      roomId
      code
      phase
      players
      settings
      structures
      worldDescription
      history
    }
  }
`;

export const LIST_ROOMS_QUERY = gql`
  query ListRooms($filters: RoomFiltersInput) {
    rooms(filters: $filters) {
      documentId
      roomId
      code
      phase
      players
    }
  }
`;
