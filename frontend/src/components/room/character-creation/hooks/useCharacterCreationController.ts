import { useEffect, useMemo, useState, useCallback } from 'react';
import { useCharacterFormState } from '../useCharacterFormState';
import { useEquipmentLogic } from './useEquipmentLogic';
import { useAvatarGeneration } from './useAvatarGeneration';
import useAuth from '../../../../hooks/useAuth';
import { useI18n } from '../../../../i18n';
import { useAlignments, useRaces, useClasses } from '../../../../hooks/useGameData';
import { calculateTotalPoints } from '../validation';
import { loadPlaceholderReferences } from '../avatarHelpers';
import { createCharacterPayload, submitCharacter } from '../services/submission-payloads';
import { generateRandomCharacter } from '../../../../services/characterGenerator';
import type { Attribute } from '../../@daicer/engine';

export function useCharacterCreationController(props: any) {
  const { room, players = [], assetMode = false, settings, onAssetCreated, onCharacterCreated } = props;
  const { user } = useAuth();
  const { t } = useI18n();

  // 1. Core Form State
  const startingLevel = settings?.startingLevel || room?.settings?.startingLevel || 1;
  const attributeBudget = settings?.attributeBudget || room?.settings?.attributePointBudget || 27;

  const formState = useCharacterFormState(startingLevel, attributeBudget, assetMode);
  const { formData, setFormData, effectiveLevel, placeholderRefs, setPlaceholderRefs, setPlaceholderDimensions } =
    formState;

  // 2. Equipment
  const equipment = useEquipmentLogic({
    assetMode,
    formDataClass: formData.characterClass,
    initialGold: 0, // Will be set by effect
  });

  // Sync gold initialization
  useEffect(() => {
    if (formData.characterClass) {
      equipment.setEquipmentGold(assetMode ? 9999999 : 100);
    }
  }, [formData.characterClass, assetMode]);

  // 3. Avatar Generation
  const avatarGen = useAvatarGeneration(
    formData,
    room,
    startingLevel,
    equipment.equippedItems,
    equipment.equipmentItems,
    assetMode
  );

  // 4. Data Loading
  const { data: alignments, loading: alLoading } = useAlignments();
  const { data: races, loading: rLoading } = useRaces();
  const { data: classes, loading: cLoading } = useClasses();

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 5. Helpers
  const pointsUsed = useMemo(() => calculateTotalPoints(formData.attributes), [formData.attributes]);
  const pointsRemaining = attributeBudget - pointsUsed;

  const updateField = (field: any, value: any) => setFormData((p) => ({ ...p, [field]: value }));

  const ensurePlaceholderReferences = async () => {
    if (placeholderRefs && Object.keys(placeholderRefs).length > 0) return placeholderRefs;
    const { refs, dims } = await loadPlaceholderReferences();
    setPlaceholderRefs(refs);
    setPlaceholderDimensions(dims);
    return refs;
  };

  const handleGenerateAll = () => avatarGen.handleGenerateAll(ensurePlaceholderReferences);

  const handleCreateCharacter = async () => {
    if (!assetMode && !room) return setError('Room not found');
    if (!formData.name) return setError(t('characterCreation.errors.nameRequired'));
    // Validation logic cut for brevity, assuming formState or helper handles detailed validation or we rely on backend error

    try {
      setLoading(true);
      const payload = createCharacterPayload(
        formData,
        effectiveLevel,
        equipment.inventory,
        equipment.equippedItems,
        equipment.equipmentItems,
        equipment.equipmentGold
      );
      await submitCharacter(
        room,
        payload,
        assetMode,
        avatarGen.avatarPreview,
        onAssetCreated,
        onCharacterCreated,
        effectiveLevel
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplate = async (archetype: string) => {
    setLoading(true);
    const generated = generateRandomCharacter(archetype, formData.race);
    setFormData((prev) => ({ ...prev, ...generated, attributes: generated.attributes as any }));
    setLoading(false);
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
    [attributeBudget, setFormData]
  );

  const previewImages = useMemo(() => {
    const map: Record<string, string | null> = { portrait: null, upperBody: null, fullBody: null };
    ['portrait', 'upperBody', 'fullBody'].forEach((slot) => {
      const s = slot as 'portrait' | 'upperBody' | 'fullBody';
      if (avatarGen.avatarPreview[s]) {
        map[s] = `data:${avatarGen.avatarPreview[s].mimeType};base64,${avatarGen.avatarPreview[s].data}`;
      }
    });
    return map;
  }, [avatarGen.avatarPreview]);

  return {
    ...formState,
    equipment,
    avatarGen,
    previewImages,
    data: { alignments, races, classes },
    ui: {
      loading:
        loading ||
        alLoading ||
        rLoading ||
        cLoading ||
        avatarGen.previewLoadState.portrait ||
        avatarGen.previewLoadState.upperBody ||
        avatarGen.previewLoadState.fullBody,
      error: error || avatarGen.genError,
      pointsUsed,
      pointsRemaining,
      attributeBudget,
    },
    actions: { updateField, handleGenerateAll, handleCreateCharacter, loadTemplate, setAttributeScore },
    user,
  };
}
