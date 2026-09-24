import {
  Archive,
  BookOpen,
  CheckCircle2,
  Compass,
  Hash,
  Inbox,
  Moon,
  Plus,
  RotateCcw,
  Sparkles,
  Star,
  Sun
} from 'lucide-react';
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { TagWithCount } from '../../types/item';
import { Button } from '../ui/Button';

interface SidebarProps {
  counts: {
    inbox: number;
    reading: number;
    completed: number;
    favorites: number;
    archived: number;
    all: number;
  };
  tags: TagWithCount[];
  onOpenAddModal: () => void;
  onResetLibrary?: () => void;
}

export function Sidebar({ counts, tags, onOpenAddModal, onResetLibrary }: SidebarProps) {
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const navItems = [
    {
      to: '/inbox',
      label: 'Inbox',
      icon: Inbox,
      count: counts.inbox,
      badgeHighlight: counts.inbox > 0,
    },
    {
      to: '/reading',
      label: 'Читаю',
      icon: BookOpen,
      count: counts.reading,
    },
    {
      to: '/completed',
      label: 'Прочитано',
      icon: CheckCircle2,
      count: counts.completed,
    },
    {
      to: '/favorites',
      label: 'Избранное',
      icon: Star,
      count: counts.favorites,
    },
    {
      to: '/archive',
      label: 'Архив',
      icon: Archive,
      count: counts.archived,
    },
  ];

  return (
    <aside className="w-64 border-r border-neutral-200/80 dark:border-neutral-800 bg-[#fcfbf9]/95 dark:bg-[#121417]/95 flex flex-col h-full shrink-0 select-none">
      {/* Brand header */}
      <div className="p-4 sm:p-5 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800/60">
        <Link to="/inbox" className="text-base font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950 flex items-center justify-center font-mono text-xs font-bold">
            R
          </div>
          <span>ReadLater</span>
        </Link>
      </div>

      {/* Primary Add action */}
      <div className="px-4 pt-4 pb-2">
        <Button
          variant="primary"
          onClick={onOpenAddModal}
          className="w-full justify-center shadow-xs text-xs sm:text-sm py-2"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Добавить ссылку</span>
        </Button>
      </div>

      {/* Main navigation links */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-6">
        <div>
          <span className="px-3 text-[11px] font-mono uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-semibold block mb-1">
            Библиотека
          </span>
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to || (item.to === '/inbox' && location.pathname === '/');
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm transition-colors ${
                    isActive
                      ? 'bg-neutral-200/80 dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 font-medium'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>

                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className={`font-mono text-xs tabular-nums px-1.5 py-0.2 rounded ${
                        item.badgeHighlight
                          ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 font-semibold'
                          : 'text-neutral-400 dark:text-neutral-500'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Tags section */}
        {tags.length > 0 && (
          <div>
            <span className="px-3 text-[11px] font-mono uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-semibold block mb-1">
              Теги
            </span>
            <div className="space-y-0.5">
              {tags.slice(0, 10).map((tag) => (
                <Link
                  key={tag.name}
                  to={`/tag/${tag.name}`}
                  className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors font-mono"
                >
                  <span>#{tag.name}</span>
                  <span className="text-[11px] text-neutral-400 dark:text-neutral-500 tabular-nums">
                    {tag.count}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer controls: theme toggle & reset */}
      <div className="p-3 border-t border-neutral-100 dark:border-neutral-800/60 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTheme('light')}
            aria-label="Светлая тема"
            title="Светлая тема"
            className={`p-1.5 rounded-md ${theme === 'light' ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTheme('dark')}
            aria-label="Тёмная тема"
            title="Тёмная тема"
            className={`p-1.5 rounded-md ${theme === 'dark' ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
        </div>

        {onResetLibrary && (
          <button
            onClick={onResetLibrary}
            className="hover:text-neutral-900 dark:hover:text-neutral-200 text-[11px] flex items-center gap-1 transition-colors"
            title="Сбросить библиотеку к начальным примерам"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Сброс</span>
          </button>
        )}
      </div>
    </aside>
  );
}
