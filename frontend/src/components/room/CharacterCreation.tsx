import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Bird,
  Feather,
  Flame,
  Gem,
  Leaf,
  Shield,
  Sparkles,
  Swords,
  Users,
  Wand2,
  Package,
  ShoppingCart,
  Backpack,
} from 'lucide-react';
import clsx from 'clsx';
import type { AvatarPreviewResponse, ReferenceImagePayload } from '../../types/assets';
import type { Room, Attribute } from '../../types/shared';
import { GamePhase } from '../../types/shared';
import {
  addCharacter,
  generateAvatarPortrait,
  generateAvatarUpperBody,
  generateAvatarFullBody,
} from '../../services/api';
import { setReady } from '../../services/socket';
import useAuth from '../../hooks/useAuth';
import MarkdownMessage from '../game/MarkdownMessage';
import { useAlignments, useRaces, useClasses } from '../../hooks/useGameData';
import { Button } from '../ui/button';
import { LoadingOverlay } from '../ui/LoadingOverlay';
import Input from '../ui/input';
import Label from '../ui/label';
import Textarea from '../ui/textarea';
import { DiceLoader } from '../ui/dice-loader';
import { useDebouncedBusy } from '../../hooks/useDebouncedBusy';
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
import {
  StepValidationGate,
  RaceSelectionGrid,
  CharacterAssetPreview,
  formatAlignmentOption,
} from './character-creation/helpers';
import { EpicClassSelectionGrid } from './character-creation/EpicClassCards';
import {
  FormWizard,
  FormWizardSteps,
  FormWizardContent,
  FormWizardStep,
  FormWizardActions,
  useFormWizard,
  type Step,
} from '../ui/FormWizard';
import { NumericInput } from '../ui/NumericInput';
import { ToggleButtonGroup, type ToggleButtonOption } from '../ui/ToggleButtonGroup';
import { buildCharacterSheetAsset, type CharacterSheetAsset } from './character-creation/characterSheetAsset';
import { WorldGenerationProgress } from '../world/WorldGenerationProgress';
import { MapRenderer } from '../world/MapRenderer';
import { HistoryTimeline } from '../world/HistoryTimeline';
import { GenerationTimeline } from '../world/GenerationTimeline';

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
}: CharacterCreationProps) {
  const { user } = useAuth();
  const { t } = useI18n();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
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

  // Use character portrait if available, fallback to user photo or default
  const getPlayerAvatar = (player: Player) => {
    if (player.avatarPreview?.portrait) {
      return `data:${player.avatarPreview.portrait.mimeType};base64,${player.avatarPreview.portrait.data}`;
    }
    return user?.photoURL && user.photoURL.trim().length > 0 ? user.photoURL : '/face.png';
  };
  const userPlayer = !assetMode ? players.find((p) => p.userId === user?.uid) : undefined;

  const currentUserAvatar = userPlayer
    ? getPlayerAvatar(userPlayer)
    : user?.photoURL && user.photoURL.trim().length > 0
      ? user.photoURL
      : '/face.png';
  const [placeholderLoading, setPlaceholderLoading] = useState(false);
  const { isBusy: previewBusy } = useDebouncedBusy(previewLoading, { enterDelayMs: 180 });

  const allReady = !assetMode && players.length > 0 && players.every((p) => p.isReady);
  const isStarting = allReady && room?.phase === 'CHARACTER_CREATION';

  const isOwner = user?.uid === room.ownerId;
  const isLocked = room?.characterCreationLocked !== false; // Locked by default

  // GATE: If locked and not in asset mode, show approval screens
  if (!assetMode && isLocked) {
    if (!isOwner) {
      // Non-owner: show waiting screen
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md text-center space-y-6 card p-8">
            <DiceLoader size="medium" diceCount={3} />
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold text-aurora-200">Waiting for Game Master</h2>
              <p className="text-sm text-shadow-400">
                The world is ready! The room owner must approve character creation before you can begin.
              </p>
              <p className="text-xs text-shadow-500 mt-4">
                You'll be notified automatically when character creation is unlocked.
              </p>
            </div>
          </div>
        </div>
      );
    }
    // Owner: show unlock button
    const handleUnlockCharacterCreation = async () => {
      try {
        const token = await user.getIdToken();
        await fetch(`${import.meta.env.VITE_API_URL}/api/rooms/${room.id}/unlock-characters`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        // Socket.IO will broadcast the update
      } catch (err) {
        console.error('Failed to unlock character creation:', err);
      }
    };

    // Owner review screen - show full world before unlocking
    return (
      <div className="min-h-screen p-6 space-y-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="card p-6 text-center">
            <h2 className="text-2xl font-semibold text-aurora-200 mb-2">World Generation Complete!</h2>
            <p className="text-sm text-shadow-400">
              Review your world below. When satisfied, allow players to create characters.
            </p>
          </div>

          {/* Generation Timeline - FIRST - Full collapsible event log */}
          <GenerationTimeline events={room.generationEvents || []} />

          {/* World Description */}
          {room.worldDescription && (
            <div className="card p-6">
              <h3 className="text-base font-semibold uppercase tracking-[0.3em] text-aurora-300 mb-4">
                World Description
              </h3>
              <div className="rounded-lg border border-midnight-600 bg-midnight-900/70 p-6 text-sm text-shadow-200">
                <MarkdownMessage content={room.worldDescription} />
              </div>
            </div>
          )}

          {/* World Map */}
          {room.structures && room.structures.length > 0 && (
            <div className="card p-6">
              <h3 className="text-base font-semibold uppercase tracking-[0.3em] text-aurora-300 mb-4">World Map</h3>
              <div className="rounded-lg border border-midnight-600 bg-midnight-900/70 p-4">
                <MapRenderer roomId={room.id} structures={room.structures} roads={room.roads || []} />
              </div>
            </div>
          )}

          {/* World History */}
          {room.worldHistory && typeof room.worldHistory === 'object' && room.worldHistory.periods ? (
            <div className="card p-6">
              <h3 className="text-base font-semibold uppercase tracking-[0.3em] text-aurora-300 mb-4">World History</h3>
              <div className="rounded-lg border border-midnight-600 bg-midnight-900/70 p-6">
                <HistoryTimeline history={room.worldHistory} />
              </div>
            </div>
          ) : room.worldHistory && typeof room.worldHistory === 'string' ? (
            <div className="card p-6">
              <h3 className="text-base font-semibold uppercase tracking-[0.3em] text-aurora-300 mb-4">World History</h3>
              <div className="rounded-lg border border-midnight-600 bg-midnight-900/70 p-6 text-sm text-shadow-200">
                <MarkdownMessage content={room.worldHistory} />
              </div>
            </div>
          ) : null}

          {/* Unlock Button */}
          <div className="card p-6 text-center">
            <button
              type="button"
              onClick={handleUnlockCharacterCreation}
              className="btn-primary"
              data-testid="unlock-character-creation-button"
            >
              <Sparkles className="mr-2 inline-block h-5 w-5" />
              Allow Character Creation & Open Room to Players
            </button>
            <p className="text-xs text-shadow-500 mt-3">
              This will make the room joinable and allow all players to create their characters.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { data: alignments, loading: alignmentsLoading } = useAlignments();
  const { data: races, loading: racesLoading } = useRaces();
  const { data: classes, loading: classesLoading } = useClasses();
  const dataLoading = alignmentsLoading || racesLoading || classesLoading;

  const hasCharacter = !assetMode && !!userPlayer?.character;

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
    appearance: { age: '', height: '', weight: '', eyes: '', skin: '', hair: '', description: '' },
    personality: { traits: '', ideals: '', bonds: '', flaws: '' },
  });

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
        const response = await fetch('/api/game-data/equipment');
        if (response.ok) {
          const { data } = await response.json();
          setEquipmentItems(data);
        }
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
        newInventory[existingIndex].quantity += 1;
        setInventory(newInventory);
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
          newInventory[existingIndex].quantity += 1;
          setInventory(newInventory);
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
      if (existingIndex !== -1) {
        newInv[existingIndex].quantity += 1;
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
    if (existingIndex !== -1) {
      newInv[existingIndex].quantity += 1;
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
          if (existingIndex !== -1) {
            newInventory[existingIndex].quantity += quantity - 1;
          } else {
            newInventory.push({ itemIndex, quantity: quantity - 1 });
          }
        }
      } else {
        // Add to inventory only
        const existingIndex = newInventory.findIndex((i) => i.itemIndex === itemIndex);
        if (existingIndex !== -1) {
          newInventory[existingIndex].quantity += quantity;
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
          (prev.attributes[attr] ? calculateTotalPoints({ [attr]: prev.attributes[attr] }) : 0) +
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

    setPlaceholderLoading(true);
    try {
      const { refs, dims } = await loadPlaceholderReferences();
      setPlaceholderRefs(refs);
      setPlaceholderDimensions(dims);
      return refs;
    } finally {
      setPlaceholderLoading(false);
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/game-data/character-templates/${archetype}`);
      const result = await response.json();

      if (!result.success) throw new Error('Failed to load template');

      const template = result.data;
      if (!template?.attributes?.Strength) throw new Error('Template missing required attributes');

      setFormData({
        name: template.name,
        race: template.race,
        characterClass: template.characterClass,
        background: template.backstory,
        alignment: template.alignment,
        attributes: {
          Strength: template.attributes?.Strength ?? 8,
          Dexterity: template.attributes?.Dexterity ?? 8,
          Constitution: template.attributes?.Constitution ?? 8,
          Intelligence: template.attributes?.Intelligence ?? 8,
          Wisdom: template.attributes?.Wisdom ?? 8,
          Charisma: template.attributes?.Charisma ?? 8,
        },
        skills: template.skills ?? {},
        equipment: template.equipment ?? '',
        proficienciesAndLanguages: template.proficienciesAndLanguages ?? '',
        features: template.features ?? '',
        treasure: template.treasure ?? '',
        currency: template.currency ?? { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
        resourcePools: template.resourcePools ?? [],
        talents: template.talents ?? [],
        expertises: template.expertises ?? [],
        appearance: {
          age: template.appearance?.age ?? '',
          height: template.appearance?.height ?? '',
          weight: template.appearance?.weight ?? '',
          eyes: template.appearance?.eyes ?? '',
          skin: template.appearance?.skin ?? '',
          hair: template.appearance?.hair ?? '',
          description: template.appearance?.description ?? '',
        },
        personality: {
          traits: template.personality?.traits ?? '',
          ideals: template.personality?.ideals ?? '',
          bonds: template.personality?.bonds ?? '',
          flaws: template.personality?.flaws ?? '',
        },
      });
      setAvatarPreview({});
      setPreviewLoading(false);
      setPreviewLoadState({ portrait: false, upperBody: false, fullBody: false });
      setPreviewError(null);
    } catch (err) {
      setError(t('characterCreation.errors.templateFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePreview = async () => {
    try {
      setPreviewLoading(true);
      setPreviewError(null);
      setAvatarPreview({});
      setPreviewLoadState({ portrait: true, upperBody: true, fullBody: true });
      const refs = await ensurePlaceholderReferences();

      const roomForPayload: Room =
        assetMode || !room
          ? {
              id: 'asset',
              code: 'ASSET',
              phase: GamePhase.CHARACTER_CREATION,
              worldDescription: 'Character sheet asset creation',
              settings: null,
              ownerId: '',
              createdAt: Date.now(),
              updatedAt: Date.now(),
            }
          : room;

      const payload = buildAvatarPayload(formData, roomForPayload, startingLevel, equippedItems, equipmentItems);
      const portraitPayload = appendReference(payload, refs?.portrait);
      const portraitRaw = await generateAvatarPortrait(portraitPayload);
      let portrait = portraitRaw;
      try {
        portrait = await downscalePreviewImage(portraitRaw);
      } catch (downscaleError) {
        console.warn('Failed to downscale portrait preview', downscaleError);
      }
      setAvatarPreview({ portrait });
      setPreviewLoadState((prev) => ({ ...prev, portrait: false }));

      const upperBodyPayload = appendReference(payload, refs?.upperBody);
      const upperBodyRaw = await generateAvatarUpperBody(upperBodyPayload, portrait);
      let upperBody = upperBodyRaw;
      try {
        upperBody = await downscalePreviewImage(upperBodyRaw);
      } catch (downscaleError) {
        console.warn('Failed to downscale upper-body preview', downscaleError);
      }
      setAvatarPreview((prev) => ({ ...prev, portrait, upperBody }));
      setPreviewLoadState((prev) => ({ ...prev, upperBody: false }));

      const fullBodyPayload = appendReference(payload, refs?.fullBody);
      const fullBodyRaw = await generateAvatarFullBody(fullBodyPayload, portrait, upperBody);
      let fullBody = fullBodyRaw;
      try {
        fullBody = await downscalePreviewImage(fullBodyRaw);
      } catch (downscaleError) {
        console.warn('Failed to downscale full-body preview', downscaleError);
      }
      setAvatarPreview((prev) => ({ ...prev, portrait, upperBody, fullBody }));
      setPreviewLoadState({ portrait: false, upperBody: false, fullBody: false });
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : t('characterCreation.errors.generatePortraits'));
    } finally {
      setPreviewLoading(false);
      setPreviewLoadState({ portrait: false, upperBody: false, fullBody: false });
    }
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

      const conModifier = Math.floor((formData.attributes.Constitution - 10) / 2);
      const dexModifier = Math.floor((formData.attributes.Dexterity - 10) / 2);
      const armorClass = 10 + dexModifier;
      const proficiencyBonus = 2;

      await addCharacter(room.id, {
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
          will: Math.floor((formData.attributes.Wisdom - 10) / 2),
        },
        skills: formData.skills ?? {},
        baseAttackBonus: proficiencyBonus,
        attacks: [],
        // ✨ ADD EQUIPMENT DATA
        equipment: JSON.stringify({
          equipped: equippedItems,
          inventory,
          gold: equipmentGold,
        }),
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
      { id: 'portraits', title: t('characterCreation.steps.portraits.title') },
      { id: 'review', title: t('characterCreation.steps.review.title') },
    ],
    [t]
  );

  const [activeStepId, setActiveStepId] = useState<string>(wizardSteps[0]?.id ?? 'class');
  const [assetCompleted, setAssetCompleted] = useState(false);

  const assetPreview = useMemo<CharacterSheetAsset>(
    () =>
      buildCharacterSheetAsset({
        form: formData,
        level: effectiveLevel,
        avatarPreview,
        demo: assetMode,
        originRoomId: room?.id,
      }),
    [formData, effectiveLevel, avatarPreview, assetMode, room?.id]
  );

  useEffect(() => {
    if (activeStepId !== 'review') {
      setAssetCompleted(false);
    }
  }, [activeStepId]);

  const handleWizardNext = async () => {
    if (activeStepId === 'review') {
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

  const isFinalStep = activeStepId === 'review';
  const showWizardActions = !(!assetMode && hasCharacter);

  if (!assetMode && hasCharacter && userPlayer && room) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-8">
          <div className="space-y-3 text-center md:text-left">
            <h1 className="text-3xl font-bold text-aurora-200 md:text-4xl">{t('characterCreation.header.title')}</h1>
            <p className="text-shadow-400">{t('characterCreation.header.subtitle')}</p>
          </div>

          <section className="rounded-2xl border border-midnight-600 bg-midnight-800/70 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={currentUserAvatar}
                  alt={userPlayer.character?.name ?? 'Character avatar'}
                  className="h-14 w-14 rounded-full border border-aurora-400/40 object-cover shadow-lg"
                />
                <div>
                  <h2 className="text-2xl font-bold text-shadow-50">{userPlayer.character?.name ?? 'Unknown'}</h2>
                  <p className="text-sm text-shadow-300">
                    Level {userPlayer.character?.level ?? 1} {userPlayer.character?.race ?? ''}{' '}
                    {userPlayer.character?.characterClass ?? ''}
                  </p>
                </div>
              </div>{' '}
              <div className="flex flex-col gap-2 text-sm text-shadow-400">
                <span>
                  {t('characterCreation.party.readyCountSuffix')}: {players.filter((p) => p.isReady).length} /{' '}
                  {room.settings?.playerCount || players.length}
                </span>
                {userPlayer.isReady ? (
                  <Button onClick={() => setReady(room.id, false)} variant="secondary">
                    {t('characterCreation.party.unready')}
                  </Button>
                ) : (
                  <Button onClick={() => setReady(room.id, true)}>{t('characterCreation.party.readyUp')}</Button>
                )}
              </div>
            </div>
            {userPlayer.character?.backstory ? (
              <div className="mt-4 rounded-xl border border-shadow-700 bg-shadow-900/50 p-4">
                <p className="text-xs uppercase tracking-[0.32em] text-shadow-500">
                  {t('characters.labels.backstory')}
                </p>
                <p className="text-sm text-shadow-200">{userPlayer.character.backstory}</p>
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl border border-midnight-600 bg-midnight-800/70 p-6">
            <h3 className="text-xl font-semibold text-aurora-200 mb-4">{t('characterCreation.party.title')}</h3>
            <div className="grid gap-3">
              {players
                .filter((player) => player.character !== null)
                .map((player) => (
                  <div
                    key={player.id}
                    className="flex flex-col gap-2 rounded-xl border border-midnight-600 bg-midnight-900/60 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-shadow-100">{player.character!.name}</p>
                      <p className="text-xs text-shadow-500">
                        Level {player.character!.level} {player.character!.race} {player.character!.characterClass}
                      </p>
                    </div>
                    {player.isReady ? (
                      <span className="text-xs font-semibold uppercase tracking-[0.35em] text-aurora-200">
                        {t('characterCreation.party.readyBadge')}
                      </span>
                    ) : null}
                  </div>
                ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  const raceOptions: RaceOption[] = (races ?? []).map((race) => ({
    id: race.id,
    name: race.name,
    description: race.description,
    size: race.size,
    speed: race.speed,
  }));

  const classOptions: ToggleButtonOption<string>[] = (classes ?? []).map((cls) => ({
    value: cls.name,
    label: cls.name,
    description: cls.description,
  }));

  const alignmentOptions: ToggleButtonOption<string>[] = (alignments ?? []).map((alignment) => ({
    value: alignment.name,
    label: alignment.name,
    description: alignment.description,
  }));

  const backgroundValid = formData.background.trim().length >= 50;
  const portraitsValid = Boolean(avatarPreview.portrait && avatarPreview.upperBody && avatarPreview.fullBody);

  return (
    <>
      {/* World Generation Progress Overlay */}
      {room && <WorldGenerationProgress roomId={room.id} />}

      {(loading || dataLoading) && (
        <LoadingOverlay
          message={loading ? t('characterCreation.overlays.creating') : t('characterCreation.overlays.loadingData')}
        />
      )}
      {isStarting && <LoadingOverlay message={t('gameplay.adventureBegins')} />}
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

          <FormWizard
            steps={wizardSteps}
            onStepChange={(index) => setActiveStepId(wizardSteps[index]?.id ?? 'class')}
            onComplete={() => {
              if (assetMode) {
                setAssetCompleted(true);
              }
            }}
          >
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
                      loadTemplate(value.toLowerCase());
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
                    {pointsRemaining === 0
                      ? t('characterCreation.pointBuy.perfect')
                      : `${pointsRemaining} ${t('characterCreation.pointBuy.remainingSuffix')}`}
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
                    backgroundValid &&
                      formData.appearance.height &&
                      formData.appearance.weight &&
                      formData.appearance.skin &&
                      formData.appearance.hair &&
                      formData.appearance.eyes &&
                      formData.personality.traits.trim() &&
                      formData.personality.ideals.trim()
                  )}
                />
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-aurora-200 uppercase tracking-wider">
                    Character Identity & Story
                  </h2>
                  <p className="text-sm text-shadow-400">
                    Define your character's backstory, appearance, and personality. All fields are required and
                    pre-filled from your class/race template.
                  </p>

                  {/* Backstory */}
                  <div className="rounded-2xl border border-aurora-500/40 bg-gradient-to-br from-midnight-800/80 via-midnight-800/70 to-midnight-900/60 p-6 space-y-4">
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

                  {/* Appearance & Personality */}
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-4 rounded-2xl border border-aurora-500/40 bg-gradient-to-br from-midnight-800/80 via-midnight-800/70 to-midnight-900/60 p-6">
                      <h3 className="text-lg font-semibold text-aurora-200">
                        {t('characterCreation.appearance.sectionTitle')} *
                      </h3>
                      <p className="text-xs text-shadow-400">
                        All appearance fields are required. Pre-filled from your class/race.
                      </p>
                      <AppearanceSection appearance={formData.appearance} onAppearanceChange={updateAppearance} />
                    </div>
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
                                        <p className="font-semibold text-shadow-100">{item.name}</p>
                                        {item.damage && (
                                          <p className="text-xs text-shadow-400">
                                            {item.damage.damageDice} {item.damage.damageType}
                                          </p>
                                        )}
                                        {item.armorClass && (
                                          <p className="text-xs text-shadow-400">AC {item.armorClass.base}</p>
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
                                          <p className="font-semibold text-shadow-100">{item.name}</p>
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
                                          <p className="text-xs text-shadow-400">AC {item.armorClass.base}</p>
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
                      <DiceLoader text="Loading equipment..." />
                    </div>
                  )}
                </div>
              </FormWizardStep>

              <FormWizardStep step="portraits">
                <StepValidationGate valid={portraitsValid} />
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-aurora-200">{t('characterCreation.portraits.title')}</h2>
                  <p className="text-sm text-shadow-400">{t('characterCreation.portraits.description')}</p>
                  <AvatarSection
                    avatarPreview={avatarPreview}
                    previewLoading={previewLoading}
                    previewLoadState={previewLoadState}
                    previewBusy={previewBusy}
                    previewError={previewError}
                    placeholderLoading={placeholderLoading}
                    placeholderDimensions={placeholderDimensions}
                    onGeneratePreview={handleGeneratePreview}
                  />
                </div>
              </FormWizardStep>

              <FormWizardStep step="review">
                <StepValidationGate valid={Boolean(formData.name.trim())} />
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-aurora-200">
                    {t('characterCreation.steps.review.heading')}
                  </h2>
                  <p className="text-sm text-shadow-400">{t('characterCreation.steps.review.copy')}</p>

                  {/* Name & Level Entry - Final Step! */}
                  <div className="rounded-2xl border border-aurora-500/40 bg-gradient-to-br from-aurora-900/20 via-midnight-800/70 to-midnight-900/60 p-6">
                    <h3 className="text-xl font-semibold text-aurora-200 mb-4">Final Touch: Name Your Hero *</h3>
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                      <div className="space-y-4">
                        <Label htmlFor="name" className="text-lg font-semibold text-aurora-300">
                          Character Name *
                        </Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => updateField('name', e.target.value)}
                          placeholder={t('characterCreation.form.namePlaceholder')}
                          className="text-lg"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-lg font-semibold text-aurora-300">
                          {t('characterCreation.form.startingLevel')}
                        </Label>
                        <NumericInput
                          value={effectiveLevel}
                          onChange={(value) => {
                            if (assetMode) {
                              setCustomLevel(value);
                            }
                          }}
                          min={1}
                          max={20}
                          disabled={!assetMode}
                          showButtons={assetMode}
                          className="max-w-xs"
                        />
                        {!assetMode ? <p className="text-xs text-shadow-500">Locked by room settings</p> : null}
                      </div>
                    </div>
                  </div>

                  {/* Character Preview */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-midnight-600 bg-midnight-800/60 p-5">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.32em] text-shadow-400 mb-3">
                        Profile
                      </h3>
                      <ul className="space-y-2 text-sm text-shadow-200">
                        <li>
                          <span className="font-semibold text-shadow-100">Name:</span> {formData.name}
                        </li>
                        <li>
                          <span className="font-semibold text-shadow-100">Level:</span> {effectiveLevel}
                        </li>
                        <li>
                          <span className="font-semibold text-shadow-100">Race:</span> {formData.race}
                        </li>
                        <li>
                          <span className="font-semibold text-shadow-100">Class:</span> {formData.characterClass}
                        </li>
                        <li>
                          <span className="font-semibold text-shadow-100">Alignment:</span> {formData.alignment}
                        </li>
                      </ul>
                    </div>

                    <div className="rounded-2xl border border-midnight-600 bg-midnight-800/60 p-5">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.32em] text-shadow-400 mb-3">
                        Attributes
                      </h3>
                      <div className="grid grid-cols-3 gap-3 text-sm text-shadow-200">
                        {Object.entries(formData.attributes).map(([attr, score]) => (
                          <div key={attr} className="rounded-xl border border-midnight-600 bg-midnight-900/60 p-3">
                            <p className="text-xs uppercase tracking-[0.32em] text-shadow-500">{attr}</p>
                            <p className="text-lg font-semibold text-shadow-50">{score}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {formData.background ? (
                    <div className="rounded-2xl border border-midnight-600 bg-midnight-800/60 p-5">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.32em] text-shadow-400 mb-3">
                        Background Story
                      </h3>
                      <p className="text-sm leading-relaxed text-shadow-200 whitespace-pre-line">
                        {formData.background}
                      </p>
                    </div>
                  ) : null}

                  <CharacterAssetPreview asset={assetPreview} />

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
