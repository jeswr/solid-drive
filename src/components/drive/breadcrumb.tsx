import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbProps {
  path: string;
  onNavigate: (path: string) => void;
}

export function Breadcrumb({ path, onNavigate }: BreadcrumbProps) {
  const pathSegments = path.split('/').filter(Boolean);
  
  const buildPath = (index: number): string => {
    return '/' + pathSegments.slice(0, index + 1).join('/') + '/';
  };

  return (
    <nav className="flex items-center space-x-1 text-sm text-gray-500">
      <button
        onClick={() => onNavigate('/')}
        className="flex items-center hover:text-gray-700 transition-colors"
      >
        <Home className="h-4 w-4" />
      </button>
      
      {pathSegments.map((segment, index) => (
        <div key={index} className="flex items-center">
          <ChevronRight className="h-4 w-4 mx-1" />
          <button
            onClick={() => onNavigate(buildPath(index))}
            className="hover:text-gray-700 transition-colors truncate max-w-32"
            title={segment}
          >
            {segment}
          </button>
        </div>
      ))}
    </nav>
  );
}