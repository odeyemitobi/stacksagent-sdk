import { ExecutionIntent, Policy, PolicyEvaluation, Result, ok, err } from '@stackagent/types';

export class SecurityEngine {
  /**
   * Evaluates an ExecutionIntent against an array of Policies.
   * Returns a successful Result if all applicable policies pass.
   */
  public evaluatePolicies(intent: ExecutionIntent, policies: Policy[]): Result<PolicyEvaluation, Error> {
    let globalRequiresApproval = false;
    let globalReason = '';

    for (const policy of policies) {
      // 1. Check if the policy applies to this intent
      if (policy.targetActionId && policy.targetActionId !== intent.actionId) {
        continue;
      }
      if (policy.targetProtocolId && policy.targetProtocolId !== intent.protocolId) {
        continue;
      }

      // 2. Evaluate based on policy type
      const evaluation = this.evaluateSinglePolicy(intent, policy);
      
      // 3. Short-circuit on failure
      if (!evaluation.passed) {
        return ok(evaluation);
      }

      if (evaluation.requiresApproval) {
        globalRequiresApproval = true;
        if (evaluation.reason) {
          globalReason += evaluation.reason + ' ';
        }
      }
    }

    return ok({ passed: true, requiresApproval: globalRequiresApproval, reason: globalReason.trim() || undefined });
  }

  private evaluateSinglePolicy(intent: ExecutionIntent, policy: Policy): PolicyEvaluation {
    switch (policy.type) {
      case 'ALLOWLIST':
        return this.evaluateAllowlist(intent, policy);
      case 'DENYLIST':
        return this.evaluateDenylist(intent, policy);
      case 'SPENDING_LIMIT':
        return this.evaluateSpendingLimit(intent, policy);
      case 'TIME_WINDOW':
        // Placeholder
        return { passed: true };
      case 'APPROVAL_THRESHOLD':
        return this.evaluateApprovalThreshold(intent, policy);
      default:
        return {
          passed: false,
          reason: `Unknown policy type: ${policy.type}`,
          failedPolicyId: policy.id,
        };
    }
  }

  private evaluateApprovalThreshold(intent: ExecutionIntent, policy: Policy): PolicyEvaluation {
    const thresholdAmount = policy.parameters['thresholdAmount'] as number | undefined;
    
    if (typeof thresholdAmount !== 'number') {
      return { passed: false, reason: 'Invalid APPROVAL_THRESHOLD configuration', failedPolicyId: policy.id };
    }

    const intentAmount = intent.parameters['amount'] as number | undefined;

    if (typeof intentAmount === 'number' && intentAmount > thresholdAmount) {
      return {
        passed: true,
        requiresApproval: true,
        reason: `Intent amount (${intentAmount}) exceeds approval threshold (${thresholdAmount}). Human approval required.`,
        failedPolicyId: policy.id,
      };
    }

    return { passed: true };
  }

  private evaluateSpendingLimit(intent: ExecutionIntent, policy: Policy): PolicyEvaluation {
    const maxAmount = policy.parameters['maxAmount'] as number | undefined;
    
    if (typeof maxAmount !== 'number') {
      return { passed: false, reason: 'Invalid SPENDING_LIMIT configuration', failedPolicyId: policy.id };
    }

    const intentAmount = intent.parameters['amount'] as number | undefined;

    // If the intent doesn't specify an amount, but a spending limit exists, 
    // it's safer to fail it unless we know for a fact the action doesn't move funds.
    // For MVP, if a SPENDING_LIMIT policy is scoped to this action and amount is missing, block it.
    if (typeof intentAmount !== 'number') {
      return { 
        passed: false, 
        reason: 'Action requires an amount parameter for spending limit evaluation.',
        failedPolicyId: policy.id 
      };
    }

    if (intentAmount > maxAmount) {
      return {
        passed: false,
        reason: `Intent amount (${intentAmount}) exceeds spending limit (${maxAmount}).`,
        failedPolicyId: policy.id,
      };
    }

    return { passed: true };
  }

  private evaluateAllowlist(intent: ExecutionIntent, policy: Policy): PolicyEvaluation {
    const allowedProtocols = policy.parameters['protocols'] as string[] | undefined;
    if (!allowedProtocols) {
      return { passed: false, reason: 'Invalid ALLOWLIST configuration', failedPolicyId: policy.id };
    }

    if (!allowedProtocols.includes(intent.protocolId)) {
      return {
        passed: false,
        reason: `Protocol '${intent.protocolId}' is not in the allowlist.`,
        failedPolicyId: policy.id,
      };
    }

    return { passed: true };
  }

  private evaluateDenylist(intent: ExecutionIntent, policy: Policy): PolicyEvaluation {
    const deniedProtocols = policy.parameters['protocols'] as string[] | undefined;
    if (!deniedProtocols) {
      return { passed: false, reason: 'Invalid DENYLIST configuration', failedPolicyId: policy.id };
    }

    if (deniedProtocols.includes(intent.protocolId)) {
      return {
        passed: false,
        reason: `Protocol '${intent.protocolId}' is strictly denied.`,
        failedPolicyId: policy.id,
      };
    }

    return { passed: true };
  }
}
