import { chunkMarkdown } from './markdown-chunker';

const sample = `
# Header 1
Content 1
## Subheader 1.1
Content 1.1
### Subheader 1.1.1
Content 1.1.1
# Header 2
Content 2
`;

const chunks = chunkMarkdown(sample);
console.log('Chunks:', chunks.length);
chunks.forEach((c, i) => {
  console.log(`Chunk ${i}: ${c.title} (Level ${c.level})`);
  console.log('---');
  console.log(c.content.replace(/\n/g, '\\n'));
  console.log('===');
});
