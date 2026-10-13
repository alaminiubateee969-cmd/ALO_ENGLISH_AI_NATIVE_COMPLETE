/**
 * src/lib/crm/pipeline.ts
 *
 * The lead pipeline as a shape, separated from the screen that draws it.
 *
 * WHY A MODULE FOR THIS
 * ─────────────────────
 * A pipeline board looks like a layout problem and is really a statement about
 * the business: these are the stages a lead moves through, this is the order, and
 * a lead whose status is not on the list belongs somewhere rather than nowhere.
 * Putting the stages and the grouping here means the board cannot quietly drop a
 * lead because its status string was not in the column list — the failure mode
 * that turns a pipeline view into a comfortable lie.
 *
 * The counts are what a manager reads at a glance: how many are waiting, and how
 * long the oldest has been waiting. Nothing here computes a conversion rate: this
 * database records status changes, not the reason for them, and a rate would imply
 * a cohort analysis nobody has done.
 */

export type PipelineLead = {
  id: string;
  name: string;
  status: string;
  source?: string | null;
  country?: string | null;
  intake?: string | null;
  createdAt: string | Date;
};

export type PipelineStage = {
  status: string;
  label: string;
  /** What moving a lead here actually means, for the column header. */
  meaning: string;
};

/** The stages, in the order work moves through them. */
export const PIPELINE_STAGES: readonly PipelineStage[] = [
  { status: 'NEW', label: 'New', meaning: 'Captured, not yet contacted' },
  { status: 'CONTACTED', label: 'Contacted', meaning: 'Someone has spoken to them' },
  { status: 'QUALIFIED', label: 'Qualified', meaning: 'Requirements and budget discussed' },
  { status: 'CONVERTED', label: 'Converted', meaning: 'Became a student' },
  { status: 'LOST', label: 'Lost', meaning: 'Closed without a student record' },
];

export const UNKNOWN_STAGE_STATUS = 'UNRECOGNISED';

export type PipelineColumn = PipelineStage & {
  leads: PipelineLead[];
  count: number;
  /** Age in days of the oldest lead in this column; null when it is empty. */
  oldestAgeDays: number | null;
  /** True for the column that holds leads whose status is not on the list. */
  unexpected?: boolean;
};

export type Pipeline = {
  columns: PipelineColumn[];
  total: number;
  /** True when at least one lead had a status the stage list does not know. */
  hasUnrecognised: boolean;
  note: string;
};

function ageDays(createdAt: string | Date, now: Date): number {
  const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  const ms = now.getTime() - created.getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

/**
 * Group leads into the stages above, plus a column for anything unrecognised.
 *
 * That extra column is the point of the module: a status added to the schema but
 * not to this list would otherwise make leads silently invisible on the board,
 * and the person who added the status would have no reason to look here.
 */
export function buildPipeline(leads: readonly PipelineLead[], now: Date = new Date()): Pipeline {
  const columns: PipelineColumn[] = PIPELINE_STAGES.map((stage) => ({
    ...stage,
    leads: [],
    count: 0,
    oldestAgeDays: null,
  }));

  const byStatus = new Map(columns.map((column) => [column.status, column]));
  const unrecognised: PipelineLead[] = [];

  for (const lead of leads) {
    const column = byStatus.get(lead.status);
    if (column) column.leads.push(lead);
    else unrecognised.push(lead);
  }

  if (unrecognised.length > 0) {
    columns.push({
      status: UNKNOWN_STAGE_STATUS,
      label: 'Unrecognised',
      meaning: 'Status not in the pipeline stage list; these leads need a stage, not a guess',
      leads: unrecognised,
      count: unrecognised.length,
      oldestAgeDays: null,
      unexpected: true,
    });
  }

  for (const column of columns) {
    column.leads.sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
    column.count = column.leads.length;
    column.oldestAgeDays = column.leads.length > 0 ? ageDays(column.leads[0]!.createdAt, now) : null;
  }

  return {
    columns,
    total: leads.length,
    hasUnrecognised: unrecognised.length > 0,
    note: 'Counts and waiting times only. No conversion rate: that would need a cohort analysis this database does not support.',
  };
}

/** Statuses that appear in the data but not in the stage list. */
export function unrecognisedStatuses(leads: readonly PipelineLead[]): string[] {
  const known = new Set(PIPELINE_STAGES.map((stage) => stage.status));
  return [...new Set(leads.map((lead) => lead.status).filter((status) => !known.has(status)))];
}
