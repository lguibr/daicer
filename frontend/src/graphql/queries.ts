import { gql } from '@apollo/client';

export const GET_ROOM_QUERY = gql`
  query GetRoom($filters: RoomFiltersInput) {
    rooms(filters: $filters) {
      documentId
      roomId
      code
      phase
      players {
        id
        name
        isReady
        isOnline
        joinedAt
        action
        user {
          documentId
          username
        }
        character {
          documentId
          name
          name
          backstory
          portrait {
            url
          }
          upperBody {
            url
          }
          fullBody {
            url
          }
          baseStats {
            strength
            dexterity
            constitution
            intelligence
            wisdom
            charisma
          }
        }
      }
      settings
      worldType
      worldSize
      adventureLength
      difficulty
      startingLevel
      playerCount
      theme
      setting
      tone
      dmStyle {
        verbosity
        detail
        engagement
        narrative
        specialMode
        customDirectives
      }
      generationParams {
        structureMinDistance
        maxStructures
        generateRoads
        elevationScale
        elevationOctaves
        elevationPersistence
        moistureScale
        moistureOctaves
        moisturePersistence
        caveFillPercentage
        caveIterations
        caveBirthLimit
        caveDeathLimit
        bspSize
        bspMinRoomSize
        bspMaxRoomSize
        featureMinDistance
        featureAttempts
      }
      structures
      worldDescription
      history # Keeping for legacy support
      messages(sort: "timestamp:asc", pagination: { limit: 100 }) {
        documentId
        content
        senderName
        senderType
        timestamp
        turn {
          documentId
          turnNumber
        }
      }
      turns(sort: "turnNumber:desc", pagination: { limit: 5 }) {
        documentId
        turnNumber
        narrative
        status
        type
        characterSnapshots
        actions
        createdAt
      }
      owner {
        documentId
        username
      }
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
      phase
      owner {
        documentId
        username
      }
      players {
        id
        name
        isReady
        isOnline
        joinedAt
        user {
          documentId
          username
        }
        character {
          documentId
          name
          portrait {
            url
          }
        }
      }
    }
  }
`;
