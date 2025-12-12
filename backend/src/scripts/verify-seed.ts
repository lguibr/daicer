import { createStrapi } from '@strapi/strapi';

async function main() {
  const strapi = createStrapi({ distDir: './dist' });
  await strapi.load();
  await strapi.start();

  try {
    const categories = await strapi.documents('api::equipment-category.equipment-category').findMany({});
    const equipment = await strapi.documents('api::equipment.equipment').findMany({});
    const magicItems = await strapi.documents('api::magic-item.magic-item').findMany({});
    const proficiencies = await strapi.documents('api::proficiency.proficiency').findMany({});
    const languages = await strapi.documents('api::language.language').findMany({});
    const traits = await strapi.documents('api::trait.trait').findMany({});

    console.log('--- Verification Report ---');
    console.log(`Equipment Categories: ${categories.length}`);
    console.log(`Equipment Items: ${equipment.length}`);
    console.log(`Magic Items: ${magicItems.length}`);
    console.log(`Proficiencies: ${proficiencies.length}`);
    console.log(`Languages: ${languages.length}`);
    console.log(`Traits: ${traits.length}`);
    console.log('---------------------------');
  } catch (error) {
    console.error('Verification failed:', error);
  } finally {
    strapi.stop();
  }
}

main();
