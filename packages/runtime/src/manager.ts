import { AgentConfig, AgentState, Result, ok, err } from '@stackagent/types';
import { Agent } from './agent';

export interface IAgentStorage {
  save(agent: AgentState): Promise<void>;
  get(id: string): Promise<AgentState | null>;
  list(): Promise<AgentState[]>;
}

export class InMemoryAgentStorage implements IAgentStorage {
  private agents = new Map<string, AgentState>();

  async save(agent: AgentState): Promise<void> {
    this.agents.set(agent.id, agent);
  }

  async get(id: string): Promise<AgentState | null> {
    return this.agents.get(id) || null;
  }

  async list(): Promise<AgentState[]> {
    return Array.from(this.agents.values());
  }
}

export class AgentManager {
  private storage: IAgentStorage;
  // Keep in-memory instances around for runtime execution, 
  // but sync state to storage.
  private activeAgents: Map<string, Agent>;

  constructor(storage?: IAgentStorage) {
    this.storage = storage || new InMemoryAgentStorage();
    this.activeAgents = new Map();
  }

  /**
   * Instantiates a new Agent and persists its initial state.
   */
  public async createAgent(config: AgentConfig): Promise<Result<Agent, Error>> {
    try {
      const agent = new Agent(config);
      this.activeAgents.set(agent.getState().id, agent);
      await this.storage.save(agent.getState());
      return ok(agent);
    } catch (e) {
      return err(e instanceof Error ? e : new Error('Failed to create agent'));
    }
  }

  /**
   * Retrieves an Agent by its unique ID.
   */
  public async getAgent(id: string): Promise<Result<Agent, Error>> {
    let agent = this.activeAgents.get(id);
    if (!agent) {
      // Hydrate from storage if not actively running
      const state = await this.storage.get(id);
      if (!state) {
        return err(new Error(`Agent with ID '${id}' not found.`));
      }
      // Re-instantiate based on state
      agent = new Agent(state.config, state.id); 
      // (Assuming Agent constructor can optionally take an ID, we might need to patch agent.ts)
      this.activeAgents.set(id, agent);
    }
    return ok(agent);
  }

  /**
   * Returns a list of all Agents.
   */
  public async listAgents(): Promise<AgentState[]> {
    return await this.storage.list();
  }
}

// Export a default singleton for MVP usage
export const agentManager = new AgentManager();
