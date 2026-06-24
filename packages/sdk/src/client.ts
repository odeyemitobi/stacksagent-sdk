import {
  AgentConfig,
  AgentState,
  ExecutionIntent,
  NetworkMode,
  Policy,
  PolicyEvaluation,
  Protocol,
  Result,
  SimulationResult,
  WalletState,
} from '@stackagent/types';
import { Agent, AgentManager, IAgentStorage } from '@stackagent/runtime';
import { registry, ProtocolRegistry } from '@stackagent/registry';
import { SecurityEngine, TransactionSimulator } from '@stackagent/security';
import { connectWallet, signContractCall, ConnectWalletOptions, SignContractCallOptions } from '@stackagent/wallet';
import {
  AgentNotFoundError,
  PolicyRejectedError,
  ProtocolNotFoundError,
  SimulationFailedError,
  WalletConnectionError,
} from './errors';

export interface StackAgentClientOptions {
  storage?: IAgentStorage;
  registry?: ProtocolRegistry;
  networkMode?: NetworkMode;
}

export interface ProposeExecutionResult {
  intent: ExecutionIntent;
  policyEvaluation: PolicyEvaluation;
  simulation: SimulationResult;
}

/**
 * Public SDK client composing runtime, registry, security, and wallet packages.
 */
export class StackAgentClient {
  private readonly agentManager: AgentManager;
  private readonly registry: ProtocolRegistry;
  private readonly securityEngine: SecurityEngine;
  private readonly simulator: TransactionSimulator;
  private readonly networkMode: NetworkMode;

  constructor(options: StackAgentClientOptions = {}) {
    this.agentManager = new AgentManager(options.storage);
    this.registry = options.registry ?? registry;
    this.securityEngine = new SecurityEngine();
    this.simulator = new TransactionSimulator(this.registry);
    this.networkMode = options.networkMode ?? NetworkMode.Testnet;
  }

  /** Creates a new agent and persists its initial state. */
  async createAgent(config: AgentConfig, signal?: AbortSignal): Promise<Agent> {
    signal?.throwIfAborted();
    const result = await this.agentManager.createAgent(config);
    if (!result.ok) {
      throw result.error;
    }
    return result.value;
  }

  /** Retrieves an agent by ID. */
  async getAgent(id: string, signal?: AbortSignal): Promise<Agent> {
    signal?.throwIfAborted();
    const result = await this.agentManager.getAgent(id);
    if (!result.ok) {
      throw new AgentNotFoundError(id);
    }
    return result.value;
  }

  /** Lists all agents. */
  async listAgents(signal?: AbortSignal): Promise<AgentState[]> {
    signal?.throwIfAborted();
    return this.agentManager.listAgents();
  }

  /** Lists registered protocol metadata. */
  listProtocols(signal?: AbortSignal): Protocol[] {
    signal?.throwIfAborted();
    return this.registry.listProtocols();
  }

  /** Retrieves protocol metadata by ID. */
  getProtocol(id: string, signal?: AbortSignal): Protocol {
    signal?.throwIfAborted();
    const result = this.registry.getProtocol(id);
    if (!result.ok) {
      throw new ProtocolNotFoundError(id);
    }
    return result.value;
  }

  /**
   * Runs the full local security flow: policy evaluation then simulation.
   * Use before requesting a wallet signature.
   */
  async proposeExecution(
    intent: ExecutionIntent,
    policies: Policy[],
    signal?: AbortSignal,
  ): Promise<ProposeExecutionResult> {
    signal?.throwIfAborted();

    const evaluation = this.securityEngine.evaluatePolicies(intent, policies);
    if (!evaluation.ok) {
      throw evaluation.error;
    }

    if (!evaluation.value.passed) {
      throw new PolicyRejectedError(evaluation.value.reason ?? 'Policy evaluation failed.');
    }

    const simulation = await this.simulator.simulate(intent);
    if (!simulation.ok) {
      throw new SimulationFailedError(simulation.error.message);
    }

    return {
      intent,
      policyEvaluation: evaluation.value,
      simulation: simulation.value,
    };
  }

  /** Simulates a transaction without policy checks. */
  async simulateExecution(intent: ExecutionIntent, signal?: AbortSignal): Promise<SimulationResult> {
    signal?.throwIfAborted();
    const result = await this.simulator.simulate(intent);
    if (!result.ok) {
      throw new SimulationFailedError(result.error.message);
    }
    return result.value;
  }

  /** Connects a Stacks wallet via @stacks/connect. */
  async connectWallet(options: Omit<ConnectWalletOptions, 'networkMode'>, signal?: AbortSignal): Promise<WalletState> {
    signal?.throwIfAborted();
    const result = await connectWallet({ ...options, networkMode: this.networkMode });
    if (!result.ok) {
      throw new WalletConnectionError(result.error.message);
    }
    return result.value;
  }

  /** Signs a contract call using the connected wallet. */
  async signContractCall(
    options: Omit<SignContractCallOptions, 'networkMode'>,
    signal?: AbortSignal,
  ): Promise<{ txId: string }> {
    signal?.throwIfAborted();
    const result = await signContractCall({ ...options, networkMode: this.networkMode });
    if (!result.ok) {
      throw new WalletConnectionError(result.error.message);
    }
    return result.value;
  }
}

export type { Result };
