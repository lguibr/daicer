import { useState, useMemo, useCallback, useEffect } from 'react';
import type { Room, Player, Attribute, Talent, ResourcePool, CharacterSheet } from '../../types/shared';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import NumericStepper from '../ui/NumericStepper';
import type {
  AvatarGenerationPayload,
  AvatarPreviewResponse,
  AvatarPreviewImage,
  ReferenceImagePayload,
} from '../../types/assets';
import { DiceLoader } from '../ui/dice-loader';
import { useDebouncedBusy } from '../../hooks/useDebouncedBusy';

interface CharacterCreationProps {
  room: Room;
  players: Player[];
}

const ATTRIBUTES: Attribute[] = [
  'Strength' as Attribute,
  'Dexterity' as Attribute,
  'Constitution' as Attribute,
  'Intelligence' as Attribute,
  'Wisdom' as Attribute,
  'Charisma' as Attribute,
];

// D&D 5e point-buy costs
const POINT_BUY_COSTS: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
};

/**
 * Calculate point cost for an attribute score
 */
function getPointCost(score: number): number {
  return POINT_BUY_COSTS[score] || 0;
}

/**
 * Calculate total points used
 */
function calculateTotalPoints(attributes: Record<string, number>): number {
  return Object.values(attributes).reduce((sum, score) => sum + getPointCost(score), 0);
}

type CharacterFormState = {
  name: string;
  race: string;
  characterClass: string;
  background: string;
  alignment: string;
  attributes: Record<Attribute, number>;
  skills: Record<string, number>;
  equipment: string;
  proficienciesAndLanguages: string;
  features: string;
  treasure: string;
  currency: CharacterSheet['currency'];
  resourcePools: ResourcePool[];
  talents: Talent[];
  expertises: string[];
  appearance: {
    age: string;
    height: string;
    weight: string;
    eyes: string;
    skin: string;
    hair: string;
    description: string;
  };
  personality: {
    traits: string;
    ideals: string;
    bonds: string;
    flaws: string;
  };
};

const previewPlaceholders: Array<{ key: keyof AvatarPreviewResponse; src: string; label: string }> = [
  {
    key: 'portrait',
    src: '/face.png',
    label: 'Portrait Preview',
  },
  {
    key: 'upperBody',
    src: '/upper.png',
    label: 'Upper Body Preview',
  },
  {
    key: 'fullBody',
    src: '/full.png',
    label: 'Full Body Preview',
  },
];

const MAX_PREVIEW_DIMENSION = 512;
const PREVIEW_OUTPUT_MIME = 'image/webp';
const PREVIEW_OUTPUT_QUALITY = 0.85;

const PLACEHOLDER_REFERENCES: Record<
  keyof AvatarPreviewResponse,
  { src: string; description: string; mimeType: string }
> = {
  portrait: { src: '/face.png', description: 'Portrait framing reference', mimeType: 'image/png' },
  upperBody: { src: '/upper.png', description: 'Upper body framing reference', mimeType: 'image/png' },
  fullBody: { src: '/full.png', description: 'Full body framing reference', mimeType: 'image/png' },
};

const appendReference = (base: AvatarGenerationPayload, extra?: ReferenceImagePayload): AvatarGenerationPayload => {
  if (!extra) {
    return base;
  }
  const existing = base.referenceImages ?? [];
  return {
    ...base,
    referenceImages: [...existing, extra],
  };
};

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    const slice = bytes.subarray(i, i + chunk);
    binary += String.fromCharCode(...slice);
  }

  return btoa(binary);
}

async function downscalePreviewImage(
  image: AvatarPreviewImage,
  maxDimension = MAX_PREVIEW_DIMENSION
): Promise<AvatarPreviewImage> {
  if (typeof window === 'undefined') {
    return image;
  }

  return new Promise<AvatarPreviewImage>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const originalWidth = img.width || 1;
      const originalHeight = img.height || 1;
      const largestSide = Math.max(originalWidth, originalHeight);
      const scale = largestSide > maxDimension ? maxDimension / largestSide : 1;

      const targetWidth = Math.max(1, Math.round(originalWidth * scale));
      const targetHeight = Math.max(1, Math.round(originalHeight * scale));

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to obtain canvas context for preview downscale'));
        return;
      }

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      const dataUrl = canvas.toDataURL(PREVIEW_OUTPUT_MIME, PREVIEW_OUTPUT_QUALITY);
      const base64Data = dataUrl.split(',')[1];
      if (!base64Data) {
        reject(new Error('Failed to extract base64 data from preview image'));
        return;
      }

      resolve({
        mimeType: PREVIEW_OUTPUT_MIME,
        data: base64Data,
        prompt: image.prompt,
        width: targetWidth,
        height: targetHeight,
      });
    };
    img.onerror = () => reject(new Error('Failed to load preview image for downscale'));
    img.src = `data:${image.mimeType};base64,${image.data}`;
  });
}

