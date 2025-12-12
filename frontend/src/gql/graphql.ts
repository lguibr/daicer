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
  baseStats?: Maybe<Scalars['JSON']['output']>;
  class?: Maybe<Class>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  documentId: Scalars['ID']['output'];
  fullBody?: Maybe<UploadFile>;
  name: Scalars['String']['output'];
  portrait?: Maybe<UploadFile>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  race?: Maybe<Race>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  user?: Maybe<UsersPermissionsUser>;
};

export type CharacterEntityResponseCollection = {
  __typename?: 'CharacterEntityResponseCollection';
  nodes: Array<Character>;
  pageInfo: Pagination;
};

export type CharacterFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<CharacterFiltersInput>>>;
  baseStats?: InputMaybe<JsonFilterInput>;
  class?: InputMaybe<ClassFiltersInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  description?: InputMaybe<StringFilterInput>;
  documentId?: InputMaybe<IdFilterInput>;
  name?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<CharacterFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<CharacterFiltersInput>>>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  race?: InputMaybe<RaceFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  user?: InputMaybe<UsersPermissionsUserFiltersInput>;
};

export type CharacterInput = {
  baseStats?: InputMaybe<Scalars['JSON']['input']>;
  class?: InputMaybe<Scalars['ID']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  fullBody?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  portrait?: InputMaybe<Scalars['ID']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  race?: InputMaybe<Scalars['ID']['input']>;
  user?: InputMaybe<Scalars['ID']['input']>;
};

export type CharacterRelationResponseCollection = {
  __typename?: 'CharacterRelationResponseCollection';
  nodes: Array<Character>;
};

