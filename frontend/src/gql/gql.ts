/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  mutation CreateRoom($data: RoomInput!) {\n    createRoom(data: $data) {\n      documentId\n      roomId\n      code\n    }\n  }\n": typeof types.CreateRoomDocument,
    "\n  mutation JoinRoom($code: String!) {\n    joinRoom(code: $code) {\n      documentId\n      roomId\n      code\n      players\n      phase\n      settings\n      structures\n      worldDescription\n      history\n    }\n  }\n": typeof types.JoinRoomDocument,
    "\n  mutation UpdateRoom($documentId: ID!, $data: RoomInput!) {\n    updateRoom(documentId: $documentId, data: $data) {\n      documentId\n      settings\n    }\n  }\n": typeof types.UpdateRoomDocument,
    "\n  mutation GenerateWorld($roomId: ID!, $language: String) {\n    generateWorld(roomId: $roomId, language: $language)\n  }\n": typeof types.GenerateWorldDocument,
    "\n  mutation AddCharacter($roomId: ID!, $character: JSON!) {\n    addCharacter(roomId: $roomId, character: $character)\n  }\n": typeof types.AddCharacterDocument,
    "\n  mutation StartGame($roomId: ID!, $language: String, $streamId: String) {\n    startGame(roomId: $roomId, language: $language, streamId: $streamId)\n  }\n": typeof types.StartGameDocument,
    "\n  mutation SubmitAction($roomId: ID!, $action: String!) {\n    submitAction(roomId: $roomId, action: $action)\n  }\n": typeof types.SubmitActionDocument,
    "\n  mutation GenerateAvatarPortrait($payload: JSON!, $referenceImage: String) {\n    generateAvatarPortrait(payload: $payload, referenceImage: $referenceImage)\n  }\n": typeof types.GenerateAvatarPortraitDocument,
    "\n  query GetRoom($filters: RoomFiltersInput) {\n    rooms(filters: $filters) {\n      documentId\n      roomId\n      code\n      phase\n      players\n      settings\n      structures\n      worldDescription\n      history\n    }\n  }\n": typeof types.GetRoomDocument,
    "\n  query ListRooms($filters: RoomFiltersInput) {\n    rooms(filters: $filters) {\n      documentId\n      roomId\n      code\n      phase\n      players\n    }\n  }\n": typeof types.ListRoomsDocument,
};
const documents: Documents = {
    "\n  mutation CreateRoom($data: RoomInput!) {\n    createRoom(data: $data) {\n      documentId\n      roomId\n      code\n    }\n  }\n": types.CreateRoomDocument,
    "\n  mutation JoinRoom($code: String!) {\n    joinRoom(code: $code) {\n      documentId\n      roomId\n      code\n      players\n      phase\n      settings\n      structures\n      worldDescription\n      history\n    }\n  }\n": types.JoinRoomDocument,
    "\n  mutation UpdateRoom($documentId: ID!, $data: RoomInput!) {\n    updateRoom(documentId: $documentId, data: $data) {\n      documentId\n      settings\n    }\n  }\n": types.UpdateRoomDocument,
    "\n  mutation GenerateWorld($roomId: ID!, $language: String) {\n    generateWorld(roomId: $roomId, language: $language)\n  }\n": types.GenerateWorldDocument,
    "\n  mutation AddCharacter($roomId: ID!, $character: JSON!) {\n    addCharacter(roomId: $roomId, character: $character)\n  }\n": types.AddCharacterDocument,
    "\n  mutation StartGame($roomId: ID!, $language: String, $streamId: String) {\n    startGame(roomId: $roomId, language: $language, streamId: $streamId)\n  }\n": types.StartGameDocument,
    "\n  mutation SubmitAction($roomId: ID!, $action: String!) {\n    submitAction(roomId: $roomId, action: $action)\n  }\n": types.SubmitActionDocument,
    "\n  mutation GenerateAvatarPortrait($payload: JSON!, $referenceImage: String) {\n    generateAvatarPortrait(payload: $payload, referenceImage: $referenceImage)\n  }\n": types.GenerateAvatarPortraitDocument,
    "\n  query GetRoom($filters: RoomFiltersInput) {\n    rooms(filters: $filters) {\n      documentId\n      roomId\n      code\n      phase\n      players\n      settings\n      structures\n      worldDescription\n      history\n    }\n  }\n": types.GetRoomDocument,
    "\n  query ListRooms($filters: RoomFiltersInput) {\n    rooms(filters: $filters) {\n      documentId\n      roomId\n      code\n      phase\n      players\n    }\n  }\n": types.ListRoomsDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateRoom($data: RoomInput!) {\n    createRoom(data: $data) {\n      documentId\n      roomId\n      code\n    }\n  }\n"): (typeof documents)["\n  mutation CreateRoom($data: RoomInput!) {\n    createRoom(data: $data) {\n      documentId\n      roomId\n      code\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation JoinRoom($code: String!) {\n    joinRoom(code: $code) {\n      documentId\n      roomId\n      code\n      players\n      phase\n      settings\n      structures\n      worldDescription\n      history\n    }\n  }\n"): (typeof documents)["\n  mutation JoinRoom($code: String!) {\n    joinRoom(code: $code) {\n      documentId\n      roomId\n      code\n      players\n      phase\n      settings\n      structures\n      worldDescription\n      history\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateRoom($documentId: ID!, $data: RoomInput!) {\n    updateRoom(documentId: $documentId, data: $data) {\n      documentId\n      settings\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateRoom($documentId: ID!, $data: RoomInput!) {\n    updateRoom(documentId: $documentId, data: $data) {\n      documentId\n      settings\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation GenerateWorld($roomId: ID!, $language: String) {\n    generateWorld(roomId: $roomId, language: $language)\n  }\n"): (typeof documents)["\n  mutation GenerateWorld($roomId: ID!, $language: String) {\n    generateWorld(roomId: $roomId, language: $language)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AddCharacter($roomId: ID!, $character: JSON!) {\n    addCharacter(roomId: $roomId, character: $character)\n  }\n"): (typeof documents)["\n  mutation AddCharacter($roomId: ID!, $character: JSON!) {\n    addCharacter(roomId: $roomId, character: $character)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation StartGame($roomId: ID!, $language: String, $streamId: String) {\n    startGame(roomId: $roomId, language: $language, streamId: $streamId)\n  }\n"): (typeof documents)["\n  mutation StartGame($roomId: ID!, $language: String, $streamId: String) {\n    startGame(roomId: $roomId, language: $language, streamId: $streamId)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SubmitAction($roomId: ID!, $action: String!) {\n    submitAction(roomId: $roomId, action: $action)\n  }\n"): (typeof documents)["\n  mutation SubmitAction($roomId: ID!, $action: String!) {\n    submitAction(roomId: $roomId, action: $action)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation GenerateAvatarPortrait($payload: JSON!, $referenceImage: String) {\n    generateAvatarPortrait(payload: $payload, referenceImage: $referenceImage)\n  }\n"): (typeof documents)["\n  mutation GenerateAvatarPortrait($payload: JSON!, $referenceImage: String) {\n    generateAvatarPortrait(payload: $payload, referenceImage: $referenceImage)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetRoom($filters: RoomFiltersInput) {\n    rooms(filters: $filters) {\n      documentId\n      roomId\n      code\n      phase\n      players\n      settings\n      structures\n      worldDescription\n      history\n    }\n  }\n"): (typeof documents)["\n  query GetRoom($filters: RoomFiltersInput) {\n    rooms(filters: $filters) {\n      documentId\n      roomId\n      code\n      phase\n      players\n      settings\n      structures\n      worldDescription\n      history\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ListRooms($filters: RoomFiltersInput) {\n    rooms(filters: $filters) {\n      documentId\n      roomId\n      code\n      phase\n      players\n    }\n  }\n"): (typeof documents)["\n  query ListRooms($filters: RoomFiltersInput) {\n    rooms(filters: $filters) {\n      documentId\n      roomId\n      code\n      phase\n      players\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;