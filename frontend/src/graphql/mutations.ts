import { gql } from '@apollo/client';

export const CREATE_ROOM_MUTATION = gql`
  mutation CreateRoom($data: JSON!) {
    createRoom(data: $data) {
      documentId
      roomId
      code
      world {
        name
        description
        seed
        language
        chunkSize
        detail
        fogRadius
        globalScale
        seaLevel
        elevationScale
        roughness
        moistureScale
        temperatureOffset
        roadDensity
        structureChance
        structureSpacing
        structureSizeAvg
        worldSize
        worldType
        worldBackground
      }
      dmSettings {
        adventureLength
        difficulty
        theme
        setting
        tone
        playerCount
        startingLevel
        attributePointBudget
        dmSystemPrompt
        dmStyle {
          verbosity
          detail
          engagement
          narrative
          specialMode
          customDirectives
        }
      }
    }
  }
`;

export const JOIN_ROOM_MUTATION = gql`
  mutation JoinRoom($code: String!) {
    joinRoom(code: $code) {
      documentId
      roomId
      code
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
      phase
      world {
        name
        description
        seed
        language
        chunkSize
        detail
        fogRadius
        globalScale
        seaLevel
        elevationScale
        roughness
        moistureScale
        temperatureOffset
        roadDensity
        structureChance
        structureSpacing
        structureSizeAvg
        worldSize
        worldType
        worldBackground
      }
      dmSettings {
        adventureLength
        difficulty
        theme
        setting
        tone
        playerCount
        startingLevel
        attributePointBudget
        dmSystemPrompt
        dmStyle {
          verbosity
          detail
          engagement
          narrative
          specialMode
          customDirectives
        }
      }
    }
  }
`;

export const UPDATE_ROOM_MUTATION = gql`
  mutation UpdateRoom($documentId: ID!, $data: RoomInput!) {
    updateRoom(documentId: $documentId, data: $data) {
      documentId
    }
  }
`;

export const GENERATE_WORLD_MUTATION = gql`
  mutation GenerateWorld($roomId: ID!, $language: String) {
    generateWorld(roomId: $roomId, language: $language)
  }
`;

export const ADD_CHARACTER_MUTATION = gql`
  mutation AddCharacter($roomId: ID!, $character: JSON!) {
    addCharacter(roomId: $roomId, character: $character)
  }
`;

export const START_GAME_MUTATION = gql`
  mutation StartGame($roomId: ID!, $language: String, $streamId: String) {
    startGame(roomId: $roomId, language: $language, streamId: $streamId)
  }
`;

export const SUBMIT_ACTION_MUTATION = gql`
  mutation SubmitAction($roomId: ID!, $action: String!) {
    submitAction(roomId: $roomId, action: $action)
  }
`;

// Asset Generation
export const GENERATE_PORTRAIT_MUTATION = gql`
  mutation GenerateAvatarPortrait($payload: JSON!, $referenceImage: String) {
    generateAvatarPortrait(payload: $payload, referenceImage: $referenceImage)
  }
`;

export const GENERATE_UPPER_BODY_MUTATION = gql`
  mutation GenerateAvatarUpperBody($payload: JSON!, $portrait: JSON!, $referenceImage: String) {
    generateAvatarUpperBody(payload: $payload, portrait: $portrait, referenceImage: $referenceImage)
  }
`;

export const GENERATE_FULL_BODY_MUTATION = gql`
  mutation GenerateAvatarFullBody($payload: JSON!, $portrait: JSON!, $upperBody: JSON!, $referenceImage: String) {
    generateAvatarFullBody(
      payload: $payload
      portrait: $portrait
      upperBody: $upperBody
      referenceImage: $referenceImage
    )
  }
`;

export const SPAWN_CREATURE_MUTATION = gql`
  mutation SpawnCreature($roomId: ID!, $creature: JSON!) {
    spawnCreature(roomId: $roomId, creature: $creature)
  }
`;

export const GENERATE_TERRAIN_CHUNK_MUTATION = gql`
  mutation GenerateTerrainChunk($roomId: ID!, $chunkX: Int!, $chunkY: Int!, $chunkSize: Int) {
    generateTerrainChunk(roomId: $roomId, chunkX: $chunkX, chunkY: $chunkY, chunkSize: $chunkSize)
  }
`;
