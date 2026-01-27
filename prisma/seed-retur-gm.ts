// prisma/seed-retur-gm.ts
// Seed script untuk generate dummy data Retur dan Gross Margin
// Run dengan: npx ts-node prisma/seed-retur-gm.ts

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed for Retur and Gross Margin data...');

  // Get categories
  const categories = await prisma.category.findMany();

  if (categories.length === 0) {
    console.error('❌ No categories found. Please seed categories first.');
    return;
  }

  const categoryMap = new Map(categories.map(c => [c.name, c.id]));

  // Define date range for dummy data (January 2026)
  const year = 2026;
  const month = 1;

  console.log(`📅 Generating data for ${month}/${year}...`);

  // ===========================================
  // SEED RETUR DATA
  // ===========================================

  console.log('📦 Seeding Retur data...');

  const returData: Prisma.ReturCreateManyInput[] = [];

  // Generate 20 retur records
  for (let i = 1; i <= 20; i++) {
    const day = Math.floor(Math.random() * 20) + 1; // Random day 1-20
    const catIndex = Math.floor(Math.random() * categories.length);
    const category = categories[catIndex];
    const area = Math.random() > 0.5 ? 'CABANG' : 'LOCAL';

    const sellingAmount = Math.floor(Math.random() * 2000000) + 500000; // 500k - 2.5M
    const buyingAmount = sellingAmount * 0.7; // 70% of selling (HPP)

    returData.push({
      salesInvoice: `RJ-${year}-${String(month).padStart(2, '0')}-${String(i).padStart(4, '0')}`,
      postingDate: new Date(year, month - 1, day),
      sellingAmount: new Prisma.Decimal(sellingAmount),
      buyingAmount: new Prisma.Decimal(buyingAmount),
      categoryId: category.id,
      locationType: area as 'CABANG' | 'LOCAL',
      createdBy: 1, // Admin user
      updatedBy: 1,
    });
  }

  await prisma.retur.createMany({
    data: returData,
    skipDuplicates: true,
  });

  console.log(`✅ Created ${returData.length} retur records`);

  // ===========================================
  // SEED GROSS MARGIN DATA
  // ===========================================

  console.log('💰 Seeding Gross Margin data...');

  const gmData: Prisma.GrossMarginCreateManyInput[] = [];

  // Generate data for each day (1-20 January 2026)
  for (let day = 1; day <= 20; day++) {
    // For each category and area combination
    for (const category of categories) {
      for (const area of ['CABANG', 'LOCAL']) {
        // Random omzet between 1M - 50M
        const omzet = Math.floor(Math.random() * 49000000) + 1000000;

        // HPP is 70-90% of omzet (margin 10-30%)
        const hppPercent = 0.7 + Math.random() * 0.2; // 70% - 90%
        const hpp = omzet * hppPercent;

        const margin = omzet - hpp;
        const marginPercent = (margin / omzet) * 100;

        gmData.push({
          recordDate: new Date(year, month - 1, day),
          categoryId: category.id,
          locationType: area as 'CABANG' | 'LOCAL',
          omzetAmount: new Prisma.Decimal(omzet),
          hppAmount: new Prisma.Decimal(hpp),
          marginAmount: new Prisma.Decimal(margin),
          marginPercent: new Prisma.Decimal(marginPercent),
          createdBy: 1,
          updatedBy: 1,
        });
      }
    }
  }

  await prisma.grossMargin.createMany({
    data: gmData,
    skipDuplicates: true,
  });

  console.log(`✅ Created ${gmData.length} gross margin records`);

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
