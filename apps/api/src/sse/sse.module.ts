import { Global, Module } from '@nestjs/common';
import { SseGateway } from './sse.gateway';

@Global()
@Module({
  providers: [SseGateway],
  exports: [SseGateway],
})
export class SseModule {}
