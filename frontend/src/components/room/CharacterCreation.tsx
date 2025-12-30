import { useMemo, useEffect } from 'react';
import { Package, ShoppingCart, Shield } from 'lucide-react';
import clsx from 'clsx';
import { LoadingOverlay } from '../ui/LoadingOverlay';
import Textarea from '../ui/textarea';
import { DiceLoader } from '../ui/dice-loader';
import { useI18n } from '../../i18n';
import type { CharacterCreationProps } from './character-creation/types';
import { AttributesSection } from './character-creation/AttributesSection';
import { AppearanceSection } from './character-creation/AppearanceSection';
import { PersonalitySection } from './character-creation/PersonalitySection';
import { AvatarSection } from './character-creation/AvatarSection';
import { EquipmentShop } from '../equipment/EquipmentShop';
import { useCharacterCreationController } from './character-creation/hooks/useCharacterCreationController';
import { RaceSelectionGrid } from './character-creation/helpers';
import { EpicClassSelectionGrid } from './character-creation/EpicClassCards';
import {
  FormWizard,
  FormWizardContent,
  FormWizardStep,
  FormWizardActions,
  type Step,
  useFormWizard,
} from '../ui/FormWizard';

function CharacterCreationWizardContent({ ctrl }: { ctrl: ReturnType<typeof useCharacterCreationController> }) {
  // const { t } = useI18n();
  const { formData, equipment, avatarGen, ui, actions, data, previewImages } = ctrl;
  const { currentStepIndex, steps, nextStep, previousStep, setCanGoNext } = useFormWizard();
  const currentStep = steps[currentStepIndex];

  // Validation Effect
  useEffect(() => {
    if (currentStep?.id === 'attributes') {
      setCanGoNext(ui.pointsRemaining === 0);
    } else {
      setCanGoNext(true);
    }
  }, [currentStep?.id, ui.pointsRemaining, setCanGoNext]);

  if (!currentStep) return null;

  return (
    <div className="flex flex-col h-full">
      <FormWizardContent className="flex-1 overflow-y-auto p-6">
        {ui.error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <span>{ui.error}</span>
          </div>
        )}

        {currentStep.id === 'class' && (
          <FormWizardStep step="class">
            <EpicClassSelectionGrid
              options={(data.classes || []).map((c) => ({
                value: c.id || c.name,
                label: c.name,
                description: c.description,
              }))}
              selectedClass={formData.characterClass}
              onSelect={(id) => actions.updateField('characterClass', id)}
              loading={ui.loading}
            />
          </FormWizardStep>
        )}

        {currentStep.id === 'race' && (
          <FormWizardStep step="race">
            <RaceSelectionGrid
              options={(data.races || []).map((r) => ({
                id: r.id || r.name,
                name: r.name,
                description: r.description,
                size: r.size,
                speed: undefined, // speed is likely undefined on Race type from controller anyway, or I can map it if available
              }))}
              selectedRace={formData.race}
              onSelect={(id) => actions.updateField('race', id)}
              loading={ui.loading}
            />
          </FormWizardStep>
        )}

        {currentStep.id === 'attributes' && (
          <FormWizardStep step="attributes">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8">
                <AttributesSection
                  attributes={formData.attributes}
                  onAttributeChange={actions.setAttributeScore}
                  pointsRemaining={ui.pointsRemaining}
                  attributeBudget={ui.attributeBudget}
                />
              </div>
              <div className="lg:col-span-4 space-y-6">
                <div className="glass-panel p-6 rounded-xl space-y-4">
                  <h3 className="text-lg font-cinzel font-bold text-primary-gold">Point Buy</h3>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Budget</span>
                    <span className="font-mono">{ui.attributeBudget}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Remaining</span>
                    <span
                      className={clsx(
                        'font-mono font-bold',
                        ui.pointsRemaining < 0 ? 'text-destructive' : 'text-emerald-400'
                      )}
                    >
                      {ui.pointsRemaining}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </FormWizardStep>
        )}

        {currentStep.id === 'equipment' && (
          <FormWizardStep step="equipment">
            {!equipment.equipmentChoice ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <div
                  className="glass-panel p-8 rounded-xl cursor-pointer hover:border-primary-gold transition-colors text-center space-y-4"
                  onClick={equipment.handleChooseStartingPack}
                >
                  <Package className="w-12 h-12 mx-auto text-primary-gold" />
                  <h3 className="text-xl font-cinzel font-bold">Class Equipment</h3>
                  <p className="text-sm text-muted-foreground">
                    Start with a pre-selected pack of items suitable for your class.
                  </p>
                </div>
                <div
                  className="glass-panel p-8 rounded-xl cursor-pointer hover:border-primary-gold transition-colors text-center space-y-4"
                  onClick={equipment.handleChooseFreeGold}
                >
                  <ShoppingCart className="w-12 h-12 mx-auto text-emerald-400" />
                  <h3 className="text-xl font-cinzel font-bold">Gold & Shop</h3>
                  <p className="text-sm text-muted-foreground">Start with gold and buy your own gear from the shop.</p>
                </div>
              </div>
            ) : (
              <EquipmentShop
                items={equipment.equipmentItems}
                currentGold={equipment.equipmentGold}
                inventory={equipment.inventory}
                equippedItems={equipment.equippedItems}
                onBuyItem={equipment.handleBuyItem}
              />
            )}
          </FormWizardStep>
        )}

        {currentStep.id === 'details' && (
          <FormWizardStep step="details">
            <div className="space-y-8">
              <AppearanceSection
                name={formData.name}
                onNameChange={(val) => actions.updateField('name', val)}
                appearance={formData.appearance}
                onAppearanceChange={(k, v) => actions.updateField('appearance', { ...formData.appearance, [k]: v })}
              />
              <PersonalitySection
                personality={formData.personality}
                onPersonalityChange={(k, v) => actions.updateField('personality', { ...formData.personality, [k]: v })}
              />
              <div className="glass-panel p-6 rounded-xl space-y-4">
                <label className="text-sm font-medium text-muted-foreground">Backstory</label>
                <Textarea
                  value={formData.backstory}
                  onChange={(e) => actions.updateField('backstory', e.target.value)}
                  className="min-h-[150px]"
                  placeholder="Tell us about your hero..."
                />
              </div>
            </div>
          </FormWizardStep>
        )}

        {currentStep.id === 'review' && (
          <FormWizardStep step="review">
            <AvatarSection
              images={previewImages}
              loading={avatarGen.previewLoadState}
              onGenerateAll={actions.handleGenerateAll}
              onUpload={avatarGen.handleAvatarUpload}
              onCapture={avatarGen.handleAvatarUpdate}
              placeholderDimensions={ctrl.placeholderDimensions}
            />
          </FormWizardStep>
        )}
      </FormWizardContent>

      <FormWizardActions
        onNext={() => {
          if (currentStep.id === 'review') actions.handleCreateCharacter();
          else nextStep();
        }}
        onPrevious={previousStep}
      />
    </div>
  );
}

export default function CharacterCreation(props: CharacterCreationProps) {
  const { t } = useI18n();
  const ctrl = useCharacterCreationController(props);
  const { formData, ui, actions } = ctrl;

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
      {
        id: 'equipment',
        title: t('characterCreation.steps.equipment.title'),
        description: t('characterCreation.steps.equipment.description'),
      },
      {
        id: 'details',
        title: t('characterCreation.steps.details.title'),
        description: t('characterCreation.steps.details.description'),
      },
      {
        id: 'review',
        title: t('characterCreation.steps.review.title'),
        description: t('characterCreation.steps.review.description'),
      },
    ],
    [t]
  );

  if (ui.loading && !formData.characterClass)
    return (
      <div className="p-12 flex justify-center">
        <DiceLoader />
      </div>
    );

  return (
    <div className="w-full h-full flex flex-col bg-background text-foreground relative overflow-hidden">
      {ui.loading && <LoadingOverlay message={t('common.processing')} />}

      <FormWizard steps={wizardSteps} className="w-full h-full" onComplete={actions.handleCreateCharacter}>
        <CharacterCreationWizardContent ctrl={ctrl} />
      </FormWizard>
    </div>
  );
}
