import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  const cpus = JSON.parse(fs.readFileSync('./prisma/data/cpus.json', 'utf8'));
  const gpus = JSON.parse(fs.readFileSync('./prisma/data/gpus.json', 'utf8'));
  const cases = JSON.parse(fs.readFileSync('./prisma/data/cases.json', 'utf8'));
  const memory = JSON.parse(fs.readFileSync('./prisma/data/memory.json', 'utf8'));
  const storage = JSON.parse(fs.readFileSync('./prisma/data/storage.json', 'utf8'));
  const powerSupplies = JSON.parse(fs.readFileSync('./prisma/data/power_supplies.json', 'utf8'));
  const motherboards = JSON.parse(fs.readFileSync('./prisma/data/motherboards.json', 'utf8'));

  await prisma.cpu.createMany({ data: cpus });
  await prisma.gpu.createMany({ data: gpus });
  await prisma.case.createMany({ data: cases });
  await prisma.memory.createMany({ data: memory });
  await prisma.storage.createMany({ data: storage });
  await prisma.powerSupply.createMany({ data: powerSupplies });
  await prisma.motherboard.createMany({ data: motherboards });

  console.log('Database seeded!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
