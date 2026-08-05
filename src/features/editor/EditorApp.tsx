import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { EditorLayout } from './components/layout/EditorLayout.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { ProposalListPage } from './pages/ProposalListPage.tsx';
import { ProposalReviewPage } from './pages/ProposalReviewPage.tsx';
import { ManuscriptReviewPage } from './pages/ManuscriptReviewPage.tsx';
import { ChapterReviewListPage } from './pages/ChapterReviewListPage.tsx';
import { SeriesManagementPage } from './pages/SeriesManagementPage.tsx';
import { SeriesDetailPage } from './pages/SeriesDetailPage.tsx';

interface EditorAppProps {
  onLogout?: () => void;
}

export const EditorApp: React.FC<EditorAppProps> = ({ onLogout }) => {
  return (
    <EditorLayout onLogout={onLogout}>
      <Routes>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="proposals" element={<ProposalListPage />} />
        <Route path="proposals/:id" element={<ProposalReviewPage />} />
        <Route path="review" element={<ChapterReviewListPage />} />
        <Route path="review/:seriesId" element={<ManuscriptReviewPage />} />
        <Route path="series" element={<SeriesManagementPage />} />
        <Route path="series/:id" element={<SeriesDetailPage />} />
        <Route path="*" element={<Navigate to="/editor/dashboard" replace />} />
      </Routes>
    </EditorLayout>
  );
};
