import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, MessageSquareText, Send, UserPlus } from 'lucide-react';
import { apiClient } from '../api/client';
import { Chapter, ChapterAssignment, ChapterFeedback, User } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

interface ChapterFeedbackPanelProps {
  chapter: Chapter;
  seriesId: string;
  onChanged: () => void;
}

const getId = (value: any): string => typeof value === 'object' && value !== null ? value._id : value || '';

const extractResultUrl = (feedback?: ChapterFeedback, assignmentId?: string) => {
  const notes = feedback?.revisionHistory || [];
  for (let index = notes.length - 1; index >= 0; index -= 1) {
    if (assignmentId && getId(notes[index]?.assignmentId) !== assignmentId) continue;
    const match = notes[index]?.note?.match(/\[RESULT_URL:([^\]]+)\]/);
    if (match) return match[1];
  }
  return '';
};
export default function ChapterFeedbackPanel({ chapter, seriesId, onChanged }: ChapterFeedbackPanelProps) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [feedbacks, setFeedbacks] = useState<ChapterFeedback[]>([]);
  const [assignments, setAssignments] = useState<ChapterAssignment[]>([]);
  const [assistants, setAssistants] = useState<User[]>([]);
  const [assistantId, setAssistantId] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      const [feedbackData, assignmentData, assistantData] = await Promise.all([
        apiClient.feedback.getForChapter(chapter._id),
        apiClient.assignments.getAll(seriesId, chapter._id),
        apiClient.users.getAll('ASSISTANT'),
      ]);
      setFeedbacks(feedbackData);
      setAssignments(assignmentData);
      setAssistants(assistantData || []);
      if (!assistantId && assistantData?.[0]?._id) setAssistantId(assistantData[0]._id);
    } catch (error: any) {
      setMessage(t(error.message || 'Failed to load chapter feedback.'));
    }
  };

  useEffect(() => {
    load();
  }, [chapter._id, seriesId]);

  const latest = feedbacks.at(-1);
  const latestAssignment = useMemo(() => {
    const linkedId = getId(latest?.assignmentId);
    return assignments.find((item) => item._id === linkedId)
      || assignments.find((item) => getId(item.feedbackId) === latest?._id)
      || assignments.at(0);
  }, [assignments, latest]);
  const resultUrl = extractResultUrl(latest, latestAssignment?._id);

  const assignAssistant = async () => {
    if (!latest || latest.status !== 'OPEN' || !assistantId) return;
    setBusy(true);
    setMessage('');
    try {
      await apiClient.feedback.assign(
        chapter._id,
        assistantId,
        `Revise Chapter ${chapter.chapterNumber} - Feedback v${latest.version}`,
        latest.message,
      );
      setMessage(t('Feedback assigned to assistant successfully.'));
      await load();
      onChanged();
    } catch (error: any) {
      setMessage(t(error.message || 'Failed to assign feedback.'));
    } finally {
      setBusy(false);
    }
  };

  const acceptAssistantRevision = async () => {
    if (!latestAssignment || latestAssignment.status !== 'SUBMITTED') return;
    setBusy(true);
    setMessage('');
    try {
      await apiClient.assignments.updateStatus(
        latestAssignment._id,
        'COMPLETED',
        'Mangaka approved the assistant revision and returned the chapter to the editor.',
      );
      setMessage(t('Revision approved and returned to the editor.'));
      await load();
      onChanged();
    } catch (error: any) {
      setMessage(t(error.message || 'Failed to return revision to editor.'));
    } finally {
      setBusy(false);
    }
  };

  if (feedbacks.length === 0) return null;

  return (
    <div className="mt-3 border-t border-[#2d2d34] pt-3">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-left text-xs font-bold text-amber-300 transition-colors hover:bg-amber-500/15"
      >
        <span className="flex items-center gap-2">
          <MessageSquareText className="size-4" />
          {t('Editor feedback')} · v{latest?.version} · {t(latest?.status || 'OPEN')}
        </span>
        {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
      </button>

      {expanded && latest && (
        <div className="mt-3 space-y-3 rounded-md border border-[#2d2d34] bg-[#121214] p-4">
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-500">{t('Latest feedback')}</p>
            <p className="mt-1 text-pretty text-sm text-slate-200">{latest.message}</p>
          </div>

          {latest.status === 'OPEN' && chapter.status === 'REVISION_REQUESTED' && (
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <select
                value={assistantId}
                onChange={(event) => setAssistantId(event.target.value)}
                className="rounded-md border border-[#3a3a44] bg-[#1e1e24] px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
              >
                {assistants.map((assistant) => (
                  <option key={assistant._id} value={assistant._id}>{assistant.name} · {assistant.email}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={assignAssistant}
                disabled={busy || !assistantId}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <UserPlus className="size-4" /> {t('Assign assistant')}
              </button>
            </div>
          )}

          {latestAssignment && (
            <div className="rounded-md border border-[#2d2d34] bg-[#1e1e24] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-white">{latestAssignment.title || t('Feedback revision')}</p>
                  <p className="mt-1 text-[10px] uppercase text-slate-500">
                    {t('Assistant')}: {typeof latestAssignment.assistantId === 'object' ? latestAssignment.assistantId.name : t('Assigned member')}
                  </p>
                </div>
                <span className="rounded border border-slate-600 px-2 py-1 text-[9px] font-bold text-slate-300">
                  {t(latestAssignment.status)}
                </span>
              </div>
            </div>
          )}

          {resultUrl && (
            <div className="overflow-hidden rounded-md border border-[#2d2d34] bg-black p-2">
              <img src={resultUrl} alt={t('Assistant revision preview')} className="mx-auto max-h-80 w-auto max-w-full object-contain" draggable={false} />
            </div>
          )}

          {latestAssignment?.status === 'SUBMITTED' && (
            <button
              type="button"
              onClick={acceptAssistantRevision}
              disabled={busy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
            >
              <CheckCircle2 className="size-4" /> {t('Approve revision and return to editor')}
            </button>
          )}

          {message && <p className="text-pretty text-xs font-semibold text-amber-300">{message}</p>}

          <div className="border-t border-[#2d2d34] pt-3">
            <p className="mb-2 text-[10px] font-bold uppercase text-slate-500">{t('Feedback history')}</p>
            <div className="space-y-2">
              {feedbacks.map((feedback) => (
                <div key={feedback._id} className="flex gap-2 text-xs text-slate-400">
                  <Send className="mt-0.5 size-3 shrink-0" />
                  <span><strong className="text-slate-200">v{feedback.version}</strong> · {feedback.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}