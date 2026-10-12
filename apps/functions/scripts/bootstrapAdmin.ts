/**
 * One-time, operator-run admin bootstrap. NOT an HTTP endpoint and never invoked by app code -
 * this is a standalone script you run yourself, locally, with production database credentials
 * (same trust level as running a Prisma migration), after reviewing exactly what it does below.
 *
 * It only ever grants isAdmin to an EXISTING user, identified by their exact email - it cannot
 * create an account, and there is no way to reach it from any API route a browser or a malicious
 * PR could hit. Once you have at least one admin, every further admin grant goes through the
 * audited admin API (requires an existing admin, a reason, and writes an AdminActionLog row) -
 * this script is only for creating the very first admin, or recovering access if every admin
 * account is somehow lost.
 *
 * Usage (run from apps/functions):
 *   npx tsx scripts/bootstrapAdmin.ts you@example.com
 *
 * Idempotent: running it again on an already-admin account is a no-op that just confirms the
 * current state.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error('Usage: npx tsx scripts/bootstrapAdmin.ts <email>');
    process.exitCode = 1;
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No existing user with email ${email} - this script never creates accounts.`);
    process.exitCode = 1;
    return;
  }

  if (user.isAdmin) {
    console.log(`${email} (${user.id}) is already an admin. Nothing to do.`);
    return;
  }

  await prisma.user.update({ where: { id: user.id }, data: { isAdmin: true } });
  await prisma.adminActionLog.create({
    data: {
      actorId: user.id, // self-granted via the operator-run bootstrap, not another admin
      targetUserId: user.id,
      action: 'admin.bootstrap_grant',
      reason: 'Initial admin bootstrap via scripts/bootstrapAdmin.ts',
      before: { isAdmin: false },
      after: { isAdmin: true },
    },
  });
  console.log(`Granted admin access to ${email} (${user.id}).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
