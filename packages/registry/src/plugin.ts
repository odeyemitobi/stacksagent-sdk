import { IPlugin, Protocol, ExecutionIntent, Result, TransactionPayload, err } from '@stackagent/types';

/**
 * Base abstract class for authoring third-party StackAgent plugins.
 */
export abstract class BasePlugin implements IPlugin {
  public abstract readonly protocol: Protocol;

  /**
   * Translates the AI's deterministic ExecutionIntent into a Stacks Transaction.
   * Developers must implement this method to encode contract calls and define strict post-conditions.
   */
  public abstract buildTransaction(intent: ExecutionIntent): Promise<Result<TransactionPayload, Error>>;

  /**
   * Helper utility for plugins to gracefully reject unsupported intents.
   */
  protected rejectUnsupportedAction(actionId: string): Result<TransactionPayload, Error> {
    return err(new Error(`Action '${actionId}' is not supported by the ${this.protocol.name} plugin.`));
  }
}
