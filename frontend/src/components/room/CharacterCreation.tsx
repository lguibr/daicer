import { useState, useMemo, useCallback, useEffect } from 'react';
import { Package, ShoppingCart, Backpack, Shield, Check } from 'lucide-react';
import clsx from 'clsx';
import type { AvatarPreviewResponse, ReferenceImagePayload } from '../../types/assets';
import type { Room, Attribute } from '../../types/models';
import { GamePhase } from '../../types/models';
import {
  addCharacter,
  generateAvatarPortrait,
  generateAvatarUpperBody,
  generateAvatarFullBody,
} from '../../services/api';
import { generateRandomCharacter } from '../../services/characterGenerator';
import useAuth from '../../hooks/useAuth';
import MarkdownMessage from '../game/MarkdownMessage';
import { useAlignments, useRaces, useClasses } from '../../hooks/useGameData';
import { getEquipment } from '../../services/game-data';
import { Button } from '../ui/button';
import { LoadingOverlay } from '../ui/LoadingOverlay';
import Textarea from '../ui/textarea';
import { DiceLoader } from '../ui/dice-loader';
import { useI18n } from '../../i18n';
import type { CharacterCreationProps, CharacterFormState } from './character-creation/types';
import { AttributesSection } from './character-creation/AttributesSection';
import { AppearanceSection } from './character-creation/AppearanceSection';
import { PersonalitySection } from './character-creation/PersonalitySection';
import { AvatarSection } from './character-creation/AvatarSection';
import { EquipmentShop } from '../equipment/EquipmentShop';
import type { EquipmentItemData } from '../equipment/EquipmentItemCard';
import { calculateTotalPoints } from './character-creation/validation';
import {
  loadPlaceholderReferences,
  buildAvatarPayload,
  appendReference,
  downscalePreviewImage,
} from './character-creation/avatarHelpers';
import { StepValidationGate, RaceSelectionGrid, formatAlignmentOption } from './character-creation/helpers';
import { EpicClassSelectionGrid } from './character-creation/EpicClassCards';
import {
  FormWizard,
  FormWizardSteps,
  FormWizardContent,
  FormWizardStep,
  FormWizardActions,
  type Step,
} from '../ui/FormWizard';
import { type ToggleButtonOption } from '../ui/ToggleButtonGroup';
import { buildCharacterSheetAsset } from './character-creation/characterSheetAsset';

type RaceOption = {
  id: string;
  name: string;
  description?: string;
  size?: string;
  speed?: number;
};

