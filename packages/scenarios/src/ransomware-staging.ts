import type { Scenario } from './types';
import { minutesAgo, secondsAgo } from './util';

const HOST = 'host-19';
const C2_DOMAIN = 'updates-cdn-sync.net';

export const ransomwareStaging: Scenario = {
  id: 'ransomware_staging',
  title: 'Ransomware Staging',
  description:
    'Shadow-copy deletion, a mass file-rename/encryption pattern, beaconing to a C2 domain, and attempts to spread — pre-detonation ransomware staging.',
  indexes: ['synt_endpoint', 'synt_network'],
  seedEvents: () => {
    const events: Record<string, unknown>[] = [];

    // Inhibit recovery: delete volume shadow copies.
    events.push({
      index: 'synt_endpoint',
      sourcetype: 'endpoint:process',
      _time: minutesAgo(6),
      host: HOST,
      user: 'SYSTEM',
      process: 'vssadmin.exe',
      command_line: 'vssadmin delete shadows /all /quiet',
      action: 'inhibit_recovery',
    });

    // C2 beaconing — regular outbound to a freshly registered domain.
    for (let i = 0; i < 8; i += 1) {
      events.push({
        index: 'synt_network',
        sourcetype: 'netflow:dns',
        _time: secondsAgo(300 - i * 30),
        host: HOST,
        query: C2_DOMAIN,
        dest_domain: C2_DOMAIN,
        direction: 'outbound',
        bytes_out: 512 + i * 8,
        beacon: true,
      });
    }

    // Mass file rename/encryption pattern.
    for (let i = 0; i < 40; i += 1) {
      events.push({
        index: 'synt_endpoint',
        sourcetype: 'endpoint:file',
        _time: secondsAgo(180 - i * 3),
        host: HOST,
        process: 'svch0st.exe',
        action: 'file_rename',
        file_name: `document_${i}.docx`,
        new_file_name: `document_${i}.docx.lockbit`,
        extension_added: '.lockbit',
      });
    }

    // Attempt to spread to a neighbor.
    events.push({
      index: 'synt_network',
      sourcetype: 'netflow:conn',
      _time: secondsAgo(60),
      src_host: HOST,
      dest_host: 'host-20',
      dest_port: 445,
      protocol: 'smb',
      action: 'spread_attempt',
    });

    return events;
  },
  triggerSignal: {
    id: 'sig_ransomware_staging',
    scenarioId: 'ransomware_staging',
    source: 'splunk:saved_search:notable',
    title: 'Shadow-copy deletion + mass file rename + C2 beaconing on host-19',
    severity: 'critical',
    rawEventCount: 57,
    firstSeen: minutesAgo(6),
    entities: [
      { type: 'host', value: HOST },
      { type: 'domain', value: C2_DOMAIN },
    ],
  },
  groundTruth: {
    rootCause:
      'Pre-detonation ransomware staging on host-19: shadow copies deleted, files being renamed with a .lockbit extension by svch0st.exe, beaconing to C2 updates-cdn-sync.net, and an SMB spread attempt to host-20.',
    blastRadius: [
      { type: 'host', value: HOST },
      { type: 'domain', value: C2_DOMAIN },
      { type: 'host', value: 'host-20' },
    ],
    mitre: [
      { id: 'T1490', name: 'Inhibit System Recovery', tactic: 'Impact' },
      { id: 'T1486', name: 'Data Encrypted for Impact', tactic: 'Impact' },
      { id: 'T1071', name: 'Application Layer Protocol', tactic: 'Command and Control' },
    ],
  },
};
