import type { CaseFile } from '@synt/shared';
import PDFDocument from 'pdfkit';

const BRAND = '#0055FF';
const INK = '#0A0A0A';
const MUTED = '#6B7280';
const HAIR = '#E5E7EB';
const SEV_COLOR: Record<string, string> = {
  critical: '#DC2626',
  high: '#EA580C',
  medium: '#CA8A04',
  low: '#16A34A',
};

/** Render a polished PDF case file (PRD §10) to a Buffer. */
export function renderCaseFilePdf(cf: CaseFile): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 48 });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c as Buffer));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const width = right - left;

    // ── Header band ──────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 96).fill(INK);
    doc
      .fillColor('#FFFFFF')
      .fontSize(22)
      .font('Helvetica-Bold')
      .text('SYNT', left, 30, { continued: true })
      .fillColor(BRAND)
      .text(' /', { continued: true })
      .fillColor('#9CA3AF')
      .fontSize(11)
      .font('Helvetica')
      .text('  Autonomous SOC Analyst', { baseline: 'bottom' });
    doc
      .fillColor('#9CA3AF')
      .fontSize(9)
      .text(`Case ${cf.id}`, left, 62)
      .text(`Generated ${new Date(cf.createdAt).toUTCString()}`, left, 74);

    // Severity + confidence pills (right aligned in band)
    const sev = SEV_COLOR[cf.severity] ?? MUTED;
    pill(doc, right - 150, 34, 70, cf.severity.toUpperCase(), sev);
    pill(doc, right - 74, 34, 74, `${Math.round(cf.confidence * 100)}% CONF`, BRAND);

    doc.y = 120;
    doc.fillColor(INK).font('Helvetica-Bold').fontSize(16).text(cf.title, left, doc.y);
    doc.moveDown(0.8);

    section(doc, 'Executive Summary');
    doc.fillColor('#111827').font('Helvetica').fontSize(10.5).text(cf.summary, { width, lineGap: 2 });
    doc.moveDown(0.8);

    // ── Timeline ─────────────────────────────────────────────────────────
    section(doc, 'Timeline');
    cf.timeline.forEach((t) => {
      ensureSpace(doc, 18);
      const y = doc.y;
      doc.fillColor(MUTED).font('Helvetica').fontSize(8.5).text(fmtTime(t.ts), left, y, { width: 110 });
      doc.fillColor('#111827').fontSize(9.5).text(t.event, left + 120, y, { width: width - 120 });
      doc.moveDown(0.3);
    });
    doc.moveDown(0.6);

    // ── Blast radius ─────────────────────────────────────────────────────
    section(doc, 'Blast Radius');
    const chips = cf.blastRadius.map((e) => `${e.type}: ${e.value}`);
    doc.font('Helvetica').fontSize(9.5).fillColor('#111827').text(chips.join('   •   '), { width });
    doc.moveDown(0.8);

    // ── MITRE ────────────────────────────────────────────────────────────
    section(doc, 'MITRE ATT&CK');
    cf.mitre.forEach((m) => {
      ensureSpace(doc, 16);
      const y = doc.y;
      doc.fillColor(BRAND).font('Helvetica-Bold').fontSize(9.5).text(m.id, left, y, { width: 80 });
      doc.fillColor('#111827').font('Helvetica').text(m.name, left + 86, y, { width: 200 });
      doc.fillColor(MUTED).text(m.tactic, left + 290, y, { width: width - 290 });
      doc.moveDown(0.3);
    });
    doc.moveDown(0.6);

    // ── Playbook ─────────────────────────────────────────────────────────
    section(doc, 'Recommended Response Playbook');
    cf.recommendedPlaybook.forEach((a) => {
      ensureSpace(doc, 34);
      const y = doc.y;
      doc.fillColor(INK).font('Helvetica-Bold').fontSize(10).text(`${a.kind} → ${a.target}`, left, y);
      const tag = a.status === 'executed' ? 'EXECUTED' : a.autoApprovable ? 'AUTO-ELIGIBLE' : 'NEEDS APPROVAL';
      const tagColor = a.status === 'executed' ? '#16A34A' : a.autoApprovable ? BRAND : MUTED;
      doc.fillColor(tagColor).font('Helvetica-Bold').fontSize(8).text(tag, left + 320, y, { width: width - 320, align: 'right' });
      doc.fillColor('#374151').font('Helvetica').fontSize(9).text(a.rationale, left, doc.y + 1, { width });
      doc.fillColor(MUTED).fontSize(8).text(`blast radius: ${a.blastRadius}`, { width });
      doc.moveDown(0.5);
    });

    // ── Footer ───────────────────────────────────────────────────────────
    doc
      .fillColor(MUTED)
      .font('Helvetica')
      .fontSize(8)
      .text('Generated autonomously by Synt • Splunk Agentic Ops', left, doc.page.height - 60, {
        width,
        align: 'center',
      });

    doc.end();
  });
}

function section(doc: PDFKit.PDFDocument, title: string): void {
  ensureSpace(doc, 30);
  doc.moveDown(0.2);
  doc.fillColor('#0A0A0A').font('Helvetica-Bold').fontSize(11).text(title);
  const y = doc.y + 2;
  doc.moveTo(doc.page.margins.left, y).lineTo(doc.page.width - doc.page.margins.right, y).strokeColor(HAIR).lineWidth(1).stroke();
  doc.moveDown(0.5);
}

function pill(doc: PDFKit.PDFDocument, x: number, y: number, w: number, label: string, color: string): void {
  doc.roundedRect(x, y, w, 16, 8).fill(color);
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(7.5).text(label, x, y + 4.5, { width: w, align: 'center' });
}

function ensureSpace(doc: PDFKit.PDFDocument, needed: number): void {
  if (doc.y + needed > doc.page.height - doc.page.margins.bottom) doc.addPage();
}

function fmtTime(ts: string): string {
  const d = new Date(ts);
  return isNaN(d.getTime()) ? ts : d.toISOString().replace('T', ' ').slice(0, 19) + 'Z';
}
