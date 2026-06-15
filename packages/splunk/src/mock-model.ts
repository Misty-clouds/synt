import { getScenario, scenarios } from '@synt/scenarios';
import type { EntityRef, MitreTechnique, PlaybookAction, ScenarioId } from '@synt/shared';
import type {
  CaseFileDraft,
  EvidenceVerdict,
  HostedModel,
  HypothesisDraft,
} from './types';

interface MockHypo {
  statement: string;
  prior: number;
  confirm: boolean;
  spl: string;
}

interface MockReasoning {
  hypotheses: MockHypo[];
  summary: string;
  playbook: Omit<PlaybookAction, 'id' | 'status'>[];
}

const REASONING: Record<ScenarioId, MockReasoning> = {
  cred_stuffing: {
    hypotheses: [
      {
        statement:
          'A distributed credential-stuffing brute force is targeting many users from a few source IPs',
        prior: 0.6,
        confirm: true,
        spl: 'index=synt_auth action=failure | stats count by src_ip, user | where count > 3',
      },
      {
        statement:
          'The successful login for j.okafor from 203.0.113.42 is an account takeover, not normal activity',
        prior: 0.55,
        confirm: true,
        spl: 'index=synt_auth action=success user=j.okafor src_ip=203.0.113.42',
      },
      {
        statement: "The attacker established persistence by changing j.okafor's MFA method",
        prior: 0.45,
        confirm: true,
        spl: 'index=synt_auth action=mfa_method_change user=j.okafor',
      },
      {
        statement: 'This is benign — j.okafor simply logged in while travelling (false positive)',
        prior: 0.25,
        confirm: false,
        spl: 'index=synt_network is_new_geo=true src_ip=203.0.113.42',
      },
    ],
    summary:
      'A credential-stuffing campaign from the 203.0.113.0/24 range sprayed hundreds of failed logins across many users using a python-requests client. It succeeded against j.okafor from 203.0.113.42 — a brand-new geo (RU, bulletproof ASN) for that user — and the attacker immediately changed the account MFA method to entrench access. This is a confirmed account takeover.',
    playbook: [
      {
        kind: 'disable_user',
        target: 'j.okafor',
        rationale: 'Account is confirmed compromised; disable to halt attacker access.',
        blastRadius: 'low',
        autoApprovable: false,
      },
      {
        kind: 'revoke_sessions',
        target: 'j.okafor',
        rationale: 'Invalidate any active attacker sessions and tokens.',
        blastRadius: 'low',
        autoApprovable: false,
      },
      {
        kind: 'block_ip',
        target: '203.0.113.42',
        rationale: 'Source of the successful takeover and part of the stuffing infrastructure.',
        blastRadius: 'low',
        autoApprovable: false,
      },
    ],
  },
  insider_exfil: {
    hypotheses: [
      {
        statement: 'a.bello accessed an abnormal volume of sensitive files off-hours',
        prior: 0.5,
        confirm: true,
        spl: 'index=synt_cloud action=download user=a.bello off_hours=true | stats sum(bytes) by user',
      },
      {
        statement: 'The files were staged into an archive before exfiltration',
        prior: 0.5,
        confirm: true,
        spl: 'index=synt_endpoint process=7z.exe user=a.bello',
      },
      {
        statement: 'Staged data was exfiltrated to the external domain filedrop-share.io',
        prior: 0.55,
        confirm: true,
        spl: 'index=synt_network user=a.bello dest_domain=filedrop-share.io',
      },
      {
        statement: "This is an external compromise of a.bello's account (failed-auth precursor)",
        prior: 0.2,
        confirm: false,
        spl: 'index=synt_auth user=a.bello action=failure',
      },
    ],
    summary:
      'Privileged user a.bello downloaded an unusual volume of sensitive files (financials, PII, secrets) outside normal hours from cloud storage, staged them locally with 7-Zip on host-finance-04, then uploaded 142MB to the external domain filedrop-share.io. There is no failed authentication — the activity is authorized but clearly anomalous, consistent with insider data exfiltration. Insider cases require human judgement before action.',
    playbook: [
      {
        kind: 'disable_user',
        target: 'a.bello',
        rationale: 'Suspend access pending insider investigation; user is actively exfiltrating.',
        blastRadius: 'medium',
        autoApprovable: false,
      },
      {
        kind: 'block_domain',
        target: 'filedrop-share.io',
        rationale: 'Exfiltration destination; block to stop further upload.',
        blastRadius: 'low',
        autoApprovable: false,
      },
      {
        kind: 'open_ticket',
        target: 'a.bello',
        rationale: 'Insider incident requires HR/legal review by a human analyst.',
        blastRadius: 'low',
        autoApprovable: false,
      },
    ],
  },
  lateral_movement: {
    hypotheses: [
      {
        statement: 'host-07 is the beachhead fanning out over SMB/RDP to multiple internal hosts',
        prior: 0.6,
        confirm: true,
        spl: 'index=synt_network src_host=host-07 protocol=smb | stats dc(dest_host)',
      },
      {
        statement: 'The attacker reuses the svc-backup service account to authenticate laterally',
        prior: 0.55,
        confirm: true,
        spl: 'index=synt_auth user=svc-backup src_host=host-07',
      },
      {
        statement: 'A new admin account was created downstream for persistence',
        prior: 0.5,
        confirm: true,
        spl: 'index=synt_endpoint action=account_created group_added=Administrators',
      },
      {
        statement: 'This is legitimate backup software activity (false positive)',
        prior: 0.25,
        confirm: false,
        spl: 'index=synt_endpoint process=backup-agent.exe host=host-07',
      },
    ],
    summary:
      'Beachhead host-07 is conducting active lateral movement, opening SMB/RDP sessions to host-11, host-12, host-18 and host-23 while reusing the svc-backup service account and PsExec for remote execution. The attacker created a new local administrator account (adm-helpdesk2) on host-18 to persist. This is a live intrusion spreading across the estate.',
    playbook: [
      {
        kind: 'isolate_host',
        target: 'host-07',
        rationale: 'Beachhead of the intrusion; isolate to cut off lateral movement.',
        blastRadius: 'medium',
        autoApprovable: false,
      },
      {
        kind: 'disable_user',
        target: 'svc-backup',
        rationale: 'Service account abused for lateral authentication.',
        blastRadius: 'medium',
        autoApprovable: false,
      },
      {
        kind: 'isolate_host',
        target: 'host-18',
        rationale: 'Downstream host with attacker-created admin account.',
        blastRadius: 'medium',
        autoApprovable: false,
      },
    ],
  },
  ransomware_staging: {
    hypotheses: [
      {
        statement: 'Shadow copies are being deleted to inhibit recovery — a ransomware precursor',
        prior: 0.7,
        confirm: true,
        spl: 'index=synt_endpoint process=vssadmin.exe action=inhibit_recovery',
      },
      {
        statement: 'Files are being mass-renamed with a .lockbit extension (encryption in progress)',
        prior: 0.65,
        confirm: true,
        spl: 'index=synt_endpoint action=file_rename extension_added=.lockbit host=host-19',
      },
      {
        statement: 'host-19 is beaconing to the C2 domain updates-cdn-sync.net',
        prior: 0.6,
        confirm: true,
        spl: 'index=synt_network host=host-19 beacon=true dest_domain=updates-cdn-sync.net',
      },
      {
        statement: 'host-19 is attempting to spread to neighbouring hosts over SMB',
        prior: 0.55,
        confirm: true,
        spl: 'index=synt_network src_host=host-19 action=spread_attempt',
      },
      {
        statement: 'This is a scheduled backup job (false positive)',
        prior: 0.2,
        confirm: false,
        spl: 'index=synt_endpoint process=backup.exe host=host-19',
      },
    ],
    summary:
      'host-19 shows unmistakable pre-detonation ransomware staging: vssadmin deleted all volume shadow copies (inhibiting recovery), svch0st.exe is mass-renaming files with a .lockbit extension, the host is beaconing to the freshly-registered C2 domain updates-cdn-sync.net, and it has begun an SMB spread attempt to host-20. This requires immediate containment — there is no time for deliberation.',
    playbook: [
      {
        kind: 'isolate_host',
        target: 'host-19',
        rationale: 'Active ransomware staging; isolate immediately to prevent detonation and spread.',
        blastRadius: 'high',
        autoApprovable: true,
      },
      {
        kind: 'block_domain',
        target: 'updates-cdn-sync.net',
        rationale: 'C2 channel; block to sever attacker control.',
        blastRadius: 'low',
        autoApprovable: true,
      },
    ],
  },
};

