import { gameContractExtension } from './game-contract';

export const typeDefs = `
  type Ability {
    id: ID!
    documentId: ID!
    name: String!
    fullName: String!
    description: String
    skills: [Skill]
  }
  type Skill {
    id: ID!
    documentId: ID!
    name: String!
    description: String
    abilityScore: Ability
  }
  type Alignment {
    id: ID!
    documentId: ID!
    name: String!
    abbreviation: String
    description: String
  }
  type Background {
    id: ID!
    documentId: ID!
    name: String!
    description: String
    skillProficiencies: [Skill]
  }
  type GameCondition {
    id: ID!
    documentId: ID!
    name: String!
    description: String
  }

  input ChunkRequestInput {
    x: Int!
    y: Int!
  }

  input WorldConfigInput {
    seed: String
    chunkSize: Int
    globalScale: Float
    seaLevel: Float
    elevationScale: Float
    roughness: Float
    detail: Float
    moistureScale: Float
    temperatureOffset: Float
    structureChance: Float
    structureSpacing: Int
    structureSizeAvg: Int
    roadDensity: Float
    fogRadius: Int
  }

  type SearchResult {
    id: ID!
    name: String!
    type: String!
  }

  type WorldTime {
    ticks: Int!
    day: Int!
    year: Int!
    timeOfDay: String!
    formatted: String!
    isDay: Boolean!
    lightLevel: Float!
  }

  type RuntimeCost {
    type: String
    amount: Int
    actionType: String
    resourceId: String
  }
  
  type RuntimeRange {
    type: String
    value: Int
    reach: Int
  }

  type RuntimeAction {
    id: ID!
    name: String!
    type: String
    sourceType: String
    sourceId: String
    description: String
    img: String
    cost: RuntimeCost
    range: RuntimeRange
    attackBonus: Int
    damage: String
  }

  type AgentLog {
    id: ID!
    type: String!
    payload: JSON
    actorId: String
    sequenceId: String
    timestamp: String
  }

  extend type Query {
    getAgentLogs(roomId: ID!): [AgentLog]
    searchEntities(query: String!): [SearchResult]!
    abilities: [Ability]
    skills: [Skill]
    alignments: [Alignment]
    backgrounds: [Background]
    conditions: [GameCondition]
    getWorldTime(roomId: ID!): WorldTime
    voxelPreview(chunks: [ChunkRequestInput]!, config: WorldConfigInput!): [VoxelChunk]!
    getTimeFrame(id: ID!): JSON
  }

  type VoxelChunk {
    x: Int!
    y: Int!
    tiles: JSON!
  }

  extend type Mutation {
    generateWorld(roomId: ID!, language: String): JSON
    processTurn(roomId: ID!, messages: JSON, language: String): JSON
    addCharacter(roomId: ID!, character: JSON): JSON
    spawnCreature(roomId: ID!, creature: JSON): JSON
    generateAvatarPortrait(payload: JSON!, referenceImage: String): JSON
    generateAvatarUpperBody(payload: JSON!, portrait: JSON!, referenceImage: String): JSON
    generateAvatarFullBody(payload: JSON!, portrait: JSON!, upperBody: JSON!, referenceImage: String): JSON
    generateTerrainChunk(roomId: ID!, chunkX: Int!, chunkY: Int!, chunkSize: Int): JSON
    generateTerrain(roomId: ID!): Boolean
    executeTool(roomId: ID!, command: String!): JSON
    submitAgentAnswer(questionId: ID!, answer: String!): JSON
  }
` + gameContractExtension;
