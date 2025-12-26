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

  extend type Query {
    abilities: [Ability]
    skills: [Skill]
    alignments: [Alignment]
    backgrounds: [Background]
    conditions: [GameCondition]
  }

  extend type Mutation {
    generateWorld(roomId: ID!, language: String): JSON
    processTurn(roomId: ID!, messages: JSON, language: String): JSON
    joinRoom(code: String!): Room
    addCharacter(roomId: ID!, character: JSON): JSON
    startGame(roomId: ID!, language: String, streamId: String): JSON
    submitAction(roomId: ID!, action: String): JSON
    spawnCreature(roomId: ID!, creature: JSON): JSON
    generateAvatarPortrait(payload: JSON!, referenceImage: String): JSON
    generateAvatarUpperBody(payload: JSON!, portrait: JSON!, referenceImage: String): JSON
    generateAvatarFullBody(payload: JSON!, portrait: JSON!, upperBody: JSON!, referenceImage: String): JSON
    generateTerrainChunk(roomId: ID!, chunkX: Int!, chunkY: Int!, chunkSize: Int): JSON
    generateTerrain(roomId: ID!): Boolean
  }
`;
