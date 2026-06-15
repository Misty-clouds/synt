import { Injectable } from '@nestjs/common';
import type { TraceEvent } from '@synt/shared';
import { Subject, type Observable } from 'rxjs';

/** Per-investigation pub/sub for live TraceEvent streaming over SSE. */
@Injectable()
export class SseGateway {
  private channels = new Map<string, Subject<TraceEvent>>();

  private channel(id: string): Subject<TraceEvent> {
    let s = this.channels.get(id);
    if (!s) {
      s = new Subject<TraceEvent>();
      this.channels.set(id, s);
    }
    return s;
  }

  publish(ev: TraceEvent): void {
    this.channel(ev.investigationId).next(ev);
  }

  stream(investigationId: string): Observable<TraceEvent> {
    return this.channel(investigationId).asObservable();
  }
}
