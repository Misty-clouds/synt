import type { Scenario } from './types';
import { minutesAgo } from './util';

const BEACHHEAD = 'host-07';
const SVC_ACCOUNT = 'svc-backup';
const TARGET_HOSTS = ['host-11', 'host-12', 'host-18', 'host-23'];
const NEW_ADMIN = 'adm-helpdesk2';

export const lateralMovement: Scenario = {
  id: 'lateral_movement',
  title: 'Lateral Movement',
  description:
    'A compromised host makes SMB/RDP connections to multiple internal hosts reusing one service account; a new admin account is created on a downstream host.',
  indexes: ['synt_auth', 'synt_endpoint', 'synt_network'],
  seedEvents: () => {
    const events: Record<string, unknown>[] = [];

    // SMB/RDP connections fanning out from the beachhead.
    TARGET_HOSTS.forEach((dest, i) => {
      events.push({
        index: 'synt_network',
        sourcetype: 'netflow:conn',
        _time: minutesAgo(60 - i * 7),
        src_host: BEACHHEAD,
        dest_host: dest,
        dest_port: i % 2 === 0 ? 445 : 3389,
        protocol: i % 2 === 0 ? 'smb' : 'rdp',
        direction: 'internal',
      });
      // Auth on the target reusing the service account.
      events.push({
        index: 'synt_auth',
        sourcetype: 'auth:login',
        _time: minutesAgo(59 - i * 7),
        action: 'success',
        user: SVC_ACCOUNT,
        src_host: BEACHHEAD,
        dest_host: dest,
        logon_type: i % 2 === 0 ? 'network' : 'remote_interactive',
      });
    });

    // Suspicious remote-exec tooling on the beachhead.
    events.push({
      index: 'synt_endpoint',
      sourcetype: 'endpoint:process',
      _time: minutesAgo(55),
      host: BEACHHEAD,
      user: SVC_ACCOUNT,
      process: 'psexec.exe',
      command_line: `psexec \\\\${TARGET_HOSTS[2]} -u ${SVC_ACCOUNT} cmd`,
      action: 'remote_exec',
    });

    // New admin account created downstream — entrenchment.
    events.push({
      index: 'synt_endpoint',
      sourcetype: 'endpoint:account',
      _time: minutesAgo(20),
      host: TARGET_HOSTS[2],
      created_user: NEW_ADMIN,
      created_by: SVC_ACCOUNT,
      group_added: 'Administrators',
      action: 'account_created',
    });

    return events;
  },
  triggerSignal: {
    id: 'sig_lateral_movement',
    scenarioId: 'lateral_movement',
    source: 'splunk:saved_search:notable',
    title: 'Internal host initiating SMB/RDP to multiple hosts with shared service account',
    severity: 'critical',
    rawEventCount: 30,
    firstSeen: minutesAgo(60),
    entities: [
      { type: 'host', value: BEACHHEAD },
      { type: 'user', value: SVC_ACCOUNT },
    ],
  },
  groundTruth: {
    rootCause:
      'Active lateral movement from beachhead host-07 using svc-backup over SMB/RDP and PsExec, creating a new admin account (adm-helpdesk2) downstream.',
    blastRadius: [
      { type: 'host', value: BEACHHEAD },
      { type: 'user', value: SVC_ACCOUNT },
      { type: 'host', value: 'host-11' },
      { type: 'host', value: 'host-12' },
      { type: 'host', value: 'host-18' },
      { type: 'host', value: 'host-23' },
      { type: 'user', value: NEW_ADMIN },
    ],
    mitre: [
      { id: 'T1021', name: 'Remote Services', tactic: 'Lateral Movement' },
      { id: 'T1078', name: 'Valid Accounts', tactic: 'Defense Evasion' },
      { id: 'T1136', name: 'Create Account', tactic: 'Persistence' },
    ],
  },
};
