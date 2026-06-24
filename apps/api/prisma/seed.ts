import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  const userId = 'default-user-id';

  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      address: 'ST1PQHQKV0RJXZFY1DQM8HK4LEFPZ5REJ4M3TWT2H',
    },
  });

  const agentId = '550e8400-e29b-41d4-a716-446655440000';

  await prisma.agent.upsert({
    where: { id: agentId },
    update: {
      status: 'RUNNING',
      name: 'Treasury Yield Agent',
      role: 'Treasury Manager',
    },
    create: {
      id: agentId,
      userId,
      name: 'Treasury Yield Agent',
      role: 'Treasury Manager',
      status: 'RUNNING',
    },
  });

  await prisma.policy.deleteMany({ where: { agentId } });

  await prisma.policy.create({
    data: {
      id: uuidv4(),
      agentId,
      type: 'ALLOWLIST',
      parameters: { protocols: ['alex', 'zest'] },
    },
  });

  await prisma.policy.create({
    data: {
      id: uuidv4(),
      agentId,
      type: 'APPROVAL_THRESHOLD',
      parameters: { thresholdAmount: 100 },
    },
  });

  await prisma.publishedAgent.deleteMany({});
  await prisma.publishedAgent.create({
    data: {
      id: uuidv4(),
      authorId: userId,
      name: 'Conservative Yield Farmer',
      description: 'Low-risk STX yield strategies with strict spending limits.',
      configPayload: {
        role: 'Yield Farming',
        systemPrompt: 'Prefer conservative lending and low slippage swaps.',
        allowedProtocols: ['alex', 'zest'],
      },
    },
  });

  console.log('Seed complete.');
  console.log(`Demo agent ID: ${agentId}`);
  console.log('Run: pnpm --filter api demo:propose');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
