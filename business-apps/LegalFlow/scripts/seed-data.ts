/**
 * Seed Script - Runs full data ingestion
 * 
 * Usage: npx ts-node scripts/seed-data.ts
 * Or: npm run seed
 */

import { DataIngestionScheduler } from '../src/services/data-ingestion/scheduler.js';

async function main() {
  console.log('🚀 LegalFlow Data Seeding Started');
  console.log('================================\n');

  const scheduler = new DataIngestionScheduler();

  try {
    const results = await scheduler.runFullIngestion();

    console.log('\n================================');
    console.log('📊 INGESTION RESULTS SUMMARY');
    console.log('================================\n');

    let totalRecords = 0;
    let totalCreated = 0;
    let totalFailed = 0;

    for (const [category, result] of Object.entries(results)) {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${category}:`);
      console.log(`   Processed: ${result.recordsProcessed}`);
      console.log(`   Created: ${result.recordsCreated}`);
      console.log(`   Failed: ${result.recordsFailed}`);
      console.log(`   Duration: ${(result.duration / 1000).toFixed(2)}s\n`);

      totalRecords += result.recordsProcessed;
      totalCreated += result.recordsCreated;
      totalFailed += result.recordsFailed;
    }

    console.log('================================');
    console.log('📈 TOTALS');
    console.log('================================');
    console.log(`Total Records Processed: ${totalRecords}`);
    console.log(`Total Records Created: ${totalCreated}`);
    console.log(`Total Records Failed: ${totalFailed}`);
    console.log(`Success Rate: ${((totalCreated / totalRecords) * 100).toFixed(2)}%`);

    if (totalFailed === 0) {
      console.log('\n✅ All data seeded successfully!');
    } else {
      console.log(`\n⚠️ Completed with ${totalFailed} failures`);
    }

  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

main();

