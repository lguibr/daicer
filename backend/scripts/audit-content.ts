import dotenv from 'dotenv';
dotenv.config();

import { getStrapiClient } from './utils/strapi-client';
import fs from 'fs';
import path from 'path';

// Constants
// We still might want BASE_URL for logging if we want, or just rely on the singleton's knowledge
// But the singleton encapsulates it.
const client = getStrapiClient();

interface EntityMetrics {
  entity: string;
  total: number;
  missingImage: number;
  missingDescription: number;
  missingLocales: number;
}

const ENTITIES = [
  { uid: 'monsters', name: 'monster', descField: 'description' },
  { uid: 'races', name: 'race', descField: 'description' },
  { uid: 'magic-items', name: 'magic-item', descField: 'description' },
  { uid: 'equipments', name: 'equipment', descField: 'description' },
  { uid: 'spells', name: 'spell', descField: 'description' },
  { uid: 'classes', name: 'class', descField: 'description' },
  { uid: 'subclasses', name: 'subclass', descField: 'description' },
  { uid: 'features', name: 'feature', descField: 'description' },
  { uid: 'traits', name: 'trait', descField: 'description' },
  { uid: 'proficiencies', name: 'proficiency', descField: 'description' },
  { uid: 'magic-schools', name: 'magic-school', descField: 'description' },
  { uid: 'languages', name: 'language', descField: 'note' },
];

async function fetchAll(collectionName: string) {
  const items: any[] = [];
  let page = 1;
  const pageSize = 100; // Max usually allowed
  let hasMore = true;

  try {
    while (hasMore) {
      // console.log(`   Fetching ${collectionName} page ${page}...`);
      const res: any = await client.collection(collectionName).find({
        pagination: { page, pageSize },
        populate: '*', // Need image field
        // locale: 'all' // We only check 'en' (default) presence for main metrics, logic same as before
      });

      const data = res.data;
      const meta = res.meta;

      if (!data || data.length === 0) {
        hasMore = false;
      } else {
        items.push(...data);
        if (page >= (meta?.pagination?.pageCount || 1)) {
          hasMore = false;
        } else {
          page++;
        }
      }
    }
  } catch (e: any) {
    if (e.status === 401) {
      console.error(`   ❌ Unauthorized (401) fetching ${collectionName}. Check your STRAPI_API_TOKEN.`);
    } else if (e.status === 403) {
      console.warn(`   ⚠️ Forbidden (403) fetching ${collectionName}. Token missing permissions.`);
    } else if (e.status === 404) {
      console.warn(`   ⚠️ Not Found (404) fetching ${collectionName}. Endpoint might be wrong.`);
    } else {
      console.error(`   ❌ Error fetching ${collectionName}:`, e.message);
    }
  }

  return items;
}

async function main() {
  console.log(`Starting Content Audit (Client Mode)`);

  try {
    const results: EntityMetrics[] = [];

    for (const config of ENTITIES) {
      console.log(`Auditing ${config.name} (${config.uid})...`);

      const docs = await fetchAll(config.uid);

      let missingImageCount = 0;
      let missingDescCount = 0;
      let missingLocalesCount = 0; // Simplified for client mode: 0 for now as fetching all locales for all items is expensive/complex via REST client cleanly without N+1

      // Note: Re-implementing locale check via client would require fetching ?locale=es and ?locale=pt-BR counts
      // We can do a quick count check if "count" endpoint or just fetch minimal fields
      // For speed, let's try to just fetch "meta" from locale=es
      try {
        const resEs: any = await client.collection(config.uid).find({ pagination: { pageSize: 1 }, locale: 'es' });
        const countEs = resEs.meta?.pagination?.total || 0;

        const resPt: any = await client.collection(config.uid).find({ pagination: { pageSize: 1 }, locale: 'pt-BR' });
        const countPt = resPt.meta?.pagination?.total || 0;

        const countEn = docs.length; // Approximate total (assuming docs are 'en' default)
        missingLocalesCount = Math.max(0, countEn - countEs) + Math.max(0, countEn - countPt);
      } catch (e) {
        // Ignore locale check errors (often 403 if not public)
      }

      for (const doc of docs) {
        // Strapi V5 Client response structure:
        // doc.attributes.image or doc.image depending on client version/wrapper.
        // @strapi/client usually flattens response or keeps { id, attributes }?
        // Let's assume flattened if using recent client or check both.
        // Actually, @strapi/client v5 returns { data: [ { documentId, ...props } ] } usually.
        // Let's handle both v4 (attributes) and v5 (flat) styles just in case, but v5 is flat.

        const image = doc.image || doc.attributes?.image;
        if (!image || (Array.isArray(image) && image.length === 0) || image.data === null) {
          missingImageCount++;
        }

        const desc = doc[config.descField] || doc.attributes?.[config.descField];
        // Rich text might be array (blocks) or string
        let isEmpty = false;
        if (!desc) isEmpty = true;
        else if (typeof desc === 'string' && desc.trim() === '') isEmpty = true;
        else if (Array.isArray(desc) && desc.length === 0) isEmpty = true;

        if (isEmpty) {
          missingDescCount++;
        }
      }

      results.push({
        entity: config.name,
        total: docs.length,
        missingImage: missingImageCount,
        missingDescription: missingDescCount,
        missingLocales: missingLocalesCount,
      });
    }

    // Generate HTML Report (Reuse same logic)
    const html = generateReport(results);
    // Output to project root (../report.html) to avoid triggering Strapi backend reload (watched dir)
    const reportPath = path.join(process.cwd(), '..', 'report.html');

    fs.writeFileSync(reportPath, html);
    console.log(`Report generated at: ${reportPath}`);
  } catch (error) {
    console.error(error);
  }
}

