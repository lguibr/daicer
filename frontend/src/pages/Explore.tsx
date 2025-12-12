import { useState, useEffect, useMemo } from 'react';
import {
  AcademicCapIcon,
  UserGroupIcon,
  IdentificationIcon,
  BoltIcon,
  AdjustmentsHorizontalIcon,
  GlobeAltIcon,
  BookmarkSquareIcon,
  SparklesIcon,
  ShieldExclamationIcon,
  BeakerIcon,
  CubeIcon,
  FireIcon,
  StarIcon,
  LightBulbIcon,
  WrenchScrewdriverIcon,
  // BookOpenIcon,
  // ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useI18n } from '../i18n';
import {
  getClasses,
  getRaces,
  getBackgrounds,
  getAbilities,
  getSkills,
  getAlignments,
  getLanguages,
  getMagicSchools,
  getConditions,
  getDamageTypes,
  getEquipment,
  getWeaponProperties,
  getMonsters,
  getMagicItems,
  getFeatures,
  getTraits,
  getSubclasses,
  getProficiencies,
} from '../services/game-data';
import PublicLayout from '../components/layout/PublicLayout';
import { DiceLoader } from '../components/ui/dice-loader/DiceLoader';
import ImageThumbnail from '../components/ui/ImageThumbnail';

const SECTION_LIMIT = 6;
const EXTENDED_SECTION_LIMIT = 12;

interface ExploreCard {
  id: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  badge?: string;
  meta?: { label: string; value: string }[];
}

interface ExploreSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  items: ExploreCard[];
}

interface DataState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  message?: string;
  payload?: any;
}

