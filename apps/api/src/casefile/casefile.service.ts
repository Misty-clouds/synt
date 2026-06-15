import { Inject, Injectable, Logger } from '@nestjs/common';
import { getScenario } from '@synt/scenarios';
import type { CaseFile, Investigation, PlaybookAction, TraceEvent } from '@synt/shared';
import type { CaseFileDraft, HostedModel, SplunkClient } from '@synt/splunk';
import { randomUUID } from 'crypto';
import { HOSTED_MODEL, SPLUNK_CLIENT } from '../splunk/splunk.module';
import { SseGateway } from '../sse/sse.gateway';
import { STORE } from '../store/store.module';
import type { Store } from '../store/store';
import { renderCaseFilePdf } from './pdf';
import { StorageService } from './storage';

const HIGH_CONFIDENCE = 0.85;

@Injectable()
export class CaseFileService {
  private readonly log = new Logger('CaseFile');

  constructor(
    @Inject(STORE) private readonly store: Store,
    @Inject(SPLUNK_CLIENT) private readonly splunk: SplunkClient,
    @Inject(HOSTED_MODEL) private readonly model: HostedModel,
    private readonly storage: StorageService,
    private readonly sse: SseGateway,
  ) {}

  /** Compose a CaseFile from the trace, render the PDF, store it, and gate response. */
  async generate(inv: Investigation): Promise<CaseFile> {
    const trace = await this.store.getTrace(inv.id);
    const scenario = getScenario(inv.signal.scenarioId);
    const confidence = this.confidenceFromTrace(trace, inv);

    const draft = await this.model.json<CaseFileDraft>(
      `[scenario:${inv.signal.scenarioId}] [task:casefile] Compose the case file for "${inv.signal.title}".`,
      'Return JSON { title, summary, mitre:[{id,name,tactic}], blastRadius:[{type,value}], playbook:[{kind,target,rationale,blastRadius,autoApprovable}] }.',
    );

    const playbook: PlaybookAction[] = draft.playbook.map((a) => ({
      ...a,
      id: randomUUID(),
      status: 'proposed',
    }));

    const caseFile: CaseFile = {
      id: randomUUID(),
      investigationId: inv.id,
      title: draft.title || inv.signal.title,
      severity: inv.signal.severity,
      confidence,
      summary: draft.summary,
      timeline: this.timelineFromTrace(trace),
      blastRadius: draft.blastRadius.length ? draft.blastRadius : scenario.groundTruth.blastRadius,
      mitre: draft.mitre,
      recommendedPlaybook: playbook,
      createdAt: new Date().toISOString(),
    };

    // Render + store the PDF (R2 or local).
    try {
      const pdf = await renderCaseFilePdf(caseFile);
      caseFile.pdfUrl = await this.storage.putPdf(caseFile.id, pdf);
    } catch (err) {
      this.log.error('PDF generation failed', err as Error);
    }

    await this.store.saveCaseFile(caseFile);
    await this.store.updateInvestigation(inv.id, {
      status: 'awaiting_approval',
      caseFileId: caseFile.id,
    });

    // Confidence-gated autonomy: high-confidence auto-approvable actions self-execute.
    if (confidence >= HIGH_CONFIDENCE) {
      for (const action of playbook.filter((a) => a.autoApprovable)) {
        const res = await this.splunk.respond(action);
        await this.store.updateAction(caseFile.id, action.id, { status: 'executed' });
        this.emit(inv.id, 'action_executed', `Auto-executed ${action.kind} on ${action.target}${res.live ? '' : ' (simulated)'}.`, {
          actionId: action.id,
          live: res.live,
        });
      }
      const fresh = await this.store.getCaseFile(caseFile.id);
      if (fresh && fresh.recommendedPlaybook.every((a) => a.status === 'executed')) {
        await this.store.updateInvestigation(inv.id, { status: 'responded' });
      }
    }

    this.log.log(`case file ${caseFile.id} ready for investigation ${inv.id}`);
    return (await this.store.getCaseFile(caseFile.id)) ?? caseFile;
  }

  private confidenceFromTrace(trace: TraceEvent[], inv: Investigation): number {
    const complete = trace.find((e) => e.type === 'investigation_complete');
    const fromTrace = complete?.data?.topConfidence as number | undefined;
    if (typeof fromTrace === 'number') return fromTrace;
    return inv.hypotheses.reduce((m, h) => Math.max(m, h.posteriorConfidence ?? 0), 0);
  }

  private timelineFromTrace(trace: TraceEvent[]): { ts: string; event: string }[] {
    const keep: TraceEvent['type'][] = [
      'observe',
      'query_running',
      'hypothesis_confirmed',
      'hypothesis_rejected',
      'pivot',
      'action_executed',
      'investigation_complete',
    ];
    return trace
      .filter((e) => keep.includes(e.type))
      .map((e) => ({ ts: e.ts, event: e.message }));
  }

  private emit(investigationId: string, type: TraceEvent['type'], message: string, data?: Record<string, unknown>): void {
    const ev: TraceEvent = {
      id: `${investigationId}_x${Date.now()}`,
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
