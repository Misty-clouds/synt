import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { CaseFile, TraceEvent } from '@synt/shared';
import type { SplunkClient } from '@synt/splunk';
import { SPLUNK_CLIENT } from '../splunk/splunk.module';
import { SseGateway } from '../sse/sse.gateway';
import { STORE } from '../store/store.module';
import type { Store } from '../store/store';

@Injectable()
export class ResponseService {
  constructor(
    @Inject(STORE) private readonly store: Store,
    @Inject(SPLUNK_CLIENT) private readonly splunk: SplunkClient,
    private readonly sse: SseGateway,
  ) {}

  async approve(investigationId: string, actionId: string): Promise<CaseFile> {
    const { caseFile, action } = await this.locate(investigationId, actionId);
    await this.store.updateAction(caseFile.id, actionId, { status: 'approved' });
    const res = await this.splunk.respond(action);
    await this.store.updateAction(caseFile.id, actionId, { status: 'executed' });
    this.emit(investigationId, 'action_executed', `Analyst approved ${action.kind} on ${action.target}${res.live ? '' : ' (simulated)'}.`, {
      actionId,
      live: res.live,
    });

    const fresh = (await this.store.getCaseFile(caseFile.id))!;
    if (fresh.recommendedPlaybook.every((a) => a.status === 'executed' || a.status === 'rejected')) {
      await this.store.updateInvestigation(investigationId, { status: 'responded' });
    }
    return fresh;
  }

  async reject(investigationId: string, actionId: string): Promise<CaseFile> {
    const { caseFile } = await this.locate(investigationId, actionId);
    const updated = await this.store.updateAction(caseFile.id, actionId, { status: 'rejected' });
    return updated!;
  }

  private async locate(investigationId: string, actionId: string) {
    const caseFile = await this.store.getCaseFileByInvestigation(investigationId);
    if (!caseFile) throw new NotFoundException(`No case file for investigation ${investigationId}`);
    const action = caseFile.recommendedPlaybook.find((a) => a.id === actionId);
    if (!action) throw new NotFoundException(`Action ${actionId} not found`);
    return { caseFile, action };
  }

  private emit(investigationId: string, type: TraceEvent['type'], message: string, data?: Record<string, unknown>): void {
    const ev: TraceEvent = {
      id: `${investigationId}_r${Date.now()}`,
      investigationId,
      ts: new Date().toISOString(),
      type,
      message,
      data,
    };
    void this.store.appendTrace(ev);
    this.sse.publish(ev);
  }
}
