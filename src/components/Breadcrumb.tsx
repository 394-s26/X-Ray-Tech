import { Link } from 'react-router-dom';
import { ChevronRightIcon } from '../services/svgIcons';

interface BreadcrumbItem {
  name: string;
  to: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  const allItems = [{ name: 'Dashboard', to: '/' }, ...items];

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 flex-wrap">
      {allItems.map((item, i) => {
        const isLast = i === allItems.length - 1;
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && (
              <ChevronRightIcon
                size={12}
                className="text-gray-300 dark:text-slate-600 shrink-0"
              />
            )}
            {isLast ? (
              <span className="text-xs font-semibold text-gray-400 dark:text-slate-500">
                {item.name}
              </span>
            ) : (
              <Link
                to={item.to}
                className="text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-primary dark:hover:text-slate-100 transition-colors"
              >
                {item.name}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
