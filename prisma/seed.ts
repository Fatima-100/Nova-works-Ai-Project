/**
 * Prisma Seed Script for NovaWorks AI Project Manager
 * Seed rule: Idempotent upsert by email so running multiple times never duplicates users.
 */
import bcrypt from 'bcryptjs';
import { runSeed, SEED_USERS, SEED_PASSWORD } from '../server/seed.js';

async function main() {
  console.log('--- Starting NovaWorks Database Seed ---');
  const result = await runSeed();
  console.log(`Successfully seeded ${result.count} users with default password: ${SEED_PASSWORD}`);
  console.log('Users seeded:');
  result.users.forEach((u) => {
    console.log(`- [${u.role}] ${u.id}: ${u.name} <${u.email}> (${u.specialization})`);
  });
  console.log('--- Seed complete ---');
}

main().catch((e) => {
  console.error('Seed error:', e);
  process.exit(1);
});
