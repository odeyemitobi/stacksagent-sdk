import { AgentManager } from '@stackagent/runtime';
import { AgentConfig } from '@stackagent/types';

async function main() {
  console.log("🚀 StackAgent SDK - Agent Creation Example");
  console.log("==========================================\n");

  // 2. Configure the Agent
  const config: AgentConfig = {
    name: 'Bitcoin DeFi Assistant',
    role: 'Treasury Manager',
    systemPrompt: 'You are a helpful Bitcoin DeFi assistant.',
    allowedProtocols: ['alex', 'zest']
  };

  // 3. Start the Orchestrator
  const manager = new AgentManager();
  console.log("[*] Started Agent Manager Orchestrator");

  // 4. Spawn an Agent
  const createResult = await manager.createAgent(config);
  
  if (!createResult.ok) {
    console.error("❌ Failed to create agent:", createResult.error.message);
    process.exit(1);
  }

  const agentId = createResult.value.getState().id;
  console.log(`\n✅ Successfully spawned new Agent!`);
  console.log(`   Agent ID: ${agentId}`);

  // Fetch agent to verify state
  const agentResult = await manager.getAgent(agentId);
  if (agentResult.ok) {
    const agent = agentResult.value;
    console.log(`   Initial State: ${agent.getState().status}`);
  }

  console.log("\n(In a real application, you would now call await agent.executeTask('Swap 100 STX...'))");
  console.log("Done.");
}

main().catch(console.error);
