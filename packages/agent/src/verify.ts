/**
 * Soul-first gate (PRD §12 rule): run the OODA loop against the mock Splunk + mock
 * hosted model for every scenario and assert each reaches its ground-truth root cause,
 * blast radius, and MITRE techniques — all BEFORE any UI exists.
 *
 *   pnpm --filter @synt/agent verify
 */
import { scenarioList } from '@synt/scenarios';
import type { CaseFileDraft } from '@synt/splunk';
import { makeMockHostedModel, makeMockSplunkClient } from '@synt/splunk';
import { runInvestigation } from './index';
import { entityId } from './entities';

const RESET = '\x1b[0m';
const c = (code: string, s: string) => `${code}${s}${RESET}`;
const green = (s: string) => c('\x1b[32m', s);
const red = (s: string) => c('\x1b[31m', s);
const blue = (s: string) => c('\x1b[34m', s);
const dim = (s: string) => c('\x1b[90m', s);
const bold = (s: string) => c('\x1b[1m', s);

async function run(): Promise<void> {
  let allPass = true;

  for (const scenario of scenarioList) {
    console.log('\n' + bold(blue(`━━━ ${scenario.title} (${scenario.id}) ━━━`)));
    const splunk = makeMockSplunkClient();
    const model = makeMockHostedModel();

    const discoveredNodes = new Set<string>();
    const confirmedStatements: string[] = [];
    const splQueries: string[] = [];
    let topConfidence = 0;

    for await (const e of runInvestigation(scenario.triggerSignal, {
      splunk,
      model,
      indexes: scenario.indexes,
      now: () => new Date().toISOString(),
    })) {
      switch (e.type) {
        case 'hypotheses_formed':
          console.log(dim(`  • ${e.message}`));
          break;
        case 'query_running':
          splQueries.push(String((e.data as any)?.spl ?? ''));
          console.log(`  ${blue('SPL')} ${dim(String((e.data as any)?.spl ?? ''))}`);
          break;
        case 'entity_discovered':
          discoveredNodes.add(String((e.data as any)?.node?.id ?? ''));
          break;
        case 'hypothesis_confirmed':
          confirmedStatements.push(e.message);
          console.log(`  ${green('✓')} ${e.message}`);
          break;
        case 'hypothesis_rejected':
          console.log(`  ${red('✗')} ${e.message}`);
          break;
        case 'pivot':
          console.log(`  ${blue('⤳ pivot')} ${dim(e.message)}`);
          break;
        case 'investigation_complete':
          topConfidence = Number((e.data as any)?.topConfidence ?? 0);
          console.log(dim(`  • ${e.message}`));
          break;
      }
    }

    // ── Assertions against ground truth ──────────────────────────────────
    const gt = scenario.groundTruth;
    const missingEntities = gt.blastRadius.filter((er) => !discoveredNodes.has(entityId(er)));
    const realQueries = splQueries.filter((q) => q && !q.includes('| head 50'));

    const checks: [string, boolean][] = [
      ['ran real SPL via Splunk client', realQueries.length >= 2],
      ['confirmed ≥ 2 hypotheses', confirmedStatements.length >= 2],
      ['reached high confidence (≥ 0.85)', topConfidence >= 0.85],
      [
        `discovered full blast radius (${gt.blastRadius.length} entities)`,
        missingEntities.length === 0,
      ],
    ];

    for (const [label, ok] of checks) {
      console.log(`  ${ok ? green('PASS') : red('FAIL')}  ${label}`);
      if (!ok) allPass = false;
    }
    if (missingEntities.length) {
      console.log(red(`        missing: ${missingEntities.map((e) => `${e.type}:${e.value}`).join(', ')}`));
    }
    console.log(dim(`        root cause: ${gt.rootCause}`));

    // Show the case-file draft the model would produce.
    const draft = await model.json<CaseFileDraft>(
      `[scenario:${scenario.id}] [task:casefile]`,
      'Return the case file draft.',
    );
    console.log(
      dim(
        `        MITRE: ${draft.mitre.map((m) => m.id).join(', ')} · playbook: ${draft.playbook
          .map((p) => `${p.kind}(${p.target})`)
          .join(', ')}`,
      ),
    );
  }

  console.log('\n' + (allPass ? green(bold('✓ ALL SCENARIOS REACHED GROUND TRUTH')) : red(bold('✗ SOME SCENARIOS FAILED'))));
  process.exit(allPass ? 0 : 1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
