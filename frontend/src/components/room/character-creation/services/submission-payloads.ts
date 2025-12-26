import { addCharacter } from '../../../../services/api';
import { buildCharacterSheetAsset } from '../characterSheetAsset';

export const createCharacterPayload = (
  formData: any,
  startingLevel: number,
  inventory: any[],
  equippedItems: any,
  equipmentItems: any[],
  equipmentGold: number
) => {
  const conModifier = Math.floor(((formData.attributes?.Constitution ?? 10) - 10) / 2);
  const dexModifier = Math.floor(((formData.attributes?.Dexterity ?? 10) - 10) / 2);
  const proficiencyBonus = 2;

  // Inventory mapping
  const mappedInventory = inventory
    .map((i: any) => {
      const item = equipmentItems.find((e: any) => e.index === i.itemIndex);
      return item ? { item: item.id, quantity: i.quantity, slot: 'backpack', isEquipped: false } : null;
    })
    .filter(Boolean);

  // Equipped mapping
  const mappedEquipped = Object.entries(equippedItems)
    .map(([uiSlot, itemIndex]) => {
      if (!itemIndex) return null;
      const item = equipmentItems.find((e: any) => e.index === itemIndex);
      if (!item) return null;

      let backendSlot = 'backpack';
      let isEquipped = true;
      // Simple mapping
      if (uiSlot === 'mainHand') backendSlot = 'main_hand';
      else if (uiSlot === 'offHand' || uiSlot === 'shield') backendSlot = 'off_hand';
      else if (uiSlot === 'armor') backendSlot = 'armor';
      // ... others ...
      else {
        backendSlot = 'backpack';
        isEquipped = false;
      }

      return { item: item.id, quantity: 1, slot: backendSlot, isEquipped };
    })
    .filter(Boolean);

  return {
    ...formData,
    level: startingLevel,
    xp: 0,
    hp: 10 + conModifier,
    maxHp: 10 + conModifier,
    temporaryHp: 0,
    hitDice: { total: startingLevel, current: startingLevel },
    deathSaves: { successes: 0, failures: 0 },
    armorClass: 10 + dexModifier,
    initiative: dexModifier,
    speed: 30,
    proficiencyBonus,
    inspiration: false,
    savingThrows: {
      fortitude: conModifier,
      reflex: dexModifier,
      will: Math.floor(((formData.attributes?.Wisdom ?? 10) - 10) / 2),
    },
    skills: formData.skills ?? {},
    baseAttackBonus: proficiencyBonus,
    attacks: [],
    equipment: [...mappedInventory, ...mappedEquipped],
    currency: { cp: 0, sp: 0, ep: 0, gp: equipmentGold, pp: 0 },
    proficienciesAndLanguages: '',
    features: '',
    backstory: formData.background,
    alliesAndOrganizations: '',
    treasure: '',
    spellcasting: { class: '', ability: '', saveDC: 0, attackBonus: 0, cantrips: [], spellsKnown: [], slots: [] },
  };
};

export const submitCharacter = async (
  room: any,
  payload: any,
  assetMode: boolean,
  avatarPreview: any,
  onAssetCreated: any,
  onCharacterCreated: any,
  effectiveLevel: number
) => {
  if (assetMode) {
    const asset = buildCharacterSheetAsset({
      form: payload, // Payload has correct shape? Or needs original form data?
      // buildCharacterSheetAsset expects FormState, but Payload is flattened.
      // Ideally we reuse the utility from creating payload
      level: effectiveLevel,
      avatarPreview,
      demo: false,
      originRoomId: room?.id,
    });
    onAssetCreated?.(asset);
    return;
  }

  // Real Add
  const finalPayload = {
    ...payload,
    avatarPreview, // Backend expects this key to process uploads?
  };

  return await addCharacter(room.documentId, finalPayload);
};
