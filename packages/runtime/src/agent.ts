import { AgentConfig, AgentState, AgentStatus, Result, ok, err, TaskResult, ExecutionIntent } from '@stackagent/types';
import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';

// Define the Zod schema for structured outputs
const ExecutionIntentSchema = z.object({
  actionId: z.string().describe('The ID of the action to perform, e.g., swap, lend'),
  protocolId: z.string().describe('The ID of the protocol to interact with, e.g., alex, zest'),
  parameters: z.record(z.string(), z.unknown()).describe('The parameters required for the action'),
  reasoning: z.string().describe('The explanation for why this action is being taken'),
});

export class Agent {
  private state: AgentState;
  private openai: OpenAI;

  constructor(config: AgentConfig, id?: string) {
    const generateId = () => 
      typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : Math.random().toString(36).substring(2, 15);

    this.state = {
      id: id || generateId(),
      config,
      status: 'IDLE',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Instantiate OpenAI with standard environment variable automatically picked up by SDK
    // Provide a default empty string so the client doesn't throw if we're just testing logic
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'mock-key-for-tests',
    });
  }

  public getState(): AgentState {
    return { ...this.state };
  }

  public start(): void {
    if (this.state.status === 'RUNNING') return;
    this.updateStatus('RUNNING');
  }

  public stop(): void {
    if (this.state.status === 'STOPPED') return;
    this.updateStatus('STOPPED');
  }

  public pause(): void {
    if (this.state.status === 'PAUSED') return;
    this.updateStatus('PAUSED');
  }

  private updateStatus(status: AgentStatus): void {
    this.state.status = status;
    this.state.updatedAt = Date.now();
  }

  /**
   * Orchestrates the agent execution by parsing a task using an LLM.
   * Returns an ExecutionIntent ready to be processed by the Security Engine.
   */
  public async executeTask(taskPrompt: string): Promise<Result<TaskResult, Error>> {
    try {
      if (this.state.status !== 'RUNNING') {
         return err(new Error('Agent must be in RUNNING state to execute tasks.'));
      }

      const systemContext = `
        You are an autonomous agent with the following configuration:
        Name: ${this.state.config.name}
        Role: ${this.state.config.role}
        Allowed Protocols: ${(this.state.config.allowedProtocols || []).join(', ') || 'None'}
        
        ${this.state.config.systemPrompt || ''}
      `;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemContext },
          { role: 'user', content: taskPrompt },
        ],
        response_format: zodResponseFormat(ExecutionIntentSchema, 'execution_intent'),
      });

      const messageContent = completion.choices[0]?.message?.content;
      if (!messageContent) {
        return err(new Error('Failed to retrieve response from LLM.'));
      }

      const intent = JSON.parse(messageContent) as ExecutionIntent;

      if (!intent) {
        return err(new Error('Failed to parse execution intent from LLM.'));
      }

      const taskResult: TaskResult = {
        taskId: `task-${Date.now()}`,
        intent,
        message: 'Task parsed successfully.',
        success: true,
      };

      return ok(taskResult);
    } catch (error) {
      return err(error instanceof Error ? error : new Error('Unknown execution error'));
    }
  }
}