export default function CharacterCreation({
  room,
  players = [],
  assetMode = false,
  settings,
  onAssetCreated,
  onCharacterCreated,
}: CharacterCreationProps) {
  const { user } = useAuth();
  const { t, localize } = useI18n();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<Partial<AvatarPreviewResponse>>({});
  const [placeholderRefs, setPlaceholderRefs] = useState<Partial<
    Record<keyof AvatarPreviewResponse, ReferenceImagePayload>
  > | null>(null);
  const [placeholderDimensions, setPlaceholderDimensions] = useState<
    Partial<Record<keyof AvatarPreviewResponse, { width: number; height: number }>>
  >({});
  const [previewLoadState, setPreviewLoadState] = useState<Record<keyof AvatarPreviewResponse, boolean>>({
    portrait: false,
    upperBody: false,
    fullBody: false,
  });
  // const [previewLoading, setPreviewLoading] = useState(false);
  // const [placeholderLoading, setPlaceholderLoading] = useState(false);
  // const { isBusy: previewBusy } = useDebouncedBusy(previewLoading, { enterDelayMs: 180 });

  const allReady = !assetMode && players.length > 0 && players.every((p) => p.isReady);

  // GATE: If locked and not in asset mode, show approval screens - REMOVED for auto-unlock
  // if (!assetMode && isLocked) { ... }

  const { data: alignments, loading: alignmentsLoading } = useAlignments();
  const { data: races, loading: racesLoading } = useRaces();
  const { data: classes, loading: classesLoading } = useClasses();
  const dataLoading = alignmentsLoading || racesLoading || classesLoading;

  const hasCharacter = !assetMode && !!players.find((p) => p.userId === user?.uid)?.character;

  const startingLevel = settings?.startingLevel || room?.settings?.startingLevel || 1;
  const attributeBudget = settings?.attributeBudget || room?.settings?.attributePointBudget || 27;
  const [customLevel, setCustomLevel] = useState(startingLevel);
  const effectiveLevel = assetMode ? customLevel : startingLevel;

  useEffect(() => {
    if (!assetMode) {
      setCustomLevel(startingLevel);
    }
  }, [assetMode, startingLevel]);

  const [formData, setFormData] = useState<CharacterFormState>({
    name: '',
    race: 'Human',
    characterClass: 'Fighter',
    background: '',
    alignment: 'Neutral Good',
    attributes: { Strength: 8, Dexterity: 8, Constitution: 8, Intelligence: 8, Wisdom: 8, Charisma: 8 },
    skills: {},
    equipment: '',
    proficienciesAndLanguages: '',
    features: '',
    treasure: '',
    currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
    resourcePools: [],
    talents: [],
    expertises: [],
    appearance: { age: '', height: '', weight: '', eyes: '', skin: '', hair: '', description: '', gender: '' },
    personality: { traits: '', ideals: '', bonds: '', flaws: '' },
  });

  // Reference image state - REMOVED in favor of direct slot manipulation
  // const [referenceImage, setReferenceImage] = useState<string | null>(null);

  // Equipment state management
  const [equipmentItems, setEquipmentItems] = useState<EquipmentItemData[]>([]);
  const [equipmentChoice, setEquipmentChoice] = useState<'pack' | 'gold' | null>(null); // NEW: Track choice
  const [equipmentGold, setEquipmentGold] = useState(0);
  const [inventory, setInventory] = useState<Array<{ itemIndex: string; quantity: number }>>([]);

  // Equipped items state (for shop display)
  const [equippedItems, setEquippedItems] = useState<Record<string, string | null>>({
    mainHand: null,
    offHand: null,
    armor: null,
    shield: null,
    accessory1: null,
    accessory2: null,
  });

  // Fetch equipment items on mount
  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const items = await getEquipment();
        setEquipmentItems(items);
      } catch (err) {
        console.error('Failed to load equipment:', err);
      }
    };
    fetchEquipment();
  }, []);

  // Set initial gold based on class
  useEffect(() => {
    if (formData.characterClass) {
      // In asset mode, start with unlimited gold; in game mode, start with class-based gold
      setEquipmentGold(assetMode ? 9999999 : 100);
    }
  }, [formData.characterClass, assetMode]);

  // Equipment handlers
  const handleBuyItem = (itemIndex: string) => {
    const item = equipmentItems.find((i) => i.index === itemIndex);
    if (!item) return;

    // In asset mode, don't deduct gold
    if (assetMode) {
      const existingIndex = inventory.findIndex((i) => i.itemIndex === itemIndex);
      if (existingIndex !== -1) {
        const newInventory = [...inventory];
        const existingItem = newInventory[existingIndex];
        if (existingItem) {
          existingItem.quantity += 1;
          setInventory(newInventory);
        }
      } else {
        setInventory([...inventory, { itemIndex, quantity: 1 }]);
      }
    } else {
      // Game mode: deduct gold
      const cost = item.cost?.quantity || 0;
      if (equipmentGold >= cost) {
        setEquipmentGold(equipmentGold - cost);
        const existingIndex = inventory.findIndex((i) => i.itemIndex === itemIndex);
        if (existingIndex !== -1) {
          const newInventory = [...inventory];
          const existingItem = newInventory[existingIndex];
          if (existingItem) {
            existingItem.quantity += 1;
            setInventory(newInventory);
          }
        } else {
          setInventory([...inventory, { itemIndex, quantity: 1 }]);
        }
      }
    }
  };

  const handleBuyStartingPack = () => {
    // Add starting pack items for the class
    // For now, just give 50gp worth of items as placeholder
    setEquipmentGold(assetMode ? 9999999 : equipmentGold + 50);
  };

  const handleEquipItem = (itemIndex: string, slot: string) => {
    // Check if item is in inventory
    const inInventory = inventory.find((i) => i.itemIndex === itemIndex);
    if (!inInventory) return;

    // Unequip current item in slot (if any)
    const currentItem = equippedItems[slot];
    if (currentItem) {
      // Return to inventory
      const existingIndex = inventory.findIndex((i) => i.itemIndex === currentItem);
      const newInv = [...inventory];
      const existingItem = newInv[existingIndex];
      if (existingIndex !== -1 && existingItem) {
        existingItem.quantity += 1;
      } else {
        newInv.push({ itemIndex: currentItem, quantity: 1 });
      }
      setInventory(newInv);
    }

    // Equip new item
    setEquippedItems({ ...equippedItems, [slot]: itemIndex });

    // Remove from inventory
    const newInventory = inventory
      .map((i) => (i.itemIndex === itemIndex ? { ...i, quantity: i.quantity - 1 } : i))
      .filter((i) => i.quantity > 0);
    setInventory(newInventory);
  };

  const handleUnequipItem = (slot: string) => {
    const itemIndex = equippedItems[slot];
    if (!itemIndex) return;

    // Add back to inventory
    const existingIndex = inventory.findIndex((i) => i.itemIndex === itemIndex);
    const newInv = [...inventory];
    const existingItem = newInv[existingIndex];
    if (existingIndex !== -1 && existingItem) {
      existingItem.quantity += 1;
    } else {
      newInv.push({ itemIndex, quantity: 1 });
    }
    setInventory(newInv);

    // Unequip
    setEquippedItems({ ...equippedItems, [slot]: null });
  };

  const handleChooseStartingPack = () => {
    setEquipmentChoice('pack');
    setEquipmentGold(50); // Pack + 50g bonus

    // Auto-add class-specific starting pack items
    const className = formData.characterClass;
    const packItems: { itemIndex: string; quantity: number; autoEquip?: boolean; slot?: string }[] = [];

    // Define starting packs based on class
    switch (className) {
      case 'Fighter':
      case 'Paladin':
        packItems.push(
          { itemIndex: 'longsword', quantity: 1, autoEquip: true, slot: 'mainHand' },
          { itemIndex: 'shield', quantity: 1, autoEquip: true, slot: 'shield' },
          { itemIndex: 'chain-mail', quantity: 1, autoEquip: true, slot: 'armor' },
          { itemIndex: 'dagger', quantity: 2 }
        );
        break;
      case 'Cleric':
        packItems.push(
          { itemIndex: 'club', quantity: 1, autoEquip: true, slot: 'mainHand' },
          { itemIndex: 'shield', quantity: 1, autoEquip: true, slot: 'shield' },
          { itemIndex: 'chain-mail', quantity: 1, autoEquip: true, slot: 'armor' },
          { itemIndex: 'dagger', quantity: 1 }
        );
        break;
      case 'Ranger':
        packItems.push(
          { itemIndex: 'longbow', quantity: 1, autoEquip: true, slot: 'mainHand' },
          { itemIndex: 'leather', quantity: 1, autoEquip: true, slot: 'armor' },
          { itemIndex: 'dagger', quantity: 2 }
        );
        break;
      case 'Rogue':
        packItems.push(
          { itemIndex: 'dagger', quantity: 2, autoEquip: true, slot: 'mainHand' },
          { itemIndex: 'leather', quantity: 1, autoEquip: true, slot: 'armor' },
          { itemIndex: 'shortbow', quantity: 1 }
        );
        break;
      case 'Wizard':
      case 'Sorcerer':
      case 'Warlock':
        packItems.push(
          { itemIndex: 'dagger', quantity: 2, autoEquip: true, slot: 'mainHand' },
          { itemIndex: 'padded', quantity: 1, autoEquip: true, slot: 'armor' }
        );
        break;
      case 'Barbarian':
        packItems.push(
          { itemIndex: 'greataxe', quantity: 1, autoEquip: true, slot: 'mainHand' },
          { itemIndex: 'padded', quantity: 1, autoEquip: true, slot: 'armor' },
          { itemIndex: 'dagger', quantity: 2 }
        );
        break;
      case 'Bard':
        packItems.push(
          { itemIndex: 'dagger', quantity: 1, autoEquip: true, slot: 'mainHand' },
          { itemIndex: 'leather', quantity: 1, autoEquip: true, slot: 'armor' }
        );
        break;
      case 'Druid':
        packItems.push(
          { itemIndex: 'club', quantity: 1, autoEquip: true, slot: 'mainHand' },
          { itemIndex: 'leather', quantity: 1, autoEquip: true, slot: 'armor' }
        );
        break;
      case 'Monk':
        packItems.push({ itemIndex: 'dagger', quantity: 1, autoEquip: true, slot: 'mainHand' });
        break;
      default:
        // Fallback: basic gear
        packItems.push(
          { itemIndex: 'dagger', quantity: 1, autoEquip: true, slot: 'mainHand' },
          { itemIndex: 'leather', quantity: 1, autoEquip: true, slot: 'armor' }
        );
    }

    // Apply pack items
    const newEquipped = { ...equippedItems };
    const newInventory = [...inventory];

    packItems.forEach(({ itemIndex, quantity, autoEquip, slot }) => {
      if (autoEquip && slot) {
        // Auto-equip the item
        newEquipped[slot] = itemIndex;
        // Add remaining quantity to inventory if > 1
        if (quantity > 1) {
          const existingIndex = newInventory.findIndex((i) => i.itemIndex === itemIndex);
          const existingItem = newInventory[existingIndex];
          if (existingIndex !== -1 && existingItem) {
            existingItem.quantity += quantity - 1;
          } else {
            newInventory.push({ itemIndex, quantity: quantity - 1 });
          }
        }
      } else {
        // Add to inventory only
        const existingIndex = newInventory.findIndex((i) => i.itemIndex === itemIndex);
        const existingItem = newInventory[existingIndex];
        if (existingIndex !== -1 && existingItem) {
          existingItem.quantity += quantity;
        } else {
          newInventory.push({ itemIndex, quantity });
        }
      }
    });

    setEquippedItems(newEquipped);
    setInventory(newInventory);
  };

  const handleChooseFreeGold = () => {
    setEquipmentChoice('gold');
    setEquipmentGold(100); // 100g to spend freely
  };

  const pointsUsed = useMemo(() => calculateTotalPoints(formData.attributes), [formData.attributes]);
  const pointsRemaining = attributeBudget - pointsUsed;

  const updateField = (field: keyof CharacterFormState, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const setAttributeScore = useCallback(
    (attr: Attribute, rawValue: number) => {
      setFormData((prev) => {
        const currentScore = prev.attributes[attr];
        const clamped = Math.max(8, Math.min(15, Math.round(rawValue)));
        if (clamped === currentScore) return prev;

        const currentTotal = calculateTotalPoints(prev.attributes);
        const nextTotal =
          currentTotal -
          (prev.attributes?.[attr] ? calculateTotalPoints({ [attr]: prev.attributes[attr]! }) : 0) +
          calculateTotalPoints({ [attr]: clamped });
        if (nextTotal > attributeBudget) return prev;

        return { ...prev, attributes: { ...prev.attributes, [attr]: clamped } };
      });
    },
    [attributeBudget]
  );

  const updateAppearance = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, appearance: { ...prev.appearance, [field]: value } }));
  };

  const updatePersonality = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, personality: { ...prev.personality, [field]: value } }));
  };

  const ensurePlaceholderReferences = useCallback(async () => {
    if (placeholderRefs) return placeholderRefs;

    try {
      const { refs, dims } = await loadPlaceholderReferences();
      setPlaceholderRefs(refs);
      setPlaceholderDimensions(dims);
      return refs;
    } catch (e) {
      console.error('Failed to load placeholder references:', e);
      return null;
    }
  }, [placeholderRefs]);

  useEffect(() => {
    ensurePlaceholderReferences().catch((refError) => {
      console.error('Failed to prepare placeholder references', refError);
    });
  }, [ensurePlaceholderReferences]);

  const loadTemplate = async (archetype: string) => {
    try {
      setLoading(true);
      setError(null);

      // Simulate network delay for better UX
      await new Promise((resolve) => {
        setTimeout(resolve, 600);
      });

      const generated = generateRandomCharacter(archetype, formData.race);

      setFormData((prev) => ({
        ...prev,
        ...generated,
        attributes: generated.attributes as Record<string, number>, // TS coercion for loose typing
        appearance: {
          ...prev.appearance,
          ...generated.appearance,
        },
        personality: {
          ...prev.personality,
          ...generated.personality,
        },
      }));

      setAvatarPreview({});
      setPreviewLoadState({ portrait: false, upperBody: false, fullBody: false });
      setError(null);
    } catch (err) {
      console.error(err);
      setError(t('characterCreation.errors.templateFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAll = async () => {
    try {
      setError(null);

      // Ensure placeholders are loaded
      const refs = await ensurePlaceholderReferences();

      const roomForPayload: Room =
        assetMode || !room
          ? {
              documentId: 'room-char-creation',
              roomId: 'CHAR-CREATION',
              id: 'room-char-creation',
              code: 'CHAR-CREATION',
              phase: GamePhase.CHARACTER_CREATION,
              worldDescription: 'Character sheet asset creation',
              settings: null,
              ownerId: '',
              createdAt: Date.now(),
              updatedAt: Date.now(),
            }
          : room;

      const payload = buildAvatarPayload(formData, roomForPayload, startingLevel, equippedItems, equipmentItems);

      // Step 1: Generate Portrait
      setPreviewLoadState((prev) => ({ ...prev, portrait: true }));
      try {
        // Use user-uploaded/captured portrait as reference if available
        const userPortrait = avatarPreview.portrait
          ? `data:${avatarPreview.portrait.mimeType};base64,${avatarPreview.portrait.data}`
          : null;

        const portraitPayload = userPortrait
          ? payload // Don't append placeholder if user provided their own image
          : appendReference(payload, refs?.portrait); // Use placeholder only if no user image

        const portraitRaw = await generateAvatarPortrait(portraitPayload, userPortrait);
        let portrait = portraitRaw;
        try {
          portrait = await downscalePreviewImage(portraitRaw);
        } catch (e) {
          console.warn(e);
        }

        setAvatarPreview((prev) => ({ ...prev, portrait }));
        setPreviewLoadState((prev) => ({ ...prev, portrait: false }));

        // Step 2: Generate Upper Body (using portrait)
        setPreviewLoadState((prev) => ({ ...prev, upperBody: true }));

        // Use user-uploaded/captured upper body as reference if available
        const userUpper = avatarPreview.upperBody
          ? `data:${avatarPreview.upperBody.mimeType};base64,${avatarPreview.upperBody.data}`
          : null;

        const upperBodyPayload = userUpper
          ? payload // Don't append placeholder if user provided their own image
          : appendReference(payload, refs?.upperBody);

        const upperBodyRaw = await generateAvatarUpperBody(upperBodyPayload, portrait, userUpper);
        let upperBody = upperBodyRaw;
        try {
          upperBody = await downscalePreviewImage(upperBodyRaw);
        } catch (e) {
          console.warn(e);
        }

        setAvatarPreview((prev) => ({ ...prev, upperBody }));
        setPreviewLoadState((prev) => ({ ...prev, upperBody: false }));

        // Step 3: Generate Full Body (using portrait + upper body)
        setPreviewLoadState((prev) => ({ ...prev, fullBody: true }));

        // Use user-uploaded/captured full body as reference if available
        const userFull = avatarPreview.fullBody
          ? `data:${avatarPreview.fullBody.mimeType};base64,${avatarPreview.fullBody.data}`
          : null;

        const fullBodyPayload = userFull
          ? payload // Don't append placeholder if user provided their own image
          : appendReference(payload, refs?.fullBody);

        const fullBodyRaw = await generateAvatarFullBody(fullBodyPayload, portrait, upperBody, userFull);
        let fullBody = fullBodyRaw;
        try {
          fullBody = await downscalePreviewImage(fullBodyRaw);
        } catch (e) {
          console.warn(e);
        }

        setAvatarPreview((prev) => ({ ...prev, fullBody }));
        setPreviewLoadState((prev) => ({ ...prev, fullBody: false }));
      } catch (err) {
        setError(err instanceof Error ? err.message : t('characterCreation.errors.generatePortraits'));
        // Reset all loading states on error
        setPreviewLoadState({ portrait: false, upperBody: false, fullBody: false });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('characterCreation.errors.generatePortraits'));
      setPreviewLoadState({ portrait: false, upperBody: false, fullBody: false });
    }
  };

  const handleAvatarUpdate = (slot: 'portrait' | 'upperBody' | 'fullBody', base64Data: string) => {
    // Parse base64 to get mimeType and data
    const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const mimeType = matches[1];
      const data = matches[2];

      setAvatarPreview((prev) => ({
        ...prev,
        [slot]: {
          mimeType,
          data,
          prompt: 'User Upload',
          width: 512, // Default assumption
          height: 512,
        },
      }));
    }
  };

  const handleAvatarUpload = (slot: 'portrait' | 'upperBody' | 'fullBody', file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      handleAvatarUpdate(slot, base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateCharacter = async () => {
    if (assetMode) {
      // Asset mode: just create the asset and notify parent
      const asset = buildCharacterSheetAsset({
        form: formData,
        level: effectiveLevel,
        avatarPreview,
        demo: false,
        originRoomId: room?.id,
      });
      onAssetCreated?.(asset);
      return;
    }

    if (!room) {
      setError('Room not found');
      return;
    }

    if (!formData.name.trim()) {
      setError(t('characterCreation.errors.nameRequired'));
      return;
    }

    if (!formData.background.trim() || formData.background.length < 50) {
      setError(t('characterCreation.errors.backgroundShort'));
      return;
    }

    if (pointsRemaining !== 0) {
      setError(
        `${t('characterCreation.errors.pointsRequiredPrefix')} ${attributeBudget} ${t('characterCreation.errors.pointsRequiredSuffix')} (${pointsRemaining} ${t('characterCreation.errors.pointsRemainingSuffix')})`
      );
      return;
    }

    if (!avatarPreview.portrait || !avatarPreview.upperBody || !avatarPreview.fullBody) {
      setError(t('characterCreation.errors.missingPortraits'));
      return;
    }

    const { portrait, upperBody, fullBody } = avatarPreview;

    try {
      setLoading(true);
      setError(null);

      const conModifier = Math.floor(((formData.attributes?.Constitution ?? 10) - 10) / 2);
      const dexModifier = Math.floor(((formData.attributes?.Dexterity ?? 10) - 10) / 2);
      const armorClass = 10 + dexModifier;
      const proficiencyBonus = 2;

      const createdPlayer = await addCharacter(room.documentId, {
        ...formData,
        level: startingLevel,
        xp: 0,
        hp: 10 + conModifier,
        maxHp: 10 + conModifier,
        temporaryHp: 0,
        hitDice: { total: startingLevel, current: startingLevel },
        deathSaves: { successes: 0, failures: 0 },
        armorClass,
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
        equipment: [
          // Inventory items (in backpack)
          ...inventory
            .map((i) => {
              const item = equipmentItems.find((e) => e.index === i.itemIndex);
              return item
                ? {
                    item: item.id,
                    quantity: i.quantity,
                    slot: 'backpack',
                    isEquipped: false,
                  }
                : null;
            })
            .filter((i): i is NonNullable<typeof i> => i !== null),

          // Equipped items
          ...Object.entries(equippedItems)
            .map(([uiSlot, itemIndex]) => {
              if (!itemIndex) return null;
              const item = equipmentItems.find((e) => e.index === itemIndex);
              if (!item) return null;

              // Map UI slots to Backend Enum
              let backendSlot = 'backpack';
              let isEquipped = true;

              switch (uiSlot) {
                case 'mainHand':
                  backendSlot = 'main_hand';
                  break;
                case 'offHand':
                case 'shield':
                  backendSlot = 'off_hand'; // Both map to off_hand
                  break;
                case 'armor':
                  backendSlot = 'armor';
                  break;
                case 'head':
                  backendSlot = 'head';
                  break;
                case 'boots':
                  backendSlot = 'feet';
                  break;
                case 'necklace':
                  backendSlot = 'neck';
                  break;
                case 'gloves':
                  backendSlot = 'hands';
                  break;
                case 'cloak':
                  backendSlot = 'cloak';
                  break;
                case 'ring1':
                  backendSlot = 'ring_1';
                  break;
                case 'ring2':
                  backendSlot = 'ring_2';
                  break;
                case 'accessory1':
                  backendSlot = 'accessory';
                  break;
                case 'belt':
                case 'accessory2':
                default:
                  // Unsupported slots go to backpack as unequipped or just backpack
                  backendSlot = 'backpack';
                  isEquipped = false;
                  break;
              }

              return {
                item: item.id,
                quantity: 1,
                slot: backendSlot,
                isEquipped,
              };
            })
            .filter((i): i is NonNullable<typeof i> => i !== null),
        ],
        currency: { cp: 0, sp: 0, ep: 0, gp: equipmentGold, pp: 0 },
        proficienciesAndLanguages: '',
        features: '',
        backstory: formData.background,
        alliesAndOrganizations: '',
        treasure: '',
        spellcasting: {
          class: '',
          ability: '',
          saveDC: 0,
          attackBonus: 0,
          cantrips: [],
          spellsKnown: [],
          slots: [],
        },
        avatarPreview: { portrait, upperBody, fullBody },
      });
      onCharacterCreated?.(createdPlayer);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('characterCreation.errors.createFailed'));
    } finally {
      setLoading(false);
    }
  };

  const wizardSteps = useMemo<Step[]>(
    () => [
      {
        id: 'class',
        title: t('characterCreation.steps.class.title'),
        description: t('characterCreation.steps.class.description'),
      },
      {
        id: 'race',
        title: t('characterCreation.steps.race.title'),
        description: t('characterCreation.steps.race.description'),
      },
      {
        id: 'attributes',
        title: t('characterCreation.steps.attributes.title'),
        description: t('characterCreation.steps.attributes.description'),
      },
      { id: 'alignment', title: t('characterCreation.steps.alignment.title') },
      { id: 'identity', title: t('characterCreation.steps.identity.title') },
      {
        id: 'equipment',
        title: t('characterCreation.steps.equipment.title'),
        description: t('characterCreation.steps.equipment.description'),
      },
      { id: 'visuals', title: 'Visuals & Review' },
    ],
    [t]
  );

  const [activeStepId, setActiveStepId] = useState<string>(wizardSteps[0]?.id ?? 'class');
  const [assetCompleted, setAssetCompleted] = useState(false);

  useEffect(() => {
    if (activeStepId !== 'review') {
      // Do nothing
    }
  }, [activeStepId]);

  const handleWizardNext = async () => {
    if (activeStepId === 'visuals') {
      if (assetMode) {
        setAssetCompleted(true);
        setError(null);
        const asset = buildCharacterSheetAsset({
          form: formData,
          level: effectiveLevel,
          avatarPreview,
          demo: false,
          originRoomId: room?.id,
        });
        onAssetCreated?.(asset);
      } else {
        await handleCreateCharacter();
      }
    }
  };

  const isFinalStep = activeStepId === 'visuals';
  const showWizardActions = !(!assetMode && players.find((p) => p.userId === user?.uid)?.character);

  // REMOVED: Incorrect "O Palco Está Montado" screen.
  // The GameRoom component now handles switching back to LobbyScreen when a character exists.
  // This component should strictly render the creation form.

  const raceOptions: RaceOption[] = (races ?? []).map((race) => ({
    id: race.id,
    name: localize(race, 'name'),
    description: localize(race, 'description'),
    size: race.size,
    speed: race.speed,
  }));

  const classOptions: ToggleButtonOption<string>[] = (classes ?? []).map((cls) => ({
    value: cls.name,
    label: localize(cls, 'name'),
    description: localize(cls, 'description'),
  }));

  const alignmentOptions: ToggleButtonOption<string>[] = (alignments ?? [])
    .filter((a) => a.name !== 'Unaligned')
    .map((alignment) => ({
      value: alignment.name,
      label: localize(alignment, 'name'),
      description: localize(alignment, 'description'),
    }));

  const backgroundValid = formData.background.trim().length >= 50;
  const portraitsValid = Boolean(avatarPreview.portrait && avatarPreview.upperBody && avatarPreview.fullBody);

  return (
    <>
      {(loading || dataLoading) && (
        <LoadingOverlay
          message={loading ? t('characterCreation.overlays.creating') : t('characterCreation.overlays.loadingData')}
        />
      )}
      {allReady && room?.phase === 'CHARACTER_CREATION' && <LoadingOverlay message={t('gameplay.adventureBegins')} />}
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <header className="space-y-3 text-center md:text-left">
            <h1 className="text-3xl font-bold text-aurora-200 md:text-4xl">{t('characterCreation.header.title')}</h1>
            <p className="text-shadow-400">{t('characterCreation.header.subtitle')}</p>
          </header>

          {!assetMode && room ? (
            <section className="rounded-2xl border border-midnight-600 bg-midnight-800/80 p-6">
              <h2 className="text-xl font-semibold text-aurora-200 mb-3">{t('characterCreation.header.worldTitle')}</h2>
              <div className="text-shadow-200 leading-relaxed prose-invert max-w-none">
                {room.worldDescription ? (
                  <MarkdownMessage content={room.worldDescription} />
                ) : (
                  <p className="italic text-shadow-500">{t('characterCreation.header.worldLoading')}</p>
                )}
              </div>
            </section>
          ) : null}

          <FormWizard steps={wizardSteps} onStepChange={(index) => setActiveStepId(wizardSteps[index]?.id ?? 'class')}>
            <FormWizardSteps className="mb-4" />
            <FormWizardContent className="space-y-12">
              {/* STEP 1: Class Selection - Epic cards with auto-populate on click */}
              <FormWizardStep step="class">
                <StepValidationGate valid={Boolean(formData.characterClass)} />
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-aurora-200 uppercase tracking-wider">Choose Your Class</h2>
                  <p className="text-sm text-shadow-400">
                    Select a class to auto-populate your character, then customize in the next steps.
                  </p>

                  {/* Epic Class Cards */}
                  <EpicClassSelectionGrid
                    options={classOptions}
                    selectedClass={formData.characterClass}
                    onSelect={(value) => {
                      updateField('characterClass', value);
                      // Auto-load template when class is selected
                      loadTemplate(value);
                    }}
                    loading={classesLoading}
                  />
                </div>
              </FormWizardStep>

              <FormWizardStep step="race">
                <StepValidationGate valid={Boolean(formData.race)} />
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-aurora-200">{t('characterCreation.steps.race.heading')}</h2>
                  <p className="text-sm text-shadow-400">{t('characterCreation.steps.race.copy')}</p>
                  <RaceSelectionGrid
                    options={raceOptions}
                    selectedRace={formData.race}
                    onSelect={(race) => updateField('race', race)}
                    loading={racesLoading}
                  />
                </div>
              </FormWizardStep>

              <FormWizardStep step="attributes">
                <StepValidationGate valid={pointsRemaining === 0} />
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-aurora-200">{t('characterCreation.pointBuy.title')}</h2>
                  <p className="text-sm text-shadow-400">
                    Allocate {attributeBudget} points. Exact budget required before advancing.
                  </p>
                  <div
                    className={clsx(
                      'rounded-full px-4 py-1 text-sm font-semibold uppercase tracking-[0.32em] inline-block',
                      pointsRemaining === 0
                        ? 'bg-emerald-500/20 text-emerald-200'
                        : pointsRemaining > 0
                          ? 'bg-amber-500/20 text-amber-200'
                          : 'bg-red-500/20 text-red-200'
                    )}
                  >
                    {pointsRemaining === 0 ? (
                      <span className="flex items-center gap-1">
                        <Check className="h-4 w-4" /> {t('characterCreation.pointBuy.complete')}
                      </span>
                    ) : (
                      `${pointsRemaining} ${t('characterCreation.pointBuy.remainingSuffix')}`
                    )}
                  </div>
                  <AttributesSection
                    attributes={formData.attributes}
                    pointsRemaining={pointsRemaining}
                    attributeBudget={attributeBudget}
                    onAttributeChange={setAttributeScore}
                  />
                </div>
              </FormWizardStep>

              <FormWizardStep step="alignment">
                <StepValidationGate valid={Boolean(formData.alignment)} />
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-aurora-200">
                    {t('characterCreation.steps.alignment.heading')}
                  </h2>
                  <p className="text-sm text-shadow-400">{t('characterCreation.steps.alignment.copy')}</p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {alignmentOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateField('alignment', option.value)}
                        className={clsx(
                          'rounded-2xl border px-4 py-3 text-left transition-all',
                          option.value === formData.alignment
                            ? 'border-aurora-400/70 bg-aurora-500/10 text-aurora-100 shadow-[0_12px_28px_rgba(29,143,242,0.2)]'
                            : 'border-midnight-600 bg-midnight-800/70 text-shadow-200 hover:border-aurora-400/40 hover:bg-midnight-700/80'
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold text-shadow-50">{option.value}</span>
                          <span className="rounded-full border border-aurora-400/40 px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.32em] text-aurora-200">
                            {formatAlignmentOption(option.value)}
                          </span>
                        </div>
                        {option.description ? (
                          <p className="mt-2 text-xs leading-relaxed text-shadow-400">{option.description}</p>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>
              </FormWizardStep>

              <FormWizardStep step="identity">
                <StepValidationGate
                  valid={Boolean(
                    formData.name &&
                    backgroundValid &&
                    formData.appearance.height &&
                    formData.appearance.weight &&
                    formData.appearance.skin &&
                    formData.appearance.hair &&
                    formData.appearance.eyes &&
                    formData.appearance.gender &&
                    formData.personality.traits.trim() &&
                    formData.personality.ideals.trim()
                  )}
                />
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-aurora-200 uppercase tracking-wider">
                    {t('characterCreation.steps.identity.title')}
                  </h2>
                  <p className="text-sm text-shadow-400">Define your character's identity. All fields are required.</p>

                  {/* Row 1 & 2: Name, Vitals, Features (Handled by AppearanceSection) */}
                  <div className="rounded-2xl border border-aurora-500/40 bg-gradient-to-br from-midnight-800/80 via-midnight-800/70 to-midnight-900/60 p-6">
                    <h3 className="text-lg font-semibold text-aurora-200 mb-4">
                      {t('characterCreation.appearance.sectionTitle')} *
                    </h3>
                    <AppearanceSection
                      name={formData.name}
                      onNameChange={(val) => updateField('name', val)}
                      appearance={formData.appearance}
                      onAppearanceChange={updateAppearance}
                    />
                  </div>

                  {/* Row 3: Background | Personality */}
                  <div className="grid gap-6 lg:grid-cols-2">
                    {/* Background */}
                    <div className="space-y-4 rounded-2xl border border-aurora-500/40 bg-gradient-to-br from-midnight-800/80 via-midnight-800/70 to-midnight-900/60 p-6">
                      <h3 className="text-xl font-semibold text-aurora-200">
                        {t('characterCreation.form.backgroundLabel')} *
                      </h3>
                      <p className="text-sm text-shadow-400">{t('characterCreation.form.backgroundHint')}</p>
                      <Textarea
                        rows={8}
                        value={formData.background}
                        onChange={(e) => updateField('background', e.target.value)}
                        placeholder={t('characterCreation.form.backgroundPlaceholder')}
                        className="w-full"
                      />
                      <div className="flex items-center justify-between text-xs text-shadow-500">
                        <span>
                          {formData.background.length}/50 {t('characterCreation.form.characters')}
                        </span>
                        {backgroundValid ? <span className="text-emerald-200">✓ Ready</span> : null}
                      </div>
                    </div>

                    {/* Personality */}
                    <div className="space-y-4 rounded-2xl border border-aurora-500/40 bg-gradient-to-br from-midnight-800/80 via-midnight-800/70 to-midnight-900/60 p-6">
                      <h3 className="text-lg font-semibold text-aurora-200">
                        {t('characterCreation.personality.sectionTitle')} *
                      </h3>
                      <p className="text-xs text-shadow-400">
                        Traits and ideals are required. Pre-filled from your class.
                      </p>
                      <PersonalitySection personality={formData.personality} onPersonalityChange={updatePersonality} />
                    </div>
                  </div>
                </div>
              </FormWizardStep>

              <FormWizardStep step="equipment">
                <StepValidationGate valid />
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-aurora-200">
                    {t('characterCreation.steps.equipment.heading')}
                  </h2>
                  <p className="text-sm text-shadow-400">{t('characterCreation.steps.equipment.copy')}</p>

                  {/* Choice UI - Show only if choice hasn't been made */}
                  {!equipmentChoice && !assetMode && (
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Option 1: Take Starting Pack + 50g */}
                      <button
                        type="button"
                        onClick={handleChooseStartingPack}
                        className="group relative overflow-hidden rounded-2xl border-2 border-aurora-500/40 bg-gradient-to-br from-aurora-900/20 via-midnight-800/70 to-midnight-900/60 p-6 text-left transition-all hover:border-aurora-400/60 hover:shadow-lg"
                      >
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-aurora-500/20 p-3">
                              <Package className="h-6 w-6 text-aurora-400" />
                            </div>
                            <h3 className="text-lg font-bold text-aurora-200">Starting Pack + 50g</h3>
                          </div>
                          <p className="text-sm text-shadow-300">
                            Get a curated equipment pack for your {formData.characterClass} class, plus 50 gold to spend
                            on extras.
                          </p>
                          <div className="rounded-lg border border-aurora-500/30 bg-aurora-500/10 p-3">
                            <p className="text-xs font-semibold text-aurora-200">Recommended for new players</p>
                          </div>
                        </div>
                      </button>

                      {/* Option 2: Get 100g Free Choice */}
                      <button
                        type="button"
                        onClick={handleChooseFreeGold}
                        className="group relative overflow-hidden rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-900/20 via-midnight-800/70 to-midnight-900/60 p-6 text-left transition-all hover:border-amber-400/60 hover:shadow-lg"
                      >
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-amber-500/20 p-3">
                              <ShoppingCart className="h-6 w-6 text-amber-400" />
                            </div>
                            <h3 className="text-lg font-bold text-amber-200">100 Gold Free Choice</h3>
                          </div>
                          <p className="text-sm text-shadow-300">
                            Get 100 gold pieces to buy exactly what you want from the shop. Total freedom!
                          </p>
                          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                            <p className="text-xs font-semibold text-amber-200">For experienced players</p>
                          </div>
                        </div>
                      </button>
                    </div>
                  )}

                  {/* Equipment Shop - Show after choice is made or in asset mode */}
                  {(equipmentChoice || assetMode) && equipmentItems.length > 0 && (
                    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                      {/* LEFT SIDE: SHOP */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 rounded-xl border-2 border-amber-500/40 bg-amber-500/10 px-4 py-3">
                          <ShoppingCart className="h-6 w-6 text-amber-400" />
                          <div>
                            <h3 className="text-lg font-bold text-amber-200">SHOP - Buy Items</h3>
                            <p className="text-xs text-amber-300">Purchase equipment with your gold</p>
                          </div>
                        </div>
                        <EquipmentShop
                          items={equipmentItems}
                          currentGold={equipmentGold}
                          equippedItems={equippedItems}
                          inventory={inventory}
                          onBuyItem={handleBuyItem}
                          onBuyStartingPack={handleBuyStartingPack}
                          startingPackCost={50}
                          mode={assetMode ? 'asset' : 'game'}
                        />
                      </div>

                      {/* RIGHT SIDE: YOUR GEAR (Inventory + Equipped) */}
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-center gap-3 rounded-xl border-2 border-emerald-500/40 bg-emerald-500/10 px-4 py-3">
                          <Backpack className="h-6 w-6 text-emerald-400" />
                          <div>
                            <h3 className="text-lg font-bold text-emerald-200">YOUR GEAR</h3>
                            <p className="text-xs text-emerald-300">Equip & manage your items</p>
                          </div>
                        </div>

                        {/* Equipped Items Section */}
                        <div className="rounded-xl border border-aurora-500/30 bg-aurora-500/5 p-4 space-y-3">
                          <h4 className="text-sm font-bold uppercase tracking-wider text-aurora-200 flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Currently Equipped
                          </h4>
                          {Object.entries(equippedItems).some(([_, itemIndex]) => itemIndex) ? (
                            <div className="space-y-2">
                              {Object.entries(equippedItems).map(([slot, itemIndex]) => {
                                if (!itemIndex) return null;
                                const item = equipmentItems.find((i) => i.index === itemIndex);
                                if (!item) return null;
                                return (
                                  <div
                                    key={slot}
                                    className="rounded-lg border border-aurora-500/40 bg-midnight-800/70 p-3 space-y-2"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div>
                                        <p className="text-xs uppercase tracking-wider text-aurora-400">{slot}</p>
                                        <p className="font-semibold text-shadow-100">{localize(item, 'name')}</p>
                                        {item.damage && (
                                          <p className="text-xs text-shadow-400">
                                            {item.damage.damageDice} {item.damage.damageType}
                                          </p>
                                        )}
                                        {item.armorClass && (
                                          <p className="text-xs text-shadow-400">
                                            AC{' '}
                                            {typeof item.armorClass === 'number'
                                              ? item.armorClass
                                              : item.armorClass.base}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleUnequipItem(slot)}
                                      className="w-full text-xs"
                                    >
                                      ↓ Unequip to Bag
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-center text-sm text-shadow-500 py-4">No items equipped yet</p>
                          )}
                        </div>

                        {/* Inventory / Bag Section */}
                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
                          <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-200 flex items-center gap-2">
                            <Backpack className="h-4 w-4" />
                            In Your Bag ({inventory.reduce((sum, i) => sum + i.quantity, 0)} items)
                          </h4>
                          {inventory.length > 0 ? (
                            <div className="space-y-2">
                              {inventory.map(({ itemIndex, quantity }) => {
                                const item = equipmentItems.find((i) => i.index === itemIndex);
                                if (!item) return null;
                                return (
                                  <div
                                    key={itemIndex}
                                    className="rounded-lg border border-emerald-500/40 bg-midnight-800/70 p-3 space-y-2"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                          <p className="font-semibold text-shadow-100">{localize(item, 'name')}</p>
                                          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-200">
                                            x{quantity}
                                          </span>
                                        </div>
                                        <p className="text-xs text-shadow-400">{item.equipmentCategory}</p>
                                        {item.damage && (
                                          <p className="text-xs text-shadow-400">
                                            {item.damage.damageDice} {item.damage.damageType}
                                          </p>
                                        )}
                                        {item.armorClass && (
                                          <p className="text-xs text-shadow-400">
                                            AC{' '}
                                            {typeof item.armorClass === 'number'
                                              ? item.armorClass
                                              : item.armorClass.base}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    {/* Equip Buttons */}
                                    <div className="grid grid-cols-2 gap-2">
                                      {item.equipmentCategory === 'Weapon' && (
                                        <>
                                          <Button
                                            size="sm"
                                            onClick={() => handleEquipItem(itemIndex, 'mainHand')}
                                            className="text-xs"
                                          >
                                            ↑ Main Hand
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleEquipItem(itemIndex, 'offHand')}
                                            className="text-xs"
                                          >
                                            ↑ Off Hand
                                          </Button>
                                        </>
                                      )}
                                      {item.equipmentCategory === 'Armor' && item.name === 'Shield' && (
                                        <Button
                                          size="sm"
                                          onClick={() => handleEquipItem(itemIndex, 'shield')}
                                          className="col-span-2 text-xs"
                                        >
                                          ↑ Equip Shield
                                        </Button>
                                      )}
                                      {item.equipmentCategory === 'Armor' && item.name !== 'Shield' && (
                                        <Button
                                          size="sm"
                                          onClick={() => handleEquipItem(itemIndex, 'armor')}
                                          className="col-span-2 text-xs"
                                        >
                                          ↑ Equip Armor
                                        </Button>
                                      )}
                                      {item.equipmentCategory === 'Adventuring Gear' && (
                                        <Button
                                          size="sm"
                                          variant="secondary"
                                          onClick={() => handleEquipItem(itemIndex, 'accessory1')}
                                          className="col-span-2 text-xs"
                                        >
                                          ↑ Equip Accessory
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-center text-sm text-shadow-500 py-4">
                              Buy items from the shop to fill your bag!
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {!equipmentItems.length && (
                    <div className="rounded-2xl border border-midnight-600 bg-midnight-800/70 p-6">
                      <div className="flex flex-col items-center gap-2">
                        <DiceLoader size="medium" diceCount={3} />
                        <p className="text-sm text-shadow-400">Loading equipment...</p>
                      </div>
                    </div>
                  )}
                </div>
              </FormWizardStep>

              <FormWizardStep step="visuals">
                <StepValidationGate valid={portraitsValid} />
                <div className="space-y-8">
                  <div className="grid gap-8 lg:grid-cols-2">
                    <div className="space-y-6">
                      <div className="rounded-xl border border-midnight-600 bg-midnight-800/50 p-6">
                        <h3 className="mb-4 text-lg font-semibold text-shadow-300">Character Review</h3>
                        <div className="space-y-4 text-sm text-shadow-400">
                          <div className="flex justify-between border-b border-midnight-700 pb-2">
                            <span>Name</span>
                            <span className="font-medium text-shadow-200">{formData.name}</span>
                          </div>
                          <div className="flex justify-between border-b border-midnight-700 pb-2">
                            <span>Race</span>
                            <span className="font-medium text-shadow-200">{formData.race}</span>
                          </div>
                          <div className="flex justify-between border-b border-midnight-700 pb-2">
                            <span>Class</span>
                            <span className="font-medium text-shadow-200">{formData.characterClass}</span>
                          </div>
                          <div className="flex justify-between border-b border-midnight-700 pb-2">
                            <span>Alignment</span>
                            <span className="font-medium text-shadow-200">{formData.alignment}</span>
                          </div>
                          <div className="flex justify-between border-b border-midnight-700 pb-2">
                            <span>Background</span>
                            <span className="font-medium text-shadow-200 truncate max-w-[200px]">
                              {formData.background.substring(0, 30)}...
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-midnight-600 bg-midnight-800/50 p-6">
                        <h3 className="mb-4 text-lg font-semibold text-shadow-300">Equipment Summary</h3>
                        <div className="text-sm text-shadow-400">
                          <p>Gold: {equipmentGold} gp</p>
                          <p>Items: {inventory.reduce((acc, i) => acc + i.quantity, 0)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <AvatarSection
                        images={{
                          portrait: avatarPreview.portrait
                            ? `data:${avatarPreview.portrait.mimeType};base64,${avatarPreview.portrait.data}`
                            : null,
                          upperBody: avatarPreview.upperBody
                            ? `data:${avatarPreview.upperBody.mimeType};base64,${avatarPreview.upperBody.data}`
                            : null,
                          fullBody: avatarPreview.fullBody
                            ? `data:${avatarPreview.fullBody.mimeType};base64,${avatarPreview.fullBody.data}`
                            : null,
                        }}
                        loading={previewLoadState}
                        onUpload={handleAvatarUpload}
                        onCapture={handleAvatarUpdate}
                        onGenerateAll={handleGenerateAll}
                        placeholderDimensions={placeholderDimensions}
                      />

                      {assetMode && assetCompleted ? (
                        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                          <p>Character sheet asset created! You can create another or return to assets hub.</p>
                        </div>
                      ) : null}

                      {error ? (
                        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
                          {error}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </FormWizardStep>
            </FormWizardContent>

            {showWizardActions ? (
              <FormWizardActions
                previousLabel={t('characterCreation.wizard.previous')}
                nextLabel={isFinalStep ? t('characterCreation.wizard.finish') : t('characterCreation.wizard.next')}
                completeLabel={
                  assetMode ? t('characterCreation.wizard.finishAsset') : t('characterCreation.actions.create')
                }
                onNext={handleWizardNext}
                showNext={!assetMode || !hasCharacter}
              />
            ) : null}
          </FormWizard>
        </div>
      </div>
    </>
  );
}
