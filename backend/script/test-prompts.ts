import dotenv from 'dotenv';
dotenv.config();

import { strapi } from '@strapi/client';

const client = strapi({
  baseURL: 'http://localhost:1337/api',
  auth: process.env.API_TOKEN_SALT,
});

console.log(client);

async function main() {
  console.log('🚀 Starting paginated prompt retrieval test...');

  const prompts = client.collection('prompts');

  let page = 1;
  const pageSize = 2; // Small page size to demonstrate pagination logic effectively
  let hasMore = true;
  let totalPrompts = 0;

  while (hasMore) {
    console.log(`\n📄 Fetching page ${page}...`);

    try {
      const response = await prompts.find({
        sort: ['createdAt:desc'],
        pagination: {
          page,
          pageSize,
        },
        populate: '*', // Ensure we see all fields
      });

      const { data, meta } = response;
      const fetchedCount = data.length;
      totalPrompts += fetchedCount;

      if (fetchedCount === 0) {
        console.log('⚠️ No prompts found on this page.');
        hasMore = false;
        break;
      }

      console.log(`✅ Retrieved ${fetchedCount} prompts:`);
      data.forEach((prompt: any) => {
        const title = prompt.attributes?.title || prompt.title || 'Untitled';
        const slug = prompt.attributes?.slug || prompt.slug || 'no-slug';
        console.log(`   - [${prompt.id}] ${title} (${slug})`);
      });

      // Pagination Logic
      if (meta?.pagination) {
        const { page: currentPage, pageCount } = meta.pagination;
        console.log(`Debug: Current Page: ${currentPage}, Total Pages: ${pageCount}`);

        if (currentPage >= pageCount) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        // Fallback if meta is missing (shouldn't happen with standard Strapi response)
        if (fetchedCount < pageSize) {
          hasMore = false;
        } else {
          page++;
        }
      }
    } catch (error) {
      console.error('❌ Error fetching prompts:', error);
      hasMore = false;
    }
  }

  console.log(`\n🎉 Finished! Total prompts retrieved: ${totalPrompts}`);
}

main();