function clamp(n: number, lo = 0.02, hi = 0.98): number {
  return Math.max(lo, Math.min(hi, n));
}

function parseScenario(text: string): ScenarioId | undefined {
  const m = /\[scenario:(\w+)\]/.exec(text);
  const id = m?.[1] as ScenarioId | undefined;
  return id && id in scenarios ? id : undefined;
}

/**
 * Deterministic, scenario-aware stand-in for Splunk hosted models. Used for offline
 * dev, tests, and a reproducible demo path. The agent embeds `[scenario:ID]`,
 * `[task:...]`, `[hyp:i]`, `[rows:N]` markers in prompts; this reads them. A real
 * hosted model ignores the markers and reasons over the same natural-language prompt.
 */
export function makeMockHostedModel(): HostedModel {
  return {
    async complete(prompt: string) {
      const sid = parseScenario(prompt);
      if (sid) return REASONING[sid].summary;
      return 'Mock model response.';
    },

    async json<T>(prompt: string, _instruction: string): Promise<T> {
      const sid = parseScenario(prompt);
      const task = /\[task:(\w+)\]/.exec(prompt)?.[1];

      if (task === 'hypotheses' && sid) {
        const drafts: HypothesisDraft[] = REASONING[sid].hypotheses.map((h) => ({
          statement: h.statement,
          priorConfidence: h.prior,
        }));
        return drafts as unknown as T;
      }

      if (task === 'evaluate' && sid) {
        const i = Number(/\[hyp:(\d+)\]/.exec(prompt)?.[1] ?? 0);
        const rows = Number(/\[rows:(\d+)\]/.exec(prompt)?.[1] ?? 0);
        const h = REASONING[sid].hypotheses[i];
        const confirmed = !!h && h.confirm && rows > 0;
        const verdict: EvidenceVerdict = {
          confirmed,
          posteriorConfidence: confirmed
            ? clamp(h.prior + 0.45)
            : clamp((h?.prior ?? 0.3) - 0.18),
          evidence: confirmed
            ? `${rows} events corroborate this hypothesis.`
            : rows === 0
              ? 'No events match — hypothesis not supported.'
              : 'Events found contradict this benign explanation.',
          pivot: confirmed && i === 0 ? 'Pivot to the compromised entity and trace follow-on activity.' : undefined,
        };
        return verdict as unknown as T;
      }

      if (task === 'casefile' && sid) {
        const sc = getScenario(sid);
        const r = REASONING[sid];
        const draft: CaseFileDraft = {
          title: sc.title,
          summary: r.summary,
          mitre: sc.groundTruth.mitre as MitreTechnique[],
          blastRadius: sc.groundTruth.blastRadius as EntityRef[],
          playbook: r.playbook,
        };
        return draft as unknown as T;
      }

      return {} as T;
    },

    async nlToSpl(question: string, indexes: string[]): Promise<string> {
      const sid = parseScenario(question);
      const i = /\[hyp:(\d+)\]/.exec(question)?.[1];
      if (sid && i !== undefined) {
        const h = REASONING[sid].hypotheses[Number(i)];
        if (h) return h.spl;
      }
      return `index=${indexes[0] ?? 'main'} | head 50`;
    },
  };
}
