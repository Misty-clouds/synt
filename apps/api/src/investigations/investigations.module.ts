import { Module } from '@nestjs/common';
import { InvestigationsController } from './investigations.controller';

@Module({
  controllers: [InvestigationsController],
})
export class InvestigationsModule {}
