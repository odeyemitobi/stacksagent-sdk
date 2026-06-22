import { AuditLog, Result, ok, err } from '@stackagent/types';

export interface IAuditStorage {
  insert(log: AuditLog): Promise<Result<void, Error>>;
  getLogs(): Promise<Result<AuditLog[], Error>>;
}

export class InMemoryAuditStorage implements IAuditStorage {
  private logs: AuditLog[] = [];

  public async insert(log: AuditLog): Promise<Result<void, Error>> {
    try {
      // Create a deep copy and freeze it to ensure immutability
      const frozenLog = Object.freeze(JSON.parse(JSON.stringify(log)));
      this.logs.push(frozenLog);
      return ok(undefined);
    } catch (e) {
      return err(e instanceof Error ? e : new Error('Failed to insert audit log'));
    }
  }

  public async getLogs(): Promise<Result<AuditLog[], Error>> {
    // Return a shallow copy of the array containing the frozen objects
    return ok([...this.logs]);
  }
}
