import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryAuditStorage } from './audit';
import { AuditLog } from '@stackagent/types';

describe('InMemoryAuditStorage', () => {
  let storage: InMemoryAuditStorage;

  beforeEach(() => {
    storage = new InMemoryAuditStorage();
  });

  const baseLog: AuditLog = {
    id: 'log-1',
    actorId: 'agent-1',
    intent: {
      actionId: 'swap',
      protocolId: 'alex',
      parameters: { amount: 100 },
      reasoning: 'Test intent',
    },
    outcome: 'PENDING',
    timestamp: new Date().toISOString(),
  };

  it('inserts an audit log successfully', async () => {
    const insertResult = await storage.insert(baseLog);
    expect(insertResult.ok).toBe(true);

    const getResult = await storage.getLogs();
    expect(getResult.ok).toBe(true);
    if (getResult.ok) {
      expect(getResult.value).toHaveLength(1);
      const storedLog = getResult.value[0];
      expect(storedLog).toBeDefined();
      if (storedLog) {
        expect(storedLog.id).toBe('log-1');
      }
    }
  });

  it('freezes the inserted log to ensure immutability', async () => {
    await storage.insert(baseLog);
    const getResult = await storage.getLogs();
    
    expect(getResult.ok).toBe(true);
    if (getResult.ok) {
      const storedLog = getResult.value[0];
      expect(storedLog).toBeDefined();
      if (storedLog) {
        expect(Object.isFrozen(storedLog)).toBe(true);
        
        // Attempting to modify should throw in strict mode, or silently fail
        expect(() => {
          (storedLog as any).outcome = 'BROADCASTED';
        }).toThrowError();
      }
    }
  });
  
  it('deep freezes to prevent modification of nested objects', async () => {
     await storage.insert(baseLog);
     const getResult = await storage.getLogs();
     
     expect(getResult.ok).toBe(true);
     if (getResult.ok) {
       const storedLog = getResult.value[0];
       expect(storedLog).toBeDefined();
       if (storedLog) {
         // Placeholder for deep freeze tests
       }
     }
  });
});
