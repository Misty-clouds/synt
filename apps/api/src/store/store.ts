import type { CaseFile, Investigation, PlaybookAction, TraceEvent } from '@synt/shared';

export interface Store {
  init(): Promise<void>;
  readonly backend: 'memory' | 'mongo';

  createInvestigation(inv: Investigation): Promise<Investigation>;
  getInvestigation(id: string): Promise<Investigation | undefined>;
  listInvestigations(): Promise<Investigation[]>;
  updateInvestigation(id: string, patch: Partial<Investigation>): Promise<Investigation | undefined>;

  appendTrace(ev: TraceEvent): Promise<void>;
  getTrace(investigationId: string): Promise<TraceEvent[]>;

  saveCaseFile(cf: CaseFile): Promise<CaseFile>;
  getCaseFile(id: string): Promise<CaseFile | undefined>;
  getCaseFileByInvestigation(investigationId: string): Promise<CaseFile | undefined>;
  updateAction(
    caseFileId: string,
    actionId: string,
    patch: Partial<PlaybookAction>,
  ): Promise<CaseFile | undefined>;
}

/** Default offline store — everything in memory. Source of truth for SSE replay. */
export class MemoryStore implements Store {
  readonly backend: 'memory' | 'mongo' = 'memory';
  protected investigations = new Map<string, Investigation>();
  protected traces = new Map<string, TraceEvent[]>();
  protected caseFiles = new Map<string, CaseFile>();

  async init(): Promise<void> {}

  async createInvestigation(inv: Investigation): Promise<Investigation> {
    this.investigations.set(inv.id, inv);
    this.traces.set(inv.id, []);
    return inv;
  }

  async getInvestigation(id: string): Promise<Investigation | undefined> {
    return this.investigations.get(id);
  }

  async listInvestigations(): Promise<Investigation[]> {
    return [...this.investigations.values()].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }

  async updateInvestigation(id: string, patch: Partial<Investigation>): Promise<Investigation | undefined> {
    const inv = this.investigations.get(id);
    if (!inv) return undefined;
    const next = { ...inv, ...patch };
    this.investigations.set(id, next);
    return next;
  }

  async appendTrace(ev: TraceEvent): Promise<void> {
    const arr = this.traces.get(ev.investigationId) ?? [];
    arr.push(ev);
    this.traces.set(ev.investigationId, arr);
  }

  async getTrace(investigationId: string): Promise<TraceEvent[]> {
    return this.traces.get(investigationId) ?? [];
  }

  async saveCaseFile(cf: CaseFile): Promise<CaseFile> {
    this.caseFiles.set(cf.id, cf);
    return cf;
  }

  async getCaseFile(id: string): Promise<CaseFile | undefined> {
    return this.caseFiles.get(id);
  }

  async getCaseFileByInvestigation(investigationId: string): Promise<CaseFile | undefined> {
    return [...this.caseFiles.values()].find((c) => c.investigationId === investigationId);
  }

  async updateAction(
    caseFileId: string,
    actionId: string,
    patch: Partial<PlaybookAction>,
  ): Promise<CaseFile | undefined> {
    const cf = this.caseFiles.get(caseFileId);
    if (!cf) return undefined;
    cf.recommendedPlaybook = cf.recommendedPlaybook.map((a) =>
      a.id === actionId ? { ...a, ...patch } : a,
    );
    this.caseFiles.set(caseFileId, cf);
    return cf;
  }
}
