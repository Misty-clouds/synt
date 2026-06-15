import type { CaseFile, Investigation, PlaybookAction, TraceEvent } from '@synt/shared';
import mongoose, { Schema } from 'mongoose';
import { MemoryStore } from './store';

const flexible = () => new Schema({ _id: false }, { strict: false, _id: false });

/**
 * Mongo-backed store. Keeps the in-memory maps as a fast read/SSE cache (hydrated on
 * init) and persists every write to MongoDB. Activated when MONGODB_URI is set.
 */
export class MongoStore extends MemoryStore {
  readonly backend = 'mongo';
  private conn!: mongoose.Connection;
  // Flexible, strict:false schemas — loose typing keeps mongoose generics out of the way.
  private models!: {
    Investigation: mongoose.Model<any>;
    Trace: mongoose.Model<any>;
    CaseFile: mongoose.Model<any>;
  };

  constructor(private readonly uri: string) {
    super();
  }

  async init(): Promise<void> {
    this.conn = await mongoose.createConnection(this.uri).asPromise();
    this.models = {
      Investigation: this.conn.model('Investigation', flexible(), 'investigations'),
      Trace: this.conn.model('Trace', flexible(), 'traces'),
      CaseFile: this.conn.model('CaseFile', flexible(), 'caseFiles'),
    };
    // Hydrate caches so SSE replay + reads work immediately after a restart.
    for (const doc of await this.models.Investigation.find().lean())
      this.investigations.set(String(doc.id), doc as unknown as Investigation);
    for (const doc of await this.models.Trace.find().lean()) {
      const ev = doc as unknown as TraceEvent;
      const arr = this.traces.get(ev.investigationId) ?? [];
      arr.push(ev);
      this.traces.set(ev.investigationId, arr);
    }
    for (const doc of await this.models.CaseFile.find().lean())
      this.caseFiles.set(String(doc.id), doc as unknown as CaseFile);
  }

  async createInvestigation(inv: Investigation): Promise<Investigation> {
    await super.createInvestigation(inv);
    await this.models.Investigation.create(inv);
    return inv;
  }

  async updateInvestigation(id: string, patch: Partial<Investigation>): Promise<Investigation | undefined> {
    const next = await super.updateInvestigation(id, patch);
    if (next) await this.models.Investigation.updateOne({ id }, { $set: next }, { upsert: true });
    return next;
  }

  async appendTrace(ev: TraceEvent): Promise<void> {
    await super.appendTrace(ev);
    await this.models.Trace.create(ev);
  }

  async saveCaseFile(cf: CaseFile): Promise<CaseFile> {
    await super.saveCaseFile(cf);
    await this.models.CaseFile.updateOne({ id: cf.id }, { $set: cf }, { upsert: true });
    return cf;
  }

  async updateAction(
    caseFileId: string,
    actionId: string,
    patch: Partial<PlaybookAction>,
  ): Promise<CaseFile | undefined> {
    const cf = await super.updateAction(caseFileId, actionId, patch);
    if (cf) await this.models.CaseFile.updateOne({ id: caseFileId }, { $set: cf }, { upsert: true });
    return cf;
  }
}
