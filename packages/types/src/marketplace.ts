import { AgentConfig } from './runtime';

export interface PublishedAgentDto {
  id: string;
  authorId: string;
  name: string;
  description: string;
  configPayload: AgentConfig;
  downloads: number;
  createdAt: number;
  updatedAt: number;
}

export interface PublishAgentRequest {
  name: string;
  description: string;
  configPayload: AgentConfig;
}

export interface CloneAgentResponse {
  success: boolean;
  newAgentId: string;
}

export interface PaginatedMarketplaceResponse {
  items: PublishedAgentDto[];
  nextCursor: string | null;
}
