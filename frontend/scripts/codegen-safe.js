import { execSync } from 'child_process';

console.log('🔮 Starting GraphQL Codegen...');

try {
  // Inherit stdio to show colorful output from codegen
  execSync('graphql-codegen', { stdio: 'inherit' });
  console.log('✅ Codegen completed successfully!');
} catch (error) {
  console.error('\n❌ Codegen Failed!');
  console.error('---------------------------------------------------');
  console.error('⚠️  Most likely cause: The Backend is not running.');
  console.error('   The codegen needs to fetch the schema from:');
  console.error('   http://localhost:1337/graphql');
  console.error('\n🛠  To fix this:');
  console.error('   1. Open a new terminal');
  console.error('   2. Run: yarn workspace @daicer/backend dev');
  console.error('   3. Wait for Strapi to start');
  console.error('   4. Try running codegen again');
  console.error('---------------------------------------------------');
  process.exit(1);
}
