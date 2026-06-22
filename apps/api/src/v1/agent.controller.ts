import { Controller, Get, Post, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { z } from 'zod';
import { AgentManager } from '@stackagent/runtime';


const CreateAgentDto = z.object({
  name: z.string(),
  role: z.string(),
  allowedProtocols: z.array(z.string()).optional(),
});

@ApiTags('agents')
@Controller('v1/agents')
export class AgentController {
  constructor(private readonly agentManager: AgentManager) {}

  @Post()
  @ApiOperation({ summary: 'Create a new AI Agent' })
  @ApiResponse({ status: 201, description: 'Agent created successfully.' })
  async createAgent(@Body() body: unknown) {
    const parsed = CreateAgentDto.safeParse(body);
    if (!parsed.success) {
      throw new HttpException(parsed.error.issues, HttpStatus.BAD_REQUEST);
    }

    const result = await this.agentManager.createAgent(parsed.data);
    if (!result.ok) {
      throw new HttpException(result.error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return result.value.getState();
  }

  @Get()
  @ApiOperation({ summary: 'List all Agents' })
  async listAgents() {
    return await this.agentManager.listAgents();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Agent by ID' })
  async getAgent(@Param('id') id: string) {
    const result = await this.agentManager.getAgent(id);
    if (!result.ok) {
      throw new HttpException(result.error.message, HttpStatus.NOT_FOUND);
    }
    return result.value.getState();
  }
}
