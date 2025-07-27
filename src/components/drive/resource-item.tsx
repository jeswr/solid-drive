import { useState } from 'react';
import { Folder, File, MoreVertical, Download, Share, Trash2, Edit } from 'lucide-react';
import { Button } from '../ui/button';
import type { SolidResource } from '@/lib/solid/types';

interface ResourceItemProps {
  resource: SolidResource;
  isSelected: boolean;
  onSelect: (url: string) => void;
  onDoubleClick: (resource: SolidResource) => void;
  onDelete: (url: string) => void;
  onShare: (resource: SolidResource) => void;
  onRename: (resource: SolidResource) => void;
}

export function ResourceItem({
  resource,
  isSelected,
  onSelect,
  onDoubleClick,
  onDelete,
  onShare,
  onRename,
}: ResourceItemProps) {
  const [showMenu, setShowMenu] = useState(false);

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date?: Date): string => {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div
      className={`group relative flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
        isSelected
          ? 'bg-blue-50 border-blue-200 border'
          : 'hover:bg-gray-50 border border-transparent'
      }`}
      onClick={() => onSelect(resource.url)}
      onDoubleClick={() => onDoubleClick(resource)}
    >
      <div className="flex items-center flex-1 min-w-0">
        <div className="flex-shrink-0 mr-3">
          {resource.type === 'folder' ? (
            <Folder className="h-6 w-6 text-blue-500" />
          ) : (
            <File className="h-6 w-6 text-gray-500" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">
            {resource.name}
          </div>
          <div className="text-xs text-gray-500">
            {resource.type === 'file' && resource.size && (
              <span>{formatFileSize(resource.size)}</span>
            )}
            {resource.lastModified && (
              <span className="ml-2">{formatDate(resource.lastModified)}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      {showMenu && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
          <div className="py-1">
            <button
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                onRename(resource);
                setShowMenu(false);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Rename
            </button>
            <button
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                onShare(resource);
                setShowMenu(false);
              }}
            >
              <Share className="h-4 w-4 mr-2" />
              Share
            </button>
            {resource.type === 'file' && (
              <button
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={(e) => {
                  e.stopPropagation();
                  // Download functionality
                  setShowMenu(false);
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </button>
            )}
            <button
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(resource.url);
                setShowMenu(false);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}