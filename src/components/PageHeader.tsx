import type { ReactNode } from 'react';

interface PageHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  className?: string;
}

export function PageHeader({ icon, title, subtitle, className = 'mt-2 mb-8' }: PageHeaderProps) {
  return (
    <header className={`flex items-center gap-3 ${className}`}>
      <span className="grid place-items-center w-11 h-11 rounded-2xl bg-primary/10 text-primary dark:bg-primary-light/20 dark:text-secondary shrink-0">
        {icon}
      </span>
      <div>
        <h1 className="text-2xl font-bold text-primary dark:text-slate-50 leading-tight">
          {title}
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">{subtitle}</p>
      </div>
    </header>
  );
}
