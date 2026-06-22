import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AgentController } from './v1/agent.controller';
import { MarketplaceController } from './marketplace/marketplace.controller';
import { ExecutionsController } from './executions/executions.controller';
import { PrismaService } from './prisma.service';
import { PrismaAgentStorage } from './adapters/prisma-agent.storage';
import { PrismaMarketplaceStorage } from './adapters/prisma-marketplace.storage';
import { PrismaExecutionStorage } from './adapters/prisma-execution.storage';
import { AgentManager } from '@stackagent/runtime';

@Module({
  imports: [],
  controllers: [AppController, AgentController, MarketplaceController, ExecutionsController],
  providers: [
    AppService,
    PrismaService,
    PrismaAgentStorage,
    PrismaMarketplaceStorage,
    PrismaExecutionStorage,
    {
      provide: AgentManager,
      useFactory: (agentStorage: PrismaAgentStorage) => new AgentManager(agentStorage),
      inject: [PrismaAgentStorage],
    },
  ],
})
export class AppModule {}
