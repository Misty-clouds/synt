import type { Scenario } from './types';
import { minutesAgo } from './util';

const USER = 'a.bello';
const HOST = 'host-finance-04';
const EXFIL_DOMAIN = 'filedrop-share.io';
const SENSITIVE_FILES = [
  'Q3_financials.xlsx',
  'customer_pii_export.csv',
  'salary_bands_2026.xlsx',
  'merger_due_diligence.pdf',
  'api_keys_vault_export.json',
];

export const insiderExfil: Scenario = {
  id: 'insider_exfil',
  title: 'Insider Data Exfiltration',
  description:
    'A privileged user accesses an unusual volume of files outside normal hours, stages them in an archive, then uploads to an external domain. No failed auth — looks authorized.',
  indexes: ['synt_endpoint', 'synt_network', 'synt_cloud'],
  seedEvents: () => {
    const events: Record<string, unknown>[] = [];

    // Bulk cloud file access outside normal hours (02:00-ish), authorized session.
    SENSITIVE_FILES.forEach((file, i) => {
      for (let r = 0; r < 6; r += 1) {
        events.push({
          index: 'synt_cloud',
          sourcetype: 'cloud:drive:access',
          _time: minutesAgo(180 - i * 8 - r),
          action: 'download',
          user: USER,
          file_name: file,
          bytes: 4_500_000 + r * 120_000,
          off_hours: true,
          authorized: true,
        });
      }
    });

    // Staging: archive created on endpoint.
    events.push({
      index: 'synt_endpoint',
      sourcetype: 'endpoint:process',
      _time: minutesAgo(120),
      host: HOST,
      user: USER,
      process: '7z.exe',
      command_line: '7z a -p archive.7z C:\\Users\\a.bello\\stage\\*',
      action: 'data_staged',
    });

    // Exfil: large upload to external domain over HTTPS.
    events.push({
      index: 'synt_network',
      sourcetype: 'netflow:http',
      _time: minutesAgo(95),
      host: HOST,
      user: USER,
      dest_domain: EXFIL_DOMAIN,
      direction: 'outbound',
      method: 'POST',
      bytes_out: 142_000_000,
      url: `https://${EXFIL_DOMAIN}/u/anon`,
    });

    return events;
  },
  triggerSignal: {
    id: 'sig_insider_exfil',
    scenarioId: 'insider_exfil',
    source: 'splunk:saved_search:notable',
    title: 'Anomalous off-hours data access by privileged user with large outbound transfer',
    severity: 'high',
    rawEventCount: 32,
    firstSeen: minutesAgo(180),
    entities: [
      { type: 'user', value: USER },
      { type: 'host', value: HOST },
    ],
  },
  groundTruth: {
    rootCause:
      'Authorized-but-anomalous insider exfiltration: a.bello bulk-downloaded sensitive files off-hours, staged them with 7-Zip, and uploaded 142MB to filedrop-share.io.',
    blastRadius: [
      { type: 'user', value: USER },
      { type: 'host', value: HOST },
      { type: 'domain', value: EXFIL_DOMAIN },
    ],
    mitre: [
      { id: 'T1530', name: 'Data from Cloud Storage', tactic: 'Collection' },
      { id: 'T1074', name: 'Data Staged', tactic: 'Collection' },
      { id: 'T1567', name: 'Exfiltration Over Web Service', tactic: 'Exfiltration' },
    ],
  },
};
