import { Module } from '@nestjs/common';
import { AgentModule } from '../agent/agent.module';
import { TriggerController } from './trigger.controller';
import { TriggerService } from './trigger.service';

@Module({
  imports: [AgentModule],
  controllers: [TriggerController],
  providers: [TriggerService],
})
export class TriggerModule {}