function generateReport(metrics: EntityMetrics[]): string {
  const labels = metrics.map((m) => m.entity);
  const dataMissingImages = metrics.map((m) => m.missingImage);
  const dataMissingDesc = metrics.map((m) => m.missingDescription);
  const dataMissingLocales = metrics.map((m) => m.missingLocales);
  const dataTotal = metrics.map((m) => m.total);

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Daicer Content Audit (Client Mode)</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
            body { font-family: sans-serif; padding: 20px; background: #f0f2f5; }
            .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            h1 { text-align: center; color: #333; }
            .chart-wrapper { position: relative; height: 600px; width: 100%; margin-top: 40px; }
            table { width: 100%; border-collapse: collapse; margin-top: 40px; }
            th, td { text-align: left; padding: 12px; border-bottom: 1px solid #ddd; }
            th { background-color: #f8f9fa; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Content Completeness Audit</h1>
            <p style="text-align: center; color: #666;">Generated via Strapi Client API</p>
            
            <table>
                <thead>
                    <tr>
                        <th>Entity</th>
                        <th>Total Items</th>
                        <th>Missing Images</th>
                        <th>Missing Description</th>
                        <th>Missing Locales (Gap)</th>
                    </tr>
                </thead>
                <tbody>
                    ${metrics
                      .map(
                        (m) => `
                    <tr>
                        <td>${m.entity}</td>
                        <td>${m.total}</td>
                        <td style="${m.missingImage > 0 ? 'color: red; font-weight: bold;' : 'color: green;'}">${m.missingImage}</td>
                        <td style="${m.missingDescription > 0 ? 'color: red; font-weight: bold;' : 'color: green;'}">${m.missingDescription}</td>
                        <td style="${m.missingLocales > 0 ? 'color: orange; font-weight: bold;' : 'color: green;'}">${m.missingLocales}</td>
                    </tr>
                    `
                      )
                      .join('')}
                </tbody>
            </table>

            <div class="chart-wrapper">
                <canvas id="auditChart"></canvas>
            </div>
        </div>

        <script>
            const ctx = document.getElementById('auditChart').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ${JSON.stringify(labels)},
                    datasets: [
                        {
                            label: 'Total Items',
                            data: ${JSON.stringify(dataTotal)},
                            backgroundColor: '#e2e8f0',
                            stack: 'Stack 1' // Separate stack for background context
                        },
                        {
                            label: 'Missing Images',
                            data: ${JSON.stringify(dataMissingImages)},
                            backgroundColor: '#ef4444',
                            stack: 'Stack 0'
                        },
                        {
                            label: 'Missing Description',
                            data: ${JSON.stringify(dataMissingDesc)},
                            backgroundColor: '#f59e0b',
                            stack: 'Stack 0'
                        },
                        {
                            label: 'Missing Locales (Gap)',
                            data: ${JSON.stringify(dataMissingLocales)},
                            backgroundColor: '#3b82f6',
                            stack: 'Stack 0'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { stacked: true },
                        y: { stacked: false } // We don't stack total with the issues
                    }
                }
            });
        </script>
    </body>
    </html>
    `;
}

main();
