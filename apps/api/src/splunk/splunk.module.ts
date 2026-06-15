import { Global, Module } from '@nestjs/common';
import { makeHostedModelClient, makeSplunkClient } from '@synt/splunk';
import { CONFIG, type AppConfig } from '../config';

export const SPLUNK_CLIENT = 'SPLUNK_CLIENT';
export const HOSTED_MODEL = 'HOSTED_MODEL';

@Global()
@Module({
  providers: [
    {
      provide: SPLUNK_CLIENT,
      inject: [CONFIG],
      useFactory: (config: AppConfig) => {
        const client = makeSplunkClient(config);
        // eslint-disable-next-line no-console
        console.log(`[splunk] client = ${client.live ? 'LIVE (MCP)' : 'MOCK (in-memory)'}`);
        return client;
      },
    },
    {
      provide: HOSTED_MODEL,
      inject: [CONFIG],
      useFactory: (config: AppConfig) => makeHostedModelClient(config),
    },
  ],
  exports: [SPLUNK_CLIENT, HOSTED_MODEL],
})
export class SplunkModule {}