/**
 * Character creation component
 */
export default function CharacterCreation({ room, players }: CharacterCreationProps) {
  const { user } = useAuth();
  const currentUserAvatar = user?.photoURL && user.photoURL.trim().length > 0 ? user.photoURL : '/face.png';
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
  const [placeholderLoading, setPlaceholderLoading] = useState(false);
  const { isBusy: previewBusy, pending: previewPending } = useDebouncedBusy(previewLoading, {
    enterDelayMs: 180,
  });

  // Check if all players are ready (game is starting)
  const allReady = players.length > 0 && players.every((p) => p.isReady);
  const isStarting = allReady && room.phase === 'CHARACTER_CREATION';

  // Fetch game data from API
  const { data: alignments, loading: alignmentsLoading } = useAlignments();
  const { data: races, loading: racesLoading } = useRaces();
  const { data: classes, loading: classesLoading } = useClasses();

  const dataLoading = alignmentsLoading || racesLoading || classesLoading;

  // Check if current user already has a character
  const userPlayer = players.find((p) => p.userId === user?.uid);
  const hasCharacter = !!userPlayer;

  const startingLevel = room.settings?.startingLevel || 1;
  const attributeBudget = room.settings?.attributePointBudget || 27;

  const [formData, setFormData] = useState<CharacterFormState>({
    name: '',
    race: 'Human',
    characterClass: 'Fighter',
    background: '',
    alignment: 'Neutral Good',
    attributes: {
      Strength: 8,
      Dexterity: 8,
      Constitution: 8,
      Intelligence: 8,
      Wisdom: 8,
      Charisma: 8,
    },
    skills: {},
    equipment: '',
    proficienciesAndLanguages: '',
    features: '',
    treasure: '',
    currency: {
      cp: 0,
      sp: 0,
      ep: 0,
      gp: 0,
      pp: 0,
    },
    resourcePools: [],
    talents: [],
    expertises: [],
    appearance: {
      age: '',
      height: '',
      weight: '',
      eyes: '',
      skin: '',
      hair: '',
      description: '',
    },
    personality: {
      traits: '',
      ideals: '',
      bonds: '',
      flaws: '',
    },
  });

  const pointsUsed = useMemo(() => calculateTotalPoints(formData.attributes), [formData.attributes]);
  const pointsRemaining = attributeBudget - pointsUsed;

  const updateField = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const setAttributeScore = useCallback(
    (attr: Attribute, rawValue: number) => {
      setFormData((prev) => {
        const currentScore = prev.attributes[attr];
        const clamped = Math.max(8, Math.min(15, Math.round(rawValue)));

        if (clamped === currentScore) {
          return prev;
        }

        const currentTotal = calculateTotalPoints(prev.attributes);
        const nextTotal = currentTotal - getPointCost(currentScore) + getPointCost(clamped);

        if (nextTotal > attributeBudget) {
          return prev;
        }

        return {
          ...prev,
          attributes: { ...prev.attributes, [attr]: clamped },
        };
      });
    },
    [attributeBudget]
  );

  const updateAppearance = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      appearance: { ...prev.appearance, [field]: value },
    }));
  };

  const updatePersonality = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      personality: { ...prev.personality, [field]: value },
    }));
  };

  const ensurePlaceholderReferences = useCallback(async () => {
    if (placeholderRefs) {
      return placeholderRefs;
    }

    setPlaceholderLoading(true);
    try {
      const entries = await Promise.all(
        Object.entries(PLACEHOLDER_REFERENCES).map(async ([key, config]) => {
          const response = await fetch(config.src);
          if (!response.ok) {
            throw new Error(`Failed to load placeholder ${key}`);
          }

          const blob = await response.blob();
          const buffer = await blob.arrayBuffer();
          const base64 = arrayBufferToBase64(buffer);

          const decodeDimensions = async (): Promise<{ width: number; height: number } | undefined> => {
            if (typeof createImageBitmap === 'function') {
              const bitmap = await createImageBitmap(blob);
              const result = { width: bitmap.width, height: bitmap.height };
              if (typeof bitmap.close === 'function') {
                bitmap.close();
              }
              return result;
            }

            if (typeof window === 'undefined') {
              return undefined;
            }

            return new Promise<{ width: number; height: number }>((resolve, reject) => {
              const img = new Image();
              const url = URL.createObjectURL(blob);
              img.onload = () => {
                const result = { width: img.naturalWidth, height: img.naturalHeight };
                URL.revokeObjectURL(url);
                resolve(result);
              };
              img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error(`Failed to decode placeholder ${key}`));
              };
              img.src = url;
            });
          };

          const dimensions = await decodeDimensions();

          return {
            key: key as keyof AvatarPreviewResponse,
            reference: {
              mimeType: config.mimeType,
              data: base64,
              description: config.description,
            } satisfies ReferenceImagePayload,
            dimensions,
          };
        })
      );

      const refs: Partial<Record<keyof AvatarPreviewResponse, ReferenceImagePayload>> = {};
      const dims: Partial<Record<keyof AvatarPreviewResponse, { width: number; height: number }>> = {};

      entries.forEach(({ key, reference, dimensions }) => {
        refs[key] = reference;
        if (dimensions) {
          dims[key] = dimensions;
        }
      });

      setPlaceholderRefs(refs);
      setPlaceholderDimensions(dims);
      return refs;
    } finally {
      setPlaceholderLoading(false);
    }
  }, [placeholderRefs]);

  useEffect(() => {
    void ensurePlaceholderReferences();
  }, [ensurePlaceholderReferences]);

  const loadTemplate = async (archetype: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/game-data/character-templates/${archetype}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error('Failed to load template');
      }

      const template = result.data;

      if (!template?.attributes?.Strength) {
        throw new Error('Template missing required attributes');
      }
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
        currency: template.currency ?? {
          cp: 0,
          sp: 0,
          ep: 0,
          gp: 0,
          pp: 0,
        },
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
      setPreviewLoadState({
        portrait: false,
        upperBody: false,
        fullBody: false,
      });
      setPreviewError(null);
    } catch (err) {
      setError('Failed to load character template');
    } finally {
      setLoading(false);
    }
  };

  const buildAvatarPayload = (): AvatarGenerationPayload => {
    const nilIfEmpty = (value?: string) => {
      if (!value) return undefined;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    };

    const attributeSummary = Object.entries(formData.attributes)
      .map(([attr, score]) => `${attr.toUpperCase()}: ${score}`)
      .join(', ');

    const skillSummary = Object.entries(formData.skills || {})
      .filter(([, score]) => typeof score === 'number')
      .map(([skill, score]) => `${skill}: ${score}`)
      .join(', ');

    const appearanceBits = [
      formData.appearance.age ? `age ${formData.appearance.age}` : '',
      formData.appearance.height ? `height ${formData.appearance.height}` : '',
      formData.appearance.weight ? `weight ${formData.appearance.weight}` : '',
      formData.appearance.eyes ? `eyes ${formData.appearance.eyes}` : '',
      formData.appearance.skin ? `skin ${formData.appearance.skin}` : '',
      formData.appearance.hair ? `hair ${formData.appearance.hair}` : '',
      formData.appearance.description || '',
    ]
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
      .join(', ');

    const equipmentSummary = formData.equipment?.trim();
    const proficienciesSummary = formData.proficienciesAndLanguages?.trim();
    const featuresSummary = formData.features?.trim();
    const treasureSummary = formData.treasure?.trim();

    const currencySummary = formData.currency
      ? Object.entries(formData.currency)
          .map(([denom, value]) => `${denom.toUpperCase()}:${value}`)
          .join(', ')
      : '';

    const resourceSummary =
      formData.resourcePools.length > 0
        ? formData.resourcePools
            .map(
              (pool) =>
                `${pool.name} ${pool.current}/${pool.max} (${pool.refresh})${
                  pool.description ? ` - ${pool.description}` : ''
                }`
            )
            .join('; ')
        : '';

    const talentSummary =
      formData.talents.length > 0
        ? formData.talents.map((talent) => `${talent.name} [${talent.category}] - ${talent.description}`).join('; ')
        : '';

    const expertiseSummary = (formData.expertises ?? []).join(', ');

    const worldSummary = room.worldDescription
      ? room.worldDescription.replace(/\s+/g, ' ').trim().slice(0, 800)
      : undefined;

    const baseSections = [
      `${formData.name}, a level ${startingLevel} ${formData.alignment} ${formData.race} ${formData.characterClass}.`,
      attributeSummary ? `Core attributes: ${attributeSummary}.` : null,
      skillSummary ? `Skill proficiencies: ${skillSummary}.` : null,
      appearanceBits ? `Physical appearance: ${appearanceBits}.` : null,
      formData.personality.traits ? `Personality traits: ${formData.personality.traits}.` : null,
      formData.personality.ideals ? `Ideals: ${formData.personality.ideals}.` : null,
      formData.personality.bonds ? `Bonds: ${formData.personality.bonds}.` : null,
      formData.personality.flaws ? `Flaws: ${formData.personality.flaws}.` : null,
      expertiseSummary ? `Expertises: ${expertiseSummary}.` : null,
      formData.background ? `Backstory synopsis: ${formData.background}.` : null,
      talentSummary ? `Talents: ${talentSummary}.` : null,
      featuresSummary ? `Features: ${featuresSummary}.` : null,
      proficienciesSummary ? `Languages & proficiencies: ${proficienciesSummary}.` : null,
      equipmentSummary ? `Equipment: ${equipmentSummary}.` : null,
      currencySummary ? `Currency: ${currencySummary}.` : null,
      resourceSummary ? `Resource pools: ${resourceSummary}.` : null,
      treasureSummary ? `Treasure: ${treasureSummary}.` : null,
      worldSummary ? `World context: ${worldSummary}.` : null,
    ]
      .filter(Boolean)
      .join(' ');

    const basePrompt =
      baseSections.trim() ||
      `${formData.name}, a level ${startingLevel} ${formData.alignment} ${formData.race} ${formData.characterClass} hero.`;

    return {
      name: formData.name,
      basePrompt,
      appearance: {
        race: formData.race,
        classRole: formData.characterClass,
        lineage: nilIfEmpty(formData.background),
        hair: nilIfEmpty(formData.appearance.hair),
        eyes: nilIfEmpty(formData.appearance.eyes),
        attire: nilIfEmpty(formData.appearance.description),
        accessories: nilIfEmpty(formData.personality.bonds),
        notableFeatures: nilIfEmpty(formData.personality.traits),
      },
      artStyle: room.settings?.tone
        ? `${room.settings.tone} fantasy illustration`
        : 'High detail painterly fantasy illustration with dramatic lighting',
      tone: [formData.personality.traits, room.settings?.tone, formData.alignment]
        .filter((value) => value && value.trim().length > 0)
        .join(' | '),
      narrative: {
        worldSummary,
        currentScene: nilIfEmpty(formData.background.slice(0, 200)),
        playerIntent: nilIfEmpty(formData.personality.ideals),
      },
    };
  };

  const handleGeneratePreview = async () => {
    try {
      setPreviewLoading(true);
      setPreviewError(null);
      setAvatarPreview({});
      setPreviewLoadState({
        portrait: true,
        upperBody: true,
        fullBody: true,
      });
      const refs = await ensurePlaceholderReferences();
      const payload = buildAvatarPayload();
      const portraitPayload = appendReference(payload, refs?.portrait);
      const portraitRaw = await generateAvatarPortrait(portraitPayload);
      let portrait = portraitRaw;
      try {
        portrait = await downscalePreviewImage(portraitRaw);
      } catch (downscaleError) {
        // eslint-disable-next-line no-console
        console.warn('Failed to downscale portrait preview', downscaleError);
      }
      setAvatarPreview({ portrait });
      setPreviewLoadState((prev) => ({
        ...prev,
        portrait: false,
      }));

      const upperBodyPayload = appendReference(payload, refs?.upperBody);
      const upperBodyRaw = await generateAvatarUpperBody(upperBodyPayload, portrait);
      let upperBody = upperBodyRaw;
      try {
        upperBody = await downscalePreviewImage(upperBodyRaw);
      } catch (downscaleError) {
        // eslint-disable-next-line no-console
        console.warn('Failed to downscale upper-body preview', downscaleError);
      }
      setAvatarPreview((prev) => ({
        ...prev,
        portrait,
        upperBody,
      }));
      setPreviewLoadState((prev) => ({
        ...prev,
        upperBody: false,
      }));

      const fullBodyPayload = appendReference(payload, refs?.fullBody);
      const fullBodyRaw = await generateAvatarFullBody(fullBodyPayload, portrait, upperBody);
      let fullBody = fullBodyRaw;
      try {
        fullBody = await downscalePreviewImage(fullBodyRaw);
      } catch (downscaleError) {
        // eslint-disable-next-line no-console
        console.warn('Failed to downscale full-body preview', downscaleError);
      }
      setAvatarPreview((prev) => ({
        ...prev,
        portrait,
        upperBody,
        fullBody,
      }));
      setPreviewLoadState({
        portrait: false,
        upperBody: false,
        fullBody: false,
      });
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : 'Failed to generate portraits');
    } finally {
      setPreviewLoading(false);
      setPreviewLoadState({
        portrait: false,
        upperBody: false,
        fullBody: false,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Character name is required');
      return;
    }

    if (!formData.background.trim() || formData.background.length < 50) {
      setError('Background story must be at least 50 characters and describe your character relationships');
      return;
    }

    if (pointsRemaining !== 0) {
      setError(`You must use all ${attributeBudget} attribute points (${pointsRemaining} remaining)`);
      return;
    }

    if (!avatarPreview.portrait || !avatarPreview.upperBody || !avatarPreview.fullBody) {
      setError('Generate character portraits before creating your character.');
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
        equipment: '',
        currency: {
          cp: 0,
          sp: 0,
          ep: 0,
          gp: 0,
          pp: 0,
        },
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
        avatarPreview: {
          portrait,
          upperBody,
          fullBody,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create character');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {(loading || dataLoading) && <LoadingOverlay message={loading ? 'Creating character...' : 'Loading data...'} />}
      {isStarting && <LoadingOverlay message="The adventure begins..." size="large" />}
      <div className="min-h-screen p-4 md:p-8 bg-background">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-aurora-300 mb-2">The Stage Is Set</h1>
            <p className="text-shadow-400">Prepare your character for the journey ahead</p>
          </div>

          {/* Teamwork Guidance */}
          <div className="mb-6 rounded-lg border border-accent/30 bg-gradient-to-br from-midnight-900/70 via-midnight-800/60 to-midnight-700/60 p-4">
            <h3 className="text-lg font-bold text-aurora-200 mb-2">🤝 Adventure Together</h3>
            <p className="text-shadow-300 text-sm leading-relaxed">
              <strong>This is a team adventure!</strong> When writing your background, consider how your character knows
              or could connect with the other players in your party. Share common goals, past encounters, or
              complementary skills. Strong relationships make for better storytelling and more engaging gameplay!
            </p>
          </div>

          {/* World Description */}
          <div className="p-6 bg-midnight-700 rounded-lg border border-midnight-600 mb-8">
            <h2 className="text-xl font-bold text-aurora-300 mb-3">World</h2>
            <div className="text-shadow-200 leading-relaxed prose-invert max-w-none">
              {room.worldDescription ? (
                <MarkdownMessage content={room.worldDescription} />
              ) : (
                <p className="italic text-shadow-500">Generating world description...</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Character Creation Form */}
            <div>
              <h2 className="text-2xl font-bold text-aurora-300 mb-4">
                {hasCharacter ? 'Your Character' : 'Create Your Character'}
              </h2>

              {hasCharacter ? (
                <div className="p-6 bg-midnight-700 rounded-lg border border-midnight-600 space-y-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={currentUserAvatar}
                      alt={userPlayer?.character.name ?? 'Character avatar'}
                      className="h-12 w-12 flex-shrink-0 rounded-full border border-accent/40 object-cover shadow-lg"
                    />
                    <div>
                      <h3 className="text-xl font-bold text-shadow-50">{userPlayer?.character.name}</h3>
                      <p className="text-shadow-300 text-sm">
                        Level {userPlayer?.character.level} {userPlayer?.character.race}{' '}
                        {userPlayer?.character.characterClass}
                      </p>
                    </div>
                  </div>
                  <p className="text-shadow-500 text-xs">{userPlayer?.character.alignment}</p>

                  {userPlayer?.isReady ? (
                    <div>
                      <p className="text-aurora-200 font-semibold">✓ You are ready!</p>
                      <p className="text-shadow-500 text-sm mt-1">Waiting for other players...</p>
                      <Button onClick={() => setReady(room.id, false)} variant="secondary" className="mt-3 w-full">
                        Unready
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={() => setReady(room.id, true)} className="w-full">
                      Ready Up!
                    </Button>
                  )}
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="space-y-6 rounded-lg border border-midnight-600 bg-midnight-700/95 p-6"
                >
                  {/* Quick Create Templates */}
                  <div className="rounded-lg border border-accent/25 bg-midnight-800/50 p-4">
                    <h3 className="text-sm font-semibold text-aurora-200 mb-3">⚡ Quick Create</h3>
                    <p className="text-xs text-shadow-400 mb-3">Load a pre-made character for quick testing</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <Button type="button" onClick={() => loadTemplate('fighter')} variant="secondary" size="sm">
                        Fighter
                      </Button>
                      <Button type="button" onClick={() => loadTemplate('wizard')} variant="secondary" size="sm">
                        Wizard
                      </Button>
                      <Button type="button" onClick={() => loadTemplate('rogue')} variant="secondary" size="sm">
                        Rogue
                      </Button>
                      <Button type="button" onClick={() => loadTemplate('cleric')} variant="secondary" size="sm">
                        Cleric
                      </Button>
                      <Button type="button" onClick={() => loadTemplate('ranger')} variant="secondary" size="sm">
                        Ranger
                      </Button>
                      <Button type="button" onClick={() => loadTemplate('paladin')} variant="secondary" size="sm">
                        Paladin
                      </Button>
                      <Button type="button" onClick={() => loadTemplate('barbarian')} variant="secondary" size="sm">
                        Barbarian
                      </Button>
                      <Button type="button" onClick={() => loadTemplate('bard')} variant="secondary" size="sm">
                        Bard
                      </Button>
                      <Button type="button" onClick={() => loadTemplate('monk')} variant="secondary" size="sm">
                        Monk
                      </Button>
                      <Button type="button" onClick={() => loadTemplate('sorcerer')} variant="secondary" size="sm">
                        Sorcerer
                      </Button>
                      <Button type="button" onClick={() => loadTemplate('druid')} variant="secondary" size="sm">
                        Druid
                      </Button>
                      <Button type="button" onClick={() => loadTemplate('ranger_archer')} variant="secondary" size="sm">
                        Archer
                      </Button>
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div>
                    <Label htmlFor="name">Character Name *</Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      placeholder="Enter your character's name"
                      className="w-full"
                    />
                  </div>

                  <div className="text-sm text-shadow-400 p-3 bg-midnight-800/50 rounded border border-midnight-600">
                    <strong>Starting Level:</strong> {startingLevel}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="race">Race *</Label>
                      <Select value={formData.race} onValueChange={(value) => updateField('race', value)}>
                        <SelectTrigger id="race">
                          <SelectValue placeholder="Select race" />
                        </SelectTrigger>
                        <SelectContent>
                          {races?.map((race) => (
                            <SelectItem key={race.id} value={race.name}>
                              {race.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="class">Class *</Label>
                      <Select
                        value={formData.characterClass}
                        onValueChange={(value) => updateField('characterClass', value)}
                      >
                        <SelectTrigger id="class">
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes?.map((cls) => (
                            <SelectItem key={cls.id} value={cls.name}>
                              {cls.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alignment">Alignment *</Label>
                    <Select value={formData.alignment} onValueChange={(value) => updateField('alignment', value)}>
                      <SelectTrigger id="alignment">
                        <SelectValue placeholder="Select alignment" />
                      </SelectTrigger>
                      <SelectContent>
                        {alignments?.map((alignment) => (
                          <SelectItem key={alignment.id} value={alignment.name}>
                            {alignment.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Background Story */}
                  <div className="space-y-2">
                    <Label htmlFor="background">
                      Background Story * <span className="text-xs text-shadow-500">(min 50 characters)</span>
                    </Label>
                    <Textarea
                      id="background"
                      value={formData.background}
                      onChange={(e) => updateField('background', e.target.value)}
                      placeholder="Write your character's background story here. IMPORTANT: Include how you know or connect with the other party members. Do you share a common goal? Did you meet at a tavern? Are you childhood friends? Strong party bonds make for better adventures!"
                      rows={6}
                      className="w-full resize-none"
                    />
                    <p className="text-xs text-shadow-500">
                      {formData.background.length}
                      /50 characters
                      {formData.background.length >= 50 && <span className="text-green-500 ml-2">✓</span>}
                    </p>
                  </div>

                  {/* Attributes with Point Buy */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <Label>Attributes (Point Buy)</Label>
                      <div
                        className={`px-3 py-1 rounded-full text-sm font-bold ${
                          pointsRemaining < 0
                            ? 'bg-destructive/20 text-destructive-foreground'
                            : pointsRemaining === 0
                              ? 'bg-aurora-900/45 text-aurora-200'
                              : 'bg-accent/20 text-accent'
                        }`}
                      >
                        {pointsRemaining === 0 ? '✓ Perfect!' : `${pointsRemaining} points left`}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {ATTRIBUTES.map((attr) => {
                        const score = formData.attributes[attr];
                        const modifier = Math.floor((score - 10) / 2);
                        const cost = getPointCost(score);
                        const nextCost = score >= 15 ? cost : getPointCost(score + 1);
                        const costDelta = score >= 15 ? Number.POSITIVE_INFINITY : nextCost - cost;
                        const canIncrease = score < 15 && costDelta <= pointsRemaining;
                        const effectiveMax = canIncrease ? 15 : score;

                        return (
                          <div
                            key={attr}
                            className="rounded-lg border border-midnight-600 bg-midnight-800/90 p-3 space-y-3"
                          >
                            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-shadow-400">
                              <span>{attr}</span>
                              <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[0.6rem] text-accent">
                                {cost} pts
                              </span>
                            </div>
                            <NumericStepper
                              value={score}
                              min={8}
                              max={effectiveMax}
                              step={1}
                              decreaseLabel={`Decrease ${attr}`}
                              increaseLabel={`Increase ${attr}`}
                              onChange={(nextScore) => setAttributeScore(attr, nextScore)}
                              wrapperClassName="border border-midnight-700 bg-midnight-900/60 px-3 py-2"
                              inputClassName="text-xl font-semibold text-shadow-50"
                            />
                            <div className="text-xs text-center text-shadow-400">
                              Mod {modifier >= 0 ? '+' : ''}
                              {modifier}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-shadow-500 mt-2">
                      Range: 8-15 | Total Budget:
                      {attributeBudget} points
                    </p>
                  </div>

                  {/* Appearance (Optional) */}
                  <details className="border-t border-midnight-600 pt-4">
                    <summary className="text-sm font-medium text-shadow-400 mb-3 cursor-pointer hover:text-shadow-200">
                      Appearance (Optional) ▼
                    </summary>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                      <Input
                        type="text"
                        value={formData.appearance.age}
                        onChange={(e) => updateAppearance('age', e.target.value)}
                        placeholder="Age"
                        className="text-sm"
                      />
                      <Input
                        type="text"
                        value={formData.appearance.height}
                        onChange={(e) => updateAppearance('height', e.target.value)}
                        placeholder="Height"
                        className="text-sm"
                      />
                      <Input
                        type="text"
                        value={formData.appearance.weight}
                        onChange={(e) => updateAppearance('weight', e.target.value)}
                        placeholder="Weight"
                        className="text-sm"
                      />
                      <Input
                        type="text"
                        value={formData.appearance.eyes}
                        onChange={(e) => updateAppearance('eyes', e.target.value)}
                        placeholder="Eyes"
                        className="text-sm"
                      />
                      <Input
                        type="text"
                        value={formData.appearance.skin}
                        onChange={(e) => updateAppearance('skin', e.target.value)}
                        placeholder="Skin"
                        className="text-sm"
                      />
                      <Input
                        type="text"
                        value={formData.appearance.hair}
                        onChange={(e) => updateAppearance('hair', e.target.value)}
                        placeholder="Hair"
                        className="text-sm"
                      />
                    </div>
                    <Textarea
                      value={formData.appearance.description}
                      onChange={(e) => updateAppearance('description', e.target.value)}
                      placeholder="Physical description..."
                      rows={2}
                      className="mt-3 text-sm resize-none"
                    />
                  </details>

                  {/* Avatar Portrait Generation */}
                  <div className="border-t border-midnight-600 pt-4 space-y-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <Label>Character Portraits</Label>
                        <p className="text-xs text-shadow-500">
                          Generate visual references of your hero before finalising the sheet.
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={handleGeneratePreview}
                        disabled={previewPending || placeholderLoading}
                      >
                        {previewPending
                          ? 'Generating...'
                          : avatarPreview.portrait && avatarPreview.upperBody && avatarPreview.fullBody
                            ? 'Regenerate Portraits'
                            : 'Generate Portraits'}
                      </Button>
                    </div>
                    {previewError && (
                      <div className="rounded-lg border border-red-500 bg-red-900/40 p-3 text-sm text-red-200">
                        {previewError}
                      </div>
                    )}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      {previewPlaceholders.map(({ key, src, label }) => {
                        const isFullBody = key === 'fullBody';
                        const asset = avatarPreview[key];
                        const shouldShowSpinner = previewLoadState[key] || (!asset && previewBusy);
                        const spinnerDiceCount = key === 'portrait' ? 1 : key === 'upperBody' ? 2 : 3;
                        const baseFigureClasses =
                          'rounded-xl border border-midnight-600 bg-midnight-800/70 flex flex-col items-center justify-center overflow-hidden p-6';
                        const placeholderDims = placeholderDimensions[key];

                        if (shouldShowSpinner) {
                          return (
                            <figure key={key} className={`${baseFigureClasses} w-full`}>
                              <DiceLoader size="small" diceCount={spinnerDiceCount} />
                            </figure>
                          );
                        }

                        if (asset) {
                          const aspectStyle =
                            asset.width && asset.height
                              ? { aspectRatio: `${asset.width} / ${asset.height}` }
                              : undefined;

                          return (
                            <figure key={key} className={`${baseFigureClasses} w-full`} style={aspectStyle}>
                              <img
                                src={`data:${asset.mimeType};base64,${asset.data}`}
                                alt={`${formData.name || 'Character'} ${label}`}
                                className={`w-full h-auto object-contain ${isFullBody ? 'bg-midnight-900' : ''}`}
                              />
                              <figcaption className="px-3 py-2 text-xs font-semibold text-shadow-300">
                                {label}
                              </figcaption>
                            </figure>
                          );
                        }

                        return (
                          <figure
                            key={key}
                            className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-midnight-600 bg-midnight-800/40 p-6 text-center text-sm text-shadow-400"
                            style={
                              placeholderDims
                                ? { aspectRatio: `${placeholderDims.width} / ${placeholderDims.height}` }
                                : undefined
                            }
                          >
                            <img src={src} alt={label} className="w-full h-auto object-contain opacity-90" />
                            <figcaption>
                              {label}
                              <br />
                              <span className="text-xs text-shadow-500">Generate to preview</span>
                            </figcaption>
                          </figure>
                        );
                      })}
                    </div>
                  </div>

                  {/* Personality (Optional) */}
                  <details className="border-t border-midnight-600 pt-4">
                    <summary className="text-sm font-medium text-shadow-400 mb-3 cursor-pointer hover:text-shadow-200">
                      Personality (Optional) ▼
                    </summary>
                    <div className="space-y-2 mt-3">
                      <Input
                        type="text"
                        value={formData.personality.traits}
                        onChange={(e) => updatePersonality('traits', e.target.value)}
                        placeholder="Personality Traits"
                        className="text-sm"
                      />
                      <Input
                        type="text"
                        value={formData.personality.ideals}
                        onChange={(e) => updatePersonality('ideals', e.target.value)}
                        placeholder="Ideals"
                        className="text-sm"
                      />
                      <Input
                        type="text"
                        value={formData.personality.bonds}
                        onChange={(e) => updatePersonality('bonds', e.target.value)}
                        placeholder="Bonds"
                        className="text-sm"
                      />
                      <Input
                        type="text"
                        value={formData.personality.flaws}
                        onChange={(e) => updatePersonality('flaws', e.target.value)}
                        placeholder="Flaws"
                        className="text-sm"
                      />
                    </div>
                  </details>

                  {error && (
                    <div className="p-3 bg-red-900/50 border border-red-500 rounded-lg">
                      <p className="text-red-200 text-sm">{error}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={
                      loading ||
                      dataLoading ||
                      pointsRemaining !== 0 ||
                      previewLoading ||
                      placeholderLoading ||
                      !avatarPreview.portrait ||
                      !avatarPreview.upperBody ||
                      !avatarPreview.fullBody
                    }
                    className="w-full"
                  >
                    {(() => {
                      if (loading) return 'Creating...';
                      if (dataLoading) return 'Loading...';
                      return 'Create Character';
                    })()}
                  </Button>
                </form>
              )}
            </div>

            {/* Player List */}
            <div>
              <h2 className="text-2xl font-bold text-aurora-300 mb-4">Adventuring Party</h2>
              <div className="space-y-3">
                {players.length === 0 && (
                  <p className="text-shadow-500 text-center p-8">Waiting for players to create characters...</p>
                )}
                {players.map((player) => {
                  const playerAvatar =
                    player.userId === user?.uid && currentUserAvatar ? currentUserAvatar : '/face.png';

                  return (
                    <div key={player.id} className="p-4 bg-midnight-700 rounded-lg border border-midnight-600">
                      <div className="flex items-center justify-between mb-3 gap-3">
                        <div className="flex items-center gap-3">
                          {player.character.avatarAssets?.portrait?.publicUrl ? (
                            <img
                              src={player.character.avatarAssets.portrait.publicUrl}
                              alt={`${player.character.name} portrait`}
                              className="h-10 w-10 flex-shrink-0 rounded-full border border-accent/40 object-cover"
                            />
                          ) : (
                            <img
                              src={playerAvatar}
                              alt={`${player.name} avatar`}
                              className="h-10 w-10 flex-shrink-0 rounded-full border border-accent/30 object-cover"
                              loading="lazy"
                            />
                          )}
                          <div>
                            <h3 className="font-bold text-lg text-shadow-50">{player.character.name}</h3>
                            <p className="text-shadow-300 text-sm">
                              Level {player.character.level} {player.character.race} {player.character.characterClass}
                            </p>
                          </div>
                        </div>
                        {player.isReady && <span className="text-aurora-200 text-sm font-semibold">✓ Ready</span>}
                      </div>
                      <p className="text-shadow-500 text-xs">{player.character.alignment}</p>
                      {player.character.backstory && (
                        <p className="text-shadow-400 text-xs mt-2 italic line-clamp-2">{player.character.backstory}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {hasCharacter && (
                <div className="mt-6 p-4 bg-midnight-800/40 border border-aurora-500/30 rounded-lg">
                  <p className="text-aurora-200 text-sm font-semibold">
                    {players.filter((p) => p.isReady).length} /{room.settings?.playerCount || players.length} players
                    ready
                  </p>
                  <p className="text-shadow-500 text-xs mt-1">Game starts when all players are ready</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
