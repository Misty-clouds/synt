import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { InvestigationsModule } from './investigations/investigations.module';
import { NlModule } from './nl/nl.module';
import { ResponseModule } from './response/response.module';
import { SplunkModule } from './splunk/splunk.module';
import { SseModule } from './sse/sse.module';
import { StoreModule } from './store/store.module';
import { TriggerModule } from './trigger/trigger.module';

@Module({
  imports: [
    StoreModule,
    SplunkModule,
    SseModule,
    TriggerModule,
    InvestigationsModule,
    ResponseModule,
    NlModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
