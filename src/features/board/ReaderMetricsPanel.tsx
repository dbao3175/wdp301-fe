import React, { ChangeEvent, useMemo, useState } from 'react';
import { Database, FileUp, LoaderCircle } from 'lucide-react';
import { apiClient } from '../../api/client';
import { useLanguage } from '../../i18n/LanguageContext';
import { Rating, ReaderMetricInput, Series } from '../../types';
import { canonicalMetricPeriod } from './metricPeriod';

interface ReaderMetricsPanelProps {
  series: Series[];
  ratings: Rating[];
  onChanged: () => void;
}

const emptyEntry = (): ReaderMetricInput => {
  const period = canonicalMetricPeriod('WEEKLY');
  return {
    seriesId: '',
    voteCount: 0,
    ratingScore: 0,
    readerCount: 0,
    cycle: 'WEEKLY',
    ...period,
    sourceFrom: '',
  };
};

const toNumber = (value: unknown, field: string) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${field} must be a non-negative number.`);
  }
  return parsed;
};

const splitCsvLine = (line: string) => {
  const values: string[] = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      values.push(current.trim());
      current = '';
    } else {
      current += character;
    }
  }
  values.push(current.trim());
  return values;
};

export default function ReaderMetricsPanel({
  series,
  ratings,
  onChanged,
}: ReaderMetricsPanelProps) {
  const { t } = useLanguage();
  const [form, setForm] = useState<ReaderMetricInput>(emptyEntry);
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState('');

  const seriesMap = useMemo(() => {
    const map = new Map<string, string>();
    series.forEach((item) => {
      map.set(item._id, item._id);
      map.set(item.title.toLowerCase(), item._id);
    });
    return map;
  }, [series]);

  const validate = (entry: ReaderMetricInput): ReaderMetricInput => {
    if (!entry.seriesId) throw new Error(t('Select a series.'));
    if (!['WEEKLY', 'MONTHLY'].includes(entry.cycle)) {
      throw new Error(t('Cycle must be WEEKLY or MONTHLY.'));
    }
    if (!entry.sourceFrom.trim()) throw new Error(t('Source is required.'));
    if (!entry.periodStart || !entry.periodEnd) throw new Error(t('Period dates are required.'));
    if (entry.periodEnd <= entry.periodStart) {
      throw new Error(t('Period end must be after period start.'));
    }
    const canonicalPeriod = canonicalMetricPeriod(entry.cycle, entry.periodStart);
    if (
      entry.periodStart !== canonicalPeriod.periodStart
      || entry.periodEnd !== canonicalPeriod.periodEnd
    ) {
      throw new Error(t('Period must match the selected weekly or monthly cycle.'));
    }
    const ratingScore = toNumber(entry.ratingScore, 'Rating score');
    if (ratingScore > 5) throw new Error(t('Rating score cannot exceed 5.'));
    return {
      ...entry,
      ...canonicalPeriod,
      voteCount: toNumber(entry.voteCount, 'Vote count'),
      ratingScore,
      readerCount: toNumber(entry.readerCount, 'Reader count'),
      revenue: entry.revenue === undefined
        ? undefined
        : toNumber(entry.revenue, 'Revenue'),
      sourceFrom: entry.sourceFrom.trim(),
    };
  };

  const submit = async () => {
    setSubmitting(true);
    setMessage('');
    try {
      await apiClient.ratings.submit(validate(form));
      setForm(emptyEntry());
      setMessage(t('Reader metrics saved and ranking recalculation requested.'));
      onChanged();
    } catch (err: any) {
      setMessage(t(err.message || 'Reader metrics could not be saved.'));
    } finally {
      setSubmitting(false);
    }
  };

  const resolveImportedEntry = (raw: any): ReaderMetricInput => {
    const titleOrId = String(raw.seriesId || raw.series || raw.seriesTitle || raw.title || '').trim();
    const seriesId = seriesMap.get(titleOrId) || seriesMap.get(titleOrId.toLowerCase()) || '';
    const revenueValue = raw.revenue === '' || raw.revenue === null || raw.revenue === undefined
      ? undefined
      : toNumber(raw.revenue, 'Revenue');
    const cycle = String(raw.cycle || 'WEEKLY').toUpperCase() as ReaderMetricInput['cycle'];
    const period = canonicalMetricPeriod(cycle, String(raw.periodStart || new Date().toISOString().slice(0, 10)));
    return validate({
      seriesId,
      voteCount: toNumber(raw.voteCount ?? raw.votes, 'Vote count'),
      ratingScore: toNumber(raw.ratingScore ?? raw.score, 'Rating score'),
      readerCount: toNumber(raw.readerCount ?? raw.readers, 'Reader count'),
      revenue: revenueValue,
      cycle,
      ...period,
      sourceFrom: String(raw.sourceFrom || raw.source || ''),
    });
  };

  const parseFile = (name: string, text: string) => {
    let rawEntries: any[];
    let firstDataRow = 1;
    if (name.toLowerCase().endsWith('.json')) {
      const parsed = JSON.parse(text);
      rawEntries = Array.isArray(parsed) ? parsed : parsed.entries;
      if (!Array.isArray(rawEntries)) throw new Error(t('JSON must contain an array of entries.'));
    } else if (name.toLowerCase().endsWith('.csv')) {
      const lines = text.split(/\r?\n/).filter((line) => line.trim());
      if (lines.length < 2) throw new Error(t('CSV must contain a header and at least one row.'));
      const headers = splitCsvLine(lines[0]);
      firstDataRow = 2;
      rawEntries = lines.slice(1).map((line) => {
        const values = splitCsvLine(line);
        return headers.reduce<Record<string, string>>((entry, header, index) => {
          entry[header.trim()] = values[index] || '';
          return entry;
        }, {});
      });
    } else {
      throw new Error(t('Only .csv and .json files are supported.'));
    }

    const entries: Array<{ entry: ReaderMetricInput; row: number }> = [];
    const errors: Array<{ row: number; message: string }> = [];
    rawEntries.forEach((raw, index) => {
      const row = firstDataRow + index;
      try {
        entries.push({ entry: resolveImportedEntry(raw), row });
      } catch (err: any) {
        errors.push({ row, message: t(err.message || 'Invalid metric entry.') });
      }
    });
    return { entries, errors };
  };

  const importFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setImporting(true);
    setMessage('');
    let parsed: ReturnType<typeof parseFile> | null = null;
    try {
      parsed = parseFile(file.name, await file.text());
      if (parsed.entries.length === 0) {
        const details = parsed.errors.slice(0, 3)
          .map((error) => t('Row {{row}}: {{message}}', { row: error.row, message: t(error.message) }))
          .join('; ');
        setMessage(`${t('Import stopped: 0 valid rows, {{failed}} failed.', { failed: parsed.errors.length })}${details ? ` ${details}` : ''}`);
        return;
      }

      const result = await apiClient.ratings.import(parsed.entries.map(({ entry }) => entry));
      const backendErrors = result.errors.map((error) => ({
        row: parsed.entries[error.index]?.row ?? error.index + 1,
        message: error.message,
      }));
      const allErrors = [...parsed.errors, ...backendErrors];
      const details = allErrors.slice(0, 3)
        .map((error) => t('Row {{row}}: {{message}}', { row: error.row, message: t(error.message) }))
        .join('; ');
      setMessage(
        t('Import complete: {{succeeded}} succeeded, {{failed}} failed.', { succeeded: result.summary.imported, failed: allErrors.length })
        + (details ? ` ${details}` : ''),
      );
      if (result.summary.imported > 0) onChanged();
    } catch (err: any) {
      const responseErrors = Array.isArray(err.response?.errors) ? err.response.errors : [];
      const backendErrors = responseErrors.map((error: { index: number; message: string }) => ({
        row: parsed?.entries[error.index]?.row ?? error.index + 1,
        message: error.message,
      }));
      const allErrors = [...(parsed?.errors || []), ...backendErrors];
      if (allErrors.length > 0) {
        const details = allErrors.slice(0, 3)
          .map((error) => t('Row {{row}}: {{message}}', { row: error.row, message: t(error.message) }))
          .join('; ');
        setMessage(
          `${t('Import complete: {{succeeded}} succeeded, {{failed}} failed.', { succeeded: err.response?.summary?.imported || 0, failed: allErrors.length })}${details ? ` ${details}` : ''}`,
        );
      } else {
        setMessage(t(err.message || 'Metrics import failed.'));
      }
    } finally {
      setImporting(false);
    }
  };

  const recentRatings = ratings.slice(0, 5);

  return (
    <section className="bg-white border-4 border-ink-black shadow-[4px_4px_0px_#141414]">
      <div className="p-5 border-b-4 border-ink-black">
        <h2 className="font-syne text-lg font-black uppercase flex items-center gap-2">
          <Database className="w-5 h-5 text-[#E63946]" />
          {t('Reader Metrics')}
        </h2>
        <p className="font-mono text-[9px] text-neutral-500 font-bold uppercase mt-1">
          {t('Submit verified cycle data used by weekly and monthly rankings.')}
        </p>
      </div>

      <div className="p-5 space-y-4">
        {message && (
          <div className="p-3 border-2 border-ink-black bg-[#FFF3B0] text-xs font-mono font-bold">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="font-mono text-[9px] font-black uppercase md:col-span-2">
            {t('Series')}
            <select
              value={form.seriesId}
              onChange={(event) => setForm({ ...form, seriesId: event.target.value })}
              className="mt-1 w-full border-2 border-ink-black p-2 bg-white text-xs"
            >
              <option value="">{t('Choose active series...')}</option>
              {series.map((item) => (
                <option key={item._id} value={item._id}>{item.title}</option>
              ))}
            </select>
          </label>

          <label className="font-mono text-[9px] font-black uppercase">
            {t('Cycle')}
            <select
              value={form.cycle}
              onChange={(event) => {
                const cycle = event.target.value as ReaderMetricInput['cycle'];
                setForm({ ...form, cycle, ...canonicalMetricPeriod(cycle) });
              }}
              className="mt-1 w-full border-2 border-ink-black p-2 bg-white text-xs"
            >
              <option value="WEEKLY">{t('Weekly')}</option>
              <option value="MONTHLY">{t('Monthly')}</option>
            </select>
          </label>
          <label className="font-mono text-[9px] font-black uppercase">
            {t('Source')}
            <input
              value={form.sourceFrom}
              onChange={(event) => setForm({ ...form, sourceFrom: event.target.value })}
              placeholder={t('Reader survey, sales report...')}
              className="mt-1 w-full border-2 border-ink-black p-2 text-xs"
            />
          </label>

          <label className="font-mono text-[9px] font-black uppercase">
            {t('Period start')}
            <input
              type="date"
              value={form.periodStart}
              onChange={(event) => setForm({
                ...form,
                ...canonicalMetricPeriod(form.cycle, event.target.value),
              })}
              className="mt-1 w-full border-2 border-ink-black p-2 text-xs"
            />
          </label>
          <label className="font-mono text-[9px] font-black uppercase">
            {t('Period end')}
            <input
              type="date"
              value={form.periodEnd}
              readOnly
              aria-label={t('Period end (calculated from cycle)')}
              className="mt-1 w-full border-2 border-ink-black p-2 text-xs"
            />
          </label>

          {[
            ['voteCount', t('Votes'), '1'],
            ['ratingScore', t('Rating score (0-5)'), '0.1'],
            ['readerCount', t('Readers'), '1'],
            ['revenue', t('Revenue (optional)'), '0.01'],
          ].map(([field, label, step]) => (
            <label key={field} className="font-mono text-[9px] font-black uppercase">
              {label}
              <input
                type="number"
                min="0"
                max={field === 'ratingScore' ? '5' : undefined}
                step={step}
                value={form[field as keyof ReaderMetricInput] ?? ''}
                onChange={(event) => setForm({
                  ...form,
                  [field]: event.target.value === '' && field === 'revenue'
                    ? undefined
                    : Number(event.target.value),
                })}
                className="mt-1 w-full border-2 border-ink-black p-2 text-xs"
              />
            </label>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="bg-[#E63946] text-white border-2 border-ink-black py-3 font-syne text-xs font-black uppercase shadow-[3px_3px_0px_#141414] disabled:opacity-50"
          >
            {submitting ? t('Saving...') : t('Save reader metrics')}
          </button>
          <label className="flex items-center justify-center gap-2 bg-ink-black text-white border-2 border-ink-black py-3 font-syne text-xs font-black uppercase shadow-[3px_3px_0px_#E63946] cursor-pointer">
            {importing ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
            {importing ? t('Importing...') : t('Import CSV / JSON')}
            <input
              type="file"
              accept=".csv,.json,application/json,text/csv"
              onChange={importFile}
              disabled={importing}
              className="sr-only"
            />
          </label>
        </div>

        <p className="text-[9px] text-neutral-500 font-mono">
          {t('Import columns: seriesId (or seriesTitle), voteCount, ratingScore, readerCount, revenue, cycle, periodStart, periodEnd, sourceFrom.')}
        </p>

        {recentRatings.length > 0 && (
          <div className="pt-4 border-t-2 border-ink-black">
            <h3 className="font-mono text-[10px] font-black uppercase mb-2">{t('Recent metric records')}</h3>
            <div className="space-y-2">
              {recentRatings.map((rating) => {
                const ratingSeriesId = typeof rating.seriesId === 'string'
                  ? rating.seriesId
                  : rating.seriesId?._id;
                const ratingSeries = series.find((item) => item._id === ratingSeriesId);
                return (
                  <div key={rating._id} className="border-2 border-neutral-300 p-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-sans text-xs font-bold">{ratingSeries?.title || t('Unknown series')}</p>
                      <p className="font-mono text-[8px] uppercase text-neutral-500">
                        {rating.cycle ? t(rating.cycle) : t('Legacy')} · {rating.sourceFrom || rating.source || t('Unknown source')}
                      </p>
                    </div>
                    <p className="font-mono text-xs font-black">{rating.voteCount.toLocaleString()} {t('votes')}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

