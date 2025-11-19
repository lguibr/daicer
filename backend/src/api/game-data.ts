/**
 * Game Data API endpoints
 * Provides access to D&D 5e SRD data for the frontend
 * Now powered by Firestore with caching
 */

import { Router } from 'express';
import {
  getAlignments,
  getAbilities,
  getSkills,
  getRaces,
  getClasses,
  getBackgrounds,
  getLanguages,
  getMagicSchools,
  getConditions,
  getDamageTypes,
  getEquipmentCategories,
  getEquipment,
  getWeaponProperties,
  getMonsters,
  getMonster,
  getMagicItems,
  getMagicItem,
  getFeatures,
  getFeature,
  getTraits,
  getTrait,
  getSubclasses,
  getSubclass,
  getProficiencies,
  getProficiency,
  getRules,
  getRule,
  getRuleSections,
  getRuleSection,
} from '@/services/game-data';
import {
  generateCharacterFromArchetype,
  getAvailableArchetypes,
  getArchetypeInfo,
} from '@/services/character-templates';
import { successResponse } from '@/utils/response';

const router = Router();

/**
 * GET /api/game-data/alignments
 * Get all character alignments
 */
router.get('/alignments', async (_req, res) => {
  try {
    const data = await getAlignments();
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alignments' });
  }
});

/**
 * GET /api/game-data/alignments/:id
 * Get a specific alignment by ID
 */
router.get('/alignments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getAlignments();
    const alignment = data.find((a: any) => a.index === id || a.id === id);
    if (!alignment) {
      res.status(404).json({ error: 'Alignment not found' });
      return;
    }
    res.json(successResponse(alignment));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alignment' });
  }
});

/**
 * GET /api/game-data/abilities
 * Get all ability scores
 */
router.get('/abilities', async (_req, res) => {
  try {
    const data = await getAbilities();
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch abilities' });
  }
});

/**
 * GET /api/game-data/ability-scores
 * Alias for /abilities
 */
router.get('/ability-scores', async (_req, res) => {
  try {
    const data = await getAbilities();
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ability scores' });
  }
});

/**
 * GET /api/game-data/ability-scores/:id
 * Get a specific ability score by ID
 */
router.get('/ability-scores/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getAbilities();
    const ability = data.find((a: any) => a.index === id || a.id === id);
    if (!ability) {
      res.status(404).json({ error: 'Ability score not found' });
      return;
    }
    res.json(successResponse(ability));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ability score' });
  }
});

/**
 * GET /api/game-data/skills
 * Get all skills
 */
router.get('/skills', async (_req, res) => {
  try {
    const data = await getSkills();
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch skills' });
  }
});

/**
 * GET /api/game-data/skills/:id
 * Get a specific skill by ID
 */
router.get('/skills/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getSkills();
    const skill = data.find((s: any) => s.index === id || s.id === id);
    if (!skill) {
      res.status(404).json({ error: 'Skill not found' });
      return;
    }
    res.json(successResponse(skill));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch skill' });
  }
});

/**
 * GET /api/game-data/races
 * Get all player races
 */
router.get('/races', async (_req, res) => {
  try {
    const data = await getRaces();
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch races' });
  }
});

/**
 * GET /api/game-data/races/:id
 * Get a specific race by ID
 */
router.get('/races/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getRaces();
    const race = data.find((r: any) => r.index === id || r.id === id);
    if (!race) {
      res.status(404).json({ error: 'Race not found' });
      return;
    }
    res.json(successResponse(race));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch race' });
  }
});

/**
 * GET /api/game-data/classes
 * Get all character classes
 */
router.get('/classes', async (_req, res) => {
  try {
    const data = await getClasses();
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

/**
 * GET /api/game-data/classes/:id
 * Get a specific class by ID
 */
router.get('/classes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getClasses();
    const classItem = data.find((c: any) => c.index === id || c.id === id);
    if (!classItem) {
      res.status(404).json({ error: 'Class not found' });
      return;
    }
    res.json(successResponse(classItem));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch class' });
  }
});

/**
 * GET /api/game-data/backgrounds
 * Get all character backgrounds
 */
router.get('/backgrounds', async (_req, res) => {
  try {
    const data = await getBackgrounds();
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch backgrounds' });
  }
});

/**
 * GET /api/game-data/backgrounds/:id
 * Get a specific background by ID
 */
router.get('/backgrounds/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getBackgrounds();
    const background = data.find((b: any) => b.index === id || b.id === id);
    if (!background) {
      res.status(404).json({ error: 'Background not found' });
      return;
    }
    res.json(successResponse(background));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch background' });
  }
});

/**
 * GET /api/game-data/languages
 * Get all languages
 */
