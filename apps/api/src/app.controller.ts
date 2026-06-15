import { Controller, Get, Inject } from '@nestjs/common';
import { CONFIG, type AppConfig } from './config';
import { SPLUNK_CLIENT } from './splunk/splunk.module';
import type { SplunkClient } from '@synt/splunk';
import { STORE } from './store/store.module';
import type { Store } from './store/store';

@Controller()
export class AppController {
  constructor(
    @Inject(CONFIG) private readonly config: AppConfig,
    @Inject(SPLUNK_CLIENT) private readonly splunk: SplunkClient,
    @Inject(STORE) private readonly store: Store,
  ) {}

  @Get()
  health() {
    return {
      name: 'synt-api',
      status: 'ok',
      splunk: this.splunk.live ? 'live-mcp' : 'mock',
      store: this.store.backend,
      mockMode: this.config.USE_MOCK_SPLUNK === 'true',
    };
  }
}
