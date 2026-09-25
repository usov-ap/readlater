import { Archive, BookOpen, CheckCircle2, Inbox, Star } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface MobileNavProps {
  inboxCount: number;
}

export function MobileNav({ inboxCount }: MobileNavProps) {
  const location = useLocation();

  const navs = [
    { to: '/inbox', label: 'Inbox', icon: Inbox, count: inboxCount },
    { to: '/reading', label: 'Читаю', icon: BookOpen },
    { to: '/completed', label: 'Готово', icon: CheckCircle2 },
    { to: '/favorites', label: 'Избранное', icon: Star },
    { to: '/archive', label: 'Архив', icon: Archive },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#fcfbf9]/95 dark:bg-[#121417]/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 px-2 py-1.5 flex items-center justify-around">
      {navs.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.to || (item.to === '/inbox' && location.pathname === '/');
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`relative flex flex-col items-center justify-center min-w-[54px] py-1 text-[10px] font-medium transition-colors ${
              isActive
                ? 'text-neutral-950 dark:text-neutral-50'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <div className="relative">
              <Icon className="w-5 h-5 mb-0.5" />
              {item.count !== undefined && item.count > 0 && (
                <span className="absolute -top-1 -right-2 bg-amber-500 text-white font-mono text-[9px] px-1 rounded-full leading-tight font-bold">
                  {item.count}
                </span>
              )}
            </div>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