export default function ExplorePage() {
  const { t, language, localize } = useI18n();
  const [state, setState] = useState<DataState>({ status: 'idle' });

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setState({ status: 'loading' });
      try {
        const [
          classes,
          races,
          backgrounds,
          abilities,
          skills,
          alignments,
          languages,
          magicSchools,
          conditions,
          damageTypes,
          equipment,
          weaponProperties,
          monsters,
          magicItems,
          features,
          traits,
          subclasses,
          proficiencies,
        ] = await Promise.all([
          getClasses(),
          getRaces(),
          getBackgrounds(),
          getAbilities(),
          getSkills(),
          getAlignments(),
          getLanguages(),
          getMagicSchools(),
          getConditions(),
          getDamageTypes(),
          getEquipment(),
          getWeaponProperties(),
          getMonsters(),
          getMagicItems(),
          getFeatures(),
          getTraits(),
          getSubclasses(),
          getProficiencies(),
        ]);

        if (mounted) {
          setState({
            status: 'ready',
            payload: {
              classes,
              races,
              backgrounds,
              abilities,
              skills,
              alignments,
              languages,
              magicSchools,
              conditions,
              damageTypes,
              equipment,
              weaponProperties,
              monsters,
              magicItems,
              features,
              traits,
              subclasses,
              proficiencies,
              spells: [], // TODO: Add fetch service
              rules: [], // TODO: Add fetch service
            },
          });
        }
      } catch (err) {
        if (mounted) {
          console.error(err);
          setState({ status: 'error', message: 'Failed to load game data.' });
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const sections = useMemo<ExploreSection[]>(() => {
    if (state.status !== 'ready' || !state.payload) {
      return [];
    }

    const {
      classes,
      races,
      backgrounds,
      abilities,
      skills,
      alignments,
      languages,
      magicSchools,
      conditions,
      damageTypes,
      equipment,
      weaponProperties,
      monsters,
      magicItems,
      features,
      traits,
      subclasses,
      proficiencies,
      // spells,
      // rules,
    } = state.payload;

    const trimmedEquipment = equipment.slice(0, EXTENDED_SECTION_LIMIT);
    const trimmedWeaponProperties = weaponProperties.slice(0, SECTION_LIMIT);

    const formatCost = (cost: any) => {
      if (!cost) return '—';
      if (typeof cost === 'string') return cost;
      return `${cost.quantity} ${cost.unit}`;
    };

    return [
      {
        id: 'classes',
        title: t('explore.classes', 'Character Classes'),
        description: t(
          'explore.classesDesc',
          'Choose a heroic path. Compare martial prowess, spellcasting focus, and class features.'
        ),
        icon: AcademicCapIcon,
        items: classes.slice(0, SECTION_LIMIT).map((item: any) => ({
          id: item.id,
          title: localize(item, 'name'),
          description: localize(item, 'description'),
          imageUrl: item.imageUrl,
          badge: `Hit Die d${item.hitDie}`,
          meta: [
            { label: t('explore.primaryAbility', 'Primary Ability'), value: item.primaryAbility },
            { label: t('explore.savingThrows', 'Saving Throws'), value: item.savingThrows.join(', ') },
          ],
        })),
      },
      {
        id: 'races',
        title: t('explore.races', 'Ancestries'),
        description: t(
          'explore.racesDesc',
          'Discover unique traits, movement, and roleplaying hooks for each ancestry.'
        ),
        icon: UserGroupIcon,
        items: races.slice(0, SECTION_LIMIT).map((item: any) => ({
          id: item.id,
          title: localize(item, 'name'),
          description: localize(item, 'description'),
          imageUrl: item.imageUrl,
          meta: [
            { label: t('explore.speed', 'Speed'), value: `${item.speed} ft` },
            { label: t('explore.size', 'Size'), value: item.size },
          ],
        })),
      },
      {
        id: 'backgrounds',
        title: t('explore.backgrounds', 'Backgrounds'),
        description: t(
          'explore.backgroundsDesc',
          'Ground your character in the world with themed proficiencies and story prompts.'
        ),
        icon: IdentificationIcon,
        items: backgrounds.slice(0, SECTION_LIMIT).map((item: any) => ({
          id: item.id,
          title: localize(item, 'name'),
          description: localize(item, 'description'),
          imageUrl: item.imageUrl,
          meta: item.skillProficiencies.length
            ? [
                {
                  label: t('explore.skillProficiencies', 'Skill Proficiencies'),
                  value: item.skillProficiencies.join(', '),
                },
              ]
            : undefined,
        })),
      },
      {
        id: 'abilities',
        title: t('explore.abilities', 'Ability Scores'),
        description: t('explore.abilitiesDesc', 'Reference the six core abilities driving checks, saves, and combat.'),
        icon: BoltIcon,
        items: abilities.slice(0, SECTION_LIMIT).map((item: any) => ({
          id: item.id,
          title: localize(item, 'name'),
          description: localize(item, 'description'),
          imageUrl: item.imageUrl,
          badge: item.fullName,
        })),
      },
      {
        id: 'skills',
        title: t('explore.skills', 'Skills'),
        description: t('explore.skillsDesc', 'See where each skill applies and which ability fuels it.'),
        icon: AdjustmentsHorizontalIcon,
        items: skills.slice(0, SECTION_LIMIT).map((item: any) => ({
          id: item.id,
          title: localize(item, 'name'),
          description: localize(item, 'description'),
          imageUrl: item.imageUrl,
          meta: [{ label: t('explore.ability', 'Ability'), value: item.abilityScore }],
        })),
      },
      {
        id: 'alignments',
        title: t('explore.alignments', 'Alignments'),
        description: t('explore.alignmentsDesc', 'Moral and ethical compasses for your party and NPCs.'),
        icon: GlobeAltIcon,
        items: alignments.slice(0, SECTION_LIMIT).map((item: any) => ({
          id: item.id,
          title: localize(item, 'name'),
          description: localize(item, 'description'),
          imageUrl: item.imageUrl,
          badge: item.abbreviation,
        })),
      },
      {
        id: 'languages',
        title: t('explore.languages', 'Languages'),
        description: t('explore.languagesDesc', 'Plan linguistic connections and rare tongues across worlds.'),
        icon: BookmarkSquareIcon,
        items: languages.slice(0, SECTION_LIMIT).map((item: any) => ({
          id: item.id,
          title: localize(item, 'name'),
          description: item.note, // Note: Languages usually don't have descriptions, only notes. Localize note if possible?
          imageUrl: item.imageUrl,
          badge: item.isRare ? t('explore.rare', 'Rare') : t('explore.common', 'Common'),
        })),
      },
      {
        id: 'magic-schools',
        title: t('explore.magicSchools', 'Schools of Magic'),
        description: t('explore.magicSchoolsDesc', 'Differentiate arcane traditions and build themed spell lists.'),
        icon: SparklesIcon,
        items: magicSchools.slice(0, SECTION_LIMIT).map((item: any) => ({
          id: item.id,
          title: localize(item, 'name'),
          description: localize(item, 'description'),
          imageUrl: item.imageUrl,
        })),
      },
      {
        id: 'conditions',
        title: t('explore.conditions', 'Combat Conditions'),
        description: t('explore.conditionsDesc', 'Quickly recall mechanical effects during encounters.'),
        icon: ShieldExclamationIcon,
        items: conditions.slice(0, SECTION_LIMIT).map((item: any) => ({
          id: item.id,
          title: localize(item, 'name'),
          description: localize(item, 'description'),
          imageUrl: item.imageUrl,
        })),
      },
      {
        id: 'damage-types',
        title: t('explore.damageTypes', 'Damage Types'),
        description: t('explore.damageTypesDesc', 'Explain elemental profiles, resistances, and vulnerabilities.'),
        icon: BeakerIcon,
        items: damageTypes.slice(0, SECTION_LIMIT).map((item: any) => ({
          id: item.id,
          title: localize(item, 'name'),
          description: localize(item, 'description'),
          imageUrl: item.imageUrl,
        })),
      },
      {
        id: 'equipment',
        title: t('explore.equipment', 'Equipment & Gear'),
        description: t('explore.equipmentDesc', 'Browse standard adventuring gear, weapons, and armor.'),
        icon: CubeIcon,
        items: trimmedEquipment.map((item: any) => ({
          id: item.index,
          title: localize(item, 'name'),
          description: localize(item, 'description'),
          imageUrl: item.imageUrl,
          meta: [
            { label: t('explore.cost', 'Cost'), value: formatCost(item.cost) },
            { label: t('explore.weight', 'Weight'), value: item.weight ? `${item.weight} lb` : '—' },
            item.weaponCategory
              ? { label: t('explore.weaponCategory', 'Weapon Category'), value: item.weaponCategory }
              : null,
            item.armorCategory
              ? { label: t('explore.armorCategory', 'Armor Category'), value: item.armorCategory }
              : null,
          ].filter(Boolean) as { label: string; value: string }[],
        })),
      },
      {
        id: 'weapon-properties',
        title: t('explore.weaponProperties', 'Weapon Properties'),
        description: t('explore.weaponPropertiesDesc', 'Clarify weapon tags and how they affect combat tactics.'),
        icon: AcademicCapIcon,
        items: trimmedWeaponProperties.map((item: any) => ({
          id: item.id,
          title: localize(item, 'name'),
          description: localize(item, 'description'),
          imageUrl: item.imageUrl,
        })),
      },
      {
        id: 'monsters',
        title: t('explore.monsters', 'Monsters & Creatures'),
        description: t('explore.monstersDesc', 'Adversaries, allies, and beasts with full stat blocks and abilities.'),
        icon: FireIcon,
        items: monsters.slice(0, SECTION_LIMIT).map((item: any) => {
          let description = '';
          if (item.specialAbilities && item.specialAbilities.length > 0) {
            description = item.specialAbilities
              .slice(0, 2)
              .map((ability: any) => `${ability.name}: ${ability.description}`)
              .join(' ');
          } else if (item.actions && item.actions.length > 0) {
            description = item.actions[0]?.description ?? '';
          }

          return {
            id: item.id,
            title: localize(item, 'name'),
            description: description.length > 200 ? `${description.substring(0, 200)}...` : description,
            imageUrl: item.imageUrl,
            badge: item.challenge ? `CR ${item.challenge.split(' ')[0]}` : '',
            meta: [
              { label: t('explore.type', 'Type'), value: item.type },
              { label: t('explore.size', 'Size'), value: item.size },
              { label: t('explore.ac', 'AC'), value: item.armorClass?.toString() || '?' },
              { label: t('explore.hp', 'HP'), value: item.hitPoints },
            ],
          };
        }),
      },
      {
        id: 'magic-items',
        title: t('explore.magicItems', 'Magic Items'),
        description: t(
          'explore.magicItemsDesc',
          'Wondrous artifacts, enchanted weapons, and magical treasures to discover.'
        ),
        icon: StarIcon,
        items: magicItems.slice(0, SECTION_LIMIT).map((item: any) => ({
          id: item.id,
          title: localize(item, 'name'),
          description: localize(item, 'description'),
          imageUrl: item.imageUrl,
          badge: item.rarity,
          meta: [{ label: t('explore.category', 'Category'), value: item.equipmentCategory }],
        })),
      },
      {
        id: 'features',
        title: t('explore.features', 'Class Features'),
        description: t('explore.featuresDesc', 'Unique abilities and powers gained as you level up in your class.'),
        icon: LightBulbIcon,
        items: features.slice(0, SECTION_LIMIT).map((item: any) => ({
          id: item.id,
          title: localize(item, 'name'),
          description: localize(item, 'description'),
          badge: `Lv ${item.level}`,
          meta: [{ label: t('explore.class', 'Class'), value: item.className }],
        })),
      },
      {
        id: 'traits',
        title: t('explore.traits', 'Racial Traits'),
        description: t('explore.traitsDesc', 'Innate abilities and characteristics inherited from your ancestry.'),
        icon: UserGroupIcon,
        items: traits.slice(0, SECTION_LIMIT).map((item: any) => ({
          id: item.id,
          title: localize(item, 'name'),
          description: localize(item, 'description'),
          meta: [{ label: t('explore.races', 'Races'), value: item.races.join(', ') || 'All' }],
        })),
      },
      {
        id: 'subclasses',
        title: t('explore.subclasses', 'Subclasses'),
        description: t(
          'explore.subclassesDesc',
          "Specializations that define your character's unique path within their class."
        ),
        icon: AcademicCapIcon,
        items: subclasses.slice(0, SECTION_LIMIT).map((item: any) => ({
          id: item.id,
          title: localize(item, 'name'),
          description: localize(item, 'description'),
          badge: item.subclassFlavor,
          meta: [{ label: t('explore.class', 'Class'), value: item.className }],
        })),
      },
      {
        id: 'proficiencies',
        title: t('explore.proficiencies', 'Proficiencies'),
        description: t(
          'explore.proficienciesDesc',
          'Skills and equipment your character is trained to use effectively.'
        ),
        icon: WrenchScrewdriverIcon,
        items: proficiencies.slice(0, SECTION_LIMIT).map((item: any) => ({
          id: item.id,
          title: localize(item, 'name'),
          description: item.reference ? `Reference: ${item.reference}` : '',
          badge: item.type,
          meta: [{ label: t('explore.classes', 'Classes'), value: item.classes.join(', ') || 'All' }],
        })),
      },
      // Spells and Rules sections omitted or empty for now as services are missing
    ];
  }, [state, t, language]);

  return (
    <PublicLayout>
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-10">
        <header className="mb-12 space-y-4 text-center lg:text-left">
          <div className="inline-flex items-center gap-3 rounded-full border border-aurora-500/40 bg-aurora-500/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-aurora-200">
            <SparklesIcon className="h-4 w-4" />
            {t('explore.archive', 'Explore Archive')}
          </div>
          <h1 className="font-display text-3xl uppercase tracking-[0.35em] text-shadow-20 sm:text-4xl">
            {t('explore.title', 'Discover the SRD Vault')}
          </h1>
          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-shadow-200 lg:mx-0">
            {t(
              'explore.subtitle',
              'Browse curated 5e SRD data seeded into the DAICER archives. Every entry supports the character creator, rules lookup, and simulation tools connected to the Firestore emulator. Imagery will be curated later—placeholders stand in for now.'
            )}
          </p>
        </header>

        {state.status === 'loading' || state.status === 'idle' ? (
          <div className="flex flex-col items-center justify-center gap-8 py-24">
            <DiceLoader size="small" />
            <p className="text-shadow-200">{t('explore.loading', 'Retrieving tomes from the library...')}</p>
          </div>
        ) : null}

        {state.status === 'error' ? (
          <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-8 text-center text-red-200">
            <p className="font-semibold">{t('explore.error', 'Failed to load explore data.')}</p>
            <p className="mt-2 text-sm text-red-100/80">{state.message}</p>
          </div>
        ) : null}

        {state.status === 'ready' ? (
          <div className="space-y-12">
            {sections.map((section) => (
              <section key={section.id} aria-labelledby={`${section.id}-heading`} className="space-y-6">
                <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-aurora-500/30 bg-aurora-500/10">
                      <section.icon className="h-6 w-6 text-aurora-200" />
                    </div>
                    <div>
                      <h2
                        id={`${section.id}-heading`}
                        className="font-display text-xl uppercase tracking-[0.32em] text-shadow-20"
                      >
                        {section.title}
                      </h2>
                      <p className="mt-2 max-w-2xl text-sm text-shadow-200">{section.description}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-[0.35em] text-shadow-300">
                    {section.items.length} {t('explore.entries', 'entries')}
                  </span>
                </header>

                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {section.items.map((item) => (
                    <article
                      key={item.id}
                      className="group flex flex-col gap-4 rounded-2xl border border-midnight-500/50 bg-midnight-500/40 p-6 shadow-[0_18px_36px_rgba(4,7,12,0.55)] transition duration-200 hover:border-aurora-400/40 hover:bg-midnight-400/40"
                    >
                      <div className="flex items-center gap-4">
                        <ImageThumbnail
                          imageUrl={item.imageUrl}
                          alt={item.title}
                          icon={section.icon}
                          size={72}
                          className="flex-shrink-0"
                          iconClassName="text-aurora-200"
                        />
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold text-shadow-20">{item.title}</h3>
                          {item.badge ? (
                            <span className="inline-flex items-center rounded-full border border-aurora-400/40 bg-aurora-500/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-aurora-100">
                              {item.badge}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      {item.description ? (
                        <p className="text-sm leading-relaxed text-shadow-200">{item.description}</p>
                      ) : null}
                      {item.meta && item.meta.length > 0 ? (
                        <dl className="grid gap-2 rounded-xl border border-midnight-400/40 bg-midnight-400/30 p-3 text-xs">
                          {item.meta.map((meta) => (
                            <div key={`${item.id}-${meta.label}`} className="flex items-center justify-between gap-3">
                              <dt className="uppercase tracking-[0.3em] text-shadow-300">{meta.label}</dt>
                              <dd className="font-medium text-aurora-100">{meta.value}</dd>
                            </div>
                          ))}
                        </dl>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : null}
      </div>
    </PublicLayout>
  );
}
