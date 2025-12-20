import { gql } from '@apollo/client';

const PAGINATION_FRAGMENT = gql`
  fragment PaginationFragment on Pagination {
    total
    page
    pageSize
    pageCount
  }
`;

export const EXPLORER_GET_CLASSES = gql`
  query ExplorerGetClasses($pagination: PaginationArg, $filters: ClassFiltersInput, $locale: I18NLocaleCode) {
    classes_connection(pagination: $pagination, filters: $filters, locale: $locale) {
      nodes {
        documentId
        slug
        name
        description
        image {
          url
          alternativeText
        }
      }
      pageInfo {
        ...PaginationFragment
      }
    }
  }
  ${PAGINATION_FRAGMENT}
`;

export const EXPLORER_GET_DAMAGE_TYPES = gql`
  query ExplorerGetDamageTypes($pagination: PaginationArg, $filters: DamageTypeFiltersInput, $locale: I18NLocaleCode) {
    damageTypes_connection(pagination: $pagination, filters: $filters, locale: $locale) {
      nodes {
        documentId
        slug
        name
        description
        image {
          url
          alternativeText
        }
      }
      pageInfo {
        ...PaginationFragment
      }
    }
  }
  ${PAGINATION_FRAGMENT}
`;

export const EXPLORER_GET_EQUIPMENT = gql`
  query ExplorerGetEquipment($pagination: PaginationArg, $filters: EquipmentFiltersInput, $locale: I18NLocaleCode) {
    equipments_connection(pagination: $pagination, filters: $filters, locale: $locale) {
      nodes {
        documentId
        slug
        name
        description
        image {
          url
          alternativeText
        }
        cost_quantity
        cost_unit
        weight
      }
      pageInfo {
        ...PaginationFragment
      }
    }
  }
  ${PAGINATION_FRAGMENT}
`;

export const EXPLORER_GET_EQUIPMENT_CATEGORIES = gql`
  query ExplorerGetEquipmentCategories(
    $pagination: PaginationArg
    $filters: EquipmentCategoryFiltersInput
    $locale: I18NLocaleCode
  ) {
    equipmentCategories_connection(pagination: $pagination, filters: $filters, locale: $locale) {
      nodes {
        documentId
        slug
        name
        description
        image {
          url
          alternativeText
        }
      }
      pageInfo {
        ...PaginationFragment
      }
    }
  }
  ${PAGINATION_FRAGMENT}
`;

export const EXPLORER_GET_FEATURES = gql`
  query ExplorerGetFeatures($pagination: PaginationArg, $filters: FeatureFiltersInput, $locale: I18NLocaleCode) {
    features_connection(pagination: $pagination, filters: $filters, locale: $locale) {
      nodes {
        documentId
        name
        description
        image {
          url
          alternativeText
        }
        level
      }
      pageInfo {
        ...PaginationFragment
      }
    }
  }
  ${PAGINATION_FRAGMENT}
`;

export const EXPLORER_GET_LANGUAGES = gql`
  query ExplorerGetLanguages($pagination: PaginationArg, $filters: LanguageFiltersInput, $locale: I18NLocaleCode) {
    languages_connection(pagination: $pagination, filters: $filters, locale: $locale) {
      nodes {
        documentId
        name
        image {
          url
          alternativeText
        }
        note
      }
      pageInfo {
        ...PaginationFragment
      }
    }
  }
  ${PAGINATION_FRAGMENT}
`;

export const EXPLORER_GET_MAGIC_ITEMS = gql`
  query ExplorerGetMagicItems($pagination: PaginationArg, $filters: MagicItemFiltersInput, $locale: I18NLocaleCode) {
    magicItems_connection(pagination: $pagination, filters: $filters, locale: $locale) {
      nodes {
        documentId
        slug
        name
        description
        image {
          url
          alternativeText
        }
        rarity
        attunement_required
      }
      pageInfo {
        ...PaginationFragment
      }
    }
  }
  ${PAGINATION_FRAGMENT}
`;

