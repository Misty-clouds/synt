import type { Scenario } from './types';
import { minutesAgo, uid } from './util';

const ATTACK_IPS = ['203.0.113.42', '203.0.113.77', '198.51.100.9'];
const VICTIM_USERS = [
  'j.okafor',
  'a.bello',
  's.mensah',
  'k.adeyemi',
  'r.danjuma',
  'p.eze',
  'm.ibrahim',
  'l.nwosu',
  'c.obi',
  't.balogun',
];
const COMPROMISED_USER = 'j.okafor';
const SUCCESS_IP = '203.0.113.42';

export const credStuffing: Scenario = {
  id: 'cred_stuffing',
  title: 'Credential Stuffing → Account Takeover',
  description:
    'Hundreds of failed logins across many users from a small set of IPs, then a single success for j.okafor from a brand-new IP/geo, followed by an MFA-method change.',
  indexes: ['synt_auth', 'synt_network'],
  seedEvents: () => {
    const events: Record<string, unknown>[] = [];

    // ~240 failed logins spraying many users from a few attacker IPs.
    for (let i = 0; i < 240; i += 1) {
      events.push({
        index: 'synt_auth',
        sourcetype: 'auth:login',
        _time: minutesAgo(95 - i * 0.3),
        action: 'failure',
        reason: 'invalid_credentials',
        user: VICTIM_USERS[i % VICTIM_USERS.length],
        src_ip: ATTACK_IPS[i % ATTACK_IPS.length],
        app: 'sso-portal',
        user_agent: 'python-requests/2.31',
      });
    }

    // The one success — credential stuffing lands on j.okafor.
    events.push({
      index: 'synt_auth',
      sourcetype: 'auth:login',
      _time: minutesAgo(18),
      action: 'success',
      reason: 'ok',
      user: COMPROMISED_USER,
      src_ip: SUCCESS_IP,
      app: 'sso-portal',
      user_agent: 'python-requests/2.31',
    });

    // MFA method change shortly after — attacker entrenching.
    events.push({
      index: 'synt_auth',
      sourcetype: 'auth:mfa',
      _time: minutesAgo(15),
      action: 'mfa_method_change',
      user: COMPROMISED_USER,
      src_ip: SUCCESS_IP,
      old_method: 'totp',
      new_method: 'attacker_totp',
      app: 'sso-portal',
    });

    // Network/geo enrichment: the success IP is a brand-new geo for this user.
    events.push({
      index: 'synt_network',
      sourcetype: 'netflow:geo',
      _time: minutesAgo(18),
      src_ip: SUCCESS_IP,
      country: 'RU',
      asn: 'AS00000 BulletproofHost',
      first_seen_for_user: COMPROMISED_USER,
      is_new_geo: true,
    });

    return events;
  },
  triggerSignal: {
    id: 'sig_cred_stuffing',
    scenarioId: 'cred_stuffing',
    source: 'splunk:saved_search:notable',
    title: 'Spike in failed logins followed by a success from a new geo',
    severity: 'high',
    rawEventCount: 242,
    firstSeen: minutesAgo(95),
    entities: [
      { type: 'ip', value: SUCCESS_IP },
      { type: 'user', value: COMPROMISED_USER },
    ],
  },
  groundTruth: {
    rootCause:
      'Credential-stuffing attack from 203.0.113.0/24 succeeded against j.okafor; attacker then changed the account MFA method.',
    blastRadius: [
      { type: 'user', value: COMPROMISED_USER },
      { type: 'ip', value: SUCCESS_IP },
      { type: 'ip', value: '203.0.113.77' },
      { type: 'ip', value: '198.51.100.9' },
    ],
    mitre: [
      { id: 'T1110.004', name: 'Credential Stuffing', tactic: 'Credential Access' },
      { id: 'T1078', name: 'Valid Accounts', tactic: 'Defense Evasion' },
    ],
  },
};

void uid; // reserved for future per-event ids