router.get('/languages', async (_req, res) => {
  try {
    const data = await getLanguages();
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch languages' });
  }
});

/**
 * GET /api/game-data/languages/:id
 * Get a specific language by ID
 */
router.get('/languages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getLanguages();
    const language = data.find((l: any) => l.index === id || l.id === id);
    if (!language) {
      res.status(404).json({ error: 'Language not found' });
      return;
    }
    res.json(successResponse(language));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch language' });
  }
});

/**
 * GET /api/game-data/magic-schools
 * Get all schools of magic
 */
router.get('/magic-schools', async (_req, res) => {
  try {
    const data = await getMagicSchools();
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch magic schools' });
  }
});

/**
 * GET /api/game-data/magic-schools/:id
 * Get a specific magic school by ID
 */
router.get('/magic-schools/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getMagicSchools();
    const school = data.find((s: any) => s.index === id || s.id === id);
    if (!school) {
      res.status(404).json({ error: 'Magic school not found' });
      return;
    }
    res.json(successResponse(school));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch magic school' });
  }
});

/**
 * GET /api/game-data/conditions
 * Get all combat conditions
 */
router.get('/conditions', async (_req, res) => {
  try {
    const data = await getConditions();
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conditions' });
  }
});

/**
 * GET /api/game-data/conditions/:id
 * Get a specific condition by ID
 */
router.get('/conditions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getConditions();
    const condition = data.find((c: any) => c.index === id || c.id === id);
    if (!condition) {
      res.status(404).json({ error: 'Condition not found' });
      return;
    }
    res.json(successResponse(condition));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch condition' });
  }
});

/**
 * GET /api/game-data/damage-types
 * Get all damage types
 */
router.get('/damage-types', async (_req, res) => {
  try {
    const data = await getDamageTypes();
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch damage types' });
  }
});

/**
 * GET /api/game-data/damage-types/:id
 * Get a specific damage type by ID
 */
router.get('/damage-types/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getDamageTypes();
    const damageType = data.find((d: any) => d.index === id || d.id === id);
    if (!damageType) {
      res.status(404).json({ error: 'Damage type not found' });
      return;
    }
    res.json(successResponse(damageType));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch damage type' });
  }
});

/**
 * GET /api/game-data/equipment-categories
 * Get all equipment categories
 */
router.get('/equipment-categories', async (_req, res) => {
  try {
    const data = await getEquipmentCategories();
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch equipment categories' });
  }
});

/**
 * GET /api/game-data/equipment
 * Get all equipment items
 */
router.get('/equipment', async (_req, res) => {
  try {
    const data = await getEquipment();
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch equipment' });
  }
});

/**
 * GET /api/game-data/equipment/:id
 * Get a specific equipment item by ID
 */
router.get('/equipment/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getEquipment();
    const item = data.find((e: any) => e.index === id || e.id === id);
    if (!item) {
      res.status(404).json({ error: 'Equipment not found' });
      return;
    }
    res.json(successResponse(item));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch equipment' });
  }
});

/**
 * GET /api/game-data/weapons
 * Get all weapons
 */
router.get('/weapons', async (_req, res) => {
  try {
    const data = await getEquipment();
    const weapons = data.filter(
      (item: any) => item.equipment_category?.index === 'weapon' || item.equipmentCategory === 'Weapon'
    );
    res.json(successResponse(weapons));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch weapons' });
  }
});

/**
 * GET /api/game-data/weapons/:id
 * Get a specific weapon by ID
 */
router.get('/weapons/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getEquipment();
    const weapon = data.find(
      (item: any) =>
        (item.equipment_category?.index === 'weapon' || item.equipmentCategory === 'Weapon') &&
        (item.index === id || item.id === id)
    );
    if (!weapon) {
      res.status(404).json({ error: 'Weapon not found' });
      return;
    }
    res.json(successResponse(weapon));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch weapon' });
  }
});

/**
 * GET /api/game-data/armor
 * Get all armor
 */
router.get('/armor', async (_req, res) => {
  try {
    const data = await getEquipment();
    const armor = data.filter(
      (item: any) => item.equipment_category?.index === 'armor' || item.equipmentCategory === 'Armor'
    );
    res.json(successResponse(armor));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch armor' });
  }
});

/**
 * GET /api/game-data/armor/:id
 * Get a specific armor by ID
 */
router.get('/armor/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getEquipment();
    const armorItem = data.find(
      (item: any) =>
        (item.equipment_category?.index === 'armor' || item.equipmentCategory === 'Armor') &&
        (item.index === id || item.id === id)
    );
    if (!armorItem) {
      res.status(404).json({ error: 'Armor not found' });
      return;
    }
    res.json(successResponse(armorItem));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch armor' });
  }
});

