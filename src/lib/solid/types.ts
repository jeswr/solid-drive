export interface SolidResource {
  url: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  lastModified?: Date;
  contentType?: string;
  isPublic?: boolean;
  permissions: SolidPermission[];
}

export interface SolidPermission {
  agent: string;
  modes: string[];
  scope: 'resource' | 'default';
}

export interface SolidShare {
  resourceUrl: string;
  agent: string;
  modes: string[];
  grantedBy: string;
  grantedAt: Date;
}

export interface SolidApplication {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  permissions: string[];
  authorizedAt: Date;
}

export interface DriveState {
  currentPath: string;
  resources: SolidResource[];
  selectedResources: string[];
  isLoading: boolean;
  error?: string;
}

export interface SolidConfig {
  serverUrl: string;
  clientId: string;
  redirectUrl: string;
}