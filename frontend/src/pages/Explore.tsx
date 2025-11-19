import { useEffect, useMemo, useState, type ComponentType } from 'react';
import {
  AcademicCapIcon,
  AdjustmentsHorizontalIcon,
  BeakerIcon,
  BookOpenIcon,
  BookmarkSquareIcon,
  BoltIcon,
  CubeIcon,
  FireIcon,
  GlobeAltIcon,
  IdentificationIcon,
  ShieldExclamationIcon,
  SparklesIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
  StarIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';
// eslint-disable-next-line import/no-extraneous-dependencies
import { SRD_RULES, type SRDRule } from 'daicer/seeds/data/srd-rules';
import { PublicLayout } from '../components/layout';
import { DiceLoader, ImageThumbnail } from '../components/ui';
import {
  getAbilities,
  getAlignments,
  getBackgrounds,
  getClasses,
  getConditions,
  getDamageTypes,
  getEquipment,
  getLanguages,
  getMagicSchools,
  getMonsters,
  getRaces,
  getSkills,
  getWeaponProperties,
  getMagicItems,
  getFeatures,
  getTraits,
  getSubclasses,
  getProficiencies,
  type Ability,
  type Alignment,
  type Background,
  type CharacterClass,
  type Condition,
  type DamageType,
  type EquipmentItem,
  type Language,
  type MagicSchool,
  type Monster,
  type Race,
  type Skill,
  type WeaponProperty,
  type MagicItem,
  type Feature,
  type Trait,
  type Subclass,
  type Proficiency,
} from '../services/game-data';
import { getAllSpells } from '../services/spells';
import type { SpellData } from '../types/spells';

interface ExploreCard {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string | null;
  badge?: string;
  meta?: Array<{ label: string; value: string }>;
}

interface ExploreSection {
  id: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  items: ExploreCard[];
}

interface ExplorePayload {
  classes: CharacterClass[];
  races: Race[];
  backgrounds: Background[];
  abilities: Ability[];
  skills: Skill[];
  alignments: Alignment[];
  languages: Language[];
  magicSchools: MagicSchool[];
  conditions: Condition[];
  damageTypes: DamageType[];
  equipment: EquipmentItem[];
  weaponProperties: WeaponProperty[];
  monsters: Monster[];
  magicItems: MagicItem[];
  features: Feature[];
  traits: Trait[];
  subclasses: Subclass[];
  proficiencies: Proficiency[];
  spells: SpellData[];
  rules: SRDRule[];
}

type DataState =
  | { status: 'idle' | 'loading' }
  | { status: 'ready'; payload: ExplorePayload }
  | { status: 'error'; message: string };

const SECTION_LIMIT = 12;
const EXTENDED_SECTION_LIMIT = 18;

function formatCost(cost?: { quantity: number; unit: string }): string {
  if (!cost) return '—';
  return `${cost.quantity} ${cost.unit.toUpperCase()}`;
}

export default function ExplorePage() {
  const [state, setState] = useState<DataState>({ status: 'idle' });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
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

        const spells = getAllSpells().slice(0, EXTENDED_SECTION_LIMIT);
        const rules = SRD_RULES;

        if (cancelled) {
          return;
        }

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
            spells,
            rules,
          },
        });
      } catch (error) {
        if (cancelled) {
          return;
        }
        setState({ status: 'error', message: error instanceof Error ? error.message : 'Failed to load data' });
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const sections = useMemo<ExploreSection[]>(() => {
    if (state.status !== 'ready') {
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
      spells,
      rules,
    } = state.payload;

    const trimmedEquipment = equipment.slice(0, EXTENDED_SECTION_LIMIT);
    const trimmedWeaponProperties = weaponProperties.slice(0, SECTION_LIMIT);

    return [
      {
        id: 'classes',
        title: 'Character Classes',
        description: 'Choose a heroic path. Compare martial prowess, spellcasting focus, and class features.',
        icon: AcademicCapIcon,
        items: classes.slice(0, SECTION_LIMIT).map<ExploreCard>((item) => ({
          id: item.id,
          title: item.name,
          description: item.description,
          imageUrl: item.imageUrl,
          badge: `Hit Die d${item.hitDie}`,
          meta: [
            { label: 'Primary Ability', value: item.primaryAbility },
            { label: 'Saving Throws', value: item.savingThrows.join(', ') },
          ],
        })),
      },
      {
        id: 'races',
        title: 'Ancestries',
        description: 'Discover unique traits, movement, and roleplaying hooks for each ancestry.',
        icon: UserGroupIcon,
        items: races.slice(0, SECTION_LIMIT).map<ExploreCard>((item) => ({
          id: item.id,
          title: item.name,
          description: item.description,
          imageUrl: item.imageUrl,
          meta: [
            { label: 'Speed', value: `${item.speed} ft` },
            { label: 'Size', value: item.size },
          ],
        })),
      },
      {
        id: 'backgrounds',
        title: 'Backgrounds',
        description: 'Ground your character in the world with themed proficiencies and story prompts.',
        icon: IdentificationIcon,
        items: backgrounds.slice(0, SECTION_LIMIT).map<ExploreCard>((item) => ({
          id: item.id,
          title: item.name,
          description: item.description,
          imageUrl: item.imageUrl,
          meta: item.skillProficiencies.length
            ? [{ label: 'Skill Proficiencies', value: item.skillProficiencies.join(', ') }]
            : undefined,
        })),
      },
      {
        id: 'abilities',
        title: 'Ability Scores',
        description: 'Reference the six core abilities driving checks, saves, and combat.',
        icon: BoltIcon,
        items: abilities.slice(0, SECTION_LIMIT).map<ExploreCard>((item) => ({
          id: item.id,
          title: item.name,
          description: item.description,
          imageUrl: item.imageUrl,
          badge: item.fullName,
        })),
      },
      {
        id: 'skills',
        title: 'Skills',
        description: 'See where each skill applies and which ability fuels it.',
        icon: AdjustmentsHorizontalIcon,
        items: skills.slice(0, SECTION_LIMIT).map<ExploreCard>((item) => ({
          id: item.id,
          title: item.name,
          description: item.description,
          imageUrl: item.imageUrl,
          meta: [{ label: 'Ability', value: item.abilityScore }],
        })),
      },
      {
        id: 'alignments',
        title: 'Alignments',
        description: 'Moral and ethical compasses for your party and NPCs.',
        icon: GlobeAltIcon,
        items: alignments.slice(0, SECTION_LIMIT).map<ExploreCard>((item) => ({
          id: item.id,
          title: item.name,
          description: item.description,
          imageUrl: item.imageUrl,
          badge: item.abbreviation,
        })),
      },
      {
        id: 'languages',
        title: 'Languages',
        description: 'Plan linguistic connections and rare tongues across worlds.',
        icon: BookmarkSquareIcon,
        items: languages.slice(0, SECTION_LIMIT).map<ExploreCard>((item) => ({
          id: item.id,
          title: item.name,
          description: item.note,
          imageUrl: item.imageUrl,
          badge: item.isRare ? 'Rare' : 'Common',
        })),
      },
      {
        id: 'magic-schools',
        title: 'Schools of Magic',
        description: 'Differentiate arcane traditions and build themed spell lists.',
        icon: SparklesIcon,
        items: magicSchools.slice(0, SECTION_LIMIT).map<ExploreCard>((item) => ({
          id: item.id,
          title: item.name,
          description: item.description,
          imageUrl: item.imageUrl,
        })),
      },
      {
        id: 'conditions',
        title: 'Combat Conditions',
        description: 'Quickly recall mechanical effects during encounters.',
        icon: ShieldExclamationIcon,
        items: conditions.slice(0, SECTION_LIMIT).map<ExploreCard>((item) => ({
          id: item.id,
          title: item.name,
          description: item.description,
          imageUrl: item.imageUrl,
        })),
      },
      {
        id: 'damage-types',
        title: 'Damage Types',
        description: 'Explain elemental profiles, resistances, and vulnerabilities.',
        icon: BeakerIcon,
        items: damageTypes.slice(0, SECTION_LIMIT).map<ExploreCard>((item) => ({
          id: item.id,
          title: item.name,
          description: item.description,
          imageUrl: item.imageUrl,
        })),
      },
      {
        id: 'equipment',
        title: 'Equipment & Gear',
        description: 'Browse standard adventuring gear, weapons, and armor.',
        icon: CubeIcon,
        items: trimmedEquipment.map<ExploreCard>((item) => ({
          id: item.index,
          title: item.name,
          description: item.description,
          imageUrl: item.imageUrl,
          meta: [
            { label: 'Cost', value: formatCost(item.cost) },
            { label: 'Weight', value: item.weight ? `${item.weight} lb` : '—' },
            (() => {
              if ('weaponCategory' in item && typeof item.weaponCategory === 'string') {
                return { label: 'Weapon Category', value: item.weaponCategory };
              }
              return null;
            })(),
            (() => {
              if ('armorCategory' in item && typeof item.armorCategory === 'string') {
                return { label: 'Armor Category', value: item.armorCategory };
              }
              return null;
            })(),
          ].filter((entry): entry is { label: string; value: string } => Boolean(entry)),
        })),
      },
      {
        id: 'weapon-properties',
        title: 'Weapon Properties',
        description: 'Clarify weapon tags and how they affect combat tactics.',
        icon: AcademicCapIcon,
        items: trimmedWeaponProperties.map<ExploreCard>((item) => ({
          id: item.id,
          title: item.name,
          description: item.description,
          imageUrl: item.imageUrl,
        })),
      },
      {
        id: 'monsters',
        title: 'Monsters & Creatures',
        description: 'Adversaries, allies, and beasts with full stat blocks and abilities.',
        icon: FireIcon,
        items: monsters.slice(0, SECTION_LIMIT).map<ExploreCard>((item) => {
          // Build description from special abilities or actions
          let description = '';
          if (item.specialAbilities && item.specialAbilities.length > 0) {
            description = item.specialAbilities
              .slice(0, 2)
              .map((ability) => `${ability.name}: ${ability.description}`)
              .join(' ');
          } else if (item.actions && item.actions.length > 0) {
            description = item.actions[0]?.description ?? '';
          }

          return {
            id: item.id,
            title: item.name,
            description: description.length > 200 ? `${description.substring(0, 200)}...` : description,
            imageUrl: item.imageUrl,
            badge: `CR ${item.challenge.split(' ')[0]}`,
            meta: [
              { label: 'Type', value: item.type },
              { label: 'Size', value: item.size },
              { label: 'AC', value: item.armorClass.toString() },
              { label: 'HP', value: item.hitPoints },
            ],
          };
        }),
      },
      {
        id: 'magic-items',
        title: 'Magic Items',
        description: 'Wondrous artifacts, enchanted weapons, and magical treasures to discover.',
        icon: StarIcon,
        items: magicItems.slice(0, SECTION_LIMIT).map<ExploreCard>((item) => ({
          id: item.id,
          title: item.name,
          description: item.description.length > 200 ? `${item.description.substring(0, 200)}...` : item.description,
          imageUrl: item.imageUrl,
          badge: item.rarity,
          meta: [{ label: 'Category', value: item.equipmentCategory }],
        })),
      },
      {
        id: 'features',
        title: 'Class Features',
        description: 'Unique abilities and powers gained as you level up in your class.',
        icon: LightBulbIcon,
        items: features.slice(0, SECTION_LIMIT).map<ExploreCard>((item) => ({
          id: item.id,
          title: item.name,
          description: item.description.length > 200 ? `${item.description.substring(0, 200)}...` : item.description,
          badge: `Lv ${item.level}`,
          meta: [{ label: 'Class', value: item.className }],
        })),
      },
      {
        id: 'traits',
        title: 'Racial Traits',
        description: 'Innate abilities and characteristics inherited from your ancestry.',
        icon: UserGroupIcon,
        items: traits.slice(0, SECTION_LIMIT).map<ExploreCard>((item) => ({
          id: item.id,
          title: item.name,
          description: item.description.length > 200 ? `${item.description.substring(0, 200)}...` : item.description,
          meta: [{ label: 'Races', value: item.races.join(', ') || 'All' }],
        })),
      },
      {
        id: 'subclasses',
        title: 'Subclasses',
        description: "Specializations that define your character's unique path within their class.",
        icon: AcademicCapIcon,
        items: subclasses.slice(0, SECTION_LIMIT).map<ExploreCard>((item) => ({
          id: item.id,
          title: item.name,
          description: item.description.length > 200 ? `${item.description.substring(0, 200)}...` : item.description,
          badge: item.subclassFlavor,
          meta: [{ label: 'Class', value: item.className }],
        })),
      },
      {
        id: 'proficiencies',
        title: 'Proficiencies',
        description: 'Skills and equipment your character is trained to use effectively.',
        icon: WrenchScrewdriverIcon,
        items: proficiencies.slice(0, SECTION_LIMIT).map<ExploreCard>((item) => ({
          id: item.id,
          title: item.name,
          description: item.reference ? `Reference: ${item.reference}` : '',
          badge: item.type,
          meta: [{ label: 'Classes', value: item.classes.join(', ') || 'All' }],
        })),
      },
      {
        id: 'spells',
        title: 'Spellbook Spotlight',
        description: 'Sample spells with level, school, and quick summaries.',
        icon: SparklesIcon,
        items: spells.map<ExploreCard>((item) => ({
          id: item.id,
          title: item.name,
          description: item.description,
          imageUrl: item.imageUrl,
          badge: `Level ${item.level}`,
          meta: [{ label: 'School', value: item.school }],
        })),
      },
      {
        id: 'rules',
        title: 'Rules Compendium',
        description: 'SRD rule excerpts ready for reference at the table.',
        icon: BookOpenIcon,
        items: rules.slice(0, EXTENDED_SECTION_LIMIT).map<ExploreCard>((item) => ({
          id: item.id,
          title: item.title,
          description: item.content,
          imageUrl: item.imageUrl,
          badge: item.category,
        })),
      },
    ];
  }, [state]);

  return (
    <PublicLayout>
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-10">
        <header className="mb-12 space-y-4 text-center lg:text-left">
          <div className="inline-flex items-center gap-3 rounded-full border border-aurora-500/40 bg-aurora-500/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-aurora-200">
            <SparklesIcon className="h-4 w-4" />
            Explore Archive
          </div>
          <h1 className="font-display text-3xl uppercase tracking-[0.35em] text-shadow-20 sm:text-4xl">
            Discover the SRD Vault
          </h1>
          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-shadow-200 lg:mx-0">
            Browse curated 5e SRD data seeded into the DAICER archives. Every entry supports the character creator,
            rules lookup, and simulation tools connected to the Firestore emulator. Imagery will be curated
            later—placeholders stand in for now.
          </p>
        </header>

        {state.status === 'loading' || state.status === 'idle' ? (
          <div className="flex flex-col items-center justify-center gap-8 py-24">
            <DiceLoader size="small" />
            <p className="text-shadow-200">Retrieving tomes from the library...</p>
          </div>
        ) : null}

        {state.status === 'error' ? (
          <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-8 text-center text-red-200">
            <p className="font-semibold">Failed to load explore data.</p>
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
                    {section.items.length} entries
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
