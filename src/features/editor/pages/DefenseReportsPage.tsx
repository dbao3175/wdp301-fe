import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BarChart3, Send, Shield, ShieldCheck } from 'lucide-react';
import { apiClient } from '../../../api/client';
import { useLanguage } from '../../../i18n/LanguageContext';
import { ErrorState, LoadingState, StatusBadge } from '../components/common/States';

const emptyForm = {
  seriesId: '',
  title: '',
  defenseArguments: '',
  readerGrowth: '',
  improvementPlan: '',
};

export const DefenseReportsPage: React.FC = () => {
  const { language } = useLanguage();
  const vi = language === 'vi';
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');

  const reportsQuery = useQuery({
    queryKey: ['defense-reports'],
    queryFn: () => apiClient.defenseReports.getAll(),
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });
  const seriesQuery = useQuery({
    queryKey: ['editor-my-series-defense'],
    queryFn: () => apiClient.editor.getMySeries(),
    refetchInterval: 10000,
  });

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['defense-reports'] });
  };

  const createMutation = useMutation({
    mutationFn: () => apiClient.defenseReports.create(form),
    onSuccess: async () => {
      setForm(emptyForm);
      setMessage(vi ? '?? l?u h? s? b?o v? ? tr?ng th?i nh?p.' : 'Defense dossier saved as draft.');
      await refresh();
    },
    onError: (error: Error) => setMessage(error.message),
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => apiClient.defenseReports.submit(id),
    onSuccess: async () => {
      setMessage(vi ? '?? g?i h? s? cho H?i ??ng.' : 'Dossier submitted to the Board.');
      await refresh();
    },
    onError: (error: Error) => setMessage(error.message),
  });

  if (reportsQuery.isLoading || seriesQuery.isLoading) {
    return <LoadingState message={vi ? '?ang t?i h? s? b?o v?...' : 'Loading defense dossiers...'} />;
  }
  if (reportsQuery.error || seriesQuery.error) {
    return <ErrorState onRetry={() => { reportsQuery.refetch(); seriesQuery.refetch(); }} />;
  }

  const reports = reportsQuery.data || [];
  const series = seriesQuery.data || [];
  const canCreate = Boolean(
    form.seriesId &&
    form.title.trim() &&
    form.defenseArguments.trim(),
  );

  return (
    <div className="space-y-6">
      <header className="border-b-4 border-ink-black pb-4">
        <div className="flex items-center gap-3">
          <span className="border-2 border-ink-black bg-[#E63946] p-3 text-white shadow-[3px_3px_0_#141414]">
            <Shield className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-syne text-2xl font-black uppercase">
              {vi ? 'H? s? b?o v? series' : 'Series defense dossiers'}
            </h1>
            <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
              {vi ? 'T?ng h?p ti?n ??, s? li?u v? k? ho?ch ?? tr?nh H?i ??ng' : 'Evidence, metrics and improvement plan for Board review'}
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-4 border-4 border-ink-black bg-white p-5 shadow-[6px_6px_0_#141414] md:grid-cols-2">
        <label className="space-y-1 font-mono text-[10px] font-black uppercase">
          {vi ? 'Series ph? tr?ch' : 'Assigned series'}
          <select
            value={form.seriesId}
            onChange={(event) => setForm({ ...form, seriesId: event.target.value })}
            className="h-11 w-full border-2 border-ink-black bg-white px-3 text-xs outline-none"
          >
            <option value="">{vi ? 'Ch?n series...' : 'Choose a series...'}</option>
            {series.map((item: any) => <option key={item._id} value={item._id}>{item.title}</option>)}
          </select>
        </label>
        <label className="space-y-1 font-mono text-[10px] font-black uppercase">
          {vi ? 'Ti?u ?? h? s?' : 'Dossier title'}
          <input
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            className="h-11 w-full border-2 border-ink-black px-3 text-xs outline-none"
          />
        </label>
        <label className="space-y-1 font-mono text-[10px] font-black uppercase md:col-span-2">
          {vi ? 'Lu?n ?i?m b?o v?' : 'Defense arguments'}
          <textarea
            value={form.defenseArguments}
            onChange={(event) => setForm({ ...form, defenseArguments: event.target.value })}
            rows={4}
            className="w-full border-2 border-ink-black p-3 text-xs normal-case outline-none"
            placeholder={vi ? 'N?u k?t qu? s?n xu?t, ph?n h?i ??c gi? v? l? do series n?n ti?p t?c...' : 'Explain production results, reader response and why the series should continue...'}
          />
        </label>
        <label className="space-y-1 font-mono text-[10px] font-black uppercase">
          {vi ? 'T?ng tr??ng ??c gi?' : 'Reader growth'}
          <input
            value={form.readerGrowth}
            onChange={(event) => setForm({ ...form, readerGrowth: event.target.value })}
            className="h-11 w-full border-2 border-ink-black px-3 text-xs normal-case outline-none"
            placeholder="+12% / month"
          />
        </label>
        <label className="space-y-1 font-mono text-[10px] font-black uppercase">
          {vi ? 'K? ho?ch c?i thi?n' : 'Improvement plan'}
          <input
            value={form.improvementPlan}
            onChange={(event) => setForm({ ...form, improvementPlan: event.target.value })}
            className="h-11 w-full border-2 border-ink-black px-3 text-xs normal-case outline-none"
          />
        </label>
        <div className="flex items-center justify-between gap-3 md:col-span-2">
          <p className="text-xs font-bold text-[#E63946]">{message}</p>
          <button
            type="button"
            disabled={!canCreate || createMutation.isPending}
            onClick={() => createMutation.mutate()}
            className="flex items-center gap-2 border-2 border-ink-black bg-ink-black px-5 py-3 font-syne text-xs font-black uppercase text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ShieldCheck className="h-4 w-4" />
            {vi ? 'L?u h? s? nh?p' : 'Save draft'}
          </button>
        </div>
      </section>

      <section className="space-y-4">
        {reports.map((report: any) => (
          <article key={report._id} className="border-4 border-ink-black bg-white p-5 shadow-[5px_5px_0_#141414]">
            <div className="flex flex-col gap-4 md:flex-row md:items-start">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-syne text-lg font-black">{report.title}</h2>
                  <StatusBadge label={report.status || 'DRAFT'} variant={report.status === 'APPROVED' ? 'approved' : report.status === 'REJECTED' ? 'danger' : report.status === 'SUBMITTED' ? 'submitted' : 'default'} />
                </div>
                <p className="mt-1 font-mono text-[10px] uppercase text-neutral-500">
                  {report.seriesId?.title || (vi ? 'Series kh?ng x?c ??nh' : 'Unknown series')}
                </p>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-neutral-700">{report.defenseArguments}</p>
              </div>
              <div className="grid min-w-[260px] grid-cols-3 border-2 border-ink-black text-center font-mono text-[9px] uppercase">
                <span className="border-r-2 border-ink-black p-3"><strong className="block text-lg">{report.metrics?.totalChapters || 0}</strong>{vi ? 'Chapter' : 'Chapters'}</span>
                <span className="border-r-2 border-ink-black p-3"><strong className="block text-lg">{report.metrics?.totalVotes || 0}</strong>{vi ? 'Phi?u' : 'Votes'}</span>
                <span className="p-3"><strong className="block text-lg">{report.metrics?.currentRank || '?'}</strong>{vi ? 'H?ng' : 'Rank'}</span>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t-2 border-dashed border-neutral-300 pt-4">
              <span className="flex items-center gap-2 font-mono text-[10px] uppercase text-neutral-500">
                <BarChart3 className="h-4 w-4" /> {report.metrics?.readerGrowth || (vi ? 'Ch?a nh?p t?ng tr??ng' : 'No growth note')}
              </span>
              {report.status === 'DRAFT' && (
                <button
                  type="button"
                  onClick={() => submitMutation.mutate(report._id)}
                  disabled={submitMutation.isPending}
                  className="flex items-center gap-2 border-2 border-ink-black bg-[#E63946] px-4 py-2 font-syne text-[10px] font-black uppercase text-white"
                >
                  <Send className="h-4 w-4" /> {vi ? 'G?i H?i ??ng' : 'Submit to Board'}
                </button>
              )}
            </div>
          </article>
        ))}
        {reports.length === 0 && (
          <div className="border-2 border-dashed border-neutral-400 bg-white p-10 text-center font-mono text-xs uppercase text-neutral-500">
            {vi ? 'Ch?a c? h? s? b?o v? series.' : 'No defense dossier yet.'}
          </div>
        )}
      </section>
    </div>
  );
};
