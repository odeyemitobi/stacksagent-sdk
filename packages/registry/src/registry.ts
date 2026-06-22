import { Protocol, IPlugin, Result, ok, err } from '@stackagent/types';
import { alexPlugin } from './plugins/alex';
import { zestPlugin } from './plugins/zest';

export class ProtocolRegistry {
  private plugins: Map<string, IPlugin>;

  constructor(initialPlugins: IPlugin[] = []) {
    this.plugins = new Map();
    for (const plugin of initialPlugins) {
      this.plugins.set(plugin.protocol.id, plugin);
    }
  }

  /**
   * Registers a new plugin dynamically.
   */
  public registerPlugin(plugin: IPlugin): Result<void, Error> {
    if (this.plugins.has(plugin.protocol.id)) {
      return err(new Error(`Plugin for Protocol ID '${plugin.protocol.id}' is already registered.`));
    }
    this.plugins.set(plugin.protocol.id, plugin);
    return ok(undefined);
  }

  /**
   * Removes a plugin by its Protocol ID. Enables hot-swapping and test cleanup.
   */
  public unregisterPlugin(id: string): Result<void, Error> {
    if (!this.plugins.has(id)) {
      return err(new Error(`Plugin for Protocol ID '${id}' is not registered.`));
    }
    this.plugins.delete(id);
    return ok(undefined);
  }

  /**
   * Retrieves a plugin by its Protocol ID.
   */
  public getPlugin(id: string): Result<IPlugin, Error> {
    const plugin = this.plugins.get(id);
    if (!plugin) {
      return err(new Error(`Plugin for Protocol ID '${id}' not found.`));
    }
    return ok(plugin);
  }

  /**
   * Retrieves protocol metadata by ID.
   */
  public getProtocol(id: string): Result<Protocol, Error> {
    const pluginResult = this.getPlugin(id);
    if (!pluginResult.ok) return err(pluginResult.error);
    return ok(pluginResult.value.protocol);
  }

  /**
   * Lists all registered protocol metadata (used by LLM Context).
   */
  public listProtocols(): Protocol[] {
    return Array.from(this.plugins.values()).map(p => p.protocol);
  }
}

// Export a singleton instance pre-loaded with MVP plugins
export const registry = new ProtocolRegistry([alexPlugin, zestPlugin]);
