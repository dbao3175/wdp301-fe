import { PubSchedule } from '../../types';

export interface MetricPeriod {
  periodStart: string;
  periodEnd: string;
}

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

export const canonicalMetricPeriod = (
  cycle: PubSchedule,
  anchor: string | Date = new Date(),
): MetricPeriod => {
  const parsedAnchor = typeof anchor === 'string'
    ? new Date(`${anchor}T00:00:00.000Z`)
    : new Date(anchor);
  const date = Number.isNaN(parsedAnchor.getTime()) ? new Date() : parsedAnchor;

  if (cycle === 'WEEKLY') {
    const day = date.getUTCDay();
    const daysSinceMonday = day === 0 ? 6 : day - 1;
    const start = new Date(Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate() - daysSinceMonday,
    ));
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 7);
    return { periodStart: toIsoDate(start), periodEnd: toIsoDate(end) };
  }

  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
  return { periodStart: toIsoDate(start), periodEnd: toIsoDate(end) };
};