export const EXPLORER_GET_MAGIC_SCHOOLS = gql`
  query ExplorerGetMagicSchools(
    $pagination: PaginationArg
    $filters: MagicSchoolFiltersInput
    $locale: I18NLocaleCode
  ) {
    magicSchools_connection(pagination: $pagination, filters: $filters, locale: $locale) {
      nodes {
        documentId
        name
        description
        image {
          url
          alternativeText
        }
      }
      pageInfo {
        ...PaginationFragment
      }
    }
  }
  ${PAGINATION_FRAGMENT}
`;

export const EXPLORER_GET_MONSTERS = gql`
  query ExplorerGetMonsters($pagination: PaginationArg, $filters: MonsterFiltersInput, $locale: I18NLocaleCode) {
    monsters_connection(pagination: $pagination, filters: $filters, locale: $locale) {
      nodes {
        documentId
        name
        image {
          url
          alternativeText
        }
        size
        type
        alignment
        challenge_rating
      }
      pageInfo {
        ...PaginationFragment
      }
    }
  }
  ${PAGINATION_FRAGMENT}
`;

export const EXPLORER_GET_PROFICIENCIES = gql`
  query ExplorerGetProficiencies(
    $pagination: PaginationArg
    $filters: ProficiencyFiltersInput
    $locale: I18NLocaleCode
  ) {
    proficiencies_connection(pagination: $pagination, filters: $filters, locale: $locale) {
      nodes {
        documentId
        name
        image {
          url
          alternativeText
        }
        type
      }
      pageInfo {
        ...PaginationFragment
      }
    }
  }
  ${PAGINATION_FRAGMENT}
`;

export const EXPLORER_GET_RACES = gql`
  query ExplorerGetRaces($pagination: PaginationArg, $filters: RaceFiltersInput, $locale: I18NLocaleCode) {
    races_connection(pagination: $pagination, filters: $filters, locale: $locale) {
      nodes {
        documentId
        slug
        name
        description
        image {
          url
          alternativeText
        }
        size
        speed
      }
      pageInfo {
        ...PaginationFragment
      }
    }
  }
  ${PAGINATION_FRAGMENT}
`;

export const EXPLORER_GET_SPELLS = gql`
  query ExplorerGetSpells($pagination: PaginationArg, $filters: SpellFiltersInput, $locale: I18NLocaleCode) {
    spells_connection(pagination: $pagination, filters: $filters, locale: $locale) {
      nodes {
        documentId
        slug
        name
        description
        image {
          url
          alternativeText
        }
        level
        school
        casting_time
        range
      }
      pageInfo {
        ...PaginationFragment
      }
    }
  }
  ${PAGINATION_FRAGMENT}
`;

export const EXPLORER_GET_SUBCLASSES = gql`
  query ExplorerGetSubclasses($pagination: PaginationArg, $filters: SubclassFiltersInput, $locale: I18NLocaleCode) {
    subclasses_connection(pagination: $pagination, filters: $filters, locale: $locale) {
      nodes {
        documentId
        slug
        name
        description
        image {
          url
          alternativeText
        }
        subclass_flavor
      }
      pageInfo {
        ...PaginationFragment
      }
    }
  }
  ${PAGINATION_FRAGMENT}
`;

export const EXPLORER_GET_TRAITS = gql`
  query ExplorerGetTraits($pagination: PaginationArg, $filters: TraitFiltersInput, $locale: I18NLocaleCode) {
    traits_connection(pagination: $pagination, filters: $filters, locale: $locale) {
      nodes {
        documentId
        slug
        name
        description
        image {
          url
          alternativeText
        }
      }
      pageInfo {
        ...PaginationFragment
      }
    }
  }
  ${PAGINATION_FRAGMENT}
`;

export const EXPLORER_GET_WEAPON_PROPERTIES = gql`
  query ExplorerGetWeaponProperties(
    $pagination: PaginationArg
    $filters: WeaponPropertyFiltersInput
    $locale: I18NLocaleCode
  ) {
    weaponProperties_connection(pagination: $pagination, filters: $filters, locale: $locale) {
      nodes {
        documentId
        slug
        name
        description
        image {
          url
          alternativeText
        }
      }
      pageInfo {
        ...PaginationFragment
      }
    }
  }
  ${PAGINATION_FRAGMENT}
`;
