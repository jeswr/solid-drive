import { useState } from 'react';
import { X, UserPlus, Users, Globe } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import type { SolidResource, SolidPermission } from '@/lib/solid/types';

interface ShareDialogProps {
  resource: SolidResource;
  permissions: SolidPermission[];
  onClose: () => void;
  onShare: (agent: string, modes: string[]) => Promise<void>;
  onUpdatePermissions: (permissions: SolidPermission[]) => Promise<void>;
}

export function ShareDialog({
  resource,
  permissions,
  onClose,
  onShare,
  onUpdatePermissions,
}: ShareDialogProps) {
  const [newAgent, setNewAgent] = useState('');
  const [selectedModes, setSelectedModes] = useState<string[]>(['Read']);
  const [isLoading, setIsLoading] = useState(false);

  const permissionModes = [
    { id: 'Read', label: 'Read', description: 'Can view and download' },
    { id: 'Write', label: 'Write', description: 'Can edit and upload' },
    { id: 'Control', label: 'Control', description: 'Can manage permissions' },
  ];

  const handleShare = async () => {
    if (!newAgent.trim()) return;
    
    setIsLoading(true);
    try {
      await onShare(newAgent, selectedModes);
      setNewAgent('');
      setSelectedModes(['Read']);
    } catch (error) {
      console.error('Error sharing resource:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePermission = async (agent: string) => {
    const updatedPermissions = permissions.filter(p => p.agent !== agent);
    await onUpdatePermissions(updatedPermissions);
  };

  const toggleMode = (mode: string) => {
    setSelectedModes(prev =>
      prev.includes(mode)
        ? prev.filter(m => m !== mode)
        : [...prev, mode]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Share &quot;{resource.name}&quot;</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Add new person */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900">Add people</h3>
            <div className="flex space-x-2">
              <Input
                placeholder="Enter email or Web ID"
                value={newAgent}
                onChange={(e) => setNewAgent(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleShare}
                disabled={!newAgent.trim() || isLoading}
                loading={isLoading}
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Permission modes */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">Permissions</label>
              {permissionModes.map(mode => (
                <label key={mode.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedModes.includes(mode.id)}
                    onChange={() => toggleMode(mode.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="text-sm font-medium">{mode.label}</div>
                    <div className="text-xs text-gray-500">{mode.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Current permissions */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900">People with access</h3>
            <div className="space-y-2">
              {permissions.map((permission, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="text-sm font-medium">{permission.agent}</div>
                      <div className="text-xs text-gray-500">
                        {permission.modes.join(', ')}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemovePermission(permission.agent)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              
              {permissions.length === 0 && (
                <div className="text-sm text-gray-500 text-center py-4">
                  No people have access yet
                </div>
              )}
            </div>
          </div>

          {/* Public access */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900">General access</h3>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium">Anyone with the link</div>
                  <div className="text-xs text-gray-500">No access</div>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Change
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}