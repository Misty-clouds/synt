import { Global, Module } from '@nestjs/common';
import { CONFIG, loadConfig, type AppConfig } from '../config';
import { MongoStore } from './mongo-store';
import { MemoryStore, type Store } from './store';

export const STORE = 'STORE';

@Global()
@Module({
  providers: [
    { provide: CONFIG, useFactory: loadConfig },
    {
      provide: STORE,
      inject: [CONFIG],
      useFactory: async (config: AppConfig): Promise<Store> => {
        const store: Store = config.MONGODB_URI
          ? new MongoStore(config.MONGODB_URI)
          : new MemoryStore();
        await store.init();
        // eslint-disable-next-line no-console
        console.log(`[store] backend = ${store.backend}`);
        return store;
      },
    },
  ],
  exports: [CONFIG, STORE],
})
export class StoreModule {}
