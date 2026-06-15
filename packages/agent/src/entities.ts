import type { EntityRef, EntityType, SplunkRow } from '@synt/shared';

/** Splunk field → entity type. Generic so it works against real Splunk results too. */
const FIELD_MAP: Record<string, EntityType> = {
  user: 'user',
  src_user: 'user',
  created_user: 'user',
  created_by: 'user',
  host: 'host',
  src_host: 'host',
  dest_host: 'host',
  src_ip: 'ip',
  dest_ip: 'ip',
  ip: 'ip',
  dest_domain: 'domain',
  domain: 'domain',
  query: 'domain',
  process: 'process',
  file_name: 'file',
  new_file_name: 'file',
};

export interface ExtractedEntity extends EntityRef {
  field: string;
}

export function entityId(e: EntityRef): string {
  return `${e.type}:${e.value}`;
}

/** Pull recognizable entities out of a set of result rows, de-duplicated. */
export function extractEntities(rows: SplunkRow[]): ExtractedEntity[] {
  const seen = new Set<string>();
  const out: ExtractedEntity[] = [];
  for (const row of rows) {
    for (const [field, type] of Object.entries(FIELD_MAP)) {
      const raw = row[field];
      if (raw === undefined || raw === null || raw === '') continue;
      const value = String(raw);
      const id = `${type}:${value}`;
      if (seen.has(id)) continue;
      seen.add(id);
      out.push({ type, value, field });
    }
  }
  return out;
}
