import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AddLinkModal } from '../../features/items/components/AddLinkModal';
import { useItems } from '../../features/items/hooks/useItems';
import { itemsRepository } from '../../features/items/api/localStorageRepository';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { CommandPalette } from '../../features/search/components/CommandPalette';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
  headerTitle?: string;
  count?: number;
}

export function AppLayout({ children, headerTitle, count }: AppLayoutProps) {
  const location = useLocation();
  const { counts, tags, refresh } = useItems();
  const { showToast } = useToast();
  const { isRequired, logout } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Global ⌘K / Ctrl+K shortcut toggles the command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Определение названия страницы
  const getComputedTitle = () => {
    if (headerTitle) return headerTitle;
    const path = location.pathname;
    if (path === '/' || path === '/inbox') return 'Inbox';
    if (path === '/reading') return 'Читаю';
    if (path === '/completed') return 'Прочитано';
    if (path === '/favorites') return 'Избранное';
    if (path === '/archive') return 'Архив';
    if (path.startsWith('/tag/')) return decodeURIComponent(path.replace('/tag/', '#'));
    return 'ReadLater';
  };

  const getComputedCount = () => {
    if (count !== undefined) return count;
    const path = location.pathname;
    if (path === '/' || path === '/inbox') return counts.inbox;
    if (path === '/reading') return counts.reading;
    if (path === '/completed') return counts.completed;
    if (path === '/favorites') return counts.favorites;
    if (path === '/archive') return counts.archived;
    return undefined;
  };

  const handleResetLibrary = async () => {
    if (window.confirm('Сбросить библиотеку к начальным демонстрационным материалам?')) {
      try {
        await itemsRepository.resetToDefaults();
        refresh();
        showToast({ message: 'Библиотека сброшена к начальным материалам' });
      } catch (err) {
        console.error('Failed to reset library', err);
        showToast({ message: 'Не удалось сбросить библиотеку' });
      }
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#fcfbf9] dark:bg-[#121417] text-neutral-900 dark:text-neutral-100">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar
          counts={counts}
          tags={tags}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onResetLibrary={handleResetLibrary}
          onLogout={isRequired ? logout : undefined}
        />
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden bg-black/50 backdrop-blur-xs flex"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="w-72 bg-[#fcfbf9] dark:bg-[#121417] h-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar
              counts={counts}
              tags={tags}
              onOpenAddModal={() => {
                setIsMobileMenuOpen(false);
                setIsAddModalOpen(true);
              }}
              onResetLibrary={() => {
                setIsMobileMenuOpen(false);
                handleResetLibrary();
              }}
              onLogout={
                isRequired
                  ? () => {
                      setIsMobileMenuOpen(false);
                      logout();
                    }
                  : undefined
              }
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header
          title={getComputedTitle()}
          count={getComputedCount()}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
          <div className="max-w-4xl mx-auto">{children}</div>
        </main>

        {/* Mobile bottom navigation */}
        <MobileNav inboxCount={counts.inbox} />
      </div>

      {/* Global Add Link Modal */}
      <AddLinkModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onItemCreated={() => refresh()}
      />

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
}
