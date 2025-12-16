import { gql } from '@apollo/client';

export const GET_ABILITIES_QUERY = gql`
  query GetAbilities {
    abilities {
      documentId
      name
      fullName
      description
      skills {
        name
      }
    }
  }
`;

export const GET_SKILLS_QUERY = gql`
  query GetSkills {
    skills {
      documentId
      name
      description
      abilityScore {
        name
      }
    }
  }
`;

export const GET_RACES_QUERY = gql`
  query GetRaces {
    races {
      documentId
      name
      description
      speed
      size
      # Add other fields as needed based on schema
    }
  }
`;

export const GET_CLASSES_QUERY = gql`
  query GetClasses {
    classes {
      documentId
      name
      description
      hit_die
    }
  }
`;

export const GET_ALIGNMENTS_QUERY = gql`
  query GetAlignments {
    alignments {
      documentId
      name
      abbreviation
      description
    }
  }
`;

export const GET_BACKGROUNDS_QUERY = gql`
  query GetBackgrounds {
    backgrounds {
      documentId
      name
      description
      skillProficiencies {
        name
      }
    }
  }
`;

export const GET_LANGUAGES_QUERY = gql`
  query GetLanguages {
    languages {
      documentId
      name
      note
    }
  }
`;

export const GET_MAGIC_SCHOOLS_QUERY = gql`
  query GetMagicSchools {
    magicSchools {
      documentId
      name
      description
    }
  }
`;

export const GET_CONDITIONS_QUERY = gql`
  query GetConditions {
    conditions {
      documentId
      name
      description
    }
  }
`;

export const GET_DAMAGE_TYPES_QUERY = gql`
  query GetDamageTypes {
    damageTypes {
      documentId
      name
      description
    }
  }
`;

export const GET_EQUIPMENT_QUERY = gql`
  query GetEquipment {
    equipments {
      documentId
      name
      cost_quantity
      cost_unit
      weight
      description
      damage_dice
      damage_type {
        name
      }
      equipment_category {
        name
      }
      properties {
        name
      }
      range_normal
      range_long
      armor_class_base
      armor_class_dex_bonus
    }
  }
`;

export const GET_MONSTERS_QUERY = gql`
  query GetMonsters {
    monsters {
      documentId
      name
      size
      type
      alignment
      hp
      ac
      speed
      challenge_rating
    }
  }
`;

export const GET_SPELLS_QUERY = gql`
  query GetSpells {
    spells {
      documentId
      name
      level
      school
      casting_time
      range
      components
      duration
      is_ritual
      description
    }
  }
`;

export const GET_FEATURES_QUERY = gql`
  query GetFeatures {
    features {
      documentId
      name
      level
      description
    }
  }
`;

export const GET_TRAITS_QUERY = gql`
  query GetTraits {
    traits {
      documentId
      name
      description
      races {
        name
      }
    }
  }
`;

export const GET_SUBCLASSES_QUERY = gql`
  query GetSubclasses {
    subclasses {
      documentId
      name
      description
      class {
        name
      }
    }
  }
`;

export const GET_PROFICIENCIES_QUERY = gql`
  query GetProficiencies {
    proficiencies {
      documentId
      name
      type
      classes {
        name
      }
      races {
        name
      }
    }
  }
`;