export type CharacterSheet = {
  __typename?: 'CharacterSheet';
  character?: Maybe<Character>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  currentHp?: Maybe<Scalars['Int']['output']>;
  documentId: Scalars['ID']['output'];
  experience?: Maybe<Scalars['Int']['output']>;
  inventory?: Maybe<Scalars['JSON']['output']>;
  level?: Maybe<Scalars['Int']['output']>;
  maxHp?: Maybe<Scalars['Int']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  room?: Maybe<Room>;
  stats?: Maybe<Scalars['JSON']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type CharacterSheetEntityResponseCollection = {
  __typename?: 'CharacterSheetEntityResponseCollection';
  nodes: Array<CharacterSheet>;
  pageInfo: Pagination;
};

export type CharacterSheetFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<CharacterSheetFiltersInput>>>;
  character?: InputMaybe<CharacterFiltersInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  currentHp?: InputMaybe<IntFilterInput>;
  documentId?: InputMaybe<IdFilterInput>;
  experience?: InputMaybe<IntFilterInput>;
  inventory?: InputMaybe<JsonFilterInput>;
  level?: InputMaybe<IntFilterInput>;
  maxHp?: InputMaybe<IntFilterInput>;
  not?: InputMaybe<CharacterSheetFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<CharacterSheetFiltersInput>>>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  room?: InputMaybe<RoomFiltersInput>;
  stats?: InputMaybe<JsonFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type CharacterSheetInput = {
  character?: InputMaybe<Scalars['ID']['input']>;
  currentHp?: InputMaybe<Scalars['Int']['input']>;
  experience?: InputMaybe<Scalars['Int']['input']>;
  inventory?: InputMaybe<Scalars['JSON']['input']>;
  level?: InputMaybe<Scalars['Int']['input']>;
  maxHp?: InputMaybe<Scalars['Int']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  room?: InputMaybe<Scalars['ID']['input']>;
  stats?: InputMaybe<Scalars['JSON']['input']>;
};

export type CharacterSheetRelationResponseCollection = {
  __typename?: 'CharacterSheetRelationResponseCollection';
  nodes: Array<CharacterSheet>;
};

export type Class = {
  __typename?: 'Class';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  documentId: Scalars['ID']['output'];
  hit_die?: Maybe<Scalars['String']['output']>;
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

export type ComponentGameStats = {
  __typename?: 'ComponentGameStats';
  charisma?: Maybe<Scalars['Int']['output']>;
  constitution?: Maybe<Scalars['Int']['output']>;
  dexterity?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  intelligence?: Maybe<Scalars['Int']['output']>;
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
  strength?: InputMaybe<IntFilterInput>;
  wisdom?: InputMaybe<IntFilterInput>;
};

export type ComponentGameStatsInput = {
  charisma?: InputMaybe<Scalars['Int']['input']>;
  constitution?: InputMaybe<Scalars['Int']['input']>;
  dexterity?: InputMaybe<Scalars['Int']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  intelligence?: InputMaybe<Scalars['Int']['input']>;
  strength?: InputMaybe<Scalars['Int']['input']>;
  wisdom?: InputMaybe<Scalars['Int']['input']>;
};

export type DamageType = {
  __typename?: 'DamageType';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  documentId: Scalars['ID']['output'];
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

export enum Enum_Magicitem_Rarity {
  Artifact = 'Artifact',
  Common = 'Common',
  Legendary = 'Legendary',
  Rare = 'Rare',
  Uncommon = 'Uncommon',
  Varies = 'Varies',
  VeryRare = 'Very_Rare'
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

export type GenericMorph = Character | CharacterSheet | Class | ComponentGameStats | DamageType | Equipment | EquipmentCategory | Feature | I18NLocale | Language | MagicItem | MagicSchool | Monster | Proficiency | Prompt | Race | ReviewWorkflowsWorkflow | ReviewWorkflowsWorkflowStage | Room | Sequence | Spell | Subclass | Trait | UploadFile | UsersPermissionsPermission | UsersPermissionsRole | UsersPermissionsUser | WeaponProperty;

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

export type Language = {
  __typename?: 'Language';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  documentId: Scalars['ID']['output'];
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
  name?: InputMaybe<Scalars['String']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
};

export type MagicSchoolRelationResponseCollection = {
  __typename?: 'MagicSchoolRelationResponseCollection';
  nodes: Array<MagicSchool>;
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
  createEquipment?: Maybe<Equipment>;
  createEquipmentCategory?: Maybe<EquipmentCategory>;
  createFeature?: Maybe<Feature>;
  createLanguage?: Maybe<Language>;
  createMagicItem?: Maybe<MagicItem>;
  createMagicSchool?: Maybe<MagicSchool>;
  createMonster?: Maybe<Monster>;
  createProficiency?: Maybe<Proficiency>;
  createPrompt?: Maybe<Prompt>;
  createRace?: Maybe<Race>;
  createReviewWorkflowsWorkflow?: Maybe<ReviewWorkflowsWorkflow>;
  createReviewWorkflowsWorkflowStage?: Maybe<ReviewWorkflowsWorkflowStage>;
  createRoom?: Maybe<Room>;
  createSequence?: Maybe<Sequence>;
  createSpell?: Maybe<Spell>;
  createSubclass?: Maybe<Subclass>;
  createTrait?: Maybe<Trait>;
  /** Create a new role */
  createUsersPermissionsRole?: Maybe<UsersPermissionsCreateRolePayload>;
  /** Create a new user */
  createUsersPermissionsUser: UsersPermissionsUserEntityResponse;
  createWeaponProperty?: Maybe<WeaponProperty>;
  deleteCharacter?: Maybe<DeleteMutationResponse>;
  deleteCharacterSheet?: Maybe<DeleteMutationResponse>;
  deleteClass?: Maybe<DeleteMutationResponse>;
  deleteDamageType?: Maybe<DeleteMutationResponse>;
  deleteEquipment?: Maybe<DeleteMutationResponse>;
  deleteEquipmentCategory?: Maybe<DeleteMutationResponse>;
  deleteFeature?: Maybe<DeleteMutationResponse>;
  deleteLanguage?: Maybe<DeleteMutationResponse>;
  deleteMagicItem?: Maybe<DeleteMutationResponse>;
  deleteMagicSchool?: Maybe<DeleteMutationResponse>;
  deleteMonster?: Maybe<DeleteMutationResponse>;
  deleteProficiency?: Maybe<DeleteMutationResponse>;
  deletePrompt?: Maybe<DeleteMutationResponse>;
  deleteRace?: Maybe<DeleteMutationResponse>;
  deleteReviewWorkflowsWorkflow?: Maybe<DeleteMutationResponse>;
  deleteReviewWorkflowsWorkflowStage?: Maybe<DeleteMutationResponse>;
  deleteRoom?: Maybe<DeleteMutationResponse>;
  deleteSequence?: Maybe<DeleteMutationResponse>;
  deleteSpell?: Maybe<DeleteMutationResponse>;
  deleteSubclass?: Maybe<DeleteMutationResponse>;
  deleteTrait?: Maybe<DeleteMutationResponse>;
  deleteUploadFile?: Maybe<UploadFile>;
  /** Delete an existing role */
  deleteUsersPermissionsRole?: Maybe<UsersPermissionsDeleteRolePayload>;
  /** Delete an existing user */
  deleteUsersPermissionsUser: UsersPermissionsUserEntityResponse;
  deleteWeaponProperty?: Maybe<DeleteMutationResponse>;
  /** Confirm an email users email address */
  emailConfirmation?: Maybe<UsersPermissionsLoginPayload>;
  /** Request a reset password token */
  forgotPassword?: Maybe<UsersPermissionsPasswordPayload>;
  generateAvatarPortrait?: Maybe<Scalars['JSON']['output']>;
  generateWorld?: Maybe<Scalars['JSON']['output']>;
  joinRoom?: Maybe<Room>;
  login: UsersPermissionsLoginPayload;
  processTurn?: Maybe<Scalars['JSON']['output']>;
  /** Register a user */
  register: UsersPermissionsLoginPayload;
  /** Reset user password. Confirm with a code (resetToken from forgotPassword) */
  resetPassword?: Maybe<UsersPermissionsLoginPayload>;
  startGame?: Maybe<Scalars['JSON']['output']>;
  submitAction?: Maybe<Scalars['JSON']['output']>;
  updateCharacter?: Maybe<Character>;
  updateCharacterSheet?: Maybe<CharacterSheet>;
  updateClass?: Maybe<Class>;
  updateDamageType?: Maybe<DamageType>;
  updateEquipment?: Maybe<Equipment>;
  updateEquipmentCategory?: Maybe<EquipmentCategory>;
  updateFeature?: Maybe<Feature>;
  updateLanguage?: Maybe<Language>;
  updateMagicItem?: Maybe<MagicItem>;
  updateMagicSchool?: Maybe<MagicSchool>;
  updateMonster?: Maybe<Monster>;
  updateProficiency?: Maybe<Proficiency>;
  updatePrompt?: Maybe<Prompt>;
  updateRace?: Maybe<Race>;
  updateReviewWorkflowsWorkflow?: Maybe<ReviewWorkflowsWorkflow>;
  updateReviewWorkflowsWorkflowStage?: Maybe<ReviewWorkflowsWorkflowStage>;
  updateRoom?: Maybe<Room>;
  updateSequence?: Maybe<Sequence>;
  updateSpell?: Maybe<Spell>;
  updateSubclass?: Maybe<Subclass>;
  updateTrait?: Maybe<Trait>;
  updateUploadFile: UploadFile;
  /** Update an existing role */
  updateUsersPermissionsRole?: Maybe<UsersPermissionsUpdateRolePayload>;
  /** Update an existing user */
  updateUsersPermissionsUser: UsersPermissionsUserEntityResponse;
  updateWeaponProperty?: Maybe<WeaponProperty>;
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
  data: RoomInput;
  status?: InputMaybe<PublicationStatus>;
};


export type MutationCreateSequenceArgs = {
  data: SequenceInput;
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


export type MutationCreateTraitArgs = {
  data: TraitInput;
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
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


export type MutationDeleteSequenceArgs = {
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


export type MutationDeleteTraitArgs = {
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
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


export type MutationEmailConfirmationArgs = {
  confirmation: Scalars['String']['input'];
};


export type MutationForgotPasswordArgs = {
  email: Scalars['String']['input'];
};


export type MutationGenerateAvatarPortraitArgs = {
  payload: Scalars['JSON']['input'];
  referenceImage?: InputMaybe<Scalars['String']['input']>;
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


export type MutationStartGameArgs = {
  language?: InputMaybe<Scalars['String']['input']>;
  roomId: Scalars['ID']['input'];
  streamId?: InputMaybe<Scalars['String']['input']>;
};


export type MutationSubmitActionArgs = {
  action?: InputMaybe<Scalars['String']['input']>;
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


export type MutationUpdateSequenceArgs = {
  data: SequenceInput;
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


export type MutationUpdateTraitArgs = {
  data: TraitInput;
  documentId: Scalars['ID']['input'];
  locale?: InputMaybe<Scalars['I18NLocaleCode']['input']>;
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
  character?: Maybe<Character>;
  characterSheet?: Maybe<CharacterSheet>;
  characterSheets: Array<Maybe<CharacterSheet>>;
  characterSheets_connection?: Maybe<CharacterSheetEntityResponseCollection>;
  characters: Array<Maybe<Character>>;
  characters_connection?: Maybe<CharacterEntityResponseCollection>;
  class?: Maybe<Class>;
  classes: Array<Maybe<Class>>;
  classes_connection?: Maybe<ClassEntityResponseCollection>;
  damageType?: Maybe<DamageType>;
  damageTypes: Array<Maybe<DamageType>>;
  damageTypes_connection?: Maybe<DamageTypeEntityResponseCollection>;
  equipment?: Maybe<Equipment>;
  equipmentCategories: Array<Maybe<EquipmentCategory>>;
  equipmentCategories_connection?: Maybe<EquipmentCategoryEntityResponseCollection>;
  equipmentCategory?: Maybe<EquipmentCategory>;
  equipments: Array<Maybe<Equipment>>;
  equipments_connection?: Maybe<EquipmentEntityResponseCollection>;
  feature?: Maybe<Feature>;
  features: Array<Maybe<Feature>>;
  features_connection?: Maybe<FeatureEntityResponseCollection>;
  i18NLocale?: Maybe<I18NLocale>;
  i18NLocales: Array<Maybe<I18NLocale>>;
  i18NLocales_connection?: Maybe<I18NLocaleEntityResponseCollection>;
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
  sequence?: Maybe<Sequence>;
  sequences: Array<Maybe<Sequence>>;
  sequences_connection?: Maybe<SequenceEntityResponseCollection>;
  spell?: Maybe<Spell>;
  spells: Array<Maybe<Spell>>;
  spells_connection?: Maybe<SpellEntityResponseCollection>;
  subclass?: Maybe<Subclass>;
  subclasses: Array<Maybe<Subclass>>;
  subclasses_connection?: Maybe<SubclassEntityResponseCollection>;
  trait?: Maybe<Trait>;
  traits: Array<Maybe<Trait>>;
  traits_connection?: Maybe<TraitEntityResponseCollection>;
  uploadFile?: Maybe<UploadFile>;
  uploadFiles: Array<Maybe<UploadFile>>;
  uploadFiles_connection?: Maybe<UploadFileEntityResponseCollection>;
  usersPermissionsRole?: Maybe<UsersPermissionsRole>;
  usersPermissionsRoles: Array<Maybe<UsersPermissionsRole>>;
  usersPermissionsRoles_connection?: Maybe<UsersPermissionsRoleEntityResponseCollection>;
  usersPermissionsUser?: Maybe<UsersPermissionsUser>;
  usersPermissionsUsers: Array<Maybe<UsersPermissionsUser>>;
  usersPermissionsUsers_connection?: Maybe<UsersPermissionsUserEntityResponseCollection>;
  weaponProperties: Array<Maybe<WeaponProperty>>;
  weaponProperties_connection?: Maybe<WeaponPropertyEntityResponseCollection>;
  weaponProperty?: Maybe<WeaponProperty>;
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


export type QuerySequenceArgs = {
  documentId: Scalars['ID']['input'];
  status?: InputMaybe<PublicationStatus>;
};


export type QuerySequencesArgs = {
  filters?: InputMaybe<SequenceFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
};


export type QuerySequences_ConnectionArgs = {
  filters?: InputMaybe<SequenceFiltersInput>;
  pagination?: InputMaybe<PaginationArg>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<PublicationStatus>;
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

export type Race = {
  __typename?: 'Race';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  documentId: Scalars['ID']['output'];
  locale?: Maybe<Scalars['String']['output']>;
  localizations: Array<Maybe<Race>>;
  localizations_connection?: Maybe<RaceRelationResponseCollection>;
  name: Scalars['String']['output'];
  proficiencies: Array<Maybe<Proficiency>>;
  proficiencies_connection?: Maybe<ProficiencyRelationResponseCollection>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  size?: Maybe<Enum_Race_Size>;
  slug: Scalars['String']['output'];
  speed?: Maybe<Scalars['Int']['output']>;
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
  speed?: InputMaybe<IntFilterInput>;
  traits?: InputMaybe<TraitFiltersInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type RaceInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  proficiencies?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  size?: InputMaybe<Enum_Race_Size>;
  slug?: InputMaybe<Scalars['String']['input']>;
  speed?: InputMaybe<Scalars['Int']['input']>;
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
  code: Scalars['String']['output'];
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  documentId: Scalars['ID']['output'];
  history?: Maybe<Scalars['JSON']['output']>;
  isActive?: Maybe<Scalars['Boolean']['output']>;
  ownerId: Scalars['String']['output'];
  phase?: Maybe<Enum_Room_Phase>;
  players?: Maybe<Scalars['JSON']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  roomId: Scalars['String']['output'];
  settings?: Maybe<Scalars['JSON']['output']>;
  structures?: Maybe<Scalars['JSON']['output']>;
  terrainData?: Maybe<Scalars['JSON']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  worldDescription?: Maybe<Scalars['String']['output']>;
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
  documentId?: InputMaybe<IdFilterInput>;
  history?: InputMaybe<JsonFilterInput>;
  isActive?: InputMaybe<BooleanFilterInput>;
  not?: InputMaybe<RoomFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<RoomFiltersInput>>>;
  ownerId?: InputMaybe<StringFilterInput>;
  phase?: InputMaybe<StringFilterInput>;
  players?: InputMaybe<JsonFilterInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  roomId?: InputMaybe<StringFilterInput>;
  settings?: InputMaybe<JsonFilterInput>;
  structures?: InputMaybe<JsonFilterInput>;
  terrainData?: InputMaybe<JsonFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  worldDescription?: InputMaybe<StringFilterInput>;
};

export type RoomInput = {
  character_sheets?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  code?: InputMaybe<Scalars['String']['input']>;
  history?: InputMaybe<Scalars['JSON']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  ownerId?: InputMaybe<Scalars['String']['input']>;
  phase?: InputMaybe<Enum_Room_Phase>;
  players?: InputMaybe<Scalars['JSON']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  roomId?: InputMaybe<Scalars['String']['input']>;
  settings?: InputMaybe<Scalars['JSON']['input']>;
  structures?: InputMaybe<Scalars['JSON']['input']>;
  terrainData?: InputMaybe<Scalars['JSON']['input']>;
  worldDescription?: InputMaybe<Scalars['String']['input']>;
};

export type Sequence = {
  __typename?: 'Sequence';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  documentId: Scalars['ID']['output'];
  key: Scalars['String']['output'];
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  value?: Maybe<Scalars['Long']['output']>;
};

export type SequenceEntityResponseCollection = {
  __typename?: 'SequenceEntityResponseCollection';
  nodes: Array<Sequence>;
  pageInfo: Pagination;
};

export type SequenceFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<SequenceFiltersInput>>>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  documentId?: InputMaybe<IdFilterInput>;
  key?: InputMaybe<StringFilterInput>;
  not?: InputMaybe<SequenceFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<SequenceFiltersInput>>>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
  value?: InputMaybe<LongFilterInput>;
};

export type SequenceInput = {
  key?: InputMaybe<Scalars['String']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  value?: InputMaybe<Scalars['Long']['input']>;
};

export type Spell = {
  __typename?: 'Spell';
  casting_time?: Maybe<Scalars['String']['output']>;
  components?: Maybe<Scalars['JSON']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  documentId: Scalars['ID']['output'];
  duration?: Maybe<Scalars['String']['output']>;
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
  name?: InputMaybe<Scalars['String']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
  subclass_flavor?: InputMaybe<Scalars['String']['input']>;
};

export type SubclassRelationResponseCollection = {
  __typename?: 'SubclassRelationResponseCollection';
  nodes: Array<Subclass>;
};

export type Trait = {
  __typename?: 'Trait';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  documentId: Scalars['ID']['output'];
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
  characters: Array<Maybe<Character>>;
  characters_connection?: Maybe<CharacterRelationResponseCollection>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  documentId: Scalars['ID']['output'];
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
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
  characters?: InputMaybe<CharacterFiltersInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  documentId?: InputMaybe<IdFilterInput>;
  not?: InputMaybe<UsersPermissionsUserFiltersInput>;
  or?: InputMaybe<Array<InputMaybe<UsersPermissionsUserFiltersInput>>>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type UsersPermissionsUserInput = {
  characters?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  password?: InputMaybe<Scalars['String']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
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
  name?: InputMaybe<Scalars['String']['input']>;
  publishedAt?: InputMaybe<Scalars['DateTime']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
};

export type WeaponPropertyRelationResponseCollection = {
  __typename?: 'WeaponPropertyRelationResponseCollection';
  nodes: Array<WeaponProperty>;
};

export type CreateRoomMutationVariables = Exact<{
  data: RoomInput;
}>;


export type CreateRoomMutation = { __typename?: 'Mutation', createRoom?: { __typename?: 'Room', documentId: string, roomId: string, code: string } | null };

export type JoinRoomMutationVariables = Exact<{
  code: Scalars['String']['input'];
}>;


export type JoinRoomMutation = { __typename?: 'Mutation', joinRoom?: { __typename?: 'Room', documentId: string, roomId: string, code: string, players?: any | null, phase?: Enum_Room_Phase | null, settings?: any | null, structures?: any | null, worldDescription?: string | null, history?: any | null } | null };

export type UpdateRoomMutationVariables = Exact<{
  documentId: Scalars['ID']['input'];
  data: RoomInput;
}>;


export type UpdateRoomMutation = { __typename?: 'Mutation', updateRoom?: { __typename?: 'Room', documentId: string, settings?: any | null } | null };

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
}>;


export type SubmitActionMutation = { __typename?: 'Mutation', submitAction?: any | null };

export type GenerateAvatarPortraitMutationVariables = Exact<{
  payload: Scalars['JSON']['input'];
  referenceImage?: InputMaybe<Scalars['String']['input']>;
}>;


export type GenerateAvatarPortraitMutation = { __typename?: 'Mutation', generateAvatarPortrait?: any | null };

export type GetRoomQueryVariables = Exact<{
  filters?: InputMaybe<RoomFiltersInput>;
}>;


export type GetRoomQuery = { __typename?: 'Query', rooms: Array<{ __typename?: 'Room', documentId: string, roomId: string, code: string, phase?: Enum_Room_Phase | null, players?: any | null, settings?: any | null, structures?: any | null, worldDescription?: string | null, history?: any | null } | null> };

export type ListRoomsQueryVariables = Exact<{
  filters?: InputMaybe<RoomFiltersInput>;
}>;


export type ListRoomsQuery = { __typename?: 'Query', rooms: Array<{ __typename?: 'Room', documentId: string, roomId: string, code: string, phase?: Enum_Room_Phase | null, players?: any | null } | null> };


export const CreateRoomDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateRoom"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"data"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RoomInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createRoom"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"data"},"value":{"kind":"Variable","name":{"kind":"Name","value":"data"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"roomId"}},{"kind":"Field","name":{"kind":"Name","value":"code"}}]}}]}}]} as unknown as DocumentNode<CreateRoomMutation, CreateRoomMutationVariables>;
export const JoinRoomDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"JoinRoom"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"code"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"joinRoom"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"code"},"value":{"kind":"Variable","name":{"kind":"Name","value":"code"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"roomId"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"players"}},{"kind":"Field","name":{"kind":"Name","value":"phase"}},{"kind":"Field","name":{"kind":"Name","value":"settings"}},{"kind":"Field","name":{"kind":"Name","value":"structures"}},{"kind":"Field","name":{"kind":"Name","value":"worldDescription"}},{"kind":"Field","name":{"kind":"Name","value":"history"}}]}}]}}]} as unknown as DocumentNode<JoinRoomMutation, JoinRoomMutationVariables>;
export const UpdateRoomDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateRoom"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"documentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"data"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RoomInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateRoom"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"documentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"documentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"data"},"value":{"kind":"Variable","name":{"kind":"Name","value":"data"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"settings"}}]}}]}}]} as unknown as DocumentNode<UpdateRoomMutation, UpdateRoomMutationVariables>;
export const GenerateWorldDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GenerateWorld"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"roomId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"language"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"generateWorld"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"roomId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"roomId"}}},{"kind":"Argument","name":{"kind":"Name","value":"language"},"value":{"kind":"Variable","name":{"kind":"Name","value":"language"}}}]}]}}]} as unknown as DocumentNode<GenerateWorldMutation, GenerateWorldMutationVariables>;
export const AddCharacterDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddCharacter"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"roomId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"character"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"JSON"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addCharacter"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"roomId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"roomId"}}},{"kind":"Argument","name":{"kind":"Name","value":"character"},"value":{"kind":"Variable","name":{"kind":"Name","value":"character"}}}]}]}}]} as unknown as DocumentNode<AddCharacterMutation, AddCharacterMutationVariables>;
export const StartGameDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"StartGame"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"roomId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"language"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"startGame"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"roomId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"roomId"}}},{"kind":"Argument","name":{"kind":"Name","value":"language"},"value":{"kind":"Variable","name":{"kind":"Name","value":"language"}}},{"kind":"Argument","name":{"kind":"Name","value":"streamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"streamId"}}}]}]}}]} as unknown as DocumentNode<StartGameMutation, StartGameMutationVariables>;
export const SubmitActionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SubmitAction"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"roomId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"action"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"submitAction"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"roomId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"roomId"}}},{"kind":"Argument","name":{"kind":"Name","value":"action"},"value":{"kind":"Variable","name":{"kind":"Name","value":"action"}}}]}]}}]} as unknown as DocumentNode<SubmitActionMutation, SubmitActionMutationVariables>;
export const GenerateAvatarPortraitDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GenerateAvatarPortrait"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"payload"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"JSON"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"referenceImage"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"generateAvatarPortrait"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"payload"},"value":{"kind":"Variable","name":{"kind":"Name","value":"payload"}}},{"kind":"Argument","name":{"kind":"Name","value":"referenceImage"},"value":{"kind":"Variable","name":{"kind":"Name","value":"referenceImage"}}}]}]}}]} as unknown as DocumentNode<GenerateAvatarPortraitMutation, GenerateAvatarPortraitMutationVariables>;
export const GetRoomDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetRoom"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"RoomFiltersInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rooms"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"roomId"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"phase"}},{"kind":"Field","name":{"kind":"Name","value":"players"}},{"kind":"Field","name":{"kind":"Name","value":"settings"}},{"kind":"Field","name":{"kind":"Name","value":"structures"}},{"kind":"Field","name":{"kind":"Name","value":"worldDescription"}},{"kind":"Field","name":{"kind":"Name","value":"history"}}]}}]}}]} as unknown as DocumentNode<GetRoomQuery, GetRoomQueryVariables>;
export const ListRoomsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListRooms"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"RoomFiltersInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rooms"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"roomId"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"phase"}},{"kind":"Field","name":{"kind":"Name","value":"players"}}]}}]}}]} as unknown as DocumentNode<ListRoomsQuery, ListRoomsQueryVariables>;