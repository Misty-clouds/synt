import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { loadConfig } from './config';

async function bootstrap() {
  const config = loadConfig();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({ origin: config.WEB_ORIGIN === '*' ? true : config.WEB_ORIGIN });

  // Serve locally-stored PDF case files (when R2 is not configured).
  app.useStaticAssets(join(process.cwd(), 'storage'), { prefix: '/' });

  await app.listen(config.PORT);
  // eslint-disable-next-line no-console
  console.log(`Synt API on http://localhost:${config.PORT}  (mock=${config.USE_MOCK_SPLUNK})`);
}
void bootstrap();
