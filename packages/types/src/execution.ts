export interface ExecutionIntent {
  actionId: string; // e.g. "swap", "lend"
  protocolId: string; // e.g. "alex", "zest"
  parameters: Record<string, unknown>;
  reasoning: string; // The LLM's explanation for this intent
}

export interface TaskResult {
  taskId: string;
  intent?: ExecutionIntent;
  message: string;
  success: boolean;
}
