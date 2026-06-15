import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { CONFIG, type AppConfig } from '../config';
import { Inject } from '@nestjs/common';

/**
 * Stores generated PDF case files. Uses Cloudflare R2 when configured; otherwise
 * falls back to local disk served by the API at /casefiles/<id>.pdf (offline demo).
 */
@Injectable()
export class StorageService {
  private readonly log = new Logger('Storage');
  private s3?: S3Client;
  readonly localDir = join(process.cwd(), 'storage', 'casefiles');

  constructor(@Inject(CONFIG) private readonly config: AppConfig) {
    if (config.R2_ACCOUNT_ID && config.R2_ACCESS_KEY_ID && config.R2_SECRET_ACCESS_KEY) {
      this.s3 = new S3Client({
        region: 'auto',
        endpoint: `https://${config.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: config.R2_ACCESS_KEY_ID,
          secretAccessKey: config.R2_SECRET_ACCESS_KEY,
        },
      });
    }
  }

  get usingR2(): boolean {
    return !!this.s3;
  }

  async putPdf(id: string, body: Buffer): Promise<string> {
    const key = `casefiles/${id}.pdf`;
    if (this.s3) {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.config.R2_BUCKET,
          Key: key,
          Body: body,
          ContentType: 'application/pdf',
        }),
      );
      this.log.log(`uploaded ${key} to R2`);
      return `https://${this.config.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${this.config.R2_BUCKET}/${key}`;
    }
    await fs.mkdir(this.localDir, { recursive: true });
    await fs.writeFile(join(this.localDir, `${id}.pdf`), body);
    this.log.log(`wrote ${id}.pdf to local storage`);
    return `${this.config.PUBLIC_BASE_URL}/casefiles/${id}.pdf`;
  }
}
