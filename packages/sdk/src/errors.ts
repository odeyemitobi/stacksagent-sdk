/**
 * Base error for all StackAgent SDK failures.
 */
export class StackAgentError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'StackAgentError';
    this.code = code;
  }
}

export class PolicyRejectedError extends StackAgentError {
  constructor(message: string) {
    super('POLICY_REJECTED', message);
    this.name = 'PolicyRejectedError';
  }
}

export class SimulationFailedError extends StackAgentError {
  constructor(message: string) {
    super('SIMULATION_FAILED', message);
    this.name = 'SimulationFailedError';
  }
}

export class AgentNotFoundError extends StackAgentError {
  constructor(id: string) {
    super('AGENT_NOT_FOUND', `Agent with ID '${id}' not found.`);
    this.name = 'AgentNotFoundError';
  }
}

export class ProtocolNotFoundError extends StackAgentError {
  constructor(id: string) {
    super('PROTOCOL_NOT_FOUND', `Protocol '${id}' not found in registry.`);
    this.name = 'ProtocolNotFoundError';
  }
}

export class WalletConnectionError extends StackAgentError {
  constructor(message: string) {
    super('WALLET_CONNECTION_FAILED', message);
    this.name = 'WalletConnectionError';
  }
}
