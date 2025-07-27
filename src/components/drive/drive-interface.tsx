import { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  FolderPlus, 
  Search, 
  Grid, 
  List,
  Trash2,
  Share,
  Settings
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ResourceItem } from './resource-item';
import { Breadcrumb } from './breadcrumb';
import { ShareDialog } from './share-dialog';
import { SolidClient } from '@/lib/solid/client';
import type { SolidResource, SolidPermission, DriveState } from '@/lib/solid/types';

interface DriveInterfaceProps {
  solidClient: SolidClient;
  initialPath?: string;
}

export function DriveInterface({ solidClient, initialPath = '/' }: DriveInterfaceProps) {
  const [state, setState] = useState<DriveState>({
    currentPath: initialPath,
    resources: [],
    selectedResources: [],
    isLoading: false,
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedResource, setSelectedResource] = useState<SolidResource | null>(null);
  const [permissions, setPermissions] = useState<SolidPermission[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadResources();
  }, [state.currentPath]);

  const loadResources = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: undefined }));
    
    try {
      const resources = await solidClient.listResources(state.currentPath);
      setState(prev => ({ 
        ...prev, 
        resources, 
        isLoading: false,
        selectedResources: [] 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to load resources' 
      }));
    }
  };

  const handleNavigate = (path: string) => {
    setState(prev => ({ ...prev, currentPath: path }));
  };

  const handleSelect = (url: string) => {
    setState(prev => ({
      ...prev,
      selectedResources: prev.selectedResources.includes(url)
        ? prev.selectedResources.filter(r => r !== url)
        : [...prev.selectedResources, url]
    }));
  };

  const handleDoubleClick = (resource: SolidResource) => {
    if (resource.type === 'folder') {
      handleNavigate(resource.url);
    } else {
      // Handle file opening
      window.open(resource.url, '_blank');
    }
  };

  const handleCreateFolder = async () => {
    const name = prompt('Enter folder name:');
    if (!name) return;

    try {
      await solidClient.createFolder(state.currentPath, name);
      loadResources();
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files) return;

    for (const file of Array.from(files)) {
      try {
        await solidClient.uploadFile(state.currentPath, file);
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }
    
    loadResources();
  };

  const handleDelete = async (url: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await solidClient.deleteResource(url);
      loadResources();
    } catch (error) {
      console.error('Error deleting resource:', error);
    }
  };

  const handleShare = async (resource: SolidResource) => {
    setSelectedResource(resource);
    try {
      const perms = await solidClient.getPermissions(resource.url);
      setPermissions(perms);
    } catch (error) {
      console.error('Error loading permissions:', error);
      setPermissions([]);
    }
    setShowShareDialog(true);
  };

  const handleShareSubmit = async (agent: string, modes: string[]) => {
    if (!selectedResource) return;
    
    try {
      await solidClient.shareResource(selectedResource.url, agent, modes);
      const updatedPermissions = await solidClient.getPermissions(selectedResource.url);
      setPermissions(updatedPermissions);
    } catch (error) {
      console.error('Error sharing resource:', error);
    }
  };

  const handleUpdatePermissions = async (newPermissions: SolidPermission[]) => {
    if (!selectedResource) return;
    
    try {
      // Implementation would depend on the specific ACL management
      setPermissions(newPermissions);
    } catch (error) {
      console.error('Error updating permissions:', error);
    }
  };

  const filteredResources = state.resources.filter(resource =>
    resource.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900">Solid Drive</h1>
            <Breadcrumb path={state.currentPath} onNavigate={handleNavigate} />
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleCreateFolder}>
              <FolderPlus className="h-4 w-4 mr-2" />
              New Folder
            </Button>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
            />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search files and folders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
            
            {state.selectedResources.length > 0 && (
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {state.isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : state.error ? (
          <div className="text-center text-red-600 py-8">
            {state.error}
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            {searchQuery ? 'No files found matching your search.' : 'This folder is empty.'}
          </div>
        ) : (
          <div className={`grid gap-4 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6' 
              : 'grid-cols-1'
          }`}>
            {filteredResources.map((resource) => (
              <ResourceItem
                key={resource.url}
                resource={resource}
                isSelected={state.selectedResources.includes(resource.url)}
                onSelect={handleSelect}
                onDoubleClick={handleDoubleClick}
                onDelete={handleDelete}
                onShare={handleShare}
                onRename={() => {}} // TODO: Implement rename
              />
            ))}
          </div>
        )}
      </div>

      {/* Share Dialog */}
      {showShareDialog && selectedResource && (
        <ShareDialog
          resource={selectedResource}
          permissions={permissions}
          onClose={() => setShowShareDialog(false)}
          onShare={handleShareSubmit}
          onUpdatePermissions={handleUpdatePermissions}
        />
      )}
    </div>
  );
}