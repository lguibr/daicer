import { createStrapi } from '@strapi/strapi';
import fs from 'fs';
import path from 'path';

async function main() {
  const strapi = createStrapi({ distDir: './dist' });
  await strapi.load();
  await strapi.start();

  try {
    // seeds are in ../seeds/game-data relative to cms root (process.cwd())
    const seedDir = path.resolve(process.cwd(), '../seeds/game-data');

    // Helper to read JSON
    const readJson = (filename: string) => {
      try {
        return JSON.parse(fs.readFileSync(path.join(seedDir, filename), 'utf-8'));
      } catch (e) {
        console.warn(`Could not read ${filename}, skipping.`);
        return [];
      }
    };

    // 1. Seed Prompts
    console.log('Seeding Prompts...');
    const prompts = readJson('prompts.json');
    for (const p of prompts) {
      console.log('Creating prompt:', p.key);
      // Check if exists
      const existing = await strapi.documents('api::prompt.prompt').findMany({ filters: { key: p.key } });

      if (existing.length === 0) {
        const doc = await strapi.documents('api::prompt.prompt').create({
          data: {
            key: p.key,
            text: p.text_en,
            category: p.category,
          },
          status: 'published',
        });

        // Localizations
        // Spanish
        if (p.text_es) {
          await strapi.documents('api::prompt.prompt').create({
            documentId: doc.documentId,
            locale: 'es',
            data: {
              key: p.key,
              text: p.text_es,
            },
            status: 'published',
          });
        }
        // Portuguese
        if (p.text_ptBR) {
          await strapi.documents('api::prompt.prompt').create({
            documentId: doc.documentId,
            locale: 'pt-BR',
            data: {
              key: p.key,
              text: p.text_ptBR,
            },
            status: 'published',
          });
        }
      } else {
        // Check if text needs update
        const existingDoc = existing[0];
        if (existingDoc.text !== p.text_en) {
          console.log(`Updating prompt ${p.key}...`);
          await strapi.documents('api::prompt.prompt').update({
            documentId: existingDoc.documentId,
            data: {
              text: p.text_en,
              category: p.category,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any,
            status: 'published',
          });
        }
      }
    }

    // 2. Seed Races
    console.log('Seeding Races...');
    const races = readJson('character-races.json');
    const raceMap = new Map(); // id -> documentId
    for (const r of races) {
      const slug = r.id; // use id as slug
      const existing = await strapi.documents('api::race.race').findMany({ filters: { slug } });
      let docId;
      if (existing.length === 0) {
        const doc = await strapi.documents('api::race.race').create({
          data: {
            slug,
            name: r.name,
            description: r.description,
            speed: r.speed,
            size: r.size,
          },
          status: 'published',
        });
        docId = doc.documentId;

        // Spanish
        await strapi.documents('api::race.race').create({
          documentId: docId,
          locale: 'es',
          data: { slug, name: r.name_es, description: r.description_es },
          status: 'published',
        });
        // Portuguese
        await strapi.documents('api::race.race').create({
          documentId: docId,
          locale: 'pt-BR',
          data: { slug, name: r.name_ptBR, description: r.description_ptBR },
          status: 'published',
        });
      } else {
        docId = existing[0].documentId;
      }
      raceMap.set(slug, docId);
    }

    // 3. Seed Classes
    console.log('Seeding Classes...');
    const classes = readJson('character-classes.json');
    const classMap = new Map();
    for (const c of classes) {
      const slug = c.index || c.id; // use index or id
      const existing = await strapi.documents('api::class.class').findMany({ filters: { slug } });
      let docId;
      if (existing.length === 0) {
        const doc = await strapi.documents('api::class.class').create({
          data: {
            slug,
            name: c.name,
            description: '', // Seed might not have description?
            hit_die: typeof c.hit_die === 'number' ? `d${c.hit_die}` : c.hit_die,
          },
          status: 'published',
        });
        docId = doc.documentId;
      } else {
        docId = existing[0].documentId;
      }
      classMap.set(slug, docId);
    }

    // 4. Seed Subclasses
    console.log('Seeding Subclasses...');
    const subclasses = readJson('subclasses.json');
    for (const s of subclasses) {
      const slug = s.index;
      const existing = await strapi.documents('api::subclass.subclass').findMany({ filters: { slug } });
      if (existing.length === 0) {
        // Find class ID
        const classSlug = s.class?.index;
        const classDocId = classMap.get(classSlug);

        await strapi.documents('api::subclass.subclass').create({
          data: {
            slug,
            name: s.name,
            description: s.desc?.[0] || '', // desc is array
            subclass_flavor: s.subclass_flavor,
            class: classDocId, // Relation
          },
          status: 'published',
        });
      }
    }

    // 5. Seed Spells (Sample)
    console.log('Seeding Spells...');
    const spells = readJson('spells.json');
    for (const s of spells) {
      const slug = s.id || s.index;
      const existing = await strapi.documents('api::spell.spell').findMany({ filters: { slug } });
      if (existing.length === 0) {
        await strapi.documents('api::spell.spell').create({
          data: {
            slug,
            name: s.name,
            description: s.description,
            level: s.level,
            school: s.school,
            casting_time: s.castingTime,
            range: s.range,
            duration: s.duration,
            is_ritual: s.isRitual,
            components: s.components,
          },
          status: 'published',
        });
      }
    }

    // 6. Seed Monsters (Sample)
    console.log('Seeding Monsters...');
    const monsters = readJson('monsters.json');
    for (const m of monsters) {
      const slug = m.index;
      const existing = await strapi.documents('api::monster.monster').findMany({ filters: { slug } });
      if (existing.length === 0) {
        await strapi.documents('api::monster.monster').create({
          data: {
            slug,
            name: m.name,
            size: m.size,
            type: m.type,
            alignment: m.alignment,
            ac: m.armor_class?.[0]?.value || 10,
            hp: m.hit_points,
            hit_dice: m.hit_dice,
            speed: m.speed,
            proficiencies: m.proficiencies,
            stats: {
              strength: m.strength,
              dexterity: m.dexterity,
              constitution: m.constitution,
              intelligence: m.intelligence,
              wisdom: m.wisdom,
              charisma: m.charisma,
            },
            senses: m.senses,
            languages: m.languages,
            challenge_rating: m.challenge_rating,
            xp: m.xp,
            special_abilities: m.special_abilities,
            actions: m.actions,
            legendary_actions: m.legendary_actions,
          },
          status: 'published',
        });
      }
    }

    // 7. Seed Equipment Categories
    console.log('Seeding Equipment Categories...');
    const categories = readJson('equipment-categories.json');
    const categoryMap = new Map();
    for (const c of categories) {
      const slug = c.index;
      const existing = await strapi
        .documents('api::equipment-category.equipment-category')
        .findMany({ filters: { slug } });
      let docId;
      if (existing.length === 0) {
        const doc = await strapi.documents('api::equipment-category.equipment-category').create({
          data: {
            slug,
            name: c.name,
            description: c.description,
          },
          status: 'published',
        });
        docId = doc.documentId;
      } else {
        docId = existing[0].documentId;
      }
      categoryMap.set(slug, docId);
      categoryMap.set(c.name, docId);
    }

    // 8. Seed Weapon Properties
    console.log('Seeding Weapon Properties...');
    const properties = readJson('equipment-weapon-properties.json');
    const propertyMap = new Map();
    for (const p of properties) {
      const slug = p.index;
      const existing = await strapi.documents('api::weapon-property.weapon-property').findMany({ filters: { slug } });
      let docId;
      if (existing.length === 0) {
        const doc = await strapi.documents('api::weapon-property.weapon-property').create({
          data: {
            slug,
            name: p.name,
            description: p.description,
          },
          status: 'published',
        });
        docId = doc.documentId;
      } else {
        docId = existing[0].documentId;
      }
      propertyMap.set(slug, docId);
      propertyMap.set(p.name, docId);
    }

    // 9. Seed Damage Types
    console.log('Seeding Damage Types...');
    const damageTypes = readJson('combat-damage-types.json');
    const damageMap = new Map();
    for (const d of damageTypes) {
      const slug = d.index;
      const existing = await strapi.documents('api::damage-type.damage-type').findMany({ filters: { slug } });
      let docId;
      if (existing.length === 0) {
        const doc = await strapi.documents('api::damage-type.damage-type').create({
          data: {
            slug,
            name: d.name,
            description: d.description,
          },
          status: 'published',
        });
        docId = doc.documentId;
      } else {
        docId = existing[0].documentId;
      }
      damageMap.set(slug, docId);
    }

    // 10. Seed Magic Schools
    console.log('Seeding Magic Schools...');
    const schools = readJson('magic-schools.json');
    const schoolMap = new Map();
    for (const s of schools) {
      const slug = s.index;
      const existing = await strapi.documents('api::magic-school.magic-school').findMany({ filters: { slug } });
      let docId;
      if (existing.length === 0) {
        const doc = await strapi.documents('api::magic-school.magic-school').create({
          data: {
            slug,
            name: s.name,
            description: s.description,
          },
          status: 'published',
        });
        docId = doc.documentId;
      } else {
        docId = existing[0].documentId;
      }
      schoolMap.set(slug, docId);
    }

    // 11. Seed Languages
    console.log('Seeding Languages...');
    const languages = readJson('world-languages.json');
    for (const l of languages) {
      const slug = l.index;
      const existing = await strapi.documents('api::language.language').findMany({ filters: { slug } });
      if (existing.length === 0) {
        await strapi.documents('api::language.language').create({
          data: {
            slug,
            name: l.name,
            is_rare: l.isRare,
            note: l.note,
          },
          status: 'published',
        });
      }
    }

    // 12. Seed Equipment
    console.log('Seeding Equipment...');
    const equipment = readJson('equipment-items.json');
    for (const e of equipment) {
      const slug = e.index;
      const existing = await strapi.documents('api::equipment.equipment').findMany({ filters: { slug } });
      if (existing.length === 0) {
        // Resolve relations
        const propIds = (e.properties || []).map((pName: string) => propertyMap.get(pName)).filter(Boolean);
        const damageTypeId = e.damage?.damageType ? damageMap.get(e.damage.damageType) : null;
        const categoryId = categoryMap.get(e.equipmentCategory) || categoryMap.get(e.equipmentCategory.toLowerCase());

        const description = e.desc ? (Array.isArray(e.desc) ? e.desc.join('\n\n') : e.desc) : e.description;

        await strapi.documents('api::equipment.equipment').create({
          data: {
            slug,
            name: e.name,
            equipment_category: categoryId,
            cost_quantity: e.cost?.quantity,
            cost_unit: e.cost?.unit,
            weight: e.weight,
            description: description,
            damage_dice: e.damage?.damageDice,
            damage_type: damageTypeId,
            range_normal: e.range?.normal,
            range_long: e.range?.long,
            properties: propIds,
            armor_class_base: e.armorClass?.base || (typeof e.armorClass === 'number' ? e.armorClass : null),
            armor_class_dex_bonus: e.armorClass?.dexBonus,
            str_minimum: e.strMinimum,
            stealth_disadvantage: e.stealthDisadvantage,
          },
          status: 'published',
        });
      }
    }

    // 13. Seed Magic Items
    console.log('Seeding Magic Items...');
    const magicItems = readJson('magic-items.json');
    for (const mi of magicItems) {
      const slug = mi.index;
      const existing = await strapi.documents('api::magic-item.magic-item').findMany({ filters: { slug } });
      if (existing.length === 0) {
        const catObj = mi.equipment_category;
        const catId = catObj ? categoryMap.get(catObj.index) : null;
        const description = Array.isArray(mi.desc) ? mi.desc.join('\n\n') : mi.desc;
        const attunement = description ? description.toLowerCase().includes('requires attunement') : false;

        await strapi.documents('api::magic-item.magic-item').create({
          data: {
            slug,
            name: mi.name,
            equipment_category: catId,
            rarity: mi.rarity?.name,
            is_variant: mi.variant,
            attunement_required: attunement,
            description: description,
            image_url: mi.image,
          },
          status: 'published',
        });
      }
    }

    // 14. Seed Proficiencies
    console.log('Seeding Proficiencies...');
    const proficiencies = readJson('proficiencies.json');
    for (const prof of proficiencies) {
      const slug = prof.index;
      const existing = await strapi.documents('api::proficiency.proficiency').findMany({ filters: { slug } });
      if (existing.length === 0) {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
        const relatedClasses = (prof.classes || []).map((c: any) => classMap.get(c.index)).filter(Boolean);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
        const relatedRaces = (prof.races || []).map((r: any) => raceMap.get(r.index)).filter(Boolean);

        await strapi.documents('api::proficiency.proficiency').create({
          data: {
            slug,
            name: prof.name,
            type: prof.type,
            classes: relatedClasses,
            races: relatedRaces,
          },
          status: 'published',
        });
      }
    }

    // 15. Seed Traits
    console.log('Seeding Traits...');
    const traits = readJson('traits.json');
    // Map proficiencies
    const proficiencyMap = new Map();
    const profDocs = await strapi.documents('api::proficiency.proficiency').findMany({});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    profDocs.forEach((p: any) => proficiencyMap.set(p.slug, p.documentId));

    for (const t of traits) {
      const slug = t.index;
      const existing = await strapi.documents('api::trait.trait').findMany({ filters: { slug } });

      if (existing.length === 0) {
        // traits.json uses 'index' for related items
// eslint-disable-next-line @typescript-eslint/no-explicit-any
        const relatedRaces = (t.races || []).map((r: any) => raceMap.get(r.index)).filter(Boolean);
        const relatedProficiencies = (t.proficiencies || [])
// eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((p: any) => proficiencyMap.get(p.index))
          .filter(Boolean);

        const description = Array.isArray(t.desc) ? t.desc.join('\n\n') : t.desc;

        await strapi.documents('api::trait.trait').create({
          data: {
            slug,
            name: t.name,
            description,
            races: relatedRaces,
            proficiencies: relatedProficiencies,
          },
          status: 'published',
        });
      }
    }

    console.log('Seeding completed!');
  } catch (error) {
    console.error('Seeding failed:', JSON.stringify(error, null, 2));
    if (error instanceof Error) {
      console.error(error.stack);
    }
  } finally {
    strapi.stop();
  }
}

main();
