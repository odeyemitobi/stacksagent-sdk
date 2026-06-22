import { SecurityEngine, InMemoryAuditStorage } from '@stackagent/security';
import { Policy, ExecutionIntent } from '@stackagent/types';

async function main() {
  console.log("🛡️ StackAgent SDK - Policy Engine & Spending Limits Example");
  console.log("===========================================================\n");

  // 1. Define Policies (Data-driven, no hardcoded logic)
  const policies: Policy[] = [
    {
      id: 'pol-allowlist',
      type: 'ALLOWLIST',
      parameters: { protocols: ['alex', 'zest'] }
    },
    {
      id: 'pol-spending',
      type: 'SPENDING_LIMIT',
      parameters: { maxAmount: 500, asset: 'STX' }
    }
  ];

  console.log("[*] Initialized Policies:");
  console.log("    - ALLOWLIST: ['alex', 'zest']");
  console.log("    - SPENDING_LIMIT: 500 STX");

  // 2. Initialize the immutable Audit Storage
  const auditLogger = new InMemoryAuditStorage();
  
  // 3. Initialize the Security Engine
  const security = new SecurityEngine();
  console.log("\n[*] Started Security Engine Firewall");

  // Helper to log audit
  const logAudit = async (intent: ExecutionIntent, evaluation: any) => {
      await auditLogger.insert({
        id: Math.random().toString(),
        actorId: 'test-agent',
        intent,
        policyEvaluation: evaluation,
        outcome: evaluation.passed ? 'PENDING' : 'REJECTED_BY_POLICY',
        timestamp: new Date().toISOString()
      });
  };

  // 4. Simulate a safe Execution Intent from the AI
  const safeIntent: ExecutionIntent = {
    actionId: 'swap',
    protocolId: 'alex',
    parameters: { amount: 100, asset: 'STX' }, // Under the 500 limit
    reasoning: 'User requested to swap 100 STX on ALEX.'
  };

  console.log("\nEvaluating Intent A (Swap 100 STX on alex):");
  const resultA = security.evaluatePolicies(safeIntent, policies);
  if (resultA.ok && resultA.value.passed) {
    console.log("   ✅ PASSED: Intent satisfies all policies.");
  } else {
    console.log("   ❌ FAILED:", resultA.ok ? resultA.value.reason : resultA.error.message);
  }
  await logAudit(safeIntent, resultA.ok ? resultA.value : null);

  // 5. Simulate a dangerous Execution Intent (AI hallucinating a huge spend)
  const dangerousIntent: ExecutionIntent = {
    actionId: 'swap',
    protocolId: 'alex',
    parameters: { amount: 1000, asset: 'STX' }, // Exceeds the 500 limit
    reasoning: 'User wants to swap 1000 STX on ALEX.'
  };

  console.log("\nEvaluating Intent B (Swap 1000 STX on alex):");
  const resultB = security.evaluatePolicies(dangerousIntent, policies);
  if (resultB.ok && !resultB.value.passed) {
    console.log(`   🛡️ BLOCKED: ${resultB.value.reason}`);
  } else {
    console.log("   ⚠️ PASSED (This shouldn't happen!)");
  }
  await logAudit(dangerousIntent, resultB.ok ? resultB.value : null);

  // 6. Demonstrate the Immutable Audit Log recorded the blocked intent
  console.log("\n[*] Verifying Immutable Audit Ledger:");
  const logsResult = await auditLogger.getLogs();
  if (logsResult.ok) {
    console.log(`    Total entries: ${logsResult.value.length}`);
    const lastLog = logsResult.value[logsResult.value.length - 1];
    console.log(`    Last Entry Outcome: ${lastLog.outcome} (Amount: ${lastLog.intent.parameters?.amount})`);
  }

  console.log("\nDone.");
}

main().catch(console.error);
