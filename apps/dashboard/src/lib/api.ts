const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export function getApiUrl(): string {
  return API_BASE_URL;
}

/** Turns network failures into a clear message for the UI. */
export function formatApiError(err: unknown): string {
  if (err instanceof TypeError && err.message === 'Failed to fetch') {
    return `Cannot reach the API at ${API_BASE_URL}. Start it with: pnpm --filter api start:dev`;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return 'Unknown API error';
}

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
  } catch (err) {
    throw new Error(formatApiError(err));
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `API error ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export interface ApiAgent {
  id: string;
  name: string;
  role: string;
  status: string;
  createdAt: number;
  updatedAt: number;
  config?: {
    name: string;
    role: string;
    systemPrompt?: string;
    allowedProtocols?: string[];
  };
}

export interface SimulationResultPayload {
  humanReadableDiff?: Array<{ asset: string; amount: number; direction: string }>;
  predictedFee?: number;
  postConditions?: unknown[];
  stxCallParams?: {
    contractAddress: string;
    contractName: string;
    functionName: string;
    functionArgs?: string[];
  };
}

export interface PendingExecutionsResponse {
  items: Array<{
    id: string;
    intentPayload: {
      actionId: string;
      protocolId: string;
      parameters: Record<string, unknown>;
    };
    simulationResult?: SimulationResultPayload;
    agent?: { name: string; role: string };
  }>;
  nextCursor: string | null;
}
