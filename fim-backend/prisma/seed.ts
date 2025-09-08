import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');
  try {
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    console.log('Hashed admin password.');

    // Admin user
    console.log('Creating/updating admin user...');
    const admin = await prisma.user.upsert({
      where: { email: 'admin@dndmanager.com' },
      update: {},
      create: {
        email: 'admin@dndmanager.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
      },
    });
    console.log('Admin user created/updated:', { admin });

    // Player accounts (Fellowship theme)
    console.log('Creating/updating player users...');
    const players = await Promise.all([
      prisma.user.upsert({
        where: { email: 'frodo@dndmanager.com' },
        update: {},
        create: {
          email: 'frodo@dndmanager.com',
          password: await bcrypt.hash('password', 10),
          firstName: 'Frodo',
          lastName: 'Baggins',
          role: 'PLAYER',
        },
      }),
      prisma.user.upsert({
        where: { email: 'samwise@dndmanager.com' },
        update: {},
        create: {
          email: 'samwise@dndmanager.com',
          password: await bcrypt.hash('password', 10),
          firstName: 'Samwise',
          lastName: 'Gamgee',
          role: 'PLAYER',
        },
      }),
      prisma.user.upsert({
        where: { email: 'aragorn@dndmanager.com' },
        update: {},
        create: {
          email: 'aragorn@dndmanager.com',
          password: await bcrypt.hash('password', 10),
          firstName: 'Aragorn',
          lastName: 'Son of Arathorn',
          role: 'PLAYER',
        },
      }),
      prisma.user.upsert({
        where: { email: 'legolas@dndmanager.com' },
        update: {},
        create: {
          email: 'legolas@dndmanager.com',
          password: await bcrypt.hash('password', 10),
          firstName: 'Legolas',
          lastName: 'Greenleaf',
          role: 'PLAYER',
        },
      }),
    ]);
    console.log('Player users created/updated:', { players });

    // Sample campaign pages
    console.log('Creating/updating campaign pages...');
    const pages = await Promise.all([
      prisma.page.upsert({
        where: { url: 'http://example.com/campaign1' },
        update: {},
        create: {
          title: 'The Lost Mine of Phandelver',
          url: 'http://example.com/campaign1',
          description: 'A classic D&D 5e adventure for new players.',
          createdById: admin.id,
        },
      }),
      prisma.page.upsert({
        where: { url: 'http://example.com/campaign2' },
        update: {},
        create: {
          title: 'Curse of Strahd',
          url: 'http://example.com/campaign2',
          description: 'A gothic horror adventure in Barovia.',
          createdById: admin.id,
        },
      }),
      prisma.page.upsert({
        where: { url: 'http://example.com/campaign3' },
        update: {},
        create: {
          title: 'Tomb of Annihilation',
          url: 'http://example.com/campaign3',
          description: 'Explore the jungles of Chult and face deadly traps.',
          createdById: admin.id,
        },
      }),
      prisma.page.upsert({
        where: { url: 'http://example.com/campaign4' },
        update: {},
        create: {
          title: 'Storm King\'s Thunder',
          url: 'http://example.com/campaign4',
          description: 'Giants are on the rampage across the Sword Coast.',
          createdById: admin.id,
        },
      }),
      prisma.page.upsert({
        where: { url: 'http://example.com/campaign5' },
        update: {},
        create: {
          title: 'Waterdeep: Dragon Heist',
          url: 'http://example.com/campaign5',
          description: 'A grand urban caper in the city of splendors.',
          createdById: admin.id,
        },
      }),
      prisma.page.upsert({
        where: { url: 'http://example.com/campaign6' },
        update: {},
        create: {
          title: 'Descent into Avernus',
          url: 'http://example.com/campaign6',
          description: 'Save the city of Elturel from being dragged into hell.',
          createdById: admin.id,
        },
      }),
    ]);
    console.log('Campaign pages created/updated:', { pages });

    // Realistic page assignments
    console.log('Creating/updating user page assignments...');
    await Promise.all([
      // Frodo gets access to Phandelver and Strahd
      prisma.userPageAssignment.upsert({
        where: { userId_pageId: { userId: players[0].id, pageId: pages[0].id } },
        update: {},
        create: { userId: players[0].id, pageId: pages[0].id, assignedBy: admin.id },
      }),
      prisma.userPageAssignment.upsert({
        where: { userId_pageId: { userId: players[0].id, pageId: pages[1].id } },
        update: {},
        create: { userId: players[0].id, pageId: pages[1].id, assignedBy: admin.id },
      }),
      // Samwise gets access to Phandelver and Tomb of Annihilation
      prisma.userPageAssignment.upsert({
        where: { userId_pageId: { userId: players[1].id, pageId: pages[0].id } },
        update: {},
        create: { userId: players[1].id, pageId: pages[0].id, assignedBy: admin.id },
      }),
      prisma.userPageAssignment.upsert({
        where: { userId_pageId: { userId: players[1].id, pageId: pages[2].id } },
        update: {},
        create: { userId: players[1].id, pageId: pages[2].id, assignedBy: admin.id },
      }),
      // Aragorn gets access to Strahd and Storm King's Thunder
      prisma.userPageAssignment.upsert({
        where: { userId_pageId: { userId: players[2].id, pageId: pages[1].id } },
        update: {},
        create: { userId: players[2].id, pageId: pages[1].id, assignedBy: admin.id },
      }),
      prisma.userPageAssignment.upsert({
        where: { userId_pageId: { userId: players[2].id, pageId: pages[3].id } },
        update: {},
        create: { userId: players[2].id, pageId: pages[3].id, assignedBy: admin.id },
      }),
      // Legolas gets access to Tomb of Annihilation and Waterdeep
      prisma.userPageAssignment.upsert({
        where: { userId_pageId: { userId: players[3].id, pageId: pages[2].id } },
        update: {},
        create: { userId: players[3].id, pageId: pages[2].id, assignedBy: admin.id },
      }),
      prisma.userPageAssignment.upsert({
        where: { userId_pageId: { userId: players[3].id, pageId: pages[4].id } },
        update: {},
        create: { userId: players[3].id, pageId: pages[4].id, assignedBy: admin.id },
      }),
    ]);
    console.log('User page assignments created/updated.');

    console.log('Seeding finished.');
  } catch (e) {
    console.error('Seeding failed:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();