    import { PrismaClient } from '@prisma/client';
    import fs from 'fs';
    import path from 'path';

    const prisma = new PrismaClient();

    async function main() {
    try {
        const cpus = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'cpus.json'), 'utf8'));
        const gpus = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'gpus.json'), 'utf8'));
        const cases = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'cases.json'), 'utf8'));
        const memory = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'memory.json'), 'utf8'));
        const storage = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'storages.json'), 'utf8'));
        const powerSupplies = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'power_supplies.json'), 'utf8'));
        const motherboards = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'motherboards.json'), 'utf8'));

        await prisma.cpu.createMany({ data: cpus });
        await prisma.gpu.createMany({ data: gpus });
        await prisma.case.createMany({ data: cases });
        await prisma.memory.createMany({ data: memory });
        await prisma.storage.createMany({ data: storage });
        await prisma.powerSupply.createMany({ data: powerSupplies });
        await prisma.motherboard.createMany({ data: motherboards });

        console.log('Database seeded!');
    } catch (error) {
        console.error('Error reading JSON files or seeding database:', error);
        process.exit(1);
    }
    }

    main()
    .finally(async () => {
        await prisma.$disconnect();
    });
