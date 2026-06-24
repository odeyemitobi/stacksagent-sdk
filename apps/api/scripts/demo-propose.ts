/**
 * Creates a pending treasury approval via the live API security pipeline.
 * Requires the API server and database seed to be running.
 */
const API_URL = process.env.API_URL ?? 'http://localhost:3001';
const AGENT_ID = process.env.DEMO_AGENT_ID ?? '550e8400-e29b-41d4-a716-446655440000';

async function main() {
  const response = await fetch(`${API_URL}/v1/executions/propose`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'idempotency-key': `demo_${Date.now()}`,
    },
    body: JSON.stringify({
      agentId: AGENT_ID,
      intent: {
        actionId: 'swap',
        protocolId: 'alex',
        parameters: { amount: 500 },
        reasoning: 'Swap 500 STX on ALEX — exceeds approval threshold for demo.',
      },
    }),
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Propose failed (${response.status}): ${body}`);
  }

  console.log('Demo execution proposed:');
  console.log(body);
  console.log('\nOpen the dashboard Treasury page to approve and sign.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
