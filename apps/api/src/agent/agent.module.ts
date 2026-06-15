import { Module } from '@nestjs/common';
import { CaseFileModule } from '../casefile/casefile.module';
import { AgentRunner } from './agent.runner';

@Module({
  imports: [CaseFileModule],
  providers: [AgentRunner],
  exports: [AgentRunner],
})
export class AgentModule {}
