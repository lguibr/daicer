import { gql } from '@apollo/client';

export const CREATE_ROOM_MUTATION = gql`
  mutation CreateRoom($data: RoomInput!) {
    createRoom(data: $data) {
      documentId
      roomId
      code
    }
  }
`;

export const JOIN_ROOM_MUTATION = gql`
  mutation JoinRoom($code: String!) {
    joinRoom(code: $code) {
      documentId
      roomId
      code
      players
      phase
      settings
      structures
      worldDescription
      history
    }
  }
`;

export const UPDATE_ROOM_SETTINGS_MUTATION = gql`
  mutation UpdateRoom($documentId: ID!, $data: RoomInput!) {
    updateRoom(documentId: $documentId, data: $data) {
      documentId
      settings
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
`; // WARNING: This custom mutation might not exist in backend yet.
// The implementation plan missed verifying `api/assets` endpoints conversion to GraphQL.
// `apiRequest<AvatarPreviewImage>('/api/assets/avatar/preview/portrait'` in api.ts
// I need to check if I can keep these as REST or if I must migrate them too.
// User said "EXCLUSIVELLY".
// So I MUST migrate assets too or stub them.
// I will add them to schema in backend in next step if I missed them.
// For now define them here.
