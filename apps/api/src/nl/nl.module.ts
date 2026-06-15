import { Module } from '@nestjs/common';
import { NlController } from './nl.controller';
import { NlService } from './nl.service';

@Module({
  controllers: [NlController],
  providers: [NlService],
})
export class NlModule {}
