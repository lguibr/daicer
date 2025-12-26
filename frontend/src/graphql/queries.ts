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
  query ListRooms($sort: [String] = ["createdAt:desc"]) {
    rooms(sort: $sort, pagination: { limit: 50 }) {
      documentId
      roomId
      code
      createdAt
      phase
      dmSetting {
        theme
        setting
        difficulty
      }
      character_sheets {
        documentId
      }
      players {
        id
      }
    }
  }
`;

export const LIST_CHARACTERS_QUERY = gql`
  query ListCharacters {
    characters(sort: "name:asc", pagination: { limit: 1000 }) {
      documentId
      name
      race {
        name
      }
      class {
        name
      }
    }
  }
`;

export const LIST_MONSTERS_QUERY = gql`
  query ListMonsters {
    monsters(sort: "name:asc", pagination: { limit: 1000 }) {
      documentId
      name
      type
      size
      hp
      ac
      xp
      challenge_rating
    }
  }
`;
