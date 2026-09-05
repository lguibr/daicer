/**
 * Authoritative player-facing game contract. DTOs deliberately do not expose
 * Strapi relations. See GAME_CONTRACT.md for identity and authorization rules.
 */
export const gameContractTypes = /* GraphQL */ `
  enum GameRoomPhase { lobby starting gameplay character_creation world_generation combat ending ended }
  enum GameTurnStatus { collecting resolving }
  enum GameSubmissionKind { intent pass }
  enum GameSubmissionStatus { proposing submitted needs_revision resolved }
  enum GameOperationStatus { running complete failed }
  enum GameMessageAudience { room self }

  input GameWorldConfigInput {
    seed: String!
    chunkSize: Int
    detail: Int
    fogRadius: Int
    globalScale: Float
    seaLevel: Float
    elevationScale: Float
    roughness: Float
    moistureScale: Float
    temperatureOffset: Float
    roadDensity: Float
    structureChance: Float
    structureSpacing: Int
    structureSizeAvg: Int
    worldSize: String
    worldType: String
  }
  input CreateRoomInput { requestId: ID!, language: String!, worldConfig: GameWorldConfigInput! }
  input JoinRoomInput { requestId: ID!, code: String! }
  input SelectCharacterInput { requestId: ID!, roomId: ID!, blueprintId: ID! }
  input SetReadyInput { requestId: ID!, roomId: ID!, ready: Boolean! }
  input RoomOperationInput { requestId: ID!, roomId: ID! }
  input SubmitActionInput {
    requestId: ID!
    roomId: ID!
    turnNumber: Int!
    kind: GameSubmissionKind!
    text: String
  }
  input ResolveTurnInput { requestId: ID!, roomId: ID!, turnNumber: Int! }

  type GameWorldConfig {
    seed: String!
    chunkSize: Int!
    detail: Int!
    fogRadius: Int!
    globalScale: Float!
    seaLevel: Float!
    elevationScale: Float!
    roughness: Float!
    moistureScale: Float!
    temperatureOffset: Float!
    roadDensity: Float!
    structureChance: Float!
    structureSpacing: Int!
    structureSizeAvg: Int!
    worldSize: String!
    worldType: String!
  }
  type GameWorldView { worldId: ID!, language: String!, description: String!, config: GameWorldConfig! }
  type GamePosition { x: Float!, y: Float!, z: Int! }
  type GameAttributes {
    strength: Int!, dexterity: Int!, constitution: Int!, intelligence: Int!, wisdom: Int!, charisma: Int!
  }
  type GameEntityView {
    characterSheetId: ID!
    blueprintId: ID
    name: String!
    type: String!
    currentHp: Int!
    maxHp: Int!
    ac: Int!
    position: GamePosition
    stats: GameAttributes
  }
  type GameTerrainTile {
    x: Int!, y: Int!, z: Int!, block: String!, biome: String!, isWalkable: Boolean!, isTransparent: Boolean!
  }
  type GameTerrainView {
    worldId: ID!, revision: String!, chunkSize: Int!, minZ: Int!, maxZ: Int!, tiles: [GameTerrainTile!]!
  }
  type GamePlayerView {
    userId: ID!
    name: String!
    characterSheetId: ID
    characterName: String
    ready: Boolean!
    submitted: Boolean!
  }
  type GameTurnView {
    number: Int!
    status: GameTurnStatus!
    lastResolvedNumber: Int!
    submittedCount: Int!
    requiredCount: Int!
  }
  type GameSubmissionView {
    submissionId: ID!
    turnNumber: Int!
    kind: GameSubmissionKind!
    text: String
    status: GameSubmissionStatus!
    feedback: String
  }
  type GameCapabilities { canStart: Boolean!, canSubmit: Boolean!, canResolve: Boolean! }
  type GameMessageView {
    messageId: ID!
    turnNumber: Int
    audience: GameMessageAudience!
    content: String!
    senderName: String!
    senderType: String!
    timestamp: String!
  }
  type GameMessagePageInfo { hasPreviousPage: Boolean!, startCursor: String }
  type GameMessagePage { nodes: [GameMessageView!]!, pageInfo: GameMessagePageInfo! }
  type RoomSummary { roomId: ID!, code: String!, phase: GameRoomPhase!, ownerUserId: ID! }
  type CharacterBlueprint { blueprintId: ID!, name: String!, description: String! }
  type RoomView {
    roomId: ID!
    code: String!
    phase: GameRoomPhase!
    revision: Int!
    ownerUserId: ID!
    world: GameWorldView!
    players: [GamePlayerView!]!
    myself: GameEntityView
    turn: GameTurnView
    mySubmission: GameSubmissionView
    visibleEntities: [GameEntityView!]!
    terrain: GameTerrainView
    messages: GameMessagePage!
    capabilities: GameCapabilities!
  }
  type RoomOperation {
    operationId: ID!
    roomId: ID!
    phase: GameRoomPhase!
    turnNumber: Int
    status: GameOperationStatus!
  }
  type SubmissionReceipt {
    submissionId: ID!
    turnNumber: Int!
    status: GameSubmissionStatus!
    submittedCount: Int!
    requiredCount: Int!
  }
`;

export const gameQueryFields = /* GraphQL */ `
  gameView(roomId: ID!): RoomView!
  myRooms: [RoomSummary!]!
  characterBlueprints: [CharacterBlueprint!]!
  gameMessages(roomId: ID!, before: String, last: Int = 50): GameMessagePage!
`;

export const gameMutationFields = /* GraphQL */ `
  createRoom(input: CreateRoomInput!): RoomView!
  joinRoom(input: JoinRoomInput!): RoomView!
  selectCharacter(input: SelectCharacterInput!): RoomView!
  setReady(input: SetReadyInput!): RoomView!
  startGame(input: RoomOperationInput!): RoomOperation!
  submitAction(input: SubmitActionInput!): SubmissionReceipt!
  resolveTurn(input: ResolveTurnInput!): RoomOperation!
`;

/** The same definitions used by Strapi, buildable offline for scoped codegen. */
export const standaloneGameSchema = `${gameContractTypes}
  type Query { ${gameQueryFields} }
  type Mutation { ${gameMutationFields} }
`;

/** Applied by the application integration batch, replacing the old lifecycle fields. */
export const gameContractExtension = `${gameContractTypes}
  extend type Query { ${gameQueryFields} }
  extend type Mutation { ${gameMutationFields} }
`;
