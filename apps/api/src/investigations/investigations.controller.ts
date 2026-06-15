import { Controller, Get, Inject, NotFoundException, Param, Sse, type MessageEvent } from '@nestjs/common';
import type { TraceEvent } from '@synt/shared';
import { concat, defer, from, map, mergeMap, type Observable } from 'rxjs';
import { SseGateway } from '../sse/sse.gateway';
import { STORE } from '../store/store.module';
import type { Store } from '../store/store';

@Controller('investigations')
export class InvestigationsController {
  constructor(
    @Inject(STORE) private readonly store: Store,
    private readonly sse: SseGateway,
  ) {}

  @Get()
  list() {
    return this.store.listInvestigations();
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const inv = await this.store.getInvestigation(id);
    if (!inv) throw new NotFoundException(`Investigation ${id} not found`);
    return inv;
  }

  @Get(':id/trace')
  trace(@Param('id') id: string) {
    return this.store.getTrace(id);
  }

  @Get(':id/case')
  async caseFile(@Param('id') id: string) {
    const cf = await this.store.getCaseFileByInvestigation(id);
    if (!cf) throw new NotFoundException(`No case file for investigation ${id} yet`);
    return cf;
  }

  /** Live Reasoning Theatre feed: replay persisted trace, then tail live events. */
  @Sse(':id/stream')
  stream(@Param('id') id: string): Observable<MessageEvent> {
    const replay$ = defer(() => this.store.getTrace(id)).pipe(mergeMap((events) => from(events)));
    return concat(replay$, this.sse.stream(id)).pipe(map((ev: TraceEvent) => ({ data: ev as object })));
  }
}
