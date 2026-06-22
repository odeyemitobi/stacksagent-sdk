export type AgentStatus = 'IDLE' | 'RUNNING' | 'PAUSED' | 'STOPPED';

export interface AgentConfig {
  name: string;
  role: string; // e.g., "Treasury Manager", "Yield Farmer"
  systemPrompt?: string; // Prepares the state for the LLM integration
  allowedProtocols?: string[]; // Allowed protocol IDs from the Registry
}

export interface AgentState {
  id: string;
  config: AgentConfig;
  status: AgentStatus;
  createdAt: number;
  updatedAt: number;
}
