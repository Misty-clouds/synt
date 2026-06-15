import { Module } from '@nestjs/common';
import { CaseFileService } from './casefile.service';
import { StorageService } from './storage';

@Module({
  providers: [CaseFileService, StorageService],
  exports: [CaseFileService],
})
export class CaseFileModule {}
