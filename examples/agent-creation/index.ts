import { StackAgentClient } from '@stackagent/sdk';
import { NetworkMode } from '@stackagent/types';

async function main() {
  console.log('🚀 StackAgent SDK — Agent Creation Example');
  console.log('==========================================\n');

  const client = new StackAgentClient({ networkMode: NetworkMode.Testnet });

  const config = {
    name: 'Bitcoin DeFi Assistant',
    role: 'Treasury Manager',
    systemPrompt: 'You are a helpful Bitcoin DeFi assistant.',
    allowedProtocols: ['alex', 'zest'],
  };

  const agent = await client.createAgent(config);
  const state = agent.getState();

  console.log(`✅ Successfully spawned new Agent!`);
  console.log(`   Agent ID: ${state.id}`);
  console.log(`   Initial State: ${state.status}`);
  console.log(`\nRegistered protocols: ${client.listProtocols().map((p) => p.id).join(', ')}`);
  console.log('\nDone.');
}

main().catch(console.error);
