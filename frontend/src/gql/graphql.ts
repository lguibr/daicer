/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  DateTime: { input: any; output: any; }
  /** A string used to identify an i18n locale */
  I18NLocaleCode: { input: any; output: any; }
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: { input: any; output: any; }
  /** The `BigInt` scalar type represents non-fractional signed whole numeric values. */
  Long: { input: any; output: any; }
};

export type Ability = {
  __typename?: 'Ability';
  description?: Maybe<Scalars['String']['output']>;
  documentId: Scalars['ID']['output'];
  fullName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  skills?: Maybe<Array<Maybe<Skill>>>;
};

export type Alignment = {
  __typename?: 'Alignment';
  abbreviation?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  documentId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type Background = {
  __typename?: 'Background';
  description?: Maybe<Scalars['String']['output']>;
  documentId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  skillProficiencies?: Maybe<Array<Maybe<Skill>>>;
};

export type BooleanFilterInput = {
  and?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  between?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  contains?: InputMaybe<Scalars['Boolean']['input']>;
  containsi?: InputMaybe<Scalars['Boolean']['input']>;
  endsWith?: InputMaybe<Scalars['Boolean']['input']>;
  eq?: InputMaybe<Scalars['Boolean']['input']>;
  eqi?: InputMaybe<Scalars['Boolean']['input']>;
  gt?: InputMaybe<Scalars['Boolean']['input']>;
  gte?: InputMaybe<Scalars['Boolean']['input']>;
  in?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  lt?: InputMaybe<Scalars['Boolean']['input']>;
  lte?: InputMaybe<Scalars['Boolean']['input']>;
  ne?: InputMaybe<Scalars['Boolean']['input']>;
  nei?: InputMaybe<Scalars['Boolean']['input']>;
  not?: InputMaybe<BooleanFilterInput>;
  notContains?: InputMaybe<Scalars['Boolean']['input']>;
  notContainsi?: InputMaybe<Scalars['Boolean']['input']>;
  notIn?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  notNull?: InputMaybe<Scalars['Boolean']['input']>;
  null?: InputMaybe<Scalars['Boolean']['input']>;
  or?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  startsWith?: InputMaybe<Scalars['Boolean']['input']>;
};

export type Character = {
  __typename?: 'Character';
  appearance?: Maybe<Scalars['JSON']['output']>;
  backstory?: Maybe<Scalars['String']['output']>;
  baseStats?: Maybe<ComponentGameStats>;
  class?: Maybe<Class>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  documentId: Scalars['ID']['output'];
  equipment?: Maybe<Array<Maybe<ComponentGameInventoryItem>>>;
  fullBody?: Maybe<UploadFile>;
  name: Scalars['String']['output'];
  portrait?: Maybe<UploadFile>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  race?: Maybe<Race>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  upperBody?: Maybe<UploadFile>;
  user?: Maybe<UsersPermissionsUser>;
};


export type CharacterEquipmentArgs = {
  filters?: InputMaybe<ComponentGameInventoryItemFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type CharacterEntityResponseCollection = {
  __typename?: 'CharacterEntityResponseCollection';
  nodes: Array<Character>;
  pageInfo: Pagination;
};

export type CharacterFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<CharacterFiltersInput>>>;
  appearance?: InputMaybe<JsonFilterInput>;
  backstory?: InputMaybe<StringFilterInput>;
  baseStats?: InputMaybe<ComponentGameStatsFiltersInput>;
  class?: InputMaybe<ClassFiltersInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  documentId?: InputMaybe<IdFilterInput>;
  equipment?: InputMaybe<ComponentGameInventoryItemFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<CharacterFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<CharacterFiltersInput>>>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  race?: InputMaybe<RaceFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  user?: InputMaybe<UsersPermissionsUserFiltersInput>;
};

export type CharacterInput = {
  appearance?: InputMaybe<Scalars['JSON']['input']>;
  backstory?: InputMaybe<Scalars['String']['input']>;
  baseStats?: InputMaybe<ComponentGameStatsInput>;
  class?: InputMaybe<Scalars['ID']['input']>;
  equipment?: InputMaybe<Array<InputMaybe<ComponentGameInventoryItemInput>>>;
  fullBody?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  portrait?: InputMaybe<Scalars['ID']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  race?: InputMaybe<Scalars['ID']['input']>;
  upperBody?: InputMaybe<Scalars['ID']['input']>;
  user?: InputMaybe<Scalars['ID']['input']>;
};

export type CharacterRelationResponseCollection = {
  __typename?: 'CharacterRelationResponseCollection';
  nodes: Array<Character>;
};

export type CharacterSheet = {
  __typename?: 'CharacterSheet';
  appearance?: Maybe<Scalars['JSON']['output']>;
  backstory?: Maybe<Scalars['String']['output']>;
  character?: Maybe<Character>;
  class?: Maybe<Class>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  currentHp?: Maybe<Scalars['Int']['output']>;
  documentId: Scalars['ID']['output'];
  experience?: Maybe<Scalars['Int']['output']>;
  inventory?: Maybe<Array<Maybe<ComponentGameInventoryItem>>>;
  level?: Maybe<Scalars['Int']['output']>;
  maxHp?: Maybe<Scalars['Int']['output']>;
  monster?: Maybe<Monster>;
  name?: Maybe<Scalars['String']['output']>;
  position?: Maybe<ComponentGamePosition>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  race?: Maybe<Race>;
  room?: Maybe<Room>;
  speed?: Maybe<Scalars['JSON']['output']>;
  stats?: Maybe<ComponentGameStats>;
  type?: Maybe<Enum_Charactersheet_Type>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};


export type CharacterSheetInventoryArgs = {
  filters?: InputMaybe<ComponentGameInventoryItemFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type CharacterSheetEntityResponseCollection = {
  __typename?: 'CharacterSheetEntityResponseCollection';
  nodes: Array<CharacterSheet>;
  pageInfo: Pagination;
};

export type CharacterSheetFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<CharacterSheetFiltersInput>>>;
  appearance?: InputMaybe<JsonFilterInput>;
  backstory?: InputMaybe<StringFilterInput>;
  character?: InputMaybe<CharacterFiltersInput>;
  class?: InputMaybe<ClassFiltersInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  currentHp?: InputMaybe<IntFilterInput>;
  documentId?: InputMaybe<IdFilterInput>;
  experience?: InputMaybe<IntFilterInput>;
  inventory?: InputMaybe<ComponentGameInventoryItemFiltersInput>;
  level?: InputMaybe<IntFilterInput>;
  maxHp?: InputMaybe<IntFilterInput>;
  monster?: InputMaybe<MonsterFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<CharacterSheetFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<CharacterSheetFiltersInput>>>;
  position?: InputMaybe<ComponentGamePositionFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  race?: InputMaybe<RaceFiltersInput>;
  room?: InputMaybe<RoomFiltersInput>;
  speed?: InputMaybe<JsonFilterInput>;
  stats?: InputMaybe<ComponentGameStatsFiltersInput>;
  type?: InputMaybe<StringFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type CharacterSheetInput = {
  appearance?: InputMaybe<Scalars['JSON']['input']>;
  backstory?: InputMaybe<Scalars['String']['input']>;
  character?: InputMaybe<Scalars['ID']['input']>;
  class?: InputMaybe<Scalars['ID']['input']>;
  currentHp?: InputMaybe<Scalars['Int']['input']>;
  experience?: InputMaybe<Scalars['Int']['input']>;
  inventory?: InputMaybe<Array<InputMaybe<ComponentGameInventoryItemInput>>>;
  level?: InputMaybe<Scalars['Int']['input']>;
  maxHp?: InputMaybe<Scalars['Int']['input']>;
  monster?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  position?: InputMaybe<ComponentGamePositionInput>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  race?: InputMaybe<Scalars['ID']['input']>;
  room?: InputMaybe<Scalars['ID']['input']>;
  speed?: InputMaybe<Scalars['JSON']['input']>;
  stats?: InputMaybe<ComponentGameStatsInput>;
  type?: InputMaybe<Enum_Charactersheet_Type>;
};

export type CharacterSheetRelationResponseCollection = {
  __typename?: 'CharacterSheetRelationResponseCollection';
  nodes: Array<CharacterSheet>;
};

export type ChunkRequestInput = {
  x: Scalars['Int']['input'];
  y: Scalars['Int']['input'];
};

export type Class = {
  __typename?: 'Class';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  documentId: Scalars['ID']['output'];
  hit_die?: Maybe<Scalars['String']['output']>;
  image?: Maybe<UploadFile>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations: Array<Maybe<Class>>;
  localizations_connection?: Maybe<ClassRelationResponseCollection>;
  name: Scalars['String']['output'];
  proficiencies: Array<Maybe<Proficiency>>;
  proficiencies_connection?: Maybe<ProficiencyRelationResponseCollection>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  slug: Scalars['String']['output'];
  subclasses: Array<Maybe<Subclass>>;
  subclasses_connection?: Maybe<SubclassRelationResponseCollection>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};


export type ClassLocalizationsArgs = {
  filters?: InputMaybe<ClassFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ClassLocalizations_ConnectionArgs = {
  filters?: InputMaybe<ClassFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ClassProficienciesArgs = {
  filters?: InputMaybe<ProficiencyFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ClassProficiencies_ConnectionArgs = {
  filters?: InputMaybe<ProficiencyFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ClassSubclassesArgs = {
  filters?: InputMaybe<SubclassFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ClassSubclasses_ConnectionArgs = {
  filters?: InputMaybe<SubclassFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type ClassEntityResponseCollection = {
  __typename?: 'ClassEntityResponseCollection';
  nodes: Array<Class>;
  pageInfo: Pagination;
};

export type ClassFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<ClassFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  description?: InputMaybe<StringFilterInput>;
  documentId?: InputMaybe<IdFilterInput>;
  hit_die?: InputMaybe<StringFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<ClassFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<ClassFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<ClassFiltersInput>>>;
  proficiencies?: InputMaybe<ProficiencyFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  slug?: InputMaybe<StringFilterInput>;
  subclasses?: InputMaybe<SubclassFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type ClassInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  hit_die?: InputMaybe<Scalars['String']['input']>;
  image?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  proficiencies?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
  subclasses?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
};

export type ClassRelationResponseCollection = {
  __typename?: 'ClassRelationResponseCollection';
  nodes: Array<Class>;
};

export type ComponentGameDmStyle = {
  __typename?: 'ComponentGameDmStyle';
  customDirectives?: Maybe<Scalars['String']['output']>;
  detail?: Maybe<Scalars['Int']['output']>;
  engagement?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  narrative?: Maybe<Scalars['Int']['output']>;
  specialMode?: Maybe<Scalars['String']['output']>;
  verbosity?: Maybe<Scalars['Int']['output']>;
};

export type ComponentGameDmStyleFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<ComponentGameDmStyleFiltersInput>>>;
  customDirectives?: InputMaybe<StringFilterInput>;
  detail?: InputMaybe<IntFilterInput>;
  engagement?: InputMaybe<IntFilterInput>;
  narrative?: InputMaybe<IntFilterInput>;
  not?: InputMaybe<ComponentGameDmStyleFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<ComponentGameDmStyleFiltersInput>>>;
  specialMode?: InputMaybe<StringFilterInput>;
  verbosity?: InputMaybe<IntFilterInput>;
};

export type ComponentGameDmStyleInput = {
  customDirectives?: InputMaybe<Scalars['String']['input']>;
  detail?: InputMaybe<Scalars['Int']['input']>;
  engagement?: InputMaybe<Scalars['Int']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  narrative?: InputMaybe<Scalars['Int']['input']>;
  specialMode?: InputMaybe<Scalars['String']['input']>;
  verbosity?: InputMaybe<Scalars['Int']['input']>;
};

export type ComponentGameInventoryItem = {
  __typename?: 'ComponentGameInventoryItem';
  id: Scalars['ID']['output'];
  isEquipped?: Maybe<Scalars['Boolean']['output']>;
  item?: Maybe<Equipment>;
  quantity?: Maybe<Scalars['Int']['output']>;
  slot?: Maybe<Enum_Componentgameinventoryitem_Slot>;
};

export type ComponentGameInventoryItemFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<ComponentGameInventoryItemFiltersInput>>>;
  isEquipped?: InputMaybe<BooleanFilterInput>;
  item?: InputMaybe<EquipmentFiltersInput>;
  not?: InputMaybe<ComponentGameInventoryItemFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<ComponentGameInventoryItemFiltersInput>>>;
  quantity?: InputMaybe<IntFilterInput>;
  slot?: InputMaybe<StringFilterInput>;
};

export type ComponentGameInventoryItemInput = {
  id?: InputMaybe<Scalars['ID']['input']>;
  isEquipped?: InputMaybe<Scalars['Boolean']['input']>;
  item?: InputMaybe<Scalars['ID']['input']>;
  quantity?: InputMaybe<Scalars['Int']['input']>;
  slot?: InputMaybe<Enum_Componentgameinventoryitem_Slot>;
};

export type ComponentGamePlayer = {
  __typename?: 'ComponentGamePlayer';
  action?: Maybe<Scalars['String']['output']>;
  character?: Maybe<Character>;
  characterSheet?: Maybe<CharacterSheet>;
  id: Scalars['ID']['output'];
  isOnline?: Maybe<Scalars['Boolean']['output']>;
  isReady?: Maybe<Scalars['Boolean']['output']>;
  joinedAt?: Maybe<Scalars['DateTime']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  user?: Maybe<UsersPermissionsUser>;
};

export type ComponentGamePlayerFiltersInput = {
  action?: InputMaybe<StringFilterInput>;
  and?: InputMaybe<Array<InputMaybe<ComponentGamePlayerFiltersInput>>>;
  character?: InputMaybe<CharacterFiltersInput>;
  characterSheet?: InputMaybe<CharacterSheetFiltersInput>;
  isOnline?: InputMaybe<BooleanFilterInput>;
  isReady?: InputMaybe<BooleanFilterInput>;
  joinedAt?: InputMaybe<DateTimeFilterInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<ComponentGamePlayerFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<ComponentGamePlayerFiltersInput>>>;
  user?: InputMaybe<UsersPermissionsUserFiltersInput>;
};

export type ComponentGamePlayerInput = {
  action?: InputMaybe<Scalars['String']['input']>;
  character?: InputMaybe<Scalars['ID']['input']>;
  characterSheet?: InputMaybe<Scalars['ID']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  isOnline?: InputMaybe<Scalars['Boolean']['input']>;
  isReady?: InputMaybe<Scalars['Boolean']['input']>;
  joinedAt?: InputMaybe<Scalars['DateTime']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  user?: InputMaybe<Scalars['ID']['input']>;
};

export type ComponentGamePosition = {
  __typename?: 'ComponentGamePosition';
  id: Scalars['ID']['output'];
  mapId?: Maybe<Scalars['String']['output']>;
  x?: Maybe<Scalars['Int']['output']>;
  y?: Maybe<Scalars['Int']['output']>;
  z?: Maybe<Scalars['Int']['output']>;
};

export type ComponentGamePositionFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<ComponentGamePositionFiltersInput>>>;
  mapId?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<ComponentGamePositionFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<ComponentGamePositionFiltersInput>>>;
  x?: InputMaybe<IntFilterInput>;
  y?: InputMaybe<IntFilterInput>;
  z?: InputMaybe<IntFilterInput>;
};

export type ComponentGamePositionInput = {
  id?: InputMaybe<Scalars['ID']['input']>;
  mapId?: InputMaybe<Scalars['String']['input']>;
  x?: InputMaybe<Scalars['Int']['input']>;
  y?: InputMaybe<Scalars['Int']['input']>;
  z?: InputMaybe<Scalars['Int']['input']>;
};

export type ComponentGameStats = {
  __typename?: 'ComponentGameStats';
  charisma?: Maybe<Scalars['Int']['output']>;
  constitution?: Maybe<Scalars['Int']['output']>;
  dexterity?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  intelligence?: Maybe<Scalars['Int']['output']>;
  speed?: Maybe<Scalars['Int']['output']>;
  strength?: Maybe<Scalars['Int']['output']>;
  wisdom?: Maybe<Scalars['Int']['output']>;
};

export type ComponentGameStatsFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<ComponentGameStatsFiltersInput>>>;
  charisma?: InputMaybe<IntFilterInput>;
  constitution?: InputMaybe<IntFilterInput>;
  dexterity?: InputMaybe<IntFilterInput>;
  intelligence?: InputMaybe<IntFilterInput>;
  not?: InputMaybe<ComponentGameStatsFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<ComponentGameStatsFiltersInput>>>;
  speed?: InputMaybe<IntFilterInput>;
  strength?: InputMaybe<IntFilterInput>;
  wisdom?: InputMaybe<IntFilterInput>;
};

export type ComponentGameStatsInput = {
  charisma?: InputMaybe<Scalars['Int']['input']>;
  constitution?: InputMaybe<Scalars['Int']['input']>;
  dexterity?: InputMaybe<Scalars['Int']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  intelligence?: InputMaybe<Scalars['Int']['input']>;
  speed?: InputMaybe<Scalars['Int']['input']>;
  strength?: InputMaybe<Scalars['Int']['input']>;
  wisdom?: InputMaybe<Scalars['Int']['input']>;
};

export type DamageType = {
  __typename?: 'DamageType';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  documentId: Scalars['ID']['output'];
  image?: Maybe<UploadFile>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations: Array<Maybe<DamageType>>;
  localizations_connection?: Maybe<DamageTypeRelationResponseCollection>;
  name: Scalars['String']['output'];
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  slug: Scalars['String']['output'];
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};


export type DamageTypeLocalizationsArgs = {
  filters?: InputMaybe<DamageTypeFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type DamageTypeLocalizations_ConnectionArgs = {
  filters?: InputMaybe<DamageTypeFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type DamageTypeEntityResponseCollection = {
  __typename?: 'DamageTypeEntityResponseCollection';
  nodes: Array<DamageType>;
  pageInfo: Pagination;
};

export type DamageTypeFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<DamageTypeFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  description?: InputMaybe<StringFilterInput>;
  documentId?: InputMaybe<IdFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<DamageTypeFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<DamageTypeFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<DamageTypeFiltersInput>>>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  slug?: InputMaybe<StringFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type DamageTypeInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  image?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
};

export type DamageTypeRelationResponseCollection = {
  __typename?: 'DamageTypeRelationResponseCollection';
  nodes: Array<DamageType>;
};

export type DateTimeFilterInput = {
  and?: InputMaybe<Array<InputMaybe<Scalars['DateTime']['input']>>>;
  between?: InputMaybe<Array<InputMaybe<Scalars['DateTime']['input']>>>;
  contains?: InputMaybe<Scalars['DateTime']['input']>;
  containsi?: InputMaybe<Scalars['DateTime']['input']>;
  endsWith?: InputMaybe<Scalars['DateTime']['input']>;
  eq?: InputMaybe<Scalars['DateTime']['input']>;
  eqi?: InputMaybe<Scalars['DateTime']['input']>;
  gt?: InputMaybe<Scalars['DateTime']['input']>;
  gte?: InputMaybe<Scalars['DateTime']['input']>;
  in?: InputMaybe<Array<InputMaybe<Scalars['DateTime']['input']>>>;
  lt?: InputMaybe<Scalars['DateTime']['input']>;
  lte?: InputMaybe<Scalars['DateTime']['input']>;
  ne?: InputMaybe<Scalars['DateTime']['input']>;
  nei?: InputMaybe<Scalars['DateTime']['input']>;
  not?: InputMaybe<DateTimeFilterInput>;
  notContains?: InputMaybe<Scalars['DateTime']['input']>;
  notContainsi?: InputMaybe<Scalars['DateTime']['input']>;
  notIn?: InputMaybe<Array<InputMaybe<Scalars['DateTime']['input']>>>;
  notNull?: InputMaybe<Scalars['Boolean']['input']>;
  null?: InputMaybe<Scalars['Boolean']['input']>;
  or?: InputMaybe<Array<InputMaybe<Scalars['DateTime']['input']>>>;
  startsWith?: InputMaybe<Scalars['DateTime']['input']>;
};

export type DeleteMutationResponse = {
  __typename?: 'DeleteMutationResponse';
  documentId: Scalars['ID']['output'];
};

export type DmSetting = {
  __typename?: 'DmSetting';
  adventureLength?: Maybe<Enum_Dmsetting_Adventurelength>;
  attributePointBudget?: Maybe<Scalars['Int']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  difficulty?: Maybe<Enum_Dmsetting_Difficulty>;
  dmStyle?: Maybe<ComponentGameDmStyle>;
  dmSystemPrompt?: Maybe<Scalars['String']['output']>;
  documentId: Scalars['ID']['output'];
  playerCount?: Maybe<Scalars['Int']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  room?: Maybe<Room>;
  setting?: Maybe<Scalars['String']['output']>;
  startingLevel?: Maybe<Scalars['Int']['output']>;
  theme?: Maybe<Scalars['String']['output']>;
  tone?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type DmSettingEntityResponseCollection = {
  __typename?: 'DmSettingEntityResponseCollection';
  nodes: Array<DmSetting>;
  pageInfo: Pagination;
};

export type DmSettingFiltersInput = {
  adventureLength?: InputMaybe<StringFilterInput>;
  and?: InputMaybe<Array<InputMaybe<DmSettingFiltersInput>>>;
  attributePointBudget?: InputMaybe<IntFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  difficulty?: InputMaybe<StringFilterInput>;
  dmStyle?: InputMaybe<ComponentGameDmStyleFiltersInput>;
  dmSystemPrompt?: InputMaybe<StringFilterInput>;
  documentId?: InputMaybe<IdFilterInput>;
  not?: InputMaybe<DmSettingFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<DmSettingFiltersInput>>>;
  playerCount?: InputMaybe<IntFilterInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  room?: InputMaybe<RoomFiltersInput>;
  setting?: InputMaybe<StringFilterInput>;
  startingLevel?: InputMaybe<IntFilterInput>;
  theme?: InputMaybe<StringFilterInput>;
  tone?: InputMaybe<StringFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type DmSettingInput = {
  adventureLength?: InputMaybe<Enum_Dmsetting_Adventurelength>;
  attributePointBudget?: InputMaybe<Scalars['Int']['input']>;
  difficulty?: InputMaybe<Enum_Dmsetting_Difficulty>;
  dmStyle?: InputMaybe<ComponentGameDmStyleInput>;
  dmSystemPrompt?: InputMaybe<Scalars['String']['input']>;
  playerCount?: InputMaybe<Scalars['Int']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  room?: InputMaybe<Scalars['ID']['input']>;
  setting?: InputMaybe<Scalars['String']['input']>;
  startingLevel?: InputMaybe<Scalars['Int']['input']>;
  theme?: InputMaybe<Scalars['String']['input']>;
  tone?: InputMaybe<Scalars['String']['input']>;
};

export enum Enum_Charactersheet_Type {
  Monster = 'monster',
  Npc = 'npc',
  Player = 'player'
}

export enum Enum_Componentgameinventoryitem_Slot {
  Accessory = 'accessory',
  Armor = 'armor',
  Backpack = 'backpack',
  Cloak = 'cloak',
  Feet = 'feet',
  Hands = 'hands',
  Head = 'head',
  MainHand = 'main_hand',
  Neck = 'neck',
  OffHand = 'off_hand',
  Ring_1 = 'ring_1',
  Ring_2 = 'ring_2'
}

export enum Enum_Dmsetting_Adventurelength {
  Epic = 'epic',
  Flash = 'flash',
  Legendary = 'legendary',
  Long = 'long',
  Medium = 'medium',
  Short = 'short'
}

export enum Enum_Dmsetting_Difficulty {
  Challenging = 'challenging',
  Deadly = 'deadly',
  Easy = 'easy',
  Gritty = 'gritty',
  Medium = 'medium',
  Storyteller = 'storyteller'
}

export enum Enum_Magicitem_Rarity {
  Artifact = 'Artifact',
  Common = 'Common',
  Legendary = 'Legendary',
  Rare = 'Rare',
  Uncommon = 'Uncommon',
  Varies = 'Varies',
  VeryRare = 'Very_Rare'
}

export enum Enum_Message_Sendertype {
  Dm = 'dm',
  Player = 'player',
  System = 'system'
}

export enum Enum_Monster_Size {
  Gargantuan = 'Gargantuan',
  Huge = 'Huge',
  Large = 'Large',
  Medium = 'Medium',
  Small = 'Small',
  Tiny = 'Tiny'
}

export enum Enum_Proficiency_Type {
  Armor = 'Armor',
  ArtisanSTools = 'Artisan_s_Tools',
  GamingSets = 'Gaming_Sets',
  MusicalInstruments = 'Musical_Instruments',
  Other = 'Other',
  SavingThrows = 'Saving_Throws',
  Skills = 'Skills',
  Tools = 'Tools',
  Vehicles = 'Vehicles',
  Weapons = 'Weapons'
}

export enum Enum_Prompt_Category {
  Gameplay = 'gameplay',
  System = 'system',
  User = 'user'
}

export enum Enum_Race_Size {
  Large = 'Large',
  Medium = 'Medium',
  Small = 'Small',
  Tiny = 'Tiny'
}

export enum Enum_Room_Phase {
  CharacterCreation = 'character_creation',
  Combat = 'combat',
  Ending = 'ending',
  Gameplay = 'gameplay',
  Lobby = 'lobby',
  WorldGeneration = 'world_generation'
}

export enum Enum_Turn_Status {
  Complete = 'complete',
  Processing = 'processing',
  Waiting = 'waiting'
}

export enum Enum_Turn_Type {
  Combat = 'combat',
  Exploration = 'exploration',
  Group = 'group'
}

export enum Enum_World_Adventurelength {
  Epic = 'epic',
  Flash = 'flash',
  Legendary = 'legendary',
  Long = 'long',
  Medium = 'medium',
  Short = 'short'
}

export enum Enum_World_Worldsize {
  Epic = 'epic',
  Intimate = 'intimate',
  Large = 'large',
  Medium = 'medium',
  Small = 'small',
  Vast = 'vast'
}

export type Equipment = {
  __typename?: 'Equipment';
  armor_class_base?: Maybe<Scalars['Int']['output']>;
  armor_class_dex_bonus?: Maybe<Scalars['Boolean']['output']>;
  cost_quantity?: Maybe<Scalars['Int']['output']>;
  cost_unit?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  damage_dice?: Maybe<Scalars['String']['output']>;
  damage_type?: Maybe<DamageType>;
  description?: Maybe<Scalars['String']['output']>;
  documentId: Scalars['ID']['output'];
  equipment_category?: Maybe<EquipmentCategory>;
  image?: Maybe<UploadFile>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations: Array<Maybe<Equipment>>;
  localizations_connection?: Maybe<EquipmentRelationResponseCollection>;
  name: Scalars['String']['output'];
  properties: Array<Maybe<WeaponProperty>>;
  properties_connection?: Maybe<WeaponPropertyRelationResponseCollection>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  range_long?: Maybe<Scalars['Int']['output']>;
  range_normal?: Maybe<Scalars['Int']['output']>;
  slug: Scalars['String']['output'];
  stealth_disadvantage?: Maybe<Scalars['Boolean']['output']>;
  str_minimum?: Maybe<Scalars['Int']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  weight?: Maybe<Scalars['Float']['output']>;
};


export type EquipmentLocalizationsArgs = {
  filters?: InputMaybe<EquipmentFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type EquipmentLocalizations_ConnectionArgs = {
  filters?: InputMaybe<EquipmentFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type EquipmentPropertiesArgs = {
  filters?: InputMaybe<WeaponPropertyFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type EquipmentProperties_ConnectionArgs = {
  filters?: InputMaybe<WeaponPropertyFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type EquipmentCategory = {
  __typename?: 'EquipmentCategory';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  documentId: Scalars['ID']['output'];
  image?: Maybe<UploadFile>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations: Array<Maybe<EquipmentCategory>>;
  localizations_connection?: Maybe<EquipmentCategoryRelationResponseCollection>;
  name: Scalars['String']['output'];
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  slug: Scalars['String']['output'];
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};


export type EquipmentCategoryLocalizationsArgs = {
  filters?: InputMaybe<EquipmentCategoryFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type EquipmentCategoryLocalizations_ConnectionArgs = {
  filters?: InputMaybe<EquipmentCategoryFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type EquipmentCategoryEntityResponseCollection = {
  __typename?: 'EquipmentCategoryEntityResponseCollection';
  nodes: Array<EquipmentCategory>;
  pageInfo: Pagination;
};

export type EquipmentCategoryFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<EquipmentCategoryFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  description?: InputMaybe<StringFilterInput>;
  documentId?: InputMaybe<IdFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<EquipmentCategoryFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<EquipmentCategoryFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<EquipmentCategoryFiltersInput>>>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  slug?: InputMaybe<StringFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type EquipmentCategoryInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  image?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
};

export type EquipmentCategoryRelationResponseCollection = {
  __typename?: 'EquipmentCategoryRelationResponseCollection';
  nodes: Array<EquipmentCategory>;
};

export type EquipmentEntityResponseCollection = {
  __typename?: 'EquipmentEntityResponseCollection';
  nodes: Array<Equipment>;
  pageInfo: Pagination;
};

export type EquipmentFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<EquipmentFiltersInput>>>;
  armor_class_base?: InputMaybe<IntFilterInput>;
  armor_class_dex_bonus?: InputMaybe<BooleanFilterInput>;
  cost_quantity?: InputMaybe<IntFilterInput>;
  cost_unit?: InputMaybe<StringFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  damage_dice?: InputMaybe<StringFilterInput>;
  damage_type?: InputMaybe<DamageTypeFiltersInput>;
  description?: InputMaybe<StringFilterInput>;
  documentId?: InputMaybe<IdFilterInput>;
  equipment_category?: InputMaybe<EquipmentCategoryFiltersInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<EquipmentFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<EquipmentFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<EquipmentFiltersInput>>>;
  properties?: InputMaybe<WeaponPropertyFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  range_long?: InputMaybe<IntFilterInput>;
  range_normal?: InputMaybe<IntFilterInput>;
  slug?: InputMaybe<StringFilterInput>;
  stealth_disadvantage?: InputMaybe<BooleanFilterInput>;
  str_minimum?: InputMaybe<IntFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  weight?: InputMaybe<FloatFilterInput>;
};

export type EquipmentInput = {
  armor_class_base?: InputMaybe<Scalars['Int']['input']>;
  armor_class_dex_bonus?: InputMaybe<Scalars['Boolean']['input']>;
  cost_quantity?: InputMaybe<Scalars['Int']['input']>;
  cost_unit?: InputMaybe<Scalars['String']['input']>;
  damage_dice?: InputMaybe<Scalars['String']['input']>;
  damage_type?: InputMaybe<Scalars['ID']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  equipment_category?: InputMaybe<Scalars['ID']['input']>;
  image?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  properties?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  range_long?: InputMaybe<Scalars['Int']['input']>;
  range_normal?: InputMaybe<Scalars['Int']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
  stealth_disadvantage?: InputMaybe<Scalars['Boolean']['input']>;
  str_minimum?: InputMaybe<Scalars['Int']['input']>;
  weight?: InputMaybe<Scalars['Float']['input']>;
};

export type EquipmentRelationResponseCollection = {
  __typename?: 'EquipmentRelationResponseCollection';
  nodes: Array<Equipment>;
};

export type Feature = {
  __typename?: 'Feature';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  documentId: Scalars['ID']['output'];
  image?: Maybe<UploadFile>;
  level?: Maybe<Scalars['Int']['output']>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations: Array<Maybe<Feature>>;
  localizations_connection?: Maybe<FeatureRelationResponseCollection>;
  name: Scalars['String']['output'];
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  slug: Scalars['String']['output'];
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};


export type FeatureLocalizationsArgs = {
  filters?: InputMaybe<FeatureFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type FeatureLocalizations_ConnectionArgs = {
  filters?: InputMaybe<FeatureFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type FeatureEntityResponseCollection = {
  __typename?: 'FeatureEntityResponseCollection';
  nodes: Array<Feature>;
  pageInfo: Pagination;
};

export type FeatureFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<FeatureFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  description?: InputMaybe<StringFilterInput>;
  documentId?: InputMaybe<IdFilterInput>;
  level?: InputMaybe<IntFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<FeatureFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<FeatureFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<FeatureFiltersInput>>>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  slug?: InputMaybe<StringFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type FeatureInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  image?: InputMaybe<Scalars['ID']['input']>;
  level?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
};

export type FeatureRelationResponseCollection = {
  __typename?: 'FeatureRelationResponseCollection';
  nodes: Array<Feature>;
};

export type FileInfoInput = {
  alternativeText?: InputMaybe<Scalars['String']['input']>;
  caption?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type FloatFilterInput = {
  and?: InputMaybe<Array<InputMaybe<Scalars['Float']['input']>>>;
  between?: InputMaybe<Array<InputMaybe<Scalars['Float']['input']>>>;
  contains?: InputMaybe<Scalars['Float']['input']>;
  containsi?: InputMaybe<Scalars['Float']['input']>;
  endsWith?: InputMaybe<Scalars['Float']['input']>;
  eq?: InputMaybe<Scalars['Float']['input']>;
  eqi?: InputMaybe<Scalars['Float']['input']>;
  gt?: InputMaybe<Scalars['Float']['input']>;
  gte?: InputMaybe<Scalars['Float']['input']>;
  in?: InputMaybe<Array<InputMaybe<Scalars['Float']['input']>>>;
  lt?: InputMaybe<Scalars['Float']['input']>;
  lte?: InputMaybe<Scalars['Float']['input']>;
  ne?: InputMaybe<Scalars['Float']['input']>;
  nei?: InputMaybe<Scalars['Float']['input']>;
  not?: InputMaybe<FloatFilterInput>;
  notContains?: InputMaybe<Scalars['Float']['input']>;
  notContainsi?: InputMaybe<Scalars['Float']['input']>;
  notIn?: InputMaybe<Array<InputMaybe<Scalars['Float']['input']>>>;
  notNull?: InputMaybe<Scalars['Boolean']['input']>;
  null?: InputMaybe<Scalars['Boolean']['input']>;
  or?: InputMaybe<Array<InputMaybe<Scalars['Float']['input']>>>;
  startsWith?: InputMaybe<Scalars['Float']['input']>;
};

export type GameCondition = {
  __typename?: 'GameCondition';
  description?: Maybe<Scalars['String']['output']>;
  documentId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type GameEvent = {
  __typename?: 'GameEvent';
  actorId?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  documentId: Scalars['ID']['output'];
  payload: Scalars['JSON']['output'];
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  room?: Maybe<Room>;
  timeFrames: Array<Maybe<TimeFrame>>;
  timeFrames_connection?: Maybe<TimeFrameRelationResponseCollection>;
  timestamp: Scalars['Long']['output'];
  turnNumber?: Maybe<Scalars['Int']['output']>;
  type: Scalars['String']['output'];
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};


export type GameEventTimeFramesArgs = {
  filters?: InputMaybe<TimeFrameFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type GameEventTimeFrames_ConnectionArgs = {
  filters?: InputMaybe<TimeFrameFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type GameEventEntityResponseCollection = {
  __typename?: 'GameEventEntityResponseCollection';
  nodes: Array<GameEvent>;
  pageInfo: Pagination;
};

export type GameEventFiltersInput = {
  actorId?: InputMaybe<StringFilterInput>;
  and?: InputMaybe<Array<InputMaybe<GameEventFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  documentId?: InputMaybe<IdFilterInput>;
  not?: InputMaybe<GameEventFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<GameEventFiltersInput>>>;
  payload?: InputMaybe<JsonFilterInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  room?: InputMaybe<RoomFiltersInput>;
  timeFrames?: InputMaybe<TimeFrameFiltersInput>;
  timestamp?: InputMaybe<LongFilterInput>;
  turnNumber?: InputMaybe<IntFilterInput>;
  type?: InputMaybe<StringFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type GameEventInput = {
  actorId?: InputMaybe<Scalars['String']['input']>;
  payload?: InputMaybe<Scalars['JSON']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  room?: InputMaybe<Scalars['ID']['input']>;
  timeFrames?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  timestamp?: InputMaybe<Scalars['Long']['input']>;
  turnNumber?: InputMaybe<Scalars['Int']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
};

export type GameEventRelationResponseCollection = {
  __typename?: 'GameEventRelationResponseCollection';
  nodes: Array<GameEvent>;
};

export type GenericMorph = Character | CharacterSheet | Class | ComponentGameDmStyle | ComponentGameInventoryItem | ComponentGamePlayer | ComponentGamePosition | ComponentGameStats | DamageType | DmSetting | Equipment | EquipmentCategory | Feature | GameEvent | I18NLocale | KnowledgeSnippet | KnowledgeSource | Language | MagicItem | MagicSchool | Message | Monster | Proficiency | Prompt | Race | ReviewWorkflowsWorkflow | ReviewWorkflowsWorkflowStage | Room | Spell | Subclass | TimeFrame | Trait | Turn | UploadFile | UsersPermissionsPermission | UsersPermissionsRole | UsersPermissionsUser | WeaponProperty | World;

export type I18NLocale = {
  __typename?: 'I18NLocale';
  code?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  documentId: Scalars['ID']['output'];
  name?: Maybe<Scalars['String']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type I18NLocaleEntityResponseCollection = {
  __typename?: 'I18NLocaleEntityResponseCollection';
  nodes: Array<I18NLocale>;
  pageInfo: Pagination;
};

export type I18NLocaleFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<I18NLocaleFiltersInput>>>;
  code?: InputMaybe<StringFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  documentId?: InputMaybe<IdFilterInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<I18NLocaleFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<I18NLocaleFiltersInput>>>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type IdFilterInput = {
  and?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  between?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  contains?: InputMaybe<Scalars['ID']['input']>;
  containsi?: InputMaybe<Scalars['ID']['input']>;
  endsWith?: InputMaybe<Scalars['ID']['input']>;
  eq?: InputMaybe<Scalars['ID']['input']>;
  eqi?: InputMaybe<Scalars['ID']['input']>;
  gt?: InputMaybe<Scalars['ID']['input']>;
  gte?: InputMaybe<Scalars['ID']['input']>;
  in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  lt?: InputMaybe<Scalars['ID']['input']>;
  lte?: InputMaybe<Scalars['ID']['input']>;
  ne?: InputMaybe<Scalars['ID']['input']>;
  nei?: InputMaybe<Scalars['ID']['input']>;
  not?: InputMaybe<IdFilterInput>;
  notContains?: InputMaybe<Scalars['ID']['input']>;
  notContainsi?: InputMaybe<Scalars['ID']['input']>;
  notIn?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  notNull?: InputMaybe<Scalars['Boolean']['input']>;
  null?: InputMaybe<Scalars['Boolean']['input']>;
  or?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  startsWith?: InputMaybe<Scalars['ID']['input']>;
};

export type IntFilterInput = {
  and?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  between?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  contains?: InputMaybe<Scalars['Int']['input']>;
  containsi?: InputMaybe<Scalars['Int']['input']>;
  endsWith?: InputMaybe<Scalars['Int']['input']>;
  eq?: InputMaybe<Scalars['Int']['input']>;
  eqi?: InputMaybe<Scalars['Int']['input']>;
  gt?: InputMaybe<Scalars['Int']['input']>;
  gte?: InputMaybe<Scalars['Int']['input']>;
  in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  lt?: InputMaybe<Scalars['Int']['input']>;
  lte?: InputMaybe<Scalars['Int']['input']>;
  ne?: InputMaybe<Scalars['Int']['input']>;
  nei?: InputMaybe<Scalars['Int']['input']>;
  not?: InputMaybe<IntFilterInput>;
  notContains?: InputMaybe<Scalars['Int']['input']>;
  notContainsi?: InputMaybe<Scalars['Int']['input']>;
  notIn?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  notNull?: InputMaybe<Scalars['Boolean']['input']>;
  null?: InputMaybe<Scalars['Boolean']['input']>;
  or?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  startsWith?: InputMaybe<Scalars['Int']['input']>;
};

export type JsonFilterInput = {
  and?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  between?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  contains?: InputMaybe<Scalars['JSON']['input']>;
  containsi?: InputMaybe<Scalars['JSON']['input']>;
  endsWith?: InputMaybe<Scalars['JSON']['input']>;
  eq?: InputMaybe<Scalars['JSON']['input']>;
  eqi?: InputMaybe<Scalars['JSON']['input']>;
  gt?: InputMaybe<Scalars['JSON']['input']>;
  gte?: InputMaybe<Scalars['JSON']['input']>;
  in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  lt?: InputMaybe<Scalars['JSON']['input']>;
  lte?: InputMaybe<Scalars['JSON']['input']>;
  ne?: InputMaybe<Scalars['JSON']['input']>;
  nei?: InputMaybe<Scalars['JSON']['input']>;
  not?: InputMaybe<JsonFilterInput>;
  notContains?: InputMaybe<Scalars['JSON']['input']>;
  notContainsi?: InputMaybe<Scalars['JSON']['input']>;
  notIn?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  notNull?: InputMaybe<Scalars['Boolean']['input']>;
  null?: InputMaybe<Scalars['Boolean']['input']>;
  or?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  startsWith?: InputMaybe<Scalars['JSON']['input']>;
};

export type KnowledgeSnippet = {
  __typename?: 'KnowledgeSnippet';
  content: Scalars['String']['output'];
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  documentId: Scalars['ID']['output'];
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  source?: Maybe<KnowledgeSource>;
  title: Scalars['String']['output'];
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type KnowledgeSnippetEntityResponseCollection = {
  __typename?: 'KnowledgeSnippetEntityResponseCollection';
  nodes: Array<KnowledgeSnippet>;
  pageInfo: Pagination;
};

export type KnowledgeSnippetFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<KnowledgeSnippetFiltersInput>>>;
  content?: InputMaybe<StringFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  documentId?: InputMaybe<IdFilterInput>;
  not?: InputMaybe<KnowledgeSnippetFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<KnowledgeSnippetFiltersInput>>>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  source?: InputMaybe<KnowledgeSourceFiltersInput>;
  title?: InputMaybe<StringFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type KnowledgeSnippetInput = {
  content?: InputMaybe<Scalars['String']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  source?: InputMaybe<Scalars['ID']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type KnowledgeSnippetRelationResponseCollection = {
  __typename?: 'KnowledgeSnippetRelationResponseCollection';
  nodes: Array<KnowledgeSnippet>;
};

export type KnowledgeSource = {
  __typename?: 'KnowledgeSource';
  content: Scalars['String']['output'];
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  documentId: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  snippets: Array<Maybe<KnowledgeSnippet>>;
  snippets_connection?: Maybe<KnowledgeSnippetRelationResponseCollection>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};


export type KnowledgeSourceSnippetsArgs = {
  filters?: InputMaybe<KnowledgeSnippetFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type KnowledgeSourceSnippets_ConnectionArgs = {
  filters?: InputMaybe<KnowledgeSnippetFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type KnowledgeSourceEntityResponseCollection = {
  __typename?: 'KnowledgeSourceEntityResponseCollection';
  nodes: Array<KnowledgeSource>;
  pageInfo: Pagination;
};

export type KnowledgeSourceFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<KnowledgeSourceFiltersInput>>>;
  content?: InputMaybe<StringFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  documentId?: InputMaybe<IdFilterInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<KnowledgeSourceFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<KnowledgeSourceFiltersInput>>>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  snippets?: InputMaybe<KnowledgeSnippetFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type KnowledgeSourceInput = {
  content?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  snippets?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
};

export type Language = {
  __typename?: 'Language';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  documentId: Scalars['ID']['output'];
  image?: Maybe<UploadFile>;
  is_rare?: Maybe<Scalars['Boolean']['output']>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations: Array<Maybe<Language>>;
  localizations_connection?: Maybe<LanguageRelationResponseCollection>;
  name: Scalars['String']['output'];
  note?: Maybe<Scalars['String']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  slug: Scalars['String']['output'];
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};


export type LanguageLocalizationsArgs = {
  filters?: InputMaybe<LanguageFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type LanguageLocalizations_ConnectionArgs = {
  filters?: InputMaybe<LanguageFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type LanguageEntityResponseCollection = {
  __typename?: 'LanguageEntityResponseCollection';
  nodes: Array<Language>;
  pageInfo: Pagination;
};

export type LanguageFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<LanguageFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  documentId?: InputMaybe<IdFilterInput>;
  is_rare?: InputMaybe<BooleanFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<LanguageFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<LanguageFiltersInput>;
  note?: InputMaybe<StringFilterInput>;
  or?: InputMaybe<Array<InputMaybe<LanguageFiltersInput>>>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  slug?: InputMaybe<StringFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type LanguageInput = {
  image?: InputMaybe<Scalars['ID']['input']>;
  is_rare?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  note?: InputMaybe<Scalars['String']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
};

export type LanguageRelationResponseCollection = {
  __typename?: 'LanguageRelationResponseCollection';
  nodes: Array<Language>;
};

export type LongFilterInput = {
  and?: InputMaybe<Array<InputMaybe<Scalars['Long']['input']>>>;
  between?: InputMaybe<Array<InputMaybe<Scalars['Long']['input']>>>;
  contains?: InputMaybe<Scalars['Long']['input']>;
  containsi?: InputMaybe<Scalars['Long']['input']>;
  endsWith?: InputMaybe<Scalars['Long']['input']>;
  eq?: InputMaybe<Scalars['Long']['input']>;
  eqi?: InputMaybe<Scalars['Long']['input']>;
  gt?: InputMaybe<Scalars['Long']['input']>;
  gte?: InputMaybe<Scalars['Long']['input']>;
  in?: InputMaybe<Array<InputMaybe<Scalars['Long']['input']>>>;
  lt?: InputMaybe<Scalars['Long']['input']>;
  lte?: InputMaybe<Scalars['Long']['input']>;
  ne?: InputMaybe<Scalars['Long']['input']>;
  nei?: InputMaybe<Scalars['Long']['input']>;
  not?: InputMaybe<LongFilterInput>;
  notContains?: InputMaybe<Scalars['Long']['input']>;
  notContainsi?: InputMaybe<Scalars['Long']['input']>;
  notIn?: InputMaybe<Array<InputMaybe<Scalars['Long']['input']>>>;
  notNull?: InputMaybe<Scalars['Boolean']['input']>;
  null?: InputMaybe<Scalars['Boolean']['input']>;
  or?: InputMaybe<Array<InputMaybe<Scalars['Long']['input']>>>;
  startsWith?: InputMaybe<Scalars['Long']['input']>;
};

export type MagicItem = {
  __typename?: 'MagicItem';
  attunement_required?: Maybe<Scalars['Boolean']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  documentId: Scalars['ID']['output'];
  equipment_category?: Maybe<EquipmentCategory>;
  image?: Maybe<UploadFile>;
  image_url?: Maybe<Scalars['String']['output']>;
  is_variant?: Maybe<Scalars['Boolean']['output']>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations: Array<Maybe<MagicItem>>;
  localizations_connection?: Maybe<MagicItemRelationResponseCollection>;
  name: Scalars['String']['output'];
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  rarity?: Maybe<Enum_Magicitem_Rarity>;
  slug: Scalars['String']['output'];
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};


export type MagicItemLocalizationsArgs = {
  filters?: InputMaybe<MagicItemFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MagicItemLocalizations_ConnectionArgs = {
  filters?: InputMaybe<MagicItemFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type MagicItemEntityResponseCollection = {
  __typename?: 'MagicItemEntityResponseCollection';
  nodes: Array<MagicItem>;
  pageInfo: Pagination;
};

export type MagicItemFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<MagicItemFiltersInput>>>;
  attunement_required?: InputMaybe<BooleanFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  description?: InputMaybe<StringFilterInput>;
  documentId?: InputMaybe<IdFilterInput>;
  equipment_category?: InputMaybe<EquipmentCategoryFiltersInput>;
  image_url?: InputMaybe<StringFilterInput>;
  is_variant?: InputMaybe<BooleanFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<MagicItemFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<MagicItemFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<MagicItemFiltersInput>>>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  rarity?: InputMaybe<StringFilterInput>;
  slug?: InputMaybe<StringFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type MagicItemInput = {
  attunement_required?: InputMaybe<Scalars['Boolean']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  equipment_category?: InputMaybe<Scalars['ID']['input']>;
  image?: InputMaybe<Scalars['ID']['input']>;
  image_url?: InputMaybe<Scalars['String']['input']>;
  is_variant?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  rarity?: InputMaybe<Enum_Magicitem_Rarity>;
  slug?: InputMaybe<Scalars['String']['input']>;
};

export type MagicItemRelationResponseCollection = {
  __typename?: 'MagicItemRelationResponseCollection';
  nodes: Array<MagicItem>;
};

export type MagicSchool = {
  __typename?: 'MagicSchool';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  documentId: Scalars['ID']['output'];
  image?: Maybe<UploadFile>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations: Array<Maybe<MagicSchool>>;
  localizations_connection?: Maybe<MagicSchoolRelationResponseCollection>;
  name: Scalars['String']['output'];
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  slug: Scalars['String']['output'];
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};


export type MagicSchoolLocalizationsArgs = {
  filters?: InputMaybe<MagicSchoolFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MagicSchoolLocalizations_ConnectionArgs = {
  filters?: InputMaybe<MagicSchoolFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type MagicSchoolEntityResponseCollection = {
  __typename?: 'MagicSchoolEntityResponseCollection';
  nodes: Array<MagicSchool>;
  pageInfo: Pagination;
};

export type MagicSchoolFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<MagicSchoolFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  description?: InputMaybe<StringFilterInput>;
  documentId?: InputMaybe<IdFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<MagicSchoolFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<MagicSchoolFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<MagicSchoolFiltersInput>>>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  slug?: InputMaybe<StringFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type MagicSchoolInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  image?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
};

export type MagicSchoolRelationResponseCollection = {
  __typename?: 'MagicSchoolRelationResponseCollection';
  nodes: Array<MagicSchool>;
};

export type Message = {
  __typename?: 'Message';
  content: Scalars['String']['output'];
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  documentId: Scalars['ID']['output'];
  images?: Maybe<Scalars['JSON']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  recipient?: Maybe<UsersPermissionsUser>;
  room?: Maybe<Room>;
  senderName?: Maybe<Scalars['String']['output']>;
  senderType?: Maybe<Enum_Message_Sendertype>;
  timestamp?: Maybe<Scalars['Long']['output']>;
  turn?: Maybe<Turn>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type MessageEntityResponseCollection = {
  __typename?: 'MessageEntityResponseCollection';
  nodes: Array<Message>;
  pageInfo: Pagination;
};

export type MessageFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<MessageFiltersInput>>>;
  content?: InputMaybe<StringFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  documentId?: InputMaybe<IdFilterInput>;
  images?: InputMaybe<JsonFilterInput>;
  not?: InputMaybe<MessageFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<MessageFiltersInput>>>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  recipient?: InputMaybe<UsersPermissionsUserFiltersInput>;
  room?: InputMaybe<RoomFiltersInput>;
  senderName?: InputMaybe<StringFilterInput>;
  senderType?: InputMaybe<StringFilterInput>;
  timestamp?: InputMaybe<LongFilterInput>;
  turn?: InputMaybe<TurnFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type MessageInput = {
  content?: InputMaybe<Scalars['String']['input']>;
  images?: InputMaybe<Scalars['JSON']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  recipient?: InputMaybe<Scalars['ID']['input']>;
  room?: InputMaybe<Scalars['ID']['input']>;
  senderName?: InputMaybe<Scalars['String']['input']>;
  senderType?: InputMaybe<Enum_Message_Sendertype>;
  timestamp?: InputMaybe<Scalars['Long']['input']>;
  turn?: InputMaybe<Scalars['ID']['input']>;
};

export type MessageRelationResponseCollection = {
  __typename?: 'MessageRelationResponseCollection';
  nodes: Array<Message>;
};

export type Monster = {
  __typename?: 'Monster';
  ac?: Maybe<Scalars['Int']['output']>;
  actions?: Maybe<Scalars['JSON']['output']>;
  alignment?: Maybe<Scalars['String']['output']>;
  challenge_rating?: Maybe<Scalars['Float']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  documentId: Scalars['ID']['output'];
  hit_dice?: Maybe<Scalars['String']['output']>;
  hp?: Maybe<Scalars['Int']['output']>;
  image?: Maybe<UploadFile>;
  languages?: Maybe<Scalars['String']['output']>;
  legendary_actions?: Maybe<Scalars['JSON']['output']>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations: Array<Maybe<Monster>>;
  localizations_connection?: Maybe<MonsterRelationResponseCollection>;
  name: Scalars['String']['output'];
  proficiencies?: Maybe<Scalars['JSON']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  senses?: Maybe<Scalars['JSON']['output']>;
  size?: Maybe<Enum_Monster_Size>;
  slug: Scalars['String']['output'];
  special_abilities?: Maybe<Scalars['JSON']['output']>;
  speed?: Maybe<Scalars['JSON']['output']>;
  stats?: Maybe<ComponentGameStats>;
  type?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  xp?: Maybe<Scalars['Int']['output']>;
};


export type MonsterLocalizationsArgs = {
  filters?: InputMaybe<MonsterFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MonsterLocalizations_ConnectionArgs = {
  filters?: InputMaybe<MonsterFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type MonsterEntityResponseCollection = {
  __typename?: 'MonsterEntityResponseCollection';
  nodes: Array<Monster>;
  pageInfo: Pagination;
};

export type MonsterFiltersInput = {
  ac?: InputMaybe<IntFilterInput>;
  actions?: InputMaybe<JsonFilterInput>;
  alignment?: InputMaybe<StringFilterInput>;
  and?: InputMaybe<Array<InputMaybe<MonsterFiltersInput>>>;
  challenge_rating?: InputMaybe<FloatFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  description?: InputMaybe<StringFilterInput>;
  documentId?: InputMaybe<IdFilterInput>;
  hit_dice?: InputMaybe<StringFilterInput>;
  hp?: InputMaybe<IntFilterInput>;
  languages?: InputMaybe<StringFilterInput>;
  legendary_actions?: InputMaybe<JsonFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<MonsterFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<MonsterFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<MonsterFiltersInput>>>;
  proficiencies?: InputMaybe<JsonFilterInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  senses?: InputMaybe<JsonFilterInput>;
  size?: InputMaybe<StringFilterInput>;
  slug?: InputMaybe<StringFilterInput>;
  special_abilities?: InputMaybe<JsonFilterInput>;
  speed?: InputMaybe<JsonFilterInput>;
  stats?: InputMaybe<ComponentGameStatsFiltersInput>;
  type?: InputMaybe<StringFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  xp?: InputMaybe<IntFilterInput>;
};

export type MonsterInput = {
  ac?: InputMaybe<Scalars['Int']['input']>;
  actions?: InputMaybe<Scalars['JSON']['input']>;
  alignment?: InputMaybe<Scalars['String']['input']>;
  challenge_rating?: InputMaybe<Scalars['Float']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  hit_dice?: InputMaybe<Scalars['String']['input']>;
  hp?: InputMaybe<Scalars['Int']['input']>;
  image?: InputMaybe<Scalars['ID']['input']>;
  languages?: InputMaybe<Scalars['String']['input']>;
  legendary_actions?: InputMaybe<Scalars['JSON']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  proficiencies?: InputMaybe<Scalars['JSON']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  senses?: InputMaybe<Scalars['JSON']['input']>;
  size?: InputMaybe<Enum_Monster_Size>;
  slug?: InputMaybe<Scalars['String']['input']>;
  special_abilities?: InputMaybe<Scalars['JSON']['input']>;
  speed?: InputMaybe<Scalars['JSON']['input']>;
  stats?: InputMaybe<ComponentGameStatsInput>;
  type?: InputMaybe<Scalars['String']['input']>;
  xp?: InputMaybe<Scalars['Int']['input']>;
};

export type MonsterRelationResponseCollection = {
  __typename?: 'MonsterRelationResponseCollection';
  nodes: Array<Monster>;
};

export type Mutation = {
  __typename?: 'Mutation';
  addCharacter?: Maybe<Scalars['JSON']['output']>;
  /** Change user password. Confirm with the current password. */
  changePassword?: Maybe<UsersPermissionsLoginPayload>;
  createCharacter?: Maybe<Character>;
  createCharacterSheet?: Maybe<CharacterSheet>;
  createClass?: Maybe<Class>;
  createDamageType?: Maybe<DamageType>;
  createDmSetting?: Maybe<DmSetting>;
  createEquipment?: Maybe<Equipment>;
  createEquipmentCategory?: Maybe<EquipmentCategory>;
  createFeature?: Maybe<Feature>;
  createGameEvent?: Maybe<GameEvent>;
  createKnowledgeSnippet?: Maybe<KnowledgeSnippet>;
  createKnowledgeSource?: Maybe<KnowledgeSource>;
  createLanguage?: Maybe<Language>;
  createMagicItem?: Maybe<MagicItem>;
  createMagicSchool?: Maybe<MagicSchool>;
  createMessage?: Maybe<Message>;
  createMonster?: Maybe<Monster>;
  createProficiency?: Maybe<Proficiency>;
  createPrompt?: Maybe<Prompt>;
  createRace?: Maybe<Race>;
  createReviewWorkflowsWorkflow?: Maybe<ReviewWorkflowsWorkflow>;
  createReviewWorkflowsWorkflowStage?: Maybe<ReviewWorkflowsWorkflowStage>;
  createRoom?: Maybe<Room>;
  createSpell?: Maybe<Spell>;
  createSubclass?: Maybe<Subclass>;
  createTimeFrame?: Maybe<TimeFrame>;
  createTrait?: Maybe<Trait>;
  createTurn?: Maybe<Turn>;
  /** Create a new role */
  createUsersPermissionsRole?: Maybe<UsersPermissionsCreateRolePayload>;
  /** Create a new user */
  createUsersPermissionsUser: UsersPermissionsUserEntityResponse;
  createWeaponProperty?: Maybe<WeaponProperty>;
  createWorld?: Maybe<World>;
  deleteCharacter?: Maybe<DeleteMutationResponse>;
  deleteCharacterSheet?: Maybe<DeleteMutationResponse>;
  deleteClass?: Maybe<DeleteMutationResponse>;
  deleteDamageType?: Maybe<DeleteMutationResponse>;
  deleteDmSetting?: Maybe<DeleteMutationResponse>;
  deleteEquipment?: Maybe<DeleteMutationResponse>;
  deleteEquipmentCategory?: Maybe<DeleteMutationResponse>;
  deleteFeature?: Maybe<DeleteMutationResponse>;
  deleteGameEvent?: Maybe<DeleteMutationResponse>;
  deleteKnowledgeSnippet?: Maybe<DeleteMutationResponse>;
  deleteKnowledgeSource?: Maybe<DeleteMutationResponse>;
  deleteLanguage?: Maybe<DeleteMutationResponse>;
  deleteMagicItem?: Maybe<DeleteMutationResponse>;
  deleteMagicSchool?: Maybe<DeleteMutationResponse>;
  deleteMessage?: Maybe<DeleteMutationResponse>;
  deleteMonster?: Maybe<DeleteMutationResponse>;
  deleteProficiency?: Maybe<DeleteMutationResponse>;
  deletePrompt?: Maybe<DeleteMutationResponse>;
  deleteRace?: Maybe<DeleteMutationResponse>;
  deleteReviewWorkflowsWorkflow?: Maybe<DeleteMutationResponse>;
  deleteReviewWorkflowsWorkflowStage?: Maybe<DeleteMutationResponse>;
  deleteRoom?: Maybe<DeleteMutationResponse>;
  deleteSpell?: Maybe<DeleteMutationResponse>;
  deleteSubclass?: Maybe<DeleteMutationResponse>;
  deleteTimeFrame?: Maybe<DeleteMutationResponse>;
  deleteTrait?: Maybe<DeleteMutationResponse>;
  deleteTurn?: Maybe<DeleteMutationResponse>;
  deleteUploadFile?: Maybe<UploadFile>;
  /** Delete an existing role */
  deleteUsersPermissionsRole?: Maybe<UsersPermissionsDeleteRolePayload>;
  /** Delete an existing user */
  deleteUsersPermissionsUser: UsersPermissionsUserEntityResponse;
  deleteWeaponProperty?: Maybe<DeleteMutationResponse>;
  deleteWorld?: Maybe<DeleteMutationResponse>;
  /** Confirm an email users email address */
  emailConfirmation?: Maybe<UsersPermissionsLoginPayload>;
  /** Request a reset password token */
  forgotPassword?: Maybe<UsersPermissionsPasswordPayload>;
  generateAvatarFullBody?: Maybe<Scalars['JSON']['output']>;
  generateAvatarPortrait?: Maybe<Scalars['JSON']['output']>;
  generateAvatarUpperBody?: Maybe<Scalars['JSON']['output']>;
  generateTerrain?: Maybe<Scalars['Boolean']['output']>;
  generateTerrainChunk?: Maybe<Scalars['JSON']['output']>;
  generateWorld?: Maybe<Scalars['JSON']['output']>;
  joinRoom?: Maybe<Room>;
  login: UsersPermissionsLoginPayload;
  processTurn?: Maybe<Scalars['JSON']['output']>;
  /** Register a user */
  register: UsersPermissionsLoginPayload;
  /** Reset user password. Confirm with a code (resetToken from forgotPassword) */
  resetPassword?: Maybe<UsersPermissionsLoginPayload>;
  spawnCreature?: Maybe<Scalars['JSON']['output']>;
  startGame?: Maybe<Scalars['JSON']['output']>;
  submitAction?: Maybe<Scalars['JSON']['output']>;
  updateCharacter?: Maybe<Character>;
  updateCharacterSheet?: Maybe<CharacterSheet>;
  updateClass?: Maybe<Class>;
  updateDamageType?: Maybe<DamageType>;
  updateDmSetting?: Maybe<DmSetting>;
  updateEquipment?: Maybe<Equipment>;
  updateEquipmentCategory?: Maybe<EquipmentCategory>;
  updateFeature?: Maybe<Feature>;
  updateGameEvent?: Maybe<GameEvent>;
  updateKnowledgeSnippet?: Maybe<KnowledgeSnippet>;
  updateKnowledgeSource?: Maybe<KnowledgeSource>;
  updateLanguage?: Maybe<Language>;
  updateMagicItem?: Maybe<MagicItem>;
  updateMagicSchool?: Maybe<MagicSchool>;
  updateMessage?: Maybe<Message>;
  updateMonster?: Maybe<Monster>;
  updateProficiency?: Maybe<Proficiency>;
  updatePrompt?: Maybe<Prompt>;
  updateRace?: Maybe<Race>;
  updateReviewWorkflowsWorkflow?: Maybe<ReviewWorkflowsWorkflow>;
  updateReviewWorkflowsWorkflowStage?: Maybe<ReviewWorkflowsWorkflowStage>;
  updateRoom?: Maybe<Room>;
  updateSpell?: Maybe<Spell>;
  updateSubclass?: Maybe<Subclass>;
  updateTimeFrame?: Maybe<TimeFrame>;
  updateTrait?: Maybe<Trait>;
  updateTurn?: Maybe<Turn>;
  updateUploadFile: UploadFile;
  /** Update an existing role */
  updateUsersPermissionsRole?: Maybe<UsersPermissionsUpdateRolePayload>;
  /** Update an existing user */
  updateUsersPermissionsUser: UsersPermissionsUserEntityResponse;
  updateWeaponProperty?: Maybe<WeaponProperty>;
  updateWorld?: Maybe<World>;
};


export type MutationAddCharacterArgs = {
  character?: InputMaybe<Scalars['JSON']['input']>;
  roomId: Scalars['ID']['input'];
};


export type MutationChangePasswordArgs = {
  currentPassword: Scalars['String']['input'];
  password: Scalars['String']['input'];
  passwordConfirmation: Scalars['String']['input'];
};


export type MutationCreateCharacterArgs = {
  data: CharacterInput;
  status?: InputMaybe<PublicationStatus>;
};


export type MutationCreateCharacterSheetArgs = {
  data: CharacterSheetInput;
  status?: InputMaybe<PublicationStatus>;
};


export type MutationCreateClassArgs = {
  data: ClassInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type MutationCreateDamageTypeArgs = {
  data: DamageTypeInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type MutationCreateDmSettingArgs = {
  data: DmSettingInput;
  status?: InputMaybe<PublicationStatus>;
};


export type MutationCreateEquipmentArgs = {
  data: EquipmentInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type MutationCreateEquipmentCategoryArgs = {
  data: EquipmentCategoryInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type MutationCreateFeatureArgs = {
  data: FeatureInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type MutationCreateGameEventArgs = {
  data: GameEventInput;
  status?: InputMaybe<PublicationStatus>;
};


export type MutationCreateKnowledgeSnippetArgs = {
  data: KnowledgeSnippetInput;
  status?: InputMaybe<PublicationStatus>;
};


export type MutationCreateKnowledgeSourceArgs = {
  data: KnowledgeSourceInput;
  status?: InputMaybe<PublicationStatus>;
};


export type MutationCreateLanguageArgs = {
  data: LanguageInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type MutationCreateMagicItemArgs = {
  data: MagicItemInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type MutationCreateMagicSchoolArgs = {
  data: MagicSchoolInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type MutationCreateMessageArgs = {
  data: MessageInput;
  status?: InputMaybe<PublicationStatus>;
};


export type MutationCreateMonsterArgs = {
  data: MonsterInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type MutationCreateProficiencyArgs = {
  data: ProficiencyInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type MutationCreatePromptArgs = {
  data: PromptInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type MutationCreateRaceArgs = {
  data: RaceInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type MutationCreateReviewWorkflowsWorkflowArgs = {
  data: ReviewWorkflowsWorkflowInput;
  status?: InputMaybe<PublicationStatus>;
};


export type MutationCreateReviewWorkflowsWorkflowStageArgs = {
  data: ReviewWorkflowsWorkflowStageInput;
  status?: InputMaybe<PublicationStatus>;
};


export type MutationCreateRoomArgs = {
  data?: InputMaybe<Scalars['JSON']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type MutationCreateSpellArgs = {
  data: SpellInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type MutationCreateSubclassArgs = {
  data: SubclassInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type MutationCreateTimeFrameArgs = {
  data: TimeFrameInput;
  status?: InputMaybe<PublicationStatus>;
};


export type MutationCreateTraitArgs = {
  data: TraitInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type MutationCreateTurnArgs = {
  data: TurnInput;
  status?: InputMaybe<PublicationStatus>;
};


export type MutationCreateUsersPermissionsRoleArgs = {
  data: UsersPermissionsRoleInput;
};


export type MutationCreateUsersPermissionsUserArgs = {
  data: UsersPermissionsUserInput;
};


export type MutationCreateWeaponPropertyArgs = {
  data: WeaponPropertyInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type MutationCreateWorldArgs = {
  data: WorldInput;
  status?: InputMaybe<PublicationStatus>;
};


export type MutationDeleteCharacterArgs = {
  documentId: Scalars['ID']['input'];
};


export type MutationDeleteCharacterSheetArgs = {
  documentId: Scalars['ID']['input'];
};


export type MutationDeleteClassArgs = {
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeleteDamageTypeArgs = {
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeleteDmSettingArgs = {
  documentId: Scalars['ID']['input'];
};


export type MutationDeleteEquipmentArgs = {
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeleteEquipmentCategoryArgs = {
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeleteFeatureArgs = {
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeleteGameEventArgs = {
  documentId: Scalars['ID']['input'];
};


export type MutationDeleteKnowledgeSnippetArgs = {
  documentId: Scalars['ID']['input'];
};


export type MutationDeleteKnowledgeSourceArgs = {
  documentId: Scalars['ID']['input'];
};


export type MutationDeleteLanguageArgs = {
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeleteMagicItemArgs = {
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeleteMagicSchoolArgs = {
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeleteMessageArgs = {
  documentId: Scalars['ID']['input'];
};


export type MutationDeleteMonsterArgs = {
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeleteProficiencyArgs = {
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeletePromptArgs = {
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeleteRaceArgs = {
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeleteReviewWorkflowsWorkflowArgs = {
  documentId: Scalars['ID']['input'];
};


export type MutationDeleteReviewWorkflowsWorkflowStageArgs = {
  documentId: Scalars['ID']['input'];
};


export type MutationDeleteRoomArgs = {
  documentId: Scalars['ID']['input'];
};


export type MutationDeleteSpellArgs = {
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeleteSubclassArgs = {
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeleteTimeFrameArgs = {
  documentId: Scalars['ID']['input'];
};


export type MutationDeleteTraitArgs = {
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeleteTurnArgs = {
  documentId: Scalars['ID']['input'];
};


export type MutationDeleteUploadFileArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteUsersPermissionsRoleArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteUsersPermissionsUserArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteWeaponPropertyArgs = {
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
};


export type MutationDeleteWorldArgs = {
  documentId: Scalars['ID']['input'];
};


export type MutationEmailConfirmationArgs = {
  confirmation: Scalars['String']['input'];
};


export type MutationForgotPasswordArgs = {
  email: Scalars['String']['input'];
};


export type MutationGenerateAvatarFullBodyArgs = {
  payload: Scalars['JSON']['input'];
  portrait: Scalars['JSON']['input'];
  referenceImage?: InputMaybe<Scalars['String']['input']>;
  upperBody: Scalars['JSON']['input'];
};


export type MutationGenerateAvatarPortraitArgs = {
  payload: Scalars['JSON']['input'];
  referenceImage?: InputMaybe<Scalars['String']['input']>;
};


export type MutationGenerateAvatarUpperBodyArgs = {
  payload: Scalars['JSON']['input'];
  portrait: Scalars['JSON']['input'];
  referenceImage?: InputMaybe<Scalars['String']['input']>;
};


export type MutationGenerateTerrainArgs = {
  roomId: Scalars['ID']['input'];
};


export type MutationGenerateTerrainChunkArgs = {
  chunkSize?: InputMaybe<Scalars['Int']['input']>;
  chunkX: Scalars['Int']['input'];
  chunkY: Scalars['Int']['input'];
  roomId: Scalars['ID']['input'];
};


export type MutationGenerateWorldArgs = {
  language?: InputMaybe<Scalars['String']['input']>;
  roomId: Scalars['ID']['input'];
};


export type MutationJoinRoomArgs = {
  code: Scalars['String']['input'];
};


export type MutationLoginArgs = {
  input: UsersPermissionsLoginInput;
};


export type MutationProcessTurnArgs = {
  language?: InputMaybe<Scalars['String']['input']>;
  messages?: InputMaybe<Scalars['JSON']['input']>;
  roomId: Scalars['ID']['input'];
};


export type MutationRegisterArgs = {
  input: UsersPermissionsRegisterInput;
};


export type MutationResetPasswordArgs = {
  code: Scalars['String']['input'];
  password: Scalars['String']['input'];
  passwordConfirmation: Scalars['String']['input'];
};


export type MutationSpawnCreatureArgs = {
  creature?: InputMaybe<Scalars['JSON']['input']>;
  roomId: Scalars['ID']['input'];
};


export type MutationStartGameArgs = {
  language?: InputMaybe<Scalars['String']['input']>;
  roomId: Scalars['ID']['input'];
  streamId?: InputMaybe<Scalars['String']['input']>;
};


export type MutationSubmitActionArgs = {
  action: Scalars['String']['input'];
  mode?: InputMaybe<Scalars['String']['input']>;
  roomId: Scalars['ID']['input'];
};


export type MutationUpdateCharacterArgs = {
  data: CharacterInput;
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
};


export type MutationUpdateCharacterSheetArgs = {
  data: CharacterSheetInput;
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
};


export type MutationUpdateClassArgs = {
  data: ClassInput;
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type MutationUpdateDamageTypeArgs = {
  data: DamageTypeInput;
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type MutationUpdateDmSettingArgs = {
  data: DmSettingInput;
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
};


export type MutationUpdateEquipmentArgs = {
  data: EquipmentInput;
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type MutationUpdateEquipmentCategoryArgs = {
  data: EquipmentCategoryInput;
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type MutationUpdateFeatureArgs = {
  data: FeatureInput;
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type MutationUpdateGameEventArgs = {
  data: GameEventInput;
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
};


export type MutationUpdateKnowledgeSnippetArgs = {
  data: KnowledgeSnippetInput;
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
};


export type MutationUpdateKnowledgeSourceArgs = {
  data: KnowledgeSourceInput;
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
};


export type MutationUpdateLanguageArgs = {
  data: LanguageInput;
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type MutationUpdateMagicItemArgs = {
  data: MagicItemInput;
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type MutationUpdateMagicSchoolArgs = {
  data: MagicSchoolInput;
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type MutationUpdateMessageArgs = {
  data: MessageInput;
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
};


export type MutationUpdateMonsterArgs = {
  data: MonsterInput;
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type MutationUpdateProficiencyArgs = {
  data: ProficiencyInput;
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type MutationUpdatePromptArgs = {
  data: PromptInput;
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type MutationUpdateRaceArgs = {
  data: RaceInput;
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type MutationUpdateReviewWorkflowsWorkflowArgs = {
  data: ReviewWorkflowsWorkflowInput;
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
};


export type MutationUpdateReviewWorkflowsWorkflowStageArgs = {
  data: ReviewWorkflowsWorkflowStageInput;
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
};


export type MutationUpdateRoomArgs = {
  data: RoomInput;
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
};


export type MutationUpdateSpellArgs = {
  data: SpellInput;
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type MutationUpdateSubclassArgs = {
  data: SubclassInput;
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type MutationUpdateTimeFrameArgs = {
  data: TimeFrameInput;
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
};


export type MutationUpdateTraitArgs = {
  data: TraitInput;
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type MutationUpdateTurnArgs = {
  data: TurnInput;
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
};


export type MutationUpdateUploadFileArgs = {
  id: Scalars['ID']['input'];
  info?: InputMaybe<FileInfoInput>;
};


export type MutationUpdateUsersPermissionsRoleArgs = {
  data: UsersPermissionsRoleInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateUsersPermissionsUserArgs = {
  data: UsersPermissionsUserInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateWeaponPropertyArgs = {
  data: WeaponPropertyInput;
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type MutationUpdateWorldArgs = {
  data: WorldInput;
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
};

export type Pagination = {
  __typename?: 'Pagination';
  page: Scalars['Int']['output'];
  pageCount: Scalars['Int']['output'];
  pageSize: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type PaginationArg = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
  start?: InputMaybe<Scalars['Int']['input']>;
};

export type Proficiency = {
  __typename?: 'Proficiency';
  classes: Array<Maybe<Class>>;
  classes_connection?: Maybe<ClassRelationResponseCollection>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  documentId: Scalars['ID']['output'];
  image?: Maybe<UploadFile>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations: Array<Maybe<Proficiency>>;
  localizations_connection?: Maybe<ProficiencyRelationResponseCollection>;
  name: Scalars['String']['output'];
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  races: Array<Maybe<Race>>;
  races_connection?: Maybe<RaceRelationResponseCollection>;
  slug: Scalars['String']['output'];
  traits: Array<Maybe<Trait>>;
  traits_connection?: Maybe<TraitRelationResponseCollection>;
  type?: Maybe<Enum_Proficiency_Type>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};


export type ProficiencyClassesArgs = {
  filters?: InputMaybe<ClassFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProficiencyClasses_ConnectionArgs = {
  filters?: InputMaybe<ClassFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProficiencyLocalizationsArgs = {
  filters?: InputMaybe<ProficiencyFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProficiencyLocalizations_ConnectionArgs = {
  filters?: InputMaybe<ProficiencyFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProficiencyRacesArgs = {
  filters?: InputMaybe<RaceFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProficiencyRaces_ConnectionArgs = {
  filters?: InputMaybe<RaceFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProficiencyTraitsArgs = {
  filters?: InputMaybe<TraitFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProficiencyTraits_ConnectionArgs = {
  filters?: InputMaybe<TraitFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type ProficiencyEntityResponseCollection = {
  __typename?: 'ProficiencyEntityResponseCollection';
  nodes: Array<Proficiency>;
  pageInfo: Pagination;
};

export type ProficiencyFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<ProficiencyFiltersInput>>>;
  classes?: InputMaybe<ClassFiltersInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  documentId?: InputMaybe<IdFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<ProficiencyFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<ProficiencyFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<ProficiencyFiltersInput>>>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  races?: InputMaybe<RaceFiltersInput>;
  slug?: InputMaybe<StringFilterInput>;
  traits?: InputMaybe<TraitFiltersInput>;
  type?: InputMaybe<StringFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type ProficiencyInput = {
  classes?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  image?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  races?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  slug?: InputMaybe<Scalars['String']['input']>;
  traits?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  type?: InputMaybe<Enum_Proficiency_Type>;
};

export type ProficiencyRelationResponseCollection = {
  __typename?: 'ProficiencyRelationResponseCollection';
  nodes: Array<Proficiency>;
};

export type Prompt = {
  __typename?: 'Prompt';
  category?: Maybe<Enum_Prompt_Category>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  documentId: Scalars['ID']['output'];
  key: Scalars['String']['output'];
  locale?: Maybe<Scalars['String']['output']>;
  localizations: Array<Maybe<Prompt>>;
  localizations_connection?: Maybe<PromptRelationResponseCollection>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  text?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};


export type PromptLocalizationsArgs = {
  filters?: InputMaybe<PromptFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PromptLocalizations_ConnectionArgs = {
  filters?: InputMaybe<PromptFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type PromptEntityResponseCollection = {
  __typename?: 'PromptEntityResponseCollection';
  nodes: Array<Prompt>;
  pageInfo: Pagination;
};

export type PromptFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<PromptFiltersInput>>>;
  category?: InputMaybe<StringFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  documentId?: InputMaybe<IdFilterInput>;
  key?: InputMaybe<StringFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<PromptFiltersInput>;
  not?: InputMaybe<PromptFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<PromptFiltersInput>>>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  text?: InputMaybe<StringFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type PromptInput = {
  category?: InputMaybe<Enum_Prompt_Category>;
  key?: InputMaybe<Scalars['String']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  text?: InputMaybe<Scalars['String']['input']>;
};

export type PromptRelationResponseCollection = {
  __typename?: 'PromptRelationResponseCollection';
  nodes: Array<Prompt>;
};

export enum PublicationStatus {
  Draft = 'DRAFT',
  Published = 'PUBLISHED'
}

export type Query = {
  __typename?: 'Query';
  abilities?: Maybe<Array<Maybe<Ability>>>;
  alignments?: Maybe<Array<Maybe<Alignment>>>;
  backgrounds?: Maybe<Array<Maybe<Background>>>;
  character?: Maybe<Character>;
  characterSheet?: Maybe<CharacterSheet>;
  characterSheets: Array<Maybe<CharacterSheet>>;
  characterSheets_connection?: Maybe<CharacterSheetEntityResponseCollection>;
  characters: Array<Maybe<Character>>;
  characters_connection?: Maybe<CharacterEntityResponseCollection>;
  class?: Maybe<Class>;
  classes: Array<Maybe<Class>>;
  classes_connection?: Maybe<ClassEntityResponseCollection>;
  conditions?: Maybe<Array<Maybe<GameCondition>>>;
  damageType?: Maybe<DamageType>;
  damageTypes: Array<Maybe<DamageType>>;
  damageTypes_connection?: Maybe<DamageTypeEntityResponseCollection>;
  dmSetting?: Maybe<DmSetting>;
  dmSettings: Array<Maybe<DmSetting>>;
  dmSettings_connection?: Maybe<DmSettingEntityResponseCollection>;
  equipment?: Maybe<Equipment>;
  equipmentCategories: Array<Maybe<EquipmentCategory>>;
  equipmentCategories_connection?: Maybe<EquipmentCategoryEntityResponseCollection>;
  equipmentCategory?: Maybe<EquipmentCategory>;
  equipments: Array<Maybe<Equipment>>;
  equipments_connection?: Maybe<EquipmentEntityResponseCollection>;
  feature?: Maybe<Feature>;
  features: Array<Maybe<Feature>>;
  features_connection?: Maybe<FeatureEntityResponseCollection>;
  gameEvent?: Maybe<GameEvent>;
  gameEvents: Array<Maybe<GameEvent>>;
  gameEvents_connection?: Maybe<GameEventEntityResponseCollection>;
  i18NLocale?: Maybe<I18NLocale>;
  i18NLocales: Array<Maybe<I18NLocale>>;
  i18NLocales_connection?: Maybe<I18NLocaleEntityResponseCollection>;
  knowledgeSnippet?: Maybe<KnowledgeSnippet>;
  knowledgeSnippets: Array<Maybe<KnowledgeSnippet>>;
  knowledgeSnippets_connection?: Maybe<KnowledgeSnippetEntityResponseCollection>;
  knowledgeSource?: Maybe<KnowledgeSource>;
  knowledgeSources: Array<Maybe<KnowledgeSource>>;
  knowledgeSources_connection?: Maybe<KnowledgeSourceEntityResponseCollection>;
  language?: Maybe<Language>;
  languages: Array<Maybe<Language>>;
  languages_connection?: Maybe<LanguageEntityResponseCollection>;
  magicItem?: Maybe<MagicItem>;
  magicItems: Array<Maybe<MagicItem>>;
  magicItems_connection?: Maybe<MagicItemEntityResponseCollection>;
  magicSchool?: Maybe<MagicSchool>;
  magicSchools: Array<Maybe<MagicSchool>>;
  magicSchools_connection?: Maybe<MagicSchoolEntityResponseCollection>;
  me?: Maybe<UsersPermissionsMe>;
  message?: Maybe<Message>;
  messages: Array<Maybe<Message>>;
  messages_connection?: Maybe<MessageEntityResponseCollection>;
  monster?: Maybe<Monster>;
  monsters: Array<Maybe<Monster>>;
  monsters_connection?: Maybe<MonsterEntityResponseCollection>;
  proficiencies: Array<Maybe<Proficiency>>;
  proficiencies_connection?: Maybe<ProficiencyEntityResponseCollection>;
  proficiency?: Maybe<Proficiency>;
  prompt?: Maybe<Prompt>;
  prompts: Array<Maybe<Prompt>>;
  prompts_connection?: Maybe<PromptEntityResponseCollection>;
  race?: Maybe<Race>;
  races: Array<Maybe<Race>>;
  races_connection?: Maybe<RaceEntityResponseCollection>;
  reviewWorkflowsWorkflow?: Maybe<ReviewWorkflowsWorkflow>;
  reviewWorkflowsWorkflowStage?: Maybe<ReviewWorkflowsWorkflowStage>;
  reviewWorkflowsWorkflowStages: Array<Maybe<ReviewWorkflowsWorkflowStage>>;
  reviewWorkflowsWorkflowStages_connection?: Maybe<ReviewWorkflowsWorkflowStageEntityResponseCollection>;
  reviewWorkflowsWorkflows: Array<Maybe<ReviewWorkflowsWorkflow>>;
  reviewWorkflowsWorkflows_connection?: Maybe<ReviewWorkflowsWorkflowEntityResponseCollection>;
  room?: Maybe<Room>;
  rooms: Array<Maybe<Room>>;
  rooms_connection?: Maybe<RoomEntityResponseCollection>;
  searchEntities: Array<Maybe<SearchResult>>;
  skills?: Maybe<Array<Maybe<Skill>>>;
  spell?: Maybe<Spell>;
  spells: Array<Maybe<Spell>>;
  spells_connection?: Maybe<SpellEntityResponseCollection>;
  subclass?: Maybe<Subclass>;
  subclasses: Array<Maybe<Subclass>>;
  subclasses_connection?: Maybe<SubclassEntityResponseCollection>;
  timeFrame?: Maybe<TimeFrame>;
  timeFrames: Array<Maybe<TimeFrame>>;
  timeFrames_connection?: Maybe<TimeFrameEntityResponseCollection>;
  trait?: Maybe<Trait>;
  traits: Array<Maybe<Trait>>;
  traits_connection?: Maybe<TraitEntityResponseCollection>;
  turn?: Maybe<Turn>;
  turns: Array<Maybe<Turn>>;
  turns_connection?: Maybe<TurnEntityResponseCollection>;
  uploadFile?: Maybe<UploadFile>;
  uploadFiles: Array<Maybe<UploadFile>>;
  uploadFiles_connection?: Maybe<UploadFileEntityResponseCollection>;
  usersPermissionsRole?: Maybe<UsersPermissionsRole>;
  usersPermissionsRoles: Array<Maybe<UsersPermissionsRole>>;
  usersPermissionsRoles_connection?: Maybe<UsersPermissionsRoleEntityResponseCollection>;
  usersPermissionsUser?: Maybe<UsersPermissionsUser>;
  usersPermissionsUsers: Array<Maybe<UsersPermissionsUser>>;
  usersPermissionsUsers_connection?: Maybe<UsersPermissionsUserEntityResponseCollection>;
  voxelPreview: Array<Maybe<Scalars['JSON']['output']>>;
  weaponProperties: Array<Maybe<WeaponProperty>>;
  weaponProperties_connection?: Maybe<WeaponPropertyEntityResponseCollection>;
  weaponProperty?: Maybe<WeaponProperty>;
  world?: Maybe<World>;
  worlds: Array<Maybe<World>>;
  worlds_connection?: Maybe<WorldEntityResponseCollection>;
};


export type QueryCharacterArgs = {
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
};


export type QueryCharacterSheetArgs = {
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
};


export type QueryCharacterSheetsArgs = {
  filters?: InputMaybe<CharacterSheetFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryCharacterSheets_ConnectionArgs = {
  filters?: InputMaybe<CharacterSheetFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryCharactersArgs = {
  filters?: InputMaybe<CharacterFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryCharacters_ConnectionArgs = {
  filters?: InputMaybe<CharacterFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryClassArgs = {
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryClassesArgs = {
  filters?: InputMaybe<ClassFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryClasses_ConnectionArgs = {
  filters?: InputMaybe<ClassFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryDamageTypeArgs = {
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryDamageTypesArgs = {
  filters?: InputMaybe<DamageTypeFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryDamageTypes_ConnectionArgs = {
  filters?: InputMaybe<DamageTypeFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryDmSettingArgs = {
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
};


export type QueryDmSettingsArgs = {
  filters?: InputMaybe<DmSettingFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryDmSettings_ConnectionArgs = {
  filters?: InputMaybe<DmSettingFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryEquipmentArgs = {
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryEquipmentCategoriesArgs = {
  filters?: InputMaybe<EquipmentCategoryFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryEquipmentCategories_ConnectionArgs = {
  filters?: InputMaybe<EquipmentCategoryFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryEquipmentCategoryArgs = {
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryEquipmentsArgs = {
  filters?: InputMaybe<EquipmentFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryEquipments_ConnectionArgs = {
  filters?: InputMaybe<EquipmentFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryFeatureArgs = {
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryFeaturesArgs = {
  filters?: InputMaybe<FeatureFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryFeatures_ConnectionArgs = {
  filters?: InputMaybe<FeatureFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryGameEventArgs = {
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
};


export type QueryGameEventsArgs = {
  filters?: InputMaybe<GameEventFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryGameEvents_ConnectionArgs = {
  filters?: InputMaybe<GameEventFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryI18NLocaleArgs = {
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
};


export type QueryI18NLocalesArgs = {
  filters?: InputMaybe<I18NLocaleFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryI18NLocales_ConnectionArgs = {
  filters?: InputMaybe<I18NLocaleFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryKnowledgeSnippetArgs = {
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
};


export type QueryKnowledgeSnippetsArgs = {
  filters?: InputMaybe<KnowledgeSnippetFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryKnowledgeSnippets_ConnectionArgs = {
  filters?: InputMaybe<KnowledgeSnippetFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryKnowledgeSourceArgs = {
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
};


export type QueryKnowledgeSourcesArgs = {
  filters?: InputMaybe<KnowledgeSourceFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryKnowledgeSources_ConnectionArgs = {
  filters?: InputMaybe<KnowledgeSourceFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryLanguageArgs = {
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryLanguagesArgs = {
  filters?: InputMaybe<LanguageFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryLanguages_ConnectionArgs = {
  filters?: InputMaybe<LanguageFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryMagicItemArgs = {
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryMagicItemsArgs = {
  filters?: InputMaybe<MagicItemFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryMagicItems_ConnectionArgs = {
  filters?: InputMaybe<MagicItemFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryMagicSchoolArgs = {
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryMagicSchoolsArgs = {
  filters?: InputMaybe<MagicSchoolFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryMagicSchools_ConnectionArgs = {
  filters?: InputMaybe<MagicSchoolFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryMessageArgs = {
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
};


export type QueryMessagesArgs = {
  filters?: InputMaybe<MessageFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryMessages_ConnectionArgs = {
  filters?: InputMaybe<MessageFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryMonsterArgs = {
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryMonstersArgs = {
  filters?: InputMaybe<MonsterFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryMonsters_ConnectionArgs = {
  filters?: InputMaybe<MonsterFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryProficienciesArgs = {
  filters?: InputMaybe<ProficiencyFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryProficiencies_ConnectionArgs = {
  filters?: InputMaybe<ProficiencyFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryProficiencyArgs = {
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryPromptArgs = {
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryPromptsArgs = {
  filters?: InputMaybe<PromptFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryPrompts_ConnectionArgs = {
  filters?: InputMaybe<PromptFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryRaceArgs = {
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryRacesArgs = {
  filters?: InputMaybe<RaceFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryRaces_ConnectionArgs = {
  filters?: InputMaybe<RaceFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryReviewWorkflowsWorkflowArgs = {
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
};


export type QueryReviewWorkflowsWorkflowStageArgs = {
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
};


export type QueryReviewWorkflowsWorkflowStagesArgs = {
  filters?: InputMaybe<ReviewWorkflowsWorkflowStageFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryReviewWorkflowsWorkflowStages_ConnectionArgs = {
  filters?: InputMaybe<ReviewWorkflowsWorkflowStageFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryReviewWorkflowsWorkflowsArgs = {
  filters?: InputMaybe<ReviewWorkflowsWorkflowFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryReviewWorkflowsWorkflows_ConnectionArgs = {
  filters?: InputMaybe<ReviewWorkflowsWorkflowFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryRoomArgs = {
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
};


export type QueryRoomsArgs = {
  filters?: InputMaybe<RoomFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryRooms_ConnectionArgs = {
  filters?: InputMaybe<RoomFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QuerySearchEntitiesArgs = {
  query: Scalars['String']['input'];
};


export type QuerySpellArgs = {
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type QuerySpellsArgs = {
  filters?: InputMaybe<SpellFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QuerySpells_ConnectionArgs = {
  filters?: InputMaybe<SpellFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QuerySubclassArgs = {
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type QuerySubclassesArgs = {
  filters?: InputMaybe<SubclassFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QuerySubclasses_ConnectionArgs = {
  filters?: InputMaybe<SubclassFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryTimeFrameArgs = {
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
};


export type QueryTimeFramesArgs = {
  filters?: InputMaybe<TimeFrameFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryTimeFrames_ConnectionArgs = {
  filters?: InputMaybe<TimeFrameFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryTraitArgs = {
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryTraitsArgs = {
  filters?: InputMaybe<TraitFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryTraits_ConnectionArgs = {
  filters?: InputMaybe<TraitFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryTurnArgs = {
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
};


export type QueryTurnsArgs = {
  filters?: InputMaybe<TurnFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryTurns_ConnectionArgs = {
  filters?: InputMaybe<TurnFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryUploadFileArgs = {
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
};


export type QueryUploadFilesArgs = {
  filters?: InputMaybe<UploadFileFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryUploadFiles_ConnectionArgs = {
  filters?: InputMaybe<UploadFileFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryUsersPermissionsRoleArgs = {
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
};


export type QueryUsersPermissionsRolesArgs = {
  filters?: InputMaybe<UsersPermissionsRoleFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryUsersPermissionsRoles_ConnectionArgs = {
  filters?: InputMaybe<UsersPermissionsRoleFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryUsersPermissionsUserArgs = {
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
};


export type QueryUsersPermissionsUsersArgs = {
  filters?: InputMaybe<UsersPermissionsUserFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryUsersPermissionsUsers_ConnectionArgs = {
  filters?: InputMaybe<UsersPermissionsUserFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryVoxelPreviewArgs = {
  chunks: Array<InputMaybe<ChunkRequestInput>>;
  config: WorldConfigInput;
};


export type QueryWeaponPropertiesArgs = {
  filters?: InputMaybe<WeaponPropertyFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryWeaponProperties_ConnectionArgs = {
  filters?: InputMaybe<WeaponPropertyFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryWeaponPropertyArgs = {
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryWorldArgs = {
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
};


export type QueryWorldsArgs = {
  filters?: InputMaybe<WorldFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QueryWorlds_ConnectionArgs = {
  filters?: InputMaybe<WorldFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};

export type Race = {
  __typename?: 'Race';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  documentId: Scalars['ID']['output'];
  image?: Maybe<UploadFile>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations: Array<Maybe<Race>>;
  localizations_connection?: Maybe<RaceRelationResponseCollection>;
  name: Scalars['String']['output'];
  proficiencies: Array<Maybe<Proficiency>>;
  proficiencies_connection?: Maybe<ProficiencyRelationResponseCollection>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  size?: Maybe<Enum_Race_Size>;
  slug: Scalars['String']['output'];
  speed?: Maybe<Scalars['JSON']['output']>;
  traits: Array<Maybe<Trait>>;
  traits_connection?: Maybe<TraitRelationResponseCollection>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};


export type RaceLocalizationsArgs = {
  filters?: InputMaybe<RaceFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type RaceLocalizations_ConnectionArgs = {
  filters?: InputMaybe<RaceFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type RaceProficienciesArgs = {
  filters?: InputMaybe<ProficiencyFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type RaceProficiencies_ConnectionArgs = {
  filters?: InputMaybe<ProficiencyFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type RaceTraitsArgs = {
  filters?: InputMaybe<TraitFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type RaceTraits_ConnectionArgs = {
  filters?: InputMaybe<TraitFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type RaceEntityResponseCollection = {
  __typename?: 'RaceEntityResponseCollection';
  nodes: Array<Race>;
  pageInfo: Pagination;
};

export type RaceFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<RaceFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  description?: InputMaybe<StringFilterInput>;
  documentId?: InputMaybe<IdFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<RaceFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<RaceFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<RaceFiltersInput>>>;
  proficiencies?: InputMaybe<ProficiencyFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  size?: InputMaybe<StringFilterInput>;
  slug?: InputMaybe<StringFilterInput>;
  speed?: InputMaybe<JsonFilterInput>;
  traits?: InputMaybe<TraitFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type RaceInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  image?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  proficiencies?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  size?: InputMaybe<Enum_Race_Size>;
  slug?: InputMaybe<Scalars['String']['input']>;
  speed?: InputMaybe<Scalars['JSON']['input']>;
  traits?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
};

export type RaceRelationResponseCollection = {
  __typename?: 'RaceRelationResponseCollection';
  nodes: Array<Race>;
};

export type ReviewWorkflowsWorkflow = {
  __typename?: 'ReviewWorkflowsWorkflow';
  contentTypes: Scalars['JSON']['output'];
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  documentId: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  stageRequiredToPublish?: Maybe<ReviewWorkflowsWorkflowStage>;
  stages: Array<Maybe<ReviewWorkflowsWorkflowStage>>;
  stages_connection?: Maybe<ReviewWorkflowsWorkflowStageRelationResponseCollection>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};


export type ReviewWorkflowsWorkflowStagesArgs = {
  filters?: InputMaybe<ReviewWorkflowsWorkflowStageFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ReviewWorkflowsWorkflowStages_ConnectionArgs = {
  filters?: InputMaybe<ReviewWorkflowsWorkflowStageFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type ReviewWorkflowsWorkflowEntityResponseCollection = {
  __typename?: 'ReviewWorkflowsWorkflowEntityResponseCollection';
  nodes: Array<ReviewWorkflowsWorkflow>;
  pageInfo: Pagination;
};

export type ReviewWorkflowsWorkflowFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<ReviewWorkflowsWorkflowFiltersInput>>>;
  contentTypes?: InputMaybe<JsonFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  documentId?: InputMaybe<IdFilterInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<ReviewWorkflowsWorkflowFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<ReviewWorkflowsWorkflowFiltersInput>>>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  stageRequiredToPublish?: InputMaybe<ReviewWorkflowsWorkflowStageFiltersInput>;
  stages?: InputMaybe<ReviewWorkflowsWorkflowStageFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type ReviewWorkflowsWorkflowInput = {
  contentTypes?: InputMaybe<Scalars['JSON']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  stageRequiredToPublish?: InputMaybe<Scalars['ID']['input']>;
  stages?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
};

export type ReviewWorkflowsWorkflowStage = {
  __typename?: 'ReviewWorkflowsWorkflowStage';
  color?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  documentId: Scalars['ID']['output'];
  name?: Maybe<Scalars['String']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  workflow?: Maybe<ReviewWorkflowsWorkflow>;
};

export type ReviewWorkflowsWorkflowStageEntityResponseCollection = {
  __typename?: 'ReviewWorkflowsWorkflowStageEntityResponseCollection';
  nodes: Array<ReviewWorkflowsWorkflowStage>;
  pageInfo: Pagination;
};

export type ReviewWorkflowsWorkflowStageFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<ReviewWorkflowsWorkflowStageFiltersInput>>>;
  color?: InputMaybe<StringFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  documentId?: InputMaybe<IdFilterInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<ReviewWorkflowsWorkflowStageFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<ReviewWorkflowsWorkflowStageFiltersInput>>>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  workflow?: InputMaybe<ReviewWorkflowsWorkflowFiltersInput>;
};

export type ReviewWorkflowsWorkflowStageInput = {
  color?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  workflow?: InputMaybe<Scalars['ID']['input']>;
};

export type ReviewWorkflowsWorkflowStageRelationResponseCollection = {
  __typename?: 'ReviewWorkflowsWorkflowStageRelationResponseCollection';
  nodes: Array<ReviewWorkflowsWorkflowStage>;
};

export type Room = {
  __typename?: 'Room';
  character_sheets: Array<Maybe<CharacterSheet>>;
  character_sheets_connection?: Maybe<CharacterSheetRelationResponseCollection>;
  code?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  currentTimeFrame?: Maybe<TimeFrame>;
  dmSettings?: Maybe<DmSetting>;
  documentId: Scalars['ID']['output'];
  events: Array<Maybe<GameEvent>>;
  events_connection?: Maybe<GameEventRelationResponseCollection>;
  exploredTiles?: Maybe<Scalars['JSON']['output']>;
  isActive?: Maybe<Scalars['Boolean']['output']>;
  messages: Array<Maybe<Message>>;
  messages_connection?: Maybe<MessageRelationResponseCollection>;
  owner?: Maybe<UsersPermissionsUser>;
  phase?: Maybe<Enum_Room_Phase>;
  players?: Maybe<Array<Maybe<ComponentGamePlayer>>>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  roomId?: Maybe<Scalars['String']['output']>;
  timeFrames: Array<Maybe<TimeFrame>>;
  timeFrames_connection?: Maybe<TimeFrameRelationResponseCollection>;
  turnData?: Maybe<Scalars['JSON']['output']>;
  turns: Array<Maybe<Turn>>;
  turns_connection?: Maybe<TurnRelationResponseCollection>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  world?: Maybe<World>;
};


export type RoomCharacter_SheetsArgs = {
  filters?: InputMaybe<CharacterSheetFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type RoomCharacter_Sheets_ConnectionArgs = {
  filters?: InputMaybe<CharacterSheetFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type RoomEventsArgs = {
  filters?: InputMaybe<GameEventFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type RoomEvents_ConnectionArgs = {
  filters?: InputMaybe<GameEventFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type RoomMessagesArgs = {
  filters?: InputMaybe<MessageFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type RoomMessages_ConnectionArgs = {
  filters?: InputMaybe<MessageFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type RoomPlayersArgs = {
  filters?: InputMaybe<ComponentGamePlayerFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type RoomTimeFramesArgs = {
  filters?: InputMaybe<TimeFrameFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type RoomTimeFrames_ConnectionArgs = {
  filters?: InputMaybe<TimeFrameFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type RoomTurnsArgs = {
  filters?: InputMaybe<TurnFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type RoomTurns_ConnectionArgs = {
  filters?: InputMaybe<TurnFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type RoomEntityResponseCollection = {
  __typename?: 'RoomEntityResponseCollection';
  nodes: Array<Room>;
  pageInfo: Pagination;
};

export type RoomFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<RoomFiltersInput>>>;
  character_sheets?: InputMaybe<CharacterSheetFiltersInput>;
  code?: InputMaybe<StringFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  currentTimeFrame?: InputMaybe<TimeFrameFiltersInput>;
  dmSettings?: InputMaybe<DmSettingFiltersInput>;
  documentId?: InputMaybe<IdFilterInput>;
  events?: InputMaybe<GameEventFiltersInput>;
  exploredTiles?: InputMaybe<JsonFilterInput>;
  isActive?: InputMaybe<BooleanFilterInput>;
  messages?: InputMaybe<MessageFiltersInput>;
  not?: InputMaybe<RoomFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<RoomFiltersInput>>>;
  owner?: InputMaybe<UsersPermissionsUserFiltersInput>;
  phase?: InputMaybe<StringFilterInput>;
  players?: InputMaybe<ComponentGamePlayerFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  roomId?: InputMaybe<StringFilterInput>;
  timeFrames?: InputMaybe<TimeFrameFiltersInput>;
  turnData?: InputMaybe<JsonFilterInput>;
  turns?: InputMaybe<TurnFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  world?: InputMaybe<WorldFiltersInput>;
};

export type RoomInput = {
  character_sheets?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  code?: InputMaybe<Scalars['String']['input']>;
  currentTimeFrame?: InputMaybe<Scalars['ID']['input']>;
  dmSettings?: InputMaybe<Scalars['ID']['input']>;
  events?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  exploredTiles?: InputMaybe<Scalars['JSON']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  messages?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  owner?: InputMaybe<Scalars['ID']['input']>;
  phase?: InputMaybe<Enum_Room_Phase>;
  players?: InputMaybe<Array<InputMaybe<ComponentGamePlayerInput>>>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  roomId?: InputMaybe<Scalars['String']['input']>;
  timeFrames?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  turnData?: InputMaybe<Scalars['JSON']['input']>;
  turns?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  world?: InputMaybe<Scalars['ID']['input']>;
};

export type RoomRelationResponseCollection = {
  __typename?: 'RoomRelationResponseCollection';
  nodes: Array<Room>;
};

export type SearchResult = {
  __typename?: 'SearchResult';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

export type Skill = {
  __typename?: 'Skill';
  abilityScore?: Maybe<Ability>;
  description?: Maybe<Scalars['String']['output']>;
  documentId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type Spell = {
  __typename?: 'Spell';
  casting_time?: Maybe<Scalars['String']['output']>;
  components?: Maybe<Scalars['JSON']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  documentId: Scalars['ID']['output'];
  duration?: Maybe<Scalars['String']['output']>;
  image?: Maybe<UploadFile>;
  is_ritual?: Maybe<Scalars['Boolean']['output']>;
  level?: Maybe<Scalars['Int']['output']>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations: Array<Maybe<Spell>>;
  localizations_connection?: Maybe<SpellRelationResponseCollection>;
  name: Scalars['String']['output'];
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  range?: Maybe<Scalars['String']['output']>;
  school?: Maybe<Scalars['String']['output']>;
  slug: Scalars['String']['output'];
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};


export type SpellLocalizationsArgs = {
  filters?: InputMaybe<SpellFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type SpellLocalizations_ConnectionArgs = {
  filters?: InputMaybe<SpellFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type SpellEntityResponseCollection = {
  __typename?: 'SpellEntityResponseCollection';
  nodes: Array<Spell>;
  pageInfo: Pagination;
};

export type SpellFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<SpellFiltersInput>>>;
  casting_time?: InputMaybe<StringFilterInput>;
  components?: InputMaybe<JsonFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  description?: InputMaybe<StringFilterInput>;
  documentId?: InputMaybe<IdFilterInput>;
  duration?: InputMaybe<StringFilterInput>;
  is_ritual?: InputMaybe<BooleanFilterInput>;
  level?: InputMaybe<IntFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<SpellFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<SpellFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<SpellFiltersInput>>>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  range?: InputMaybe<StringFilterInput>;
  school?: InputMaybe<StringFilterInput>;
  slug?: InputMaybe<StringFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type SpellInput = {
  casting_time?: InputMaybe<Scalars['String']['input']>;
  components?: InputMaybe<Scalars['JSON']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  duration?: InputMaybe<Scalars['String']['input']>;
  image?: InputMaybe<Scalars['ID']['input']>;
  is_ritual?: InputMaybe<Scalars['Boolean']['input']>;
  level?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  range?: InputMaybe<Scalars['String']['input']>;
  school?: InputMaybe<Scalars['String']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
};

export type SpellRelationResponseCollection = {
  __typename?: 'SpellRelationResponseCollection';
  nodes: Array<Spell>;
};

export type StringFilterInput = {
  and?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  between?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  contains?: InputMaybe<Scalars['String']['input']>;
  containsi?: InputMaybe<Scalars['String']['input']>;
  endsWith?: InputMaybe<Scalars['String']['input']>;
  eq?: InputMaybe<Scalars['String']['input']>;
  eqi?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  ne?: InputMaybe<Scalars['String']['input']>;
  nei?: InputMaybe<Scalars['String']['input']>;
  not?: InputMaybe<StringFilterInput>;
  notContains?: InputMaybe<Scalars['String']['input']>;
  notContainsi?: InputMaybe<Scalars['String']['input']>;
  notIn?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  notNull?: InputMaybe<Scalars['Boolean']['input']>;
  null?: InputMaybe<Scalars['Boolean']['input']>;
  or?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  startsWith?: InputMaybe<Scalars['String']['input']>;
};

export type Subclass = {
  __typename?: 'Subclass';
  class?: Maybe<Class>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  documentId: Scalars['ID']['output'];
  image?: Maybe<UploadFile>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations: Array<Maybe<Subclass>>;
  localizations_connection?: Maybe<SubclassRelationResponseCollection>;
  name: Scalars['String']['output'];
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  slug: Scalars['String']['output'];
  subclass_flavor?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};


export type SubclassLocalizationsArgs = {
  filters?: InputMaybe<SubclassFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type SubclassLocalizations_ConnectionArgs = {
  filters?: InputMaybe<SubclassFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type SubclassEntityResponseCollection = {
  __typename?: 'SubclassEntityResponseCollection';
  nodes: Array<Subclass>;
  pageInfo: Pagination;
};

export type SubclassFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<SubclassFiltersInput>>>;
  class?: InputMaybe<ClassFiltersInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  description?: InputMaybe<StringFilterInput>;
  documentId?: InputMaybe<IdFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<SubclassFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<SubclassFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<SubclassFiltersInput>>>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  slug?: InputMaybe<StringFilterInput>;
  subclass_flavor?: InputMaybe<StringFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type SubclassInput = {
  class?: InputMaybe<Scalars['ID']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  image?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
  subclass_flavor?: InputMaybe<Scalars['String']['input']>;
};

export type SubclassRelationResponseCollection = {
  __typename?: 'SubclassRelationResponseCollection';
  nodes: Array<Subclass>;
};

export type TimeFrame = {
  __typename?: 'TimeFrame';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  documentId: Scalars['ID']['output'];
  events: Array<Maybe<GameEvent>>;
  events_connection?: Maybe<GameEventRelationResponseCollection>;
  gameState: Scalars['JSON']['output'];
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  room?: Maybe<Room>;
  timestamp: Scalars['DateTime']['output'];
  turnNumber: Scalars['Int']['output'];
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};


export type TimeFrameEventsArgs = {
  filters?: InputMaybe<GameEventFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type TimeFrameEvents_ConnectionArgs = {
  filters?: InputMaybe<GameEventFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type TimeFrameEntityResponseCollection = {
  __typename?: 'TimeFrameEntityResponseCollection';
  nodes: Array<TimeFrame>;
  pageInfo: Pagination;
};

export type TimeFrameFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<TimeFrameFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  documentId?: InputMaybe<IdFilterInput>;
  events?: InputMaybe<GameEventFiltersInput>;
  gameState?: InputMaybe<JsonFilterInput>;
  not?: InputMaybe<TimeFrameFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<TimeFrameFiltersInput>>>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  room?: InputMaybe<RoomFiltersInput>;
  timestamp?: InputMaybe<DateTimeFilterInput>;
  turnNumber?: InputMaybe<IntFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type TimeFrameInput = {
  events?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  gameState?: InputMaybe<Scalars['JSON']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  room?: InputMaybe<Scalars['ID']['input']>;
  timestamp?: InputMaybe<Scalars['DateTime']['input']>;
  turnNumber?: InputMaybe<Scalars['Int']['input']>;
};

export type TimeFrameRelationResponseCollection = {
  __typename?: 'TimeFrameRelationResponseCollection';
  nodes: Array<TimeFrame>;
};

export type Trait = {
  __typename?: 'Trait';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  documentId: Scalars['ID']['output'];
  image?: Maybe<UploadFile>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations: Array<Maybe<Trait>>;
  localizations_connection?: Maybe<TraitRelationResponseCollection>;
  name: Scalars['String']['output'];
  proficiencies: Array<Maybe<Proficiency>>;
  proficiencies_connection?: Maybe<ProficiencyRelationResponseCollection>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  races: Array<Maybe<Race>>;
  races_connection?: Maybe<RaceRelationResponseCollection>;
  slug: Scalars['String']['output'];
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};


export type TraitLocalizationsArgs = {
  filters?: InputMaybe<TraitFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type TraitLocalizations_ConnectionArgs = {
  filters?: InputMaybe<TraitFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type TraitProficienciesArgs = {
  filters?: InputMaybe<ProficiencyFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type TraitProficiencies_ConnectionArgs = {
  filters?: InputMaybe<ProficiencyFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type TraitRacesArgs = {
  filters?: InputMaybe<RaceFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type TraitRaces_ConnectionArgs = {
  filters?: InputMaybe<RaceFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type TraitEntityResponseCollection = {
  __typename?: 'TraitEntityResponseCollection';
  nodes: Array<Trait>;
  pageInfo: Pagination;
};

export type TraitFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<TraitFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  description?: InputMaybe<StringFilterInput>;
  documentId?: InputMaybe<IdFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<TraitFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<TraitFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<TraitFiltersInput>>>;
  proficiencies?: InputMaybe<ProficiencyFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  races?: InputMaybe<RaceFiltersInput>;
  slug?: InputMaybe<StringFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type TraitInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  image?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  proficiencies?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  races?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  slug?: InputMaybe<Scalars['String']['input']>;
};

export type TraitRelationResponseCollection = {
  __typename?: 'TraitRelationResponseCollection';
  nodes: Array<Trait>;
};

export type Turn = {
  __typename?: 'Turn';
  actions?: Maybe<Scalars['JSON']['output']>;
  characterSnapshots?: Maybe<Scalars['JSON']['output']>;
  contextImage?: Maybe<UploadFile>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  documentId: Scalars['ID']['output'];
  messages: Array<Maybe<Message>>;
  messages_connection?: Maybe<MessageRelationResponseCollection>;
  metadata?: Maybe<Scalars['JSON']['output']>;
  narrative?: Maybe<Scalars['String']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  room?: Maybe<Room>;
  status?: Maybe<Enum_Turn_Status>;
  turnNumber: Scalars['Int']['output'];
  type?: Maybe<Enum_Turn_Type>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};


export type TurnMessagesArgs = {
  filters?: InputMaybe<MessageFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type TurnMessages_ConnectionArgs = {
  filters?: InputMaybe<MessageFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type TurnEntityResponseCollection = {
  __typename?: 'TurnEntityResponseCollection';
  nodes: Array<Turn>;
  pageInfo: Pagination;
};

export type TurnFiltersInput = {
  actions?: InputMaybe<JsonFilterInput>;
  and?: InputMaybe<Array<InputMaybe<TurnFiltersInput>>>;
  characterSnapshots?: InputMaybe<JsonFilterInput>;
  contextImage?: InputMaybe<UploadFileFiltersInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  documentId?: InputMaybe<IdFilterInput>;
  messages?: InputMaybe<MessageFiltersInput>;
  metadata?: InputMaybe<JsonFilterInput>;
  narrative?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<TurnFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<TurnFiltersInput>>>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  room?: InputMaybe<RoomFiltersInput>;
  status?: InputMaybe<StringFilterInput>;
  turnNumber?: InputMaybe<IntFilterInput>;
  type?: InputMaybe<StringFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type TurnInput = {
  actions?: InputMaybe<Scalars['JSON']['input']>;
  characterSnapshots?: InputMaybe<Scalars['JSON']['input']>;
  contextImage?: InputMaybe<Scalars['ID']['input']>;
  messages?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  metadata?: InputMaybe<Scalars['JSON']['input']>;
  narrative?: InputMaybe<Scalars['String']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  room?: InputMaybe<Scalars['ID']['input']>;
  status?: InputMaybe<Enum_Turn_Status>;
  turnNumber?: InputMaybe<Scalars['Int']['input']>;
  type?: InputMaybe<Enum_Turn_Type>;
};

export type TurnRelationResponseCollection = {
  __typename?: 'TurnRelationResponseCollection';
  nodes: Array<Turn>;
};

export type UploadFile = {
  __typename?: 'UploadFile';
  alternativeText?: Maybe<Scalars['String']['output']>;
  caption?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  documentId: Scalars['ID']['output'];
  ext?: Maybe<Scalars['String']['output']>;
  formats?: Maybe<Scalars['JSON']['output']>;
  hash: Scalars['String']['output'];
  height?: Maybe<Scalars['Int']['output']>;
  mime: Scalars['String']['output'];
  name: Scalars['String']['output'];
  previewUrl?: Maybe<Scalars['String']['output']>;
  provider: Scalars['String']['output'];
  provider_metadata?: Maybe<Scalars['JSON']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  related?: Maybe<Array<Maybe<GenericMorph>>>;
  size: Scalars['Float']['output'];
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  url: Scalars['String']['output'];
  width?: Maybe<Scalars['Int']['output']>;
};

export type UploadFileEntityResponseCollection = {
  __typename?: 'UploadFileEntityResponseCollection';
  nodes: Array<UploadFile>;
  pageInfo: Pagination;
};

export type UploadFileFiltersInput = {
  alternativeText?: InputMaybe<StringFilterInput>;
  and?: InputMaybe<Array<InputMaybe<UploadFileFiltersInput>>>;
  caption?: InputMaybe<StringFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  documentId?: InputMaybe<IdFilterInput>;
  ext?: InputMaybe<StringFilterInput>;
  formats?: InputMaybe<JsonFilterInput>;
  hash?: InputMaybe<StringFilterInput>;
  height?: InputMaybe<IntFilterInput>;
  mime?: InputMaybe<StringFilterInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<UploadFileFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<UploadFileFiltersInput>>>;
  previewUrl?: InputMaybe<StringFilterInput>;
  provider?: InputMaybe<StringFilterInput>;
  provider_metadata?: InputMaybe<JsonFilterInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  size?: InputMaybe<FloatFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  url?: InputMaybe<StringFilterInput>;
  width?: InputMaybe<IntFilterInput>;
};

export type UsersPermissionsCreateRolePayload = {
  __typename?: 'UsersPermissionsCreateRolePayload';
  ok: Scalars['Boolean']['output'];
};

export type UsersPermissionsDeleteRolePayload = {
  __typename?: 'UsersPermissionsDeleteRolePayload';
  ok: Scalars['Boolean']['output'];
};

export type UsersPermissionsLoginInput = {
  identifier: Scalars['String']['input'];
  password: Scalars['String']['input'];
  provider?: Scalars['String']['input'];
};

export type UsersPermissionsLoginPayload = {
  __typename?: 'UsersPermissionsLoginPayload';
  jwt?: Maybe<Scalars['String']['output']>;
  user: UsersPermissionsMe;
};

export type UsersPermissionsMe = {
  __typename?: 'UsersPermissionsMe';
  blocked?: Maybe<Scalars['Boolean']['output']>;
  confirmed?: Maybe<Scalars['Boolean']['output']>;
  documentId: Scalars['ID']['output'];
  email?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  role?: Maybe<UsersPermissionsMeRole>;
  username: Scalars['String']['output'];
};

export type UsersPermissionsMeRole = {
  __typename?: 'UsersPermissionsMeRole';
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

export type UsersPermissionsPasswordPayload = {
  __typename?: 'UsersPermissionsPasswordPayload';
  ok: Scalars['Boolean']['output'];
};

export type UsersPermissionsPermission = {
  __typename?: 'UsersPermissionsPermission';
  action: Scalars['String']['output'];
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  documentId: Scalars['ID']['output'];
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  role?: Maybe<UsersPermissionsRole>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type UsersPermissionsPermissionFiltersInput = {
  action?: InputMaybe<StringFilterInput>;
  and?: InputMaybe<Array<InputMaybe<UsersPermissionsPermissionFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  documentId?: InputMaybe<IdFilterInput>;
  not?: InputMaybe<UsersPermissionsPermissionFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<UsersPermissionsPermissionFiltersInput>>>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  role?: InputMaybe<UsersPermissionsRoleFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type UsersPermissionsPermissionRelationResponseCollection = {
  __typename?: 'UsersPermissionsPermissionRelationResponseCollection';
  nodes: Array<UsersPermissionsPermission>;
};

export type UsersPermissionsRegisterInput = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
  username: Scalars['String']['input'];
};

export type UsersPermissionsRole = {
  __typename?: 'UsersPermissionsRole';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  documentId: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  permissions: Array<Maybe<UsersPermissionsPermission>>;
  permissions_connection?: Maybe<UsersPermissionsPermissionRelationResponseCollection>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  type?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users: Array<Maybe<UsersPermissionsUser>>;
  users_connection?: Maybe<UsersPermissionsUserRelationResponseCollection>;
};


export type UsersPermissionsRolePermissionsArgs = {
  filters?: InputMaybe<UsersPermissionsPermissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsRolePermissions_ConnectionArgs = {
  filters?: InputMaybe<UsersPermissionsPermissionFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsRoleUsersArgs = {
  filters?: InputMaybe<UsersPermissionsUserFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsRoleUsers_ConnectionArgs = {
  filters?: InputMaybe<UsersPermissionsUserFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type UsersPermissionsRoleEntityResponseCollection = {
  __typename?: 'UsersPermissionsRoleEntityResponseCollection';
  nodes: Array<UsersPermissionsRole>;
  pageInfo: Pagination;
};

export type UsersPermissionsRoleFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<UsersPermissionsRoleFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  description?: InputMaybe<StringFilterInput>;
  documentId?: InputMaybe<IdFilterInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<UsersPermissionsRoleFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<UsersPermissionsRoleFiltersInput>>>;
  permissions?: InputMaybe<UsersPermissionsPermissionFiltersInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  type?: InputMaybe<StringFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  users?: InputMaybe<UsersPermissionsUserFiltersInput>;
};

export type UsersPermissionsRoleInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  permissions?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
  users?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
};

export type UsersPermissionsUpdateRolePayload = {
  __typename?: 'UsersPermissionsUpdateRolePayload';
  ok: Scalars['Boolean']['output'];
};

export type UsersPermissionsUser = {
  __typename?: 'UsersPermissionsUser';
  blocked?: Maybe<Scalars['Boolean']['output']>;
  characters: Array<Maybe<Character>>;
  characters_connection?: Maybe<CharacterRelationResponseCollection>;
  confirmed?: Maybe<Scalars['Boolean']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  documentId: Scalars['ID']['output'];
  email: Scalars['String']['output'];
  provider?: Maybe<Scalars['String']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  role?: Maybe<UsersPermissionsRole>;
  rooms: Array<Maybe<Room>>;
  rooms_connection?: Maybe<RoomRelationResponseCollection>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  username: Scalars['String']['output'];
};


export type UsersPermissionsUserCharactersArgs = {
  filters?: InputMaybe<CharacterFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserCharacters_ConnectionArgs = {
  filters?: InputMaybe<CharacterFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserRoomsArgs = {
  filters?: InputMaybe<RoomFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type UsersPermissionsUserRooms_ConnectionArgs = {
  filters?: InputMaybe<RoomFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type UsersPermissionsUserEntityResponse = {
  __typename?: 'UsersPermissionsUserEntityResponse';
  data?: Maybe<UsersPermissionsUser>;
};

export type UsersPermissionsUserEntityResponseCollection = {
  __typename?: 'UsersPermissionsUserEntityResponseCollection';
  nodes: Array<UsersPermissionsUser>;
  pageInfo: Pagination;
};

export type UsersPermissionsUserFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<UsersPermissionsUserFiltersInput>>>;
  blocked?: InputMaybe<BooleanFilterInput>;
  characters?: InputMaybe<CharacterFiltersInput>;
  confirmed?: InputMaybe<BooleanFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  documentId?: InputMaybe<IdFilterInput>;
  email?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<UsersPermissionsUserFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<UsersPermissionsUserFiltersInput>>>;
  provider?: InputMaybe<StringFilterInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  role?: InputMaybe<UsersPermissionsRoleFiltersInput>;
  rooms?: InputMaybe<RoomFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  username?: InputMaybe<StringFilterInput>;
};

export type UsersPermissionsUserInput = {
  blocked?: InputMaybe<Scalars['Boolean']['input']>;
  characters?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  confirmed?: InputMaybe<Scalars['Boolean']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  password?: InputMaybe<Scalars['String']['input']>;
  provider?: InputMaybe<Scalars['String']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  role?: InputMaybe<Scalars['ID']['input']>;
  rooms?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  username?: InputMaybe<Scalars['String']['input']>;
};

export type UsersPermissionsUserRelationResponseCollection = {
  __typename?: 'UsersPermissionsUserRelationResponseCollection';
  nodes: Array<UsersPermissionsUser>;
};

export type WeaponProperty = {
  __typename?: 'WeaponProperty';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  documentId: Scalars['ID']['output'];
  image?: Maybe<UploadFile>;
  locale?: Maybe<Scalars['String']['output']>;
  localizations: Array<Maybe<WeaponProperty>>;
  localizations_connection?: Maybe<WeaponPropertyRelationResponseCollection>;
  name: Scalars['String']['output'];
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  slug: Scalars['String']['output'];
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};


export type WeaponPropertyLocalizationsArgs = {
  filters?: InputMaybe<WeaponPropertyFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type WeaponPropertyLocalizations_ConnectionArgs = {
  filters?: InputMaybe<WeaponPropertyFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type WeaponPropertyEntityResponseCollection = {
  __typename?: 'WeaponPropertyEntityResponseCollection';
  nodes: Array<WeaponProperty>;
  pageInfo: Pagination;
};

export type WeaponPropertyFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<WeaponPropertyFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  description?: InputMaybe<StringFilterInput>;
  documentId?: InputMaybe<IdFilterInput>;
  locale?: InputMaybe<StringFilterInput>;
  localizations?: InputMaybe<WeaponPropertyFiltersInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<WeaponPropertyFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<WeaponPropertyFiltersInput>>>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  slug?: InputMaybe<StringFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type WeaponPropertyInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  image?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
};

export type WeaponPropertyRelationResponseCollection = {
  __typename?: 'WeaponPropertyRelationResponseCollection';
  nodes: Array<WeaponProperty>;
};

export type World = {
  __typename?: 'World';
  adventureLength?: Maybe<Enum_World_Adventurelength>;
  chunkSize?: Maybe<Scalars['Int']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  detail?: Maybe<Scalars['Int']['output']>;
  documentId: Scalars['ID']['output'];
  elevationScale?: Maybe<Scalars['Float']['output']>;
  fogRadius?: Maybe<Scalars['Int']['output']>;
  globalScale?: Maybe<Scalars['Float']['output']>;
  history?: Maybe<Scalars['String']['output']>;
  language?: Maybe<Scalars['String']['output']>;
  moistureScale?: Maybe<Scalars['Float']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  roadDensity?: Maybe<Scalars['Float']['output']>;
  room?: Maybe<Room>;
  roughness?: Maybe<Scalars['Float']['output']>;
  seaLevel?: Maybe<Scalars['Float']['output']>;
  seed?: Maybe<Scalars['String']['output']>;
  structureChance?: Maybe<Scalars['Float']['output']>;
  structureSizeAvg?: Maybe<Scalars['Int']['output']>;
  structureSpacing?: Maybe<Scalars['Int']['output']>;
  temperatureOffset?: Maybe<Scalars['Float']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  worldBackground?: Maybe<Scalars['String']['output']>;
  worldSize?: Maybe<Enum_World_Worldsize>;
  worldType?: Maybe<Scalars['String']['output']>;
};

export type WorldConfigInput = {
  chunkSize?: InputMaybe<Scalars['Int']['input']>;
  detail?: InputMaybe<Scalars['Float']['input']>;
  elevationScale?: InputMaybe<Scalars['Float']['input']>;
  fogRadius?: InputMaybe<Scalars['Int']['input']>;
  globalScale?: InputMaybe<Scalars['Float']['input']>;
  moistureScale?: InputMaybe<Scalars['Float']['input']>;
  roadDensity?: InputMaybe<Scalars['Float']['input']>;
  roughness?: InputMaybe<Scalars['Float']['input']>;
  seaLevel?: InputMaybe<Scalars['Float']['input']>;
  seed?: InputMaybe<Scalars['String']['input']>;
  structureChance?: InputMaybe<Scalars['Float']['input']>;
  structureSizeAvg?: InputMaybe<Scalars['Int']['input']>;
  structureSpacing?: InputMaybe<Scalars['Int']['input']>;
  temperatureOffset?: InputMaybe<Scalars['Float']['input']>;
};

export type WorldEntityResponseCollection = {
  __typename?: 'WorldEntityResponseCollection';
  nodes: Array<World>;
  pageInfo: Pagination;
};

export type WorldFiltersInput = {
  adventureLength?: InputMaybe<StringFilterInput>;
  and?: InputMaybe<Array<InputMaybe<WorldFiltersInput>>>;
  chunkSize?: InputMaybe<IntFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  description?: InputMaybe<StringFilterInput>;
  detail?: InputMaybe<IntFilterInput>;
  documentId?: InputMaybe<IdFilterInput>;
  elevationScale?: InputMaybe<FloatFilterInput>;
  fogRadius?: InputMaybe<IntFilterInput>;
  globalScale?: InputMaybe<FloatFilterInput>;
  history?: InputMaybe<StringFilterInput>;
  language?: InputMaybe<StringFilterInput>;
  moistureScale?: InputMaybe<FloatFilterInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<WorldFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<WorldFiltersInput>>>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  roadDensity?: InputMaybe<FloatFilterInput>;
  room?: InputMaybe<RoomFiltersInput>;
  roughness?: InputMaybe<FloatFilterInput>;
  seaLevel?: InputMaybe<FloatFilterInput>;
  seed?: InputMaybe<StringFilterInput>;
  structureChance?: InputMaybe<FloatFilterInput>;
  structureSizeAvg?: InputMaybe<IntFilterInput>;
  structureSpacing?: InputMaybe<IntFilterInput>;
  temperatureOffset?: InputMaybe<FloatFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  worldBackground?: InputMaybe<StringFilterInput>;
  worldSize?: InputMaybe<StringFilterInput>;
  worldType?: InputMaybe<StringFilterInput>;
};

export type WorldInput = {
  adventureLength?: InputMaybe<Enum_World_Adventurelength>;
  chunkSize?: InputMaybe<Scalars['Int']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  detail?: InputMaybe<Scalars['Int']['input']>;
  elevationScale?: InputMaybe<Scalars['Float']['input']>;
  fogRadius?: InputMaybe<Scalars['Int']['input']>;
  globalScale?: InputMaybe<Scalars['Float']['input']>;
  history?: InputMaybe<Scalars['String']['input']>;
  language?: InputMaybe<Scalars['String']['input']>;
  moistureScale?: InputMaybe<Scalars['Float']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  roadDensity?: InputMaybe<Scalars['Float']['input']>;
  room?: InputMaybe<Scalars['ID']['input']>;
  roughness?: InputMaybe<Scalars['Float']['input']>;
  seaLevel?: InputMaybe<Scalars['Float']['input']>;
  seed?: InputMaybe<Scalars['String']['input']>;
  structureChance?: InputMaybe<Scalars['Float']['input']>;
  structureSizeAvg?: InputMaybe<Scalars['Int']['input']>;
  structureSpacing?: InputMaybe<Scalars['Int']['input']>;
  temperatureOffset?: InputMaybe<Scalars['Float']['input']>;
  worldBackground?: InputMaybe<Scalars['String']['input']>;
  worldSize?: InputMaybe<Enum_World_Worldsize>;
  worldType?: InputMaybe<Scalars['String']['input']>;
};

export type GetAbilitiesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAbilitiesQuery = { __typename?: 'Query', abilities?: Array<{ __typename?: 'Ability', documentId: string, name: string, fullName: string, description?: string | null, skills?: Array<{ __typename?: 'Skill', name: string } | null> | null } | null> | null };

export type GetSkillsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetSkillsQuery = { __typename?: 'Query', skills?: Array<{ __typename?: 'Skill', documentId: string, name: string, description?: string | null, abilityScore?: { __typename?: 'Ability', name: string } | null } | null> | null };

export type GetRacesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetRacesQuery = { __typename?: 'Query', races: Array<{ __typename?: 'Race', documentId: string, name: string, description?: string | null, speed?: any | null, size?: Enum_Race_Size | null } | null> };

export type GetClassesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetClassesQuery = { __typename?: 'Query', classes: Array<{ __typename?: 'Class', documentId: string, name: string, description?: string | null, hit_die?: string | null } | null> };

export type GetAlignmentsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAlignmentsQuery = { __typename?: 'Query', alignments?: Array<{ __typename?: 'Alignment', documentId: string, name: string, abbreviation?: string | null, description?: string | null } | null> | null };

export type GetBackgroundsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetBackgroundsQuery = { __typename?: 'Query', backgrounds?: Array<{ __typename?: 'Background', documentId: string, name: string, description?: string | null, skillProficiencies?: Array<{ __typename?: 'Skill', name: string } | null> | null } | null> | null };

export type GetLanguagesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetLanguagesQuery = { __typename?: 'Query', languages: Array<{ __typename?: 'Language', documentId: string, name: string, note?: string | null } | null> };

export type GetMagicSchoolsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMagicSchoolsQuery = { __typename?: 'Query', magicSchools: Array<{ __typename?: 'MagicSchool', documentId: string, name: string, description?: string | null } | null> };

export type GetConditionsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetConditionsQuery = { __typename?: 'Query', conditions?: Array<{ __typename?: 'GameCondition', documentId: string, name: string, description?: string | null } | null> | null };

export type GetDamageTypesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetDamageTypesQuery = { __typename?: 'Query', damageTypes: Array<{ __typename?: 'DamageType', documentId: string, name: string, description?: string | null } | null> };

export type GetEquipmentQueryVariables = Exact<{ [key: string]: never; }>;


export type GetEquipmentQuery = { __typename?: 'Query', equipments: Array<{ __typename?: 'Equipment', documentId: string, name: string, cost_quantity?: number | null, cost_unit?: string | null, weight?: number | null, description?: string | null, damage_dice?: string | null, range_normal?: number | null, range_long?: number | null, armor_class_base?: number | null, armor_class_dex_bonus?: boolean | null, damage_type?: { __typename?: 'DamageType', name: string } | null, equipment_category?: { __typename?: 'EquipmentCategory', name: string } | null, properties: Array<{ __typename?: 'WeaponProperty', name: string } | null> } | null> };

export type GetMonstersQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMonstersQuery = { __typename?: 'Query', monsters: Array<{ __typename?: 'Monster', documentId: string, name: string, size?: Enum_Monster_Size | null, type?: string | null, alignment?: string | null, hp?: number | null, ac?: number | null, speed?: any | null, challenge_rating?: number | null } | null> };

export type GetSpellsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetSpellsQuery = { __typename?: 'Query', spells: Array<{ __typename?: 'Spell', documentId: string, name: string, level?: number | null, school?: string | null, casting_time?: string | null, range?: string | null, components?: any | null, duration?: string | null, is_ritual?: boolean | null, description?: string | null } | null> };

export type GetFeaturesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetFeaturesQuery = { __typename?: 'Query', features: Array<{ __typename?: 'Feature', documentId: string, name: string, level?: number | null, description?: string | null } | null> };

export type GetTraitsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetTraitsQuery = { __typename?: 'Query', traits: Array<{ __typename?: 'Trait', documentId: string, name: string, description?: string | null, races: Array<{ __typename?: 'Race', name: string } | null> } | null> };

export type GetSubclassesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetSubclassesQuery = { __typename?: 'Query', subclasses: Array<{ __typename?: 'Subclass', documentId: string, name: string, description?: string | null, class?: { __typename?: 'Class', name: string } | null } | null> };

export type GetProficienciesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetProficienciesQuery = { __typename?: 'Query', proficiencies: Array<{ __typename?: 'Proficiency', documentId: string, name: string, type?: Enum_Proficiency_Type | null, classes: Array<{ __typename?: 'Class', name: string } | null>, races: Array<{ __typename?: 'Race', name: string } | null> } | null> };

export type CreateRoomMutationVariables = Exact<{
  data: Scalars['JSON']['input'];
}>;


export type CreateRoomMutation = { __typename?: 'Mutation', createRoom?: { __typename?: 'Room', documentId: string, roomId?: string | null, code?: string | null, world?: { __typename?: 'World', name?: string | null, description?: string | null, seed?: string | null, language?: string | null, chunkSize?: number | null, detail?: number | null, fogRadius?: number | null, globalScale?: number | null, seaLevel?: number | null, elevationScale?: number | null, roughness?: number | null, moistureScale?: number | null, temperatureOffset?: number | null, roadDensity?: number | null, structureChance?: number | null, structureSpacing?: number | null, structureSizeAvg?: number | null, worldSize?: Enum_World_Worldsize | null, worldType?: string | null, worldBackground?: string | null } | null, dmSettings?: { __typename?: 'DmSetting', adventureLength?: Enum_Dmsetting_Adventurelength | null, difficulty?: Enum_Dmsetting_Difficulty | null, theme?: string | null, setting?: string | null, tone?: string | null, playerCount?: number | null, startingLevel?: number | null, attributePointBudget?: number | null, dmSystemPrompt?: string | null, dmStyle?: { __typename?: 'ComponentGameDmStyle', verbosity?: number | null, detail?: number | null, engagement?: number | null, narrative?: number | null, specialMode?: string | null, customDirectives?: string | null } | null } | null } | null };

export type JoinRoomMutationVariables = Exact<{
  code: Scalars['String']['input'];
}>;


export type JoinRoomMutation = { __typename?: 'Mutation', joinRoom?: { __typename?: 'Room', documentId: string, roomId?: string | null, code?: string | null, phase?: Enum_Room_Phase | null, players?: Array<{ __typename?: 'ComponentGamePlayer', id: string, name?: string | null, isReady?: boolean | null, isOnline?: boolean | null, joinedAt?: any | null, action?: string | null, user?: { __typename?: 'UsersPermissionsUser', documentId: string, username: string } | null, character?: { __typename?: 'Character', documentId: string, name: string, portrait?: { __typename?: 'UploadFile', url: string } | null, upperBody?: { __typename?: 'UploadFile', url: string } | null, fullBody?: { __typename?: 'UploadFile', url: string } | null, baseStats?: { __typename?: 'ComponentGameStats', strength?: number | null, dexterity?: number | null, constitution?: number | null, intelligence?: number | null, wisdom?: number | null, charisma?: number | null } | null } | null } | null> | null, world?: { __typename?: 'World', name?: string | null, description?: string | null, seed?: string | null, language?: string | null, chunkSize?: number | null, detail?: number | null, fogRadius?: number | null, globalScale?: number | null, seaLevel?: number | null, elevationScale?: number | null, roughness?: number | null, moistureScale?: number | null, temperatureOffset?: number | null, roadDensity?: number | null, structureChance?: number | null, structureSpacing?: number | null, structureSizeAvg?: number | null, worldSize?: Enum_World_Worldsize | null, worldType?: string | null, worldBackground?: string | null } | null, dmSettings?: { __typename?: 'DmSetting', adventureLength?: Enum_Dmsetting_Adventurelength | null, difficulty?: Enum_Dmsetting_Difficulty | null, theme?: string | null, setting?: string | null, tone?: string | null, playerCount?: number | null, startingLevel?: number | null, attributePointBudget?: number | null, dmSystemPrompt?: string | null, dmStyle?: { __typename?: 'ComponentGameDmStyle', verbosity?: number | null, detail?: number | null, engagement?: number | null, narrative?: number | null, specialMode?: string | null, customDirectives?: string | null } | null } | null } | null };

export type UpdateRoomMutationVariables = Exact<{
  documentId: Scalars['ID']['input'];
  data: RoomInput;
}>;


export type UpdateRoomMutation = { __typename?: 'Mutation', updateRoom?: { __typename?: 'Room', documentId: string } | null };

export type GenerateWorldMutationVariables = Exact<{
  roomId: Scalars['ID']['input'];
  language?: InputMaybe<Scalars['String']['input']>;
}>;


export type GenerateWorldMutation = { __typename?: 'Mutation', generateWorld?: any | null };

export type AddCharacterMutationVariables = Exact<{
  roomId: Scalars['ID']['input'];
  character: Scalars['JSON']['input'];
}>;


export type AddCharacterMutation = { __typename?: 'Mutation', addCharacter?: any | null };

export type StartGameMutationVariables = Exact<{
  roomId: Scalars['ID']['input'];
  language?: InputMaybe<Scalars['String']['input']>;
  streamId?: InputMaybe<Scalars['String']['input']>;
}>;


export type StartGameMutation = { __typename?: 'Mutation', startGame?: any | null };

export type SubmitActionMutationVariables = Exact<{
  roomId: Scalars['ID']['input'];
  action: Scalars['String']['input'];
  mode?: InputMaybe<Scalars['String']['input']>;
}>;


export type SubmitActionMutation = { __typename?: 'Mutation', submitAction?: any | null };

export type GenerateAvatarPortraitMutationVariables = Exact<{
  payload: Scalars['JSON']['input'];
  referenceImage?: InputMaybe<Scalars['String']['input']>;
}>;


export type GenerateAvatarPortraitMutation = { __typename?: 'Mutation', generateAvatarPortrait?: any | null };

export type GenerateAvatarUpperBodyMutationVariables = Exact<{
  payload: Scalars['JSON']['input'];
  portrait: Scalars['JSON']['input'];
  referenceImage?: InputMaybe<Scalars['String']['input']>;
}>;


export type GenerateAvatarUpperBodyMutation = { __typename?: 'Mutation', generateAvatarUpperBody?: any | null };

export type GenerateAvatarFullBodyMutationVariables = Exact<{
  payload: Scalars['JSON']['input'];
  portrait: Scalars['JSON']['input'];
  upperBody: Scalars['JSON']['input'];
  referenceImage?: InputMaybe<Scalars['String']['input']>;
}>;


export type GenerateAvatarFullBodyMutation = { __typename?: 'Mutation', generateAvatarFullBody?: any | null };

export type SpawnCreatureMutationVariables = Exact<{
  roomId: Scalars['ID']['input'];
  creature: Scalars['JSON']['input'];
}>;


export type SpawnCreatureMutation = { __typename?: 'Mutation', spawnCreature?: any | null };

export type GenerateTerrainChunkMutationVariables = Exact<{
  roomId: Scalars['ID']['input'];
  chunkX: Scalars['Int']['input'];
  chunkY: Scalars['Int']['input'];
  chunkSize?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GenerateTerrainChunkMutation = { __typename?: 'Mutation', generateTerrainChunk?: any | null };

export type CreateCharacterSheetMutationVariables = Exact<{
  data: CharacterSheetInput;
}>;


export type CreateCharacterSheetMutation = { __typename?: 'Mutation', createCharacterSheet?: { __typename?: 'CharacterSheet', documentId: string, name?: string | null } | null };

export type GetRoomQueryVariables = Exact<{
  filters?: InputMaybe<RoomFiltersInput>;
}>;


export type GetRoomQuery = { __typename?: 'Query', rooms: Array<{ __typename?: 'Room', documentId: string, roomId?: string | null, code?: string | null, phase?: Enum_Room_Phase | null, character_sheets: Array<{ __typename?: 'CharacterSheet', documentId: string, name?: string | null, type?: Enum_Charactersheet_Type | null, currentHp?: number | null, maxHp?: number | null, speed?: any | null, position?: { __typename?: 'ComponentGamePosition', x?: number | null, y?: number | null, z?: number | null } | null } | null>, players?: Array<{ __typename?: 'ComponentGamePlayer', id: string, name?: string | null, isReady?: boolean | null, isOnline?: boolean | null, joinedAt?: any | null, action?: string | null, user?: { __typename?: 'UsersPermissionsUser', documentId: string, username: string } | null, character?: { __typename?: 'Character', documentId: string, name: string, backstory?: string | null, portrait?: { __typename?: 'UploadFile', url: string } | null, upperBody?: { __typename?: 'UploadFile', url: string } | null, fullBody?: { __typename?: 'UploadFile', url: string } | null, baseStats?: { __typename?: 'ComponentGameStats', strength?: number | null, dexterity?: number | null, constitution?: number | null, intelligence?: number | null, wisdom?: number | null, charisma?: number | null } | null } | null } | null> | null, world?: { __typename?: 'World', documentId: string, name?: string | null, description?: string | null, history?: string | null, worldBackground?: string | null, seed?: string | null, language?: string | null, chunkSize?: number | null, detail?: number | null, fogRadius?: number | null, globalScale?: number | null, seaLevel?: number | null, elevationScale?: number | null, roughness?: number | null, moistureScale?: number | null, temperatureOffset?: number | null, roadDensity?: number | null, structureChance?: number | null, structureSpacing?: number | null, structureSizeAvg?: number | null, worldSize?: Enum_World_Worldsize | null, worldType?: string | null } | null, dmSettings?: { __typename?: 'DmSetting', documentId: string, adventureLength?: Enum_Dmsetting_Adventurelength | null, difficulty?: Enum_Dmsetting_Difficulty | null, theme?: string | null, setting?: string | null, tone?: string | null, playerCount?: number | null, startingLevel?: number | null, attributePointBudget?: number | null, dmSystemPrompt?: string | null, dmStyle?: { __typename?: 'ComponentGameDmStyle', verbosity?: number | null, detail?: number | null, engagement?: number | null, narrative?: number | null, specialMode?: string | null, customDirectives?: string | null } | null } | null, messages: Array<{ __typename?: 'Message', documentId: string, content: string, senderName?: string | null, senderType?: Enum_Message_Sendertype | null, timestamp?: any | null, turn?: { __typename?: 'Turn', documentId: string, turnNumber: number } | null } | null>, turns: Array<{ __typename?: 'Turn', documentId: string, turnNumber: number, narrative?: string | null, status?: Enum_Turn_Status | null, type?: Enum_Turn_Type | null, characterSnapshots?: any | null, actions?: any | null, createdAt?: any | null } | null>, timeFrames: Array<{ __typename?: 'TimeFrame', documentId: string, turnNumber: number, timestamp: any, gameState: any } | null>, owner?: { __typename?: 'UsersPermissionsUser', documentId: string, username: string } | null } | null> };

export type ListRoomsQueryVariables = Exact<{
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>> | InputMaybe<Scalars['String']['input']>>;
}>;


export type ListRoomsQuery = { __typename?: 'Query', rooms: Array<{ __typename?: 'Room', documentId: string, roomId?: string | null, code?: string | null, createdAt?: any | null, phase?: Enum_Room_Phase | null, dmSettings?: { __typename?: 'DmSetting', theme?: string | null, setting?: string | null, difficulty?: Enum_Dmsetting_Difficulty | null } | null, character_sheets: Array<{ __typename?: 'CharacterSheet', documentId: string } | null>, players?: Array<{ __typename?: 'ComponentGamePlayer', id: string, user?: { __typename?: 'UsersPermissionsUser', documentId: string } | null, character?: { __typename?: 'Character', documentId: string, name: string, race?: { __typename?: 'Race', name: string } | null, class?: { __typename?: 'Class', name: string } | null } | null } | null> | null } | null> };

export type ListCharactersQueryVariables = Exact<{ [key: string]: never; }>;


export type ListCharactersQuery = { __typename?: 'Query', characters: Array<{ __typename?: 'Character', documentId: string, name: string, backstory?: string | null, race?: { __typename?: 'Race', name: string } | null, class?: { __typename?: 'Class', name: string } | null, portrait?: { __typename?: 'UploadFile', url: string } | null } | null> };

export type ListMonstersQueryVariables = Exact<{
  filters?: InputMaybe<MonsterFiltersInput>;
}>;


export type ListMonstersQuery = { __typename?: 'Query', monsters: Array<{ __typename?: 'Monster', documentId: string, name: string, type?: string | null, size?: Enum_Monster_Size | null, hp?: number | null, ac?: number | null, xp?: number | null, challenge_rating?: number | null } | null> };

export type ListSpellsQueryVariables = Exact<{
  filters?: InputMaybe<SpellFiltersInput>;
}>;


export type ListSpellsQuery = { __typename?: 'Query', spells: Array<{ __typename?: 'Spell', documentId: string, name: string, level?: number | null, school?: string | null } | null> };

export type SearchEntitiesQueryVariables = Exact<{
  query: Scalars['String']['input'];
}>;


export type SearchEntitiesQuery = { __typename?: 'Query', searchEntities: Array<{ __typename?: 'SearchResult', id: string, name: string, type: string } | null> };

export type VoxelPreviewQueryVariables = Exact<{
  chunks: Array<InputMaybe<ChunkRequestInput>> | InputMaybe<ChunkRequestInput>;
  config: WorldConfigInput;
}>;


export type VoxelPreviewQuery = { __typename?: 'Query', voxelPreview: Array<any | null> };

export type PaginationFragmentFragment = { __typename?: 'Pagination', total: number, page: number, pageSize: number, pageCount: number } & { ' $fragmentName'?: 'PaginationFragmentFragment' };

export type ExplorerGetClassesQueryVariables = Exact<{
  pagination?: InputMaybe<PaginationArg>;
  filters?: InputMaybe<ClassFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
}>;


export type ExplorerGetClassesQuery = { __typename?: 'Query', classes_connection?: { __typename?: 'ClassEntityResponseCollection', nodes: Array<{ __typename?: 'Class', documentId: string, slug: string, name: string, description?: string | null, image?: { __typename?: 'UploadFile', url: string, alternativeText?: string | null } | null }>, pageInfo: (
      { __typename?: 'Pagination' }
      & { ' $fragmentRefs'?: { 'PaginationFragmentFragment': PaginationFragmentFragment } }
    ) } | null };

export type ExplorerGetDamageTypesQueryVariables = Exact<{
  pagination?: InputMaybe<PaginationArg>;
  filters?: InputMaybe<DamageTypeFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
}>;


export type ExplorerGetDamageTypesQuery = { __typename?: 'Query', damageTypes_connection?: { __typename?: 'DamageTypeEntityResponseCollection', nodes: Array<{ __typename?: 'DamageType', documentId: string, slug: string, name: string, description?: string | null, image?: { __typename?: 'UploadFile', url: string, alternativeText?: string | null } | null }>, pageInfo: (
      { __typename?: 'Pagination' }
      & { ' $fragmentRefs'?: { 'PaginationFragmentFragment': PaginationFragmentFragment } }
    ) } | null };

export type ExplorerGetEquipmentQueryVariables = Exact<{
  pagination?: InputMaybe<PaginationArg>;
  filters?: InputMaybe<EquipmentFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
}>;


export type ExplorerGetEquipmentQuery = { __typename?: 'Query', equipments_connection?: { __typename?: 'EquipmentEntityResponseCollection', nodes: Array<{ __typename?: 'Equipment', documentId: string, slug: string, name: string, description?: string | null, cost_quantity?: number | null, cost_unit?: string | null, weight?: number | null, image?: { __typename?: 'UploadFile', url: string, alternativeText?: string | null } | null }>, pageInfo: (
      { __typename?: 'Pagination' }
      & { ' $fragmentRefs'?: { 'PaginationFragmentFragment': PaginationFragmentFragment } }
    ) } | null };

export type ExplorerGetEquipmentCategoriesQueryVariables = Exact<{
  pagination?: InputMaybe<PaginationArg>;
  filters?: InputMaybe<EquipmentCategoryFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
}>;


export type ExplorerGetEquipmentCategoriesQuery = { __typename?: 'Query', equipmentCategories_connection?: { __typename?: 'EquipmentCategoryEntityResponseCollection', nodes: Array<{ __typename?: 'EquipmentCategory', documentId: string, slug: string, name: string, description?: string | null, image?: { __typename?: 'UploadFile', url: string, alternativeText?: string | null } | null }>, pageInfo: (
      { __typename?: 'Pagination' }
      & { ' $fragmentRefs'?: { 'PaginationFragmentFragment': PaginationFragmentFragment } }
    ) } | null };

export type ExplorerGetFeaturesQueryVariables = Exact<{
  pagination?: InputMaybe<PaginationArg>;
  filters?: InputMaybe<FeatureFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
}>;


export type ExplorerGetFeaturesQuery = { __typename?: 'Query', features_connection?: { __typename?: 'FeatureEntityResponseCollection', nodes: Array<{ __typename?: 'Feature', documentId: string, name: string, description?: string | null, level?: number | null, image?: { __typename?: 'UploadFile', url: string, alternativeText?: string | null } | null }>, pageInfo: (
      { __typename?: 'Pagination' }
      & { ' $fragmentRefs'?: { 'PaginationFragmentFragment': PaginationFragmentFragment } }
    ) } | null };

export type ExplorerGetLanguagesQueryVariables = Exact<{
  pagination?: InputMaybe<PaginationArg>;
  filters?: InputMaybe<LanguageFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
}>;


export type ExplorerGetLanguagesQuery = { __typename?: 'Query', languages_connection?: { __typename?: 'LanguageEntityResponseCollection', nodes: Array<{ __typename?: 'Language', documentId: string, name: string, note?: string | null, image?: { __typename?: 'UploadFile', url: string, alternativeText?: string | null } | null }>, pageInfo: (
      { __typename?: 'Pagination' }
      & { ' $fragmentRefs'?: { 'PaginationFragmentFragment': PaginationFragmentFragment } }
    ) } | null };

export type ExplorerGetMagicItemsQueryVariables = Exact<{
  pagination?: InputMaybe<PaginationArg>;
  filters?: InputMaybe<MagicItemFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
}>;


export type ExplorerGetMagicItemsQuery = { __typename?: 'Query', magicItems_connection?: { __typename?: 'MagicItemEntityResponseCollection', nodes: Array<{ __typename?: 'MagicItem', documentId: string, slug: string, name: string, description?: string | null, rarity?: Enum_Magicitem_Rarity | null, attunement_required?: boolean | null, image?: { __typename?: 'UploadFile', url: string, alternativeText?: string | null } | null }>, pageInfo: (
      { __typename?: 'Pagination' }
      & { ' $fragmentRefs'?: { 'PaginationFragmentFragment': PaginationFragmentFragment } }
    ) } | null };

export type ExplorerGetMagicSchoolsQueryVariables = Exact<{
  pagination?: InputMaybe<PaginationArg>;
  filters?: InputMaybe<MagicSchoolFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
}>;


export type ExplorerGetMagicSchoolsQuery = { __typename?: 'Query', magicSchools_connection?: { __typename?: 'MagicSchoolEntityResponseCollection', nodes: Array<{ __typename?: 'MagicSchool', documentId: string, name: string, description?: string | null, image?: { __typename?: 'UploadFile', url: string, alternativeText?: string | null } | null }>, pageInfo: (
      { __typename?: 'Pagination' }
      & { ' $fragmentRefs'?: { 'PaginationFragmentFragment': PaginationFragmentFragment } }
    ) } | null };

export type ExplorerGetMonstersQueryVariables = Exact<{
  pagination?: InputMaybe<PaginationArg>;
  filters?: InputMaybe<MonsterFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
}>;


export type ExplorerGetMonstersQuery = { __typename?: 'Query', monsters_connection?: { __typename?: 'MonsterEntityResponseCollection', nodes: Array<{ __typename?: 'Monster', documentId: string, name: string, size?: Enum_Monster_Size | null, type?: string | null, alignment?: string | null, challenge_rating?: number | null, image?: { __typename?: 'UploadFile', url: string, alternativeText?: string | null } | null }>, pageInfo: (
      { __typename?: 'Pagination' }
      & { ' $fragmentRefs'?: { 'PaginationFragmentFragment': PaginationFragmentFragment } }
    ) } | null };

export type ExplorerGetProficienciesQueryVariables = Exact<{
  pagination?: InputMaybe<PaginationArg>;
  filters?: InputMaybe<ProficiencyFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
}>;


export type ExplorerGetProficienciesQuery = { __typename?: 'Query', proficiencies_connection?: { __typename?: 'ProficiencyEntityResponseCollection', nodes: Array<{ __typename?: 'Proficiency', documentId: string, name: string, type?: Enum_Proficiency_Type | null, image?: { __typename?: 'UploadFile', url: string, alternativeText?: string | null } | null }>, pageInfo: (
      { __typename?: 'Pagination' }
      & { ' $fragmentRefs'?: { 'PaginationFragmentFragment': PaginationFragmentFragment } }
    ) } | null };

export type ExplorerGetRacesQueryVariables = Exact<{
  pagination?: InputMaybe<PaginationArg>;
  filters?: InputMaybe<RaceFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
}>;


export type ExplorerGetRacesQuery = { __typename?: 'Query', races_connection?: { __typename?: 'RaceEntityResponseCollection', nodes: Array<{ __typename?: 'Race', documentId: string, slug: string, name: string, description?: string | null, size?: Enum_Race_Size | null, speed?: any | null, image?: { __typename?: 'UploadFile', url: string, alternativeText?: string | null } | null }>, pageInfo: (
      { __typename?: 'Pagination' }
      & { ' $fragmentRefs'?: { 'PaginationFragmentFragment': PaginationFragmentFragment } }
    ) } | null };

export type ExplorerGetSpellsQueryVariables = Exact<{
  pagination?: InputMaybe<PaginationArg>;
  filters?: InputMaybe<SpellFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
}>;


export type ExplorerGetSpellsQuery = { __typename?: 'Query', spells_connection?: { __typename?: 'SpellEntityResponseCollection', nodes: Array<{ __typename?: 'Spell', documentId: string, slug: string, name: string, description?: string | null, level?: number | null, school?: string | null, casting_time?: string | null, range?: string | null, image?: { __typename?: 'UploadFile', url: string, alternativeText?: string | null } | null }>, pageInfo: (
      { __typename?: 'Pagination' }
      & { ' $fragmentRefs'?: { 'PaginationFragmentFragment': PaginationFragmentFragment } }
    ) } | null };

export type ExplorerGetSubclassesQueryVariables = Exact<{
  pagination?: InputMaybe<PaginationArg>;
  filters?: InputMaybe<SubclassFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
}>;


export type ExplorerGetSubclassesQuery = { __typename?: 'Query', subclasses_connection?: { __typename?: 'SubclassEntityResponseCollection', nodes: Array<{ __typename?: 'Subclass', documentId: string, slug: string, name: string, description?: string | null, subclass_flavor?: string | null, image?: { __typename?: 'UploadFile', url: string, alternativeText?: string | null } | null }>, pageInfo: (
      { __typename?: 'Pagination' }
      & { ' $fragmentRefs'?: { 'PaginationFragmentFragment': PaginationFragmentFragment } }
    ) } | null };

export type ExplorerGetTraitsQueryVariables = Exact<{
  pagination?: InputMaybe<PaginationArg>;
  filters?: InputMaybe<TraitFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
}>;


export type ExplorerGetTraitsQuery = { __typename?: 'Query', traits_connection?: { __typename?: 'TraitEntityResponseCollection', nodes: Array<{ __typename?: 'Trait', documentId: string, slug: string, name: string, description?: string | null, image?: { __typename?: 'UploadFile', url: string, alternativeText?: string | null } | null }>, pageInfo: (
      { __typename?: 'Pagination' }
      & { ' $fragmentRefs'?: { 'PaginationFragmentFragment': PaginationFragmentFragment } }
    ) } | null };

export type ExplorerGetWeaponPropertiesQueryVariables = Exact<{
  pagination?: InputMaybe<PaginationArg>;
  filters?: InputMaybe<WeaponPropertyFiltersInput>;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
}>;


export type ExplorerGetWeaponPropertiesQuery = { __typename?: 'Query', weaponProperties_connection?: { __typename?: 'WeaponPropertyEntityResponseCollection', nodes: Array<{ __typename?: 'WeaponProperty', documentId: string, slug: string, name: string, description?: string | null, image?: { __typename?: 'UploadFile', url: string, alternativeText?: string | null } | null }>, pageInfo: (
      { __typename?: 'Pagination' }
      & { ' $fragmentRefs'?: { 'PaginationFragmentFragment': PaginationFragmentFragment } }
    ) } | null };

export type GenerateTerrainMutationVariables = Exact<{
  roomId: Scalars['ID']['input'];
}>;


export type GenerateTerrainMutation = { __typename?: 'Mutation', generateTerrain?: boolean | null };

export const PaginationFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaginationFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Pagination"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"page"}},{"kind":"Field","name":{"kind":"Name","value":"pageSize"}},{"kind":"Field","name":{"kind":"Name","value":"pageCount"}}]}}]} as unknown as DocumentNode<PaginationFragmentFragment, unknown>;
export const GetAbilitiesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAbilities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"abilities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"skills"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<GetAbilitiesQuery, GetAbilitiesQueryVariables>;
export const GetSkillsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSkills"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"skills"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"abilityScore"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<GetSkillsQuery, GetSkillsQueryVariables>;
export const GetRacesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetRaces"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"races"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"speed"}},{"kind":"Field","name":{"kind":"Name","value":"size"}}]}}]}}]} as unknown as DocumentNode<GetRacesQuery, GetRacesQueryVariables>;
export const GetClassesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetClasses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"classes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"hit_die"}}]}}]}}]} as unknown as DocumentNode<GetClassesQuery, GetClassesQueryVariables>;
export const GetAlignmentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAlignments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"alignments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"abbreviation"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]} as unknown as DocumentNode<GetAlignmentsQuery, GetAlignmentsQueryVariables>;
export const GetBackgroundsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetBackgrounds"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"backgrounds"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"skillProficiencies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<GetBackgroundsQuery, GetBackgroundsQueryVariables>;
export const GetLanguagesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetLanguages"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"languages"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"note"}}]}}]}}]} as unknown as DocumentNode<GetLanguagesQuery, GetLanguagesQueryVariables>;
export const GetMagicSchoolsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMagicSchools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"magicSchools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]} as unknown as DocumentNode<GetMagicSchoolsQuery, GetMagicSchoolsQueryVariables>;
export const GetConditionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetConditions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"conditions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]} as unknown as DocumentNode<GetConditionsQuery, GetConditionsQueryVariables>;
export const GetDamageTypesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetDamageTypes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"damageTypes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]} as unknown as DocumentNode<GetDamageTypesQuery, GetDamageTypesQueryVariables>;
export const GetEquipmentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEquipment"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"equipments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"cost_quantity"}},{"kind":"Field","name":{"kind":"Name","value":"cost_unit"}},{"kind":"Field","name":{"kind":"Name","value":"weight"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"damage_dice"}},{"kind":"Field","name":{"kind":"Name","value":"damage_type"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"equipment_category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"properties"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"range_normal"}},{"kind":"Field","name":{"kind":"Name","value":"range_long"}},{"kind":"Field","name":{"kind":"Name","value":"armor_class_base"}},{"kind":"Field","name":{"kind":"Name","value":"armor_class_dex_bonus"}}]}}]}}]} as unknown as DocumentNode<GetEquipmentQuery, GetEquipmentQueryVariables>;
export const GetMonstersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMonsters"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"monsters"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"alignment"}},{"kind":"Field","name":{"kind":"Name","value":"hp"}},{"kind":"Field","name":{"kind":"Name","value":"ac"}},{"kind":"Field","name":{"kind":"Name","value":"speed"}},{"kind":"Field","name":{"kind":"Name","value":"challenge_rating"}}]}}]}}]} as unknown as DocumentNode<GetMonstersQuery, GetMonstersQueryVariables>;
export const GetSpellsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSpells"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"spells"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"level"}},{"kind":"Field","name":{"kind":"Name","value":"school"}},{"kind":"Field","name":{"kind":"Name","value":"casting_time"}},{"kind":"Field","name":{"kind":"Name","value":"range"}},{"kind":"Field","name":{"kind":"Name","value":"components"}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"is_ritual"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]} as unknown as DocumentNode<GetSpellsQuery, GetSpellsQueryVariables>;
export const GetFeaturesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetFeatures"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"features"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"level"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]} as unknown as DocumentNode<GetFeaturesQuery, GetFeaturesQueryVariables>;
export const GetTraitsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTraits"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"traits"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"races"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<GetTraitsQuery, GetTraitsQueryVariables>;
export const GetSubclassesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSubclasses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"subclasses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"class"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<GetSubclassesQuery, GetSubclassesQueryVariables>;
export const GetProficienciesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetProficiencies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"proficiencies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"classes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"races"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<GetProficienciesQuery, GetProficienciesQueryVariables>;
export const CreateRoomDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateRoom"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"data"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"JSON"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createRoom"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"data"},"value":{"kind":"Variable","name":{"kind":"Name","value":"data"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"roomId"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"world"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"seed"}},{"kind":"Field","name":{"kind":"Name","value":"language"}},{"kind":"Field","name":{"kind":"Name","value":"chunkSize"}},{"kind":"Field","name":{"kind":"Name","value":"detail"}},{"kind":"Field","name":{"kind":"Name","value":"fogRadius"}},{"kind":"Field","name":{"kind":"Name","value":"globalScale"}},{"kind":"Field","name":{"kind":"Name","value":"seaLevel"}},{"kind":"Field","name":{"kind":"Name","value":"elevationScale"}},{"kind":"Field","name":{"kind":"Name","value":"roughness"}},{"kind":"Field","name":{"kind":"Name","value":"moistureScale"}},{"kind":"Field","name":{"kind":"Name","value":"temperatureOffset"}},{"kind":"Field","name":{"kind":"Name","value":"roadDensity"}},{"kind":"Field","name":{"kind":"Name","value":"structureChance"}},{"kind":"Field","name":{"kind":"Name","value":"structureSpacing"}},{"kind":"Field","name":{"kind":"Name","value":"structureSizeAvg"}},{"kind":"Field","name":{"kind":"Name","value":"worldSize"}},{"kind":"Field","name":{"kind":"Name","value":"worldType"}},{"kind":"Field","name":{"kind":"Name","value":"worldBackground"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dmSettings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adventureLength"}},{"kind":"Field","name":{"kind":"Name","value":"difficulty"}},{"kind":"Field","name":{"kind":"Name","value":"theme"}},{"kind":"Field","name":{"kind":"Name","value":"setting"}},{"kind":"Field","name":{"kind":"Name","value":"tone"}},{"kind":"Field","name":{"kind":"Name","value":"playerCount"}},{"kind":"Field","name":{"kind":"Name","value":"startingLevel"}},{"kind":"Field","name":{"kind":"Name","value":"attributePointBudget"}},{"kind":"Field","name":{"kind":"Name","value":"dmSystemPrompt"}},{"kind":"Field","name":{"kind":"Name","value":"dmStyle"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"verbosity"}},{"kind":"Field","name":{"kind":"Name","value":"detail"}},{"kind":"Field","name":{"kind":"Name","value":"engagement"}},{"kind":"Field","name":{"kind":"Name","value":"narrative"}},{"kind":"Field","name":{"kind":"Name","value":"specialMode"}},{"kind":"Field","name":{"kind":"Name","value":"customDirectives"}}]}}]}}]}}]}}]} as unknown as DocumentNode<CreateRoomMutation, CreateRoomMutationVariables>;
export const JoinRoomDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"JoinRoom"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"code"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"joinRoom"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"code"},"value":{"kind":"Variable","name":{"kind":"Name","value":"code"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"roomId"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"players"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isReady"}},{"kind":"Field","name":{"kind":"Name","value":"isOnline"}},{"kind":"Field","name":{"kind":"Name","value":"joinedAt"}},{"kind":"Field","name":{"kind":"Name","value":"action"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"username"}}]}},{"kind":"Field","name":{"kind":"Name","value":"character"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"portrait"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"upperBody"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"fullBody"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"baseStats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"strength"}},{"kind":"Field","name":{"kind":"Name","value":"dexterity"}},{"kind":"Field","name":{"kind":"Name","value":"constitution"}},{"kind":"Field","name":{"kind":"Name","value":"intelligence"}},{"kind":"Field","name":{"kind":"Name","value":"wisdom"}},{"kind":"Field","name":{"kind":"Name","value":"charisma"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"phase"}},{"kind":"Field","name":{"kind":"Name","value":"world"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"seed"}},{"kind":"Field","name":{"kind":"Name","value":"language"}},{"kind":"Field","name":{"kind":"Name","value":"chunkSize"}},{"kind":"Field","name":{"kind":"Name","value":"detail"}},{"kind":"Field","name":{"kind":"Name","value":"fogRadius"}},{"kind":"Field","name":{"kind":"Name","value":"globalScale"}},{"kind":"Field","name":{"kind":"Name","value":"seaLevel"}},{"kind":"Field","name":{"kind":"Name","value":"elevationScale"}},{"kind":"Field","name":{"kind":"Name","value":"roughness"}},{"kind":"Field","name":{"kind":"Name","value":"moistureScale"}},{"kind":"Field","name":{"kind":"Name","value":"temperatureOffset"}},{"kind":"Field","name":{"kind":"Name","value":"roadDensity"}},{"kind":"Field","name":{"kind":"Name","value":"structureChance"}},{"kind":"Field","name":{"kind":"Name","value":"structureSpacing"}},{"kind":"Field","name":{"kind":"Name","value":"structureSizeAvg"}},{"kind":"Field","name":{"kind":"Name","value":"worldSize"}},{"kind":"Field","name":{"kind":"Name","value":"worldType"}},{"kind":"Field","name":{"kind":"Name","value":"worldBackground"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dmSettings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adventureLength"}},{"kind":"Field","name":{"kind":"Name","value":"difficulty"}},{"kind":"Field","name":{"kind":"Name","value":"theme"}},{"kind":"Field","name":{"kind":"Name","value":"setting"}},{"kind":"Field","name":{"kind":"Name","value":"tone"}},{"kind":"Field","name":{"kind":"Name","value":"playerCount"}},{"kind":"Field","name":{"kind":"Name","value":"startingLevel"}},{"kind":"Field","name":{"kind":"Name","value":"attributePointBudget"}},{"kind":"Field","name":{"kind":"Name","value":"dmSystemPrompt"}},{"kind":"Field","name":{"kind":"Name","value":"dmStyle"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"verbosity"}},{"kind":"Field","name":{"kind":"Name","value":"detail"}},{"kind":"Field","name":{"kind":"Name","value":"engagement"}},{"kind":"Field","name":{"kind":"Name","value":"narrative"}},{"kind":"Field","name":{"kind":"Name","value":"specialMode"}},{"kind":"Field","name":{"kind":"Name","value":"customDirectives"}}]}}]}}]}}]}}]} as unknown as DocumentNode<JoinRoomMutation, JoinRoomMutationVariables>;
export const UpdateRoomDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateRoom"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"documentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"data"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RoomInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateRoom"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"documentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"documentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"data"},"value":{"kind":"Variable","name":{"kind":"Name","value":"data"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}}]}}]}}]} as unknown as DocumentNode<UpdateRoomMutation, UpdateRoomMutationVariables>;
export const GenerateWorldDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GenerateWorld"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"roomId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"language"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"generateWorld"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"roomId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"roomId"}}},{"kind":"Argument","name":{"kind":"Name","value":"language"},"value":{"kind":"Variable","name":{"kind":"Name","value":"language"}}}]}]}}]} as unknown as DocumentNode<GenerateWorldMutation, GenerateWorldMutationVariables>;
export const AddCharacterDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddCharacter"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"roomId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"character"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"JSON"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addCharacter"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"roomId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"roomId"}}},{"kind":"Argument","name":{"kind":"Name","value":"character"},"value":{"kind":"Variable","name":{"kind":"Name","value":"character"}}}]}]}}]} as unknown as DocumentNode<AddCharacterMutation, AddCharacterMutationVariables>;
export const StartGameDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"StartGame"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"roomId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"language"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"startGame"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"roomId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"roomId"}}},{"kind":"Argument","name":{"kind":"Name","value":"language"},"value":{"kind":"Variable","name":{"kind":"Name","value":"language"}}},{"kind":"Argument","name":{"kind":"Name","value":"streamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}}}]}]}}]} as unknown as DocumentNode<StartGameMutation, StartGameMutationVariables>;
export const SubmitActionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SubmitAction"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"roomId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"action"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"mode"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"submitAction"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"roomId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"roomId"}}},{"kind":"Argument","name":{"kind":"Name","value":"action"},"value":{"kind":"Variable","name":{"kind":"Name","value":"action"}}},{"kind":"Argument","name":{"kind":"Name","value":"mode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"mode"}}}]}]}}]} as unknown as DocumentNode<SubmitActionMutation, SubmitActionMutationVariables>;
export const GenerateAvatarPortraitDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GenerateAvatarPortrait"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"payload"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"JSON"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"referenceImage"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"generateAvatarPortrait"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"payload"},"value":{"kind":"Variable","name":{"kind":"Name","value":"payload"}}},{"kind":"Argument","name":{"kind":"Name","value":"referenceImage"},"value":{"kind":"Variable","name":{"kind":"Name","value":"referenceImage"}}}]}]}}]} as unknown as DocumentNode<GenerateAvatarPortraitMutation, GenerateAvatarPortraitMutationVariables>;
export const GenerateAvatarUpperBodyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GenerateAvatarUpperBody"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"payload"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"JSON"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"portrait"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"JSON"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"referenceImage"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"generateAvatarUpperBody"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"payload"},"value":{"kind":"Variable","name":{"kind":"Name","value":"payload"}}},{"kind":"Argument","name":{"kind":"Name","value":"portrait"},"value":{"kind":"Variable","name":{"kind":"Name","value":"portrait"}}},{"kind":"Argument","name":{"kind":"Name","value":"referenceImage"},"value":{"kind":"Variable","name":{"kind":"Name","value":"referenceImage"}}}]}]}}]} as unknown as DocumentNode<GenerateAvatarUpperBodyMutation, GenerateAvatarUpperBodyMutationVariables>;
export const GenerateAvatarFullBodyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GenerateAvatarFullBody"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"payload"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"JSON"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"portrait"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"JSON"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"upperBody"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"JSON"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"referenceImage"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"generateAvatarFullBody"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"payload"},"value":{"kind":"Variable","name":{"kind":"Name","value":"payload"}}},{"kind":"Argument","name":{"kind":"Name","value":"portrait"},"value":{"kind":"Variable","name":{"kind":"Name","value":"portrait"}}},{"kind":"Argument","name":{"kind":"Name","value":"upperBody"},"value":{"kind":"Variable","name":{"kind":"Name","value":"upperBody"}}},{"kind":"Argument","name":{"kind":"Name","value":"referenceImage"},"value":{"kind":"Variable","name":{"kind":"Name","value":"referenceImage"}}}]}]}}]} as unknown as DocumentNode<GenerateAvatarFullBodyMutation, GenerateAvatarFullBodyMutationVariables>;
export const SpawnCreatureDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SpawnCreature"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"roomId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"creature"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"JSON"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"spawnCreature"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"roomId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"roomId"}}},{"kind":"Argument","name":{"kind":"Name","value":"creature"},"value":{"kind":"Variable","name":{"kind":"Name","value":"creature"}}}]}]}}]} as unknown as DocumentNode<SpawnCreatureMutation, SpawnCreatureMutationVariables>;
export const GenerateTerrainChunkDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GenerateTerrainChunk"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"roomId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"chunkX"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"chunkY"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"chunkSize"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"generateTerrainChunk"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"roomId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"roomId"}}},{"kind":"Argument","name":{"kind":"Name","value":"chunkX"},"value":{"kind":"Variable","name":{"kind":"Name","value":"chunkX"}}},{"kind":"Argument","name":{"kind":"Name","value":"chunkY"},"value":{"kind":"Variable","name":{"kind":"Name","value":"chunkY"}}},{"kind":"Argument","name":{"kind":"Name","value":"chunkSize"},"value":{"kind":"Variable","name":{"kind":"Name","value":"chunkSize"}}}]}]}}]} as unknown as DocumentNode<GenerateTerrainChunkMutation, GenerateTerrainChunkMutationVariables>;
export const CreateCharacterSheetDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateCharacterSheet"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"data"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CharacterSheetInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createCharacterSheet"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"data"},"value":{"kind":"Variable","name":{"kind":"Name","value":"data"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<CreateCharacterSheetMutation, CreateCharacterSheetMutationVariables>;
export const GetRoomDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetRoom"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"RoomFiltersInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rooms"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"roomId"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"phase"}},{"kind":"Field","name":{"kind":"Name","value":"character_sheets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"position"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}},{"kind":"Field","name":{"kind":"Name","value":"z"}}]}},{"kind":"Field","name":{"kind":"Name","value":"currentHp"}},{"kind":"Field","name":{"kind":"Name","value":"maxHp"}},{"kind":"Field","name":{"kind":"Name","value":"speed"}}]}},{"kind":"Field","name":{"kind":"Name","value":"players"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isReady"}},{"kind":"Field","name":{"kind":"Name","value":"isOnline"}},{"kind":"Field","name":{"kind":"Name","value":"joinedAt"}},{"kind":"Field","name":{"kind":"Name","value":"action"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"username"}}]}},{"kind":"Field","name":{"kind":"Name","value":"character"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"backstory"}},{"kind":"Field","name":{"kind":"Name","value":"portrait"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"upperBody"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"fullBody"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"baseStats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"strength"}},{"kind":"Field","name":{"kind":"Name","value":"dexterity"}},{"kind":"Field","name":{"kind":"Name","value":"constitution"}},{"kind":"Field","name":{"kind":"Name","value":"intelligence"}},{"kind":"Field","name":{"kind":"Name","value":"wisdom"}},{"kind":"Field","name":{"kind":"Name","value":"charisma"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"world"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"history"}},{"kind":"Field","name":{"kind":"Name","value":"worldBackground"}},{"kind":"Field","name":{"kind":"Name","value":"seed"}},{"kind":"Field","name":{"kind":"Name","value":"language"}},{"kind":"Field","name":{"kind":"Name","value":"chunkSize"}},{"kind":"Field","name":{"kind":"Name","value":"detail"}},{"kind":"Field","name":{"kind":"Name","value":"fogRadius"}},{"kind":"Field","name":{"kind":"Name","value":"globalScale"}},{"kind":"Field","name":{"kind":"Name","value":"seaLevel"}},{"kind":"Field","name":{"kind":"Name","value":"elevationScale"}},{"kind":"Field","name":{"kind":"Name","value":"roughness"}},{"kind":"Field","name":{"kind":"Name","value":"moistureScale"}},{"kind":"Field","name":{"kind":"Name","value":"temperatureOffset"}},{"kind":"Field","name":{"kind":"Name","value":"roadDensity"}},{"kind":"Field","name":{"kind":"Name","value":"structureChance"}},{"kind":"Field","name":{"kind":"Name","value":"structureSpacing"}},{"kind":"Field","name":{"kind":"Name","value":"structureSizeAvg"}},{"kind":"Field","name":{"kind":"Name","value":"worldSize"}},{"kind":"Field","name":{"kind":"Name","value":"worldType"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dmSettings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"adventureLength"}},{"kind":"Field","name":{"kind":"Name","value":"difficulty"}},{"kind":"Field","name":{"kind":"Name","value":"theme"}},{"kind":"Field","name":{"kind":"Name","value":"setting"}},{"kind":"Field","name":{"kind":"Name","value":"tone"}},{"kind":"Field","name":{"kind":"Name","value":"playerCount"}},{"kind":"Field","name":{"kind":"Name","value":"startingLevel"}},{"kind":"Field","name":{"kind":"Name","value":"attributePointBudget"}},{"kind":"Field","name":{"kind":"Name","value":"dmSystemPrompt"}},{"kind":"Field","name":{"kind":"Name","value":"dmStyle"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"verbosity"}},{"kind":"Field","name":{"kind":"Name","value":"detail"}},{"kind":"Field","name":{"kind":"Name","value":"engagement"}},{"kind":"Field","name":{"kind":"Name","value":"narrative"}},{"kind":"Field","name":{"kind":"Name","value":"specialMode"}},{"kind":"Field","name":{"kind":"Name","value":"customDirectives"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"messages"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"sort"},"value":{"kind":"StringValue","value":"timestamp:asc","block":false}},{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"100"}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"senderName"}},{"kind":"Field","name":{"kind":"Name","value":"senderType"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"turn"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"turnNumber"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"turns"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"sort"},"value":{"kind":"StringValue","value":"turnNumber:desc","block":false}},{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"5"}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"turnNumber"}},{"kind":"Field","name":{"kind":"Name","value":"narrative"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"characterSnapshots"}},{"kind":"Field","name":{"kind":"Name","value":"actions"}},{"kind":"Field","name":{"kind":"Name","value":"actions"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"timeFrames"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"sort"},"value":{"kind":"StringValue","value":"turnNumber:asc","block":false}},{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"100"}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"turnNumber"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"gameState"}}]}},{"kind":"Field","name":{"kind":"Name","value":"owner"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"username"}}]}}]}}]}}]} as unknown as DocumentNode<GetRoomQuery, GetRoomQueryVariables>;
export const ListRoomsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListRooms"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sort"}},"type":{"kind":"ListType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},"defaultValue":{"kind":"ListValue","values":[{"kind":"StringValue","value":"createdAt:desc","block":false}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rooms"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"sort"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sort"}}},{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"50"}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"roomId"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"phase"}},{"kind":"Field","name":{"kind":"Name","value":"dmSettings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"theme"}},{"kind":"Field","name":{"kind":"Name","value":"setting"}},{"kind":"Field","name":{"kind":"Name","value":"difficulty"}}]}},{"kind":"Field","name":{"kind":"Name","value":"character_sheets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"players"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"character"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"race"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"class"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<ListRoomsQuery, ListRoomsQueryVariables>;
export const ListCharactersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListCharacters"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"characters"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"sort"},"value":{"kind":"StringValue","value":"name:asc","block":false}},{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1000"}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"backstory"}},{"kind":"Field","name":{"kind":"Name","value":"race"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"class"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"portrait"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}}]}}]}}]} as unknown as DocumentNode<ListCharactersQuery, ListCharactersQueryVariables>;
export const ListMonstersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListMonsters"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"MonsterFiltersInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"monsters"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}},{"kind":"Argument","name":{"kind":"Name","value":"sort"},"value":{"kind":"StringValue","value":"name:asc","block":false}},{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"50"}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"hp"}},{"kind":"Field","name":{"kind":"Name","value":"ac"}},{"kind":"Field","name":{"kind":"Name","value":"xp"}},{"kind":"Field","name":{"kind":"Name","value":"challenge_rating"}}]}}]}}]} as unknown as DocumentNode<ListMonstersQuery, ListMonstersQueryVariables>;
export const ListSpellsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListSpells"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"SpellFiltersInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"spells"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}},{"kind":"Argument","name":{"kind":"Name","value":"sort"},"value":{"kind":"StringValue","value":"name:asc","block":false}},{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"50"}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"level"}},{"kind":"Field","name":{"kind":"Name","value":"school"}}]}}]}}]} as unknown as DocumentNode<ListSpellsQuery, ListSpellsQueryVariables>;
export const SearchEntitiesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SearchEntities"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"query"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"searchEntities"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"Variable","name":{"kind":"Name","value":"query"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}}]}}]} as unknown as DocumentNode<SearchEntitiesQuery, SearchEntitiesQueryVariables>;
export const VoxelPreviewDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"VoxelPreview"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"chunks"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChunkRequestInput"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"config"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"WorldConfigInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"voxelPreview"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"chunks"},"value":{"kind":"Variable","name":{"kind":"Name","value":"chunks"}}},{"kind":"Argument","name":{"kind":"Name","value":"config"},"value":{"kind":"Variable","name":{"kind":"Name","value":"config"}}}]}]}}]} as unknown as DocumentNode<VoxelPreviewQuery, VoxelPreviewQueryVariables>;
export const ExplorerGetClassesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ExplorerGetClasses"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArg"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ClassFiltersInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"locale"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"I18NLocaleCode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"classes_connection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}},{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}},{"kind":"Argument","name":{"kind":"Name","value":"locale"},"value":{"kind":"Variable","name":{"kind":"Name","value":"locale"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"image"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"alternativeText"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaginationFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaginationFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Pagination"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"page"}},{"kind":"Field","name":{"kind":"Name","value":"pageSize"}},{"kind":"Field","name":{"kind":"Name","value":"pageCount"}}]}}]} as unknown as DocumentNode<ExplorerGetClassesQuery, ExplorerGetClassesQueryVariables>;
export const ExplorerGetDamageTypesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ExplorerGetDamageTypes"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArg"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"DamageTypeFiltersInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"locale"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"I18NLocaleCode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"damageTypes_connection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}},{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}},{"kind":"Argument","name":{"kind":"Name","value":"locale"},"value":{"kind":"Variable","name":{"kind":"Name","value":"locale"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"image"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"alternativeText"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaginationFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaginationFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Pagination"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"page"}},{"kind":"Field","name":{"kind":"Name","value":"pageSize"}},{"kind":"Field","name":{"kind":"Name","value":"pageCount"}}]}}]} as unknown as DocumentNode<ExplorerGetDamageTypesQuery, ExplorerGetDamageTypesQueryVariables>;
export const ExplorerGetEquipmentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ExplorerGetEquipment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArg"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"EquipmentFiltersInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"locale"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"I18NLocaleCode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"equipments_connection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}},{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}},{"kind":"Argument","name":{"kind":"Name","value":"locale"},"value":{"kind":"Variable","name":{"kind":"Name","value":"locale"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"image"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"alternativeText"}}]}},{"kind":"Field","name":{"kind":"Name","value":"cost_quantity"}},{"kind":"Field","name":{"kind":"Name","value":"cost_unit"}},{"kind":"Field","name":{"kind":"Name","value":"weight"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaginationFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaginationFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Pagination"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"page"}},{"kind":"Field","name":{"kind":"Name","value":"pageSize"}},{"kind":"Field","name":{"kind":"Name","value":"pageCount"}}]}}]} as unknown as DocumentNode<ExplorerGetEquipmentQuery, ExplorerGetEquipmentQueryVariables>;
export const ExplorerGetEquipmentCategoriesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ExplorerGetEquipmentCategories"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArg"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"EquipmentCategoryFiltersInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"locale"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"I18NLocaleCode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"equipmentCategories_connection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}},{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}},{"kind":"Argument","name":{"kind":"Name","value":"locale"},"value":{"kind":"Variable","name":{"kind":"Name","value":"locale"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"image"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"alternativeText"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaginationFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaginationFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Pagination"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"page"}},{"kind":"Field","name":{"kind":"Name","value":"pageSize"}},{"kind":"Field","name":{"kind":"Name","value":"pageCount"}}]}}]} as unknown as DocumentNode<ExplorerGetEquipmentCategoriesQuery, ExplorerGetEquipmentCategoriesQueryVariables>;
export const ExplorerGetFeaturesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ExplorerGetFeatures"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArg"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"FeatureFiltersInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"locale"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"I18NLocaleCode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"features_connection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}},{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}},{"kind":"Argument","name":{"kind":"Name","value":"locale"},"value":{"kind":"Variable","name":{"kind":"Name","value":"locale"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"image"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"alternativeText"}}]}},{"kind":"Field","name":{"kind":"Name","value":"level"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaginationFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaginationFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Pagination"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"page"}},{"kind":"Field","name":{"kind":"Name","value":"pageSize"}},{"kind":"Field","name":{"kind":"Name","value":"pageCount"}}]}}]} as unknown as DocumentNode<ExplorerGetFeaturesQuery, ExplorerGetFeaturesQueryVariables>;
export const ExplorerGetLanguagesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ExplorerGetLanguages"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArg"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"LanguageFiltersInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"locale"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"I18NLocaleCode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"languages_connection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}},{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}},{"kind":"Argument","name":{"kind":"Name","value":"locale"},"value":{"kind":"Variable","name":{"kind":"Name","value":"locale"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"image"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"alternativeText"}}]}},{"kind":"Field","name":{"kind":"Name","value":"note"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaginationFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaginationFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Pagination"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"page"}},{"kind":"Field","name":{"kind":"Name","value":"pageSize"}},{"kind":"Field","name":{"kind":"Name","value":"pageCount"}}]}}]} as unknown as DocumentNode<ExplorerGetLanguagesQuery, ExplorerGetLanguagesQueryVariables>;
export const ExplorerGetMagicItemsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ExplorerGetMagicItems"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArg"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"MagicItemFiltersInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"locale"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"I18NLocaleCode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"magicItems_connection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}},{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}},{"kind":"Argument","name":{"kind":"Name","value":"locale"},"value":{"kind":"Variable","name":{"kind":"Name","value":"locale"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"image"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"alternativeText"}}]}},{"kind":"Field","name":{"kind":"Name","value":"rarity"}},{"kind":"Field","name":{"kind":"Name","value":"attunement_required"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaginationFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaginationFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Pagination"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"page"}},{"kind":"Field","name":{"kind":"Name","value":"pageSize"}},{"kind":"Field","name":{"kind":"Name","value":"pageCount"}}]}}]} as unknown as DocumentNode<ExplorerGetMagicItemsQuery, ExplorerGetMagicItemsQueryVariables>;
export const ExplorerGetMagicSchoolsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ExplorerGetMagicSchools"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArg"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"MagicSchoolFiltersInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"locale"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"I18NLocaleCode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"magicSchools_connection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}},{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}},{"kind":"Argument","name":{"kind":"Name","value":"locale"},"value":{"kind":"Variable","name":{"kind":"Name","value":"locale"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"image"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"alternativeText"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaginationFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaginationFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Pagination"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"page"}},{"kind":"Field","name":{"kind":"Name","value":"pageSize"}},{"kind":"Field","name":{"kind":"Name","value":"pageCount"}}]}}]} as unknown as DocumentNode<ExplorerGetMagicSchoolsQuery, ExplorerGetMagicSchoolsQueryVariables>;
export const ExplorerGetMonstersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ExplorerGetMonsters"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArg"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"MonsterFiltersInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"locale"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"I18NLocaleCode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"monsters_connection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}},{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}},{"kind":"Argument","name":{"kind":"Name","value":"locale"},"value":{"kind":"Variable","name":{"kind":"Name","value":"locale"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"image"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"alternativeText"}}]}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"alignment"}},{"kind":"Field","name":{"kind":"Name","value":"challenge_rating"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaginationFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaginationFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Pagination"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"page"}},{"kind":"Field","name":{"kind":"Name","value":"pageSize"}},{"kind":"Field","name":{"kind":"Name","value":"pageCount"}}]}}]} as unknown as DocumentNode<ExplorerGetMonstersQuery, ExplorerGetMonstersQueryVariables>;
export const ExplorerGetProficienciesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ExplorerGetProficiencies"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArg"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ProficiencyFiltersInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"locale"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"I18NLocaleCode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"proficiencies_connection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}},{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}},{"kind":"Argument","name":{"kind":"Name","value":"locale"},"value":{"kind":"Variable","name":{"kind":"Name","value":"locale"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"image"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"alternativeText"}}]}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaginationFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaginationFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Pagination"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"page"}},{"kind":"Field","name":{"kind":"Name","value":"pageSize"}},{"kind":"Field","name":{"kind":"Name","value":"pageCount"}}]}}]} as unknown as DocumentNode<ExplorerGetProficienciesQuery, ExplorerGetProficienciesQueryVariables>;
export const ExplorerGetRacesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ExplorerGetRaces"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArg"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"RaceFiltersInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"locale"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"I18NLocaleCode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"races_connection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}},{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}},{"kind":"Argument","name":{"kind":"Name","value":"locale"},"value":{"kind":"Variable","name":{"kind":"Name","value":"locale"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"image"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"alternativeText"}}]}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"speed"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaginationFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaginationFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Pagination"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"page"}},{"kind":"Field","name":{"kind":"Name","value":"pageSize"}},{"kind":"Field","name":{"kind":"Name","value":"pageCount"}}]}}]} as unknown as DocumentNode<ExplorerGetRacesQuery, ExplorerGetRacesQueryVariables>;
export const ExplorerGetSpellsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ExplorerGetSpells"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArg"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"SpellFiltersInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"locale"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"I18NLocaleCode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"spells_connection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}},{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}},{"kind":"Argument","name":{"kind":"Name","value":"locale"},"value":{"kind":"Variable","name":{"kind":"Name","value":"locale"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"image"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"alternativeText"}}]}},{"kind":"Field","name":{"kind":"Name","value":"level"}},{"kind":"Field","name":{"kind":"Name","value":"school"}},{"kind":"Field","name":{"kind":"Name","value":"casting_time"}},{"kind":"Field","name":{"kind":"Name","value":"range"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaginationFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaginationFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Pagination"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"page"}},{"kind":"Field","name":{"kind":"Name","value":"pageSize"}},{"kind":"Field","name":{"kind":"Name","value":"pageCount"}}]}}]} as unknown as DocumentNode<ExplorerGetSpellsQuery, ExplorerGetSpellsQueryVariables>;
export const ExplorerGetSubclassesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ExplorerGetSubclasses"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArg"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"SubclassFiltersInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"locale"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"I18NLocaleCode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"subclasses_connection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}},{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}},{"kind":"Argument","name":{"kind":"Name","value":"locale"},"value":{"kind":"Variable","name":{"kind":"Name","value":"locale"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"image"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"alternativeText"}}]}},{"kind":"Field","name":{"kind":"Name","value":"subclass_flavor"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaginationFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaginationFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Pagination"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"page"}},{"kind":"Field","name":{"kind":"Name","value":"pageSize"}},{"kind":"Field","name":{"kind":"Name","value":"pageCount"}}]}}]} as unknown as DocumentNode<ExplorerGetSubclassesQuery, ExplorerGetSubclassesQueryVariables>;
export const ExplorerGetTraitsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ExplorerGetTraits"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArg"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"TraitFiltersInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"locale"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"I18NLocaleCode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"traits_connection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}},{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}},{"kind":"Argument","name":{"kind":"Name","value":"locale"},"value":{"kind":"Variable","name":{"kind":"Name","value":"locale"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"image"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"alternativeText"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaginationFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaginationFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Pagination"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"page"}},{"kind":"Field","name":{"kind":"Name","value":"pageSize"}},{"kind":"Field","name":{"kind":"Name","value":"pageCount"}}]}}]} as unknown as DocumentNode<ExplorerGetTraitsQuery, ExplorerGetTraitsQueryVariables>;
export const ExplorerGetWeaponPropertiesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ExplorerGetWeaponProperties"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArg"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"WeaponPropertyFiltersInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"locale"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"I18NLocaleCode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"weaponProperties_connection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}},{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}},{"kind":"Argument","name":{"kind":"Name","value":"locale"},"value":{"kind":"Variable","name":{"kind":"Name","value":"locale"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"image"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"alternativeText"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaginationFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaginationFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Pagination"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"page"}},{"kind":"Field","name":{"kind":"Name","value":"pageSize"}},{"kind":"Field","name":{"kind":"Name","value":"pageCount"}}]}}]} as unknown as DocumentNode<ExplorerGetWeaponPropertiesQuery, ExplorerGetWeaponPropertiesQueryVariables>;
export const GenerateTerrainDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GenerateTerrain"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"roomId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"generateTerrain"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"roomId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"roomId"}}}]}]}}]} as unknown as DocumentNode<GenerateTerrainMutation, GenerateTerrainMutationVariables>;