import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ArchivePage } from '../pages/ArchivePage';
import { CompletedPage } from '../pages/CompletedPage';
import { FavoritesPage } from '../pages/FavoritesPage';
import { InboxPage } from '../pages/InboxPage';
import { ItemDetailsPage } from '../pages/ItemDetailsPage';
import { ProcessingPage } from '../pages/ProcessingPage';
import { ReadingPage } from '../pages/ReadingPage';
import { TagFilterPage } from '../pages/TagFilterPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/inbox" replace />} />
        <Route path="/inbox" element={<InboxPage />} />
        <Route path="/process" element={<ProcessingPage />} />
        <Route path="/reading" element={<ReadingPage />} />
        <Route path="/completed" element={<CompletedPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/archive" element={<ArchivePage />} />
        <Route path="/tag/:tagName" element={<TagFilterPage />} />
        <Route path="/item/:id" element={<ItemDetailsPage />} />
        <Route path="*" element={<Navigate to="/inbox" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