/**
 * GET /api/game-data/weapon-properties
 * Get all weapon properties
 */
router.get('/weapon-properties', async (_req, res) => {
  try {
    const data = await getWeaponProperties();
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch weapon properties' });
  }
});

/**
 * GET /api/game-data/character-templates
 * Get list of available pre-made character templates
 */
router.get('/character-templates', async (_req, res) => {
  try {
    const archetypes = getAvailableArchetypes();
    const templates = archetypes.map((key) => ({
      id: key,
      ...getArchetypeInfo(key),
    }));
    res.json(successResponse(templates));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch character templates' });
  }
});

/**
 * GET /api/game-data/character-templates/:archetype
 * Generate a complete character from a template
 */
router.get('/character-templates/:archetype', async (req, res) => {
  try {
    const { archetype } = req.params;
    const character = generateCharacterFromArchetype(archetype);
    res.json(successResponse(character));
  } catch (error) {
    res.status(404).json({ error: 'Template not found' });
  }
});

/**
 * GET /api/game-data/monsters
 * Get all monsters
 */
router.get('/monsters', async (_req, res) => {
  try {
    const data = await getMonsters();
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch monsters' });
  }
});

/**
 * GET /api/game-data/monsters/:id
 * Get a specific monster by ID
 */
router.get('/monsters/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getMonster(id);
    if (!data) {
      res.status(404).json({ error: 'Monster not found' });
      return;
    }
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch monster' });
  }
});

/**
 * GET /api/game-data/magic-items
 * Get all magic items
 */
router.get('/magic-items', async (_req, res) => {
  try {
    const data = await getMagicItems();
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch magic items' });
  }
});

/**
 * GET /api/game-data/magic-items/:id
 * Get a specific magic item by ID
 */
router.get('/magic-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getMagicItem(id);
    if (!data) {
      res.status(404).json({ error: 'Magic item not found' });
      return;
    }
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch magic item' });
  }
});

/**
 * GET /api/game-data/features
 * Get all class features
 */
router.get('/features', async (_req, res) => {
  try {
    const data = await getFeatures();
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch features' });
  }
});

/**
 * GET /api/game-data/features/:id
 * Get a specific feature by ID
 */
router.get('/features/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getFeature(id);
    if (!data) {
      res.status(404).json({ error: 'Feature not found' });
      return;
    }
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch feature' });
  }
});

/**
 * GET /api/game-data/traits
 * Get all racial traits
 */
router.get('/traits', async (_req, res) => {
  try {
    const data = await getTraits();
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch traits' });
  }
});

/**
 * GET /api/game-data/traits/:id
 * Get a specific trait by ID
 */
router.get('/traits/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getTrait(id);
    if (!data) {
      res.status(404).json({ error: 'Trait not found' });
      return;
    }
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trait' });
  }
});

/**
 * GET /api/game-data/subclasses
 * Get all subclasses
 */
router.get('/subclasses', async (_req, res) => {
  try {
    const data = await getSubclasses();
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subclasses' });
  }
});

/**
 * GET /api/game-data/subclasses/:id
 * Get a specific subclass by ID
 */
router.get('/subclasses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getSubclass(id);
    if (!data) {
      res.status(404).json({ error: 'Subclass not found' });
      return;
    }
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subclass' });
  }
});

/**
 * GET /api/game-data/proficiencies
 * Get all proficiencies
 */
router.get('/proficiencies', async (_req, res) => {
  try {
    const data = await getProficiencies();
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch proficiencies' });
  }
});

/**
 * GET /api/game-data/proficiencies/:id
 * Get a specific proficiency by ID
 */
router.get('/proficiencies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getProficiency(id);
    if (!data) {
      res.status(404).json({ error: 'Proficiency not found' });
      return;
    }
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch proficiency' });
  }
});

/**
 * GET /api/game-data/rules
 * Get all rules from SRD
 */
router.get('/rules', async (_req, res) => {
  try {
    const data = getRules();
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rules' });
  }
});

/**
 * GET /api/game-data/rules/:id
 * Get a specific rule by ID
 */
router.get('/rules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = getRule(id);
    if (!data) {
      res.status(404).json({ error: 'Rule not found' });
      return;
    }
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rule' });
  }
});

/**
 * GET /api/game-data/rule-sections
 * Get all rule sections (categories)
 */
router.get('/rule-sections', async (_req, res) => {
  try {
    const data = getRuleSections();
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rule sections' });
  }
});

/**
 * GET /api/game-data/rule-sections/:id
 * Get a specific rule section by ID
 */
router.get('/rule-sections/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = getRuleSection(id);
    if (!data) {
      res.status(404).json({ error: 'Rule section not found' });
      return;
    }
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rule section' });
  }
});

export default router;
