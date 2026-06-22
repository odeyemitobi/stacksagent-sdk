import { describe, it, expect, beforeEach } from 'vitest';
import { SecurityEngine } from './engine';
import { ExecutionIntent, Policy } from '@stackagent/types';

describe('SecurityEngine', () => {
  let engine: SecurityEngine;

  beforeEach(() => {
    engine = new SecurityEngine();
  });

  const baseIntent: ExecutionIntent = {
    actionId: 'swap',
    protocolId: 'alex',
    parameters: {},
    reasoning: 'Test intent',
  };

  it('passes when no policies are provided', () => {
    const result = engine.evaluatePolicies(baseIntent, []);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.passed).toBe(true);
    }
  });

  describe('ALLOWLIST', () => {
    it('passes if intent matches globally allowed protocol', () => {
      const allowlist: Policy = {
        id: 'p-1',
        type: 'ALLOWLIST',
        parameters: { protocols: ['alex', 'zest'] },
      };

      const result = engine.evaluatePolicies(baseIntent, [allowlist]);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value.passed).toBe(true);
    });

    it('fails if intent uses unlisted protocol', () => {
      const allowlist: Policy = {
        id: 'p-1',
        type: 'ALLOWLIST',
        parameters: { protocols: ['zest'] }, // 'alex' is not allowed
      };

      const result = engine.evaluatePolicies(baseIntent, [allowlist]);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.passed).toBe(false);
        expect(result.value.failedPolicyId).toBe('p-1');
        expect(result.value.reason).toContain('not in the allowlist');
      }
    });

    it('fails if ALLOWLIST parameters are invalid', () => {
      const allowlist: Policy = {
        id: 'p-1',
        type: 'ALLOWLIST',
        parameters: {}, // missing protocols array
      };

      const result = engine.evaluatePolicies(baseIntent, [allowlist]);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.passed).toBe(false);
        expect(result.value.reason).toContain('Invalid ALLOWLIST');
      }
    });
  });

  describe('DENYLIST', () => {
    it('passes if intent protocol is not denied', () => {
      const denylist: Policy = {
        id: 'p-2',
        type: 'DENYLIST',
        parameters: { protocols: ['zest'] },
      };

      const result = engine.evaluatePolicies(baseIntent, [denylist]);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value.passed).toBe(true);
    });

    it('fails if intent uses denied protocol', () => {
      const denylist: Policy = {
        id: 'p-2',
        type: 'DENYLIST',
        parameters: { protocols: ['alex'] },
      };

      const result = engine.evaluatePolicies(baseIntent, [denylist]);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.passed).toBe(false);
        expect(result.value.failedPolicyId).toBe('p-2');
        expect(result.value.reason).toContain('strictly denied');
      }
    });

    it('fails if DENYLIST parameters are invalid', () => {
      const denylist: Policy = {
        id: 'p-2',
        type: 'DENYLIST',
        parameters: {}, // missing protocols array
      };

      const result = engine.evaluatePolicies(baseIntent, [denylist]);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.passed).toBe(false);
        expect(result.value.reason).toContain('Invalid DENYLIST');
      }
    });
  });

  describe('Policy Scoping', () => {
    it('skips policy if targetActionId does not match', () => {
      const specificDeny: Policy = {
        id: 'p-3',
        type: 'DENYLIST',
        targetActionId: 'lend', // This policy only applies to 'lend' actions
        parameters: { protocols: ['alex'] }, // Deny 'alex' for 'lend'
      };

      // Our intent is a 'swap' on 'alex'
      const result = engine.evaluatePolicies(baseIntent, [specificDeny]);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value.passed).toBe(true); // Should pass because policy is skipped
    });

    it('skips policy if targetProtocolId does not match', () => {
      const specificAllow: Policy = {
        id: 'p-4',
        type: 'ALLOWLIST',
        targetProtocolId: 'zest', // Only applies to 'zest'
        parameters: { protocols: ['zest'] },
      };

      // Intent is on 'alex', so this allowlist doesn't apply (gets skipped)
      // Since no other policies exist, it passes.
      const result = engine.evaluatePolicies(baseIntent, [specificAllow]);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value.passed).toBe(true);
    });
  });

  describe('Future/Unknown Policies', () => {
    it('returns false for completely unknown policy types', () => {
      const unknownPolicy: Policy = {
        id: 'p-5',
        type: 'UNKNOWN_TYPE' as any,
        parameters: {},
      };

      const result = engine.evaluatePolicies(baseIntent, [unknownPolicy]);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.passed).toBe(false);
        expect(result.value.reason).toContain('Unknown policy type');
      }
    });

  describe('SPENDING_LIMIT', () => {
    const limitPolicy: Policy = {
      id: 'p-limit',
      type: 'SPENDING_LIMIT',
      parameters: { maxAmount: 1000 },
    };

    it('passes if intent amount is below or equal to the limit', () => {
      const validIntent: ExecutionIntent = {
        ...baseIntent,
        parameters: { amount: 500 },
      };
      const result = engine.evaluatePolicies(validIntent, [limitPolicy]);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value.passed).toBe(true);
    });

    it('fails if intent amount exceeds the limit', () => {
      const invalidIntent: ExecutionIntent = {
        ...baseIntent,
        parameters: { amount: 1001 },
      };
      const result = engine.evaluatePolicies(invalidIntent, [limitPolicy]);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.passed).toBe(false);
        expect(result.value.failedPolicyId).toBe('p-limit');
        expect(result.value.reason).toContain('exceeds spending limit');
      }
    });

    it('fails if intent is missing amount parameter', () => {
      const noAmountIntent: ExecutionIntent = {
        ...baseIntent,
        parameters: {}, // No amount
      };
      const result = engine.evaluatePolicies(noAmountIntent, [limitPolicy]);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.passed).toBe(false);
        expect(result.value.reason).toContain('requires an amount parameter');
      }
    });

    it('fails if policy has invalid configuration', () => {
      const badLimitPolicy: Policy = {
        id: 'p-bad-limit',
        type: 'SPENDING_LIMIT',
        parameters: {}, // missing maxAmount
      };
      const validIntent: ExecutionIntent = {
        ...baseIntent,
        parameters: { amount: 500 },
      };
      const result = engine.evaluatePolicies(validIntent, [badLimitPolicy]);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.passed).toBe(false);
        expect(result.value.reason).toContain('Invalid SPENDING_LIMIT configuration');
      }
    });
  });
  describe('APPROVAL_THRESHOLD', () => {
    it('should return requiresApproval when intent amount exceeds threshold', () => {
      const intent: ExecutionIntent = {
        actionId: 'swap',
        protocolId: 'alex',
        parameters: { amount: 1500 },
        reasoning: 'test',
      };
      const policy: Policy = {
        id: 'p5',
        type: 'APPROVAL_THRESHOLD',
        parameters: { thresholdAmount: 1000 },
      };
      const result = engine.evaluatePolicies(intent, [policy]);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.passed).toBe(true);
        expect(result.value.requiresApproval).toBe(true);
      }
    });

    it('should pass cleanly when intent amount is below threshold', () => {
      const intent: ExecutionIntent = {
        actionId: 'swap',
        protocolId: 'alex',
        parameters: { amount: 500 },
        reasoning: 'test',
      };
      const policy: Policy = {
        id: 'p5',
        type: 'APPROVAL_THRESHOLD',
        parameters: { thresholdAmount: 1000 },
      };
      const result = engine.evaluatePolicies(intent, [policy]);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.passed).toBe(true);
        expect(result.value.requiresApproval).toBeFalsy();
      }
    });
  });
});
});
