import { 
  getSolidDataset, 
  Thing,
  getUrl, 
  getStringNoLocale,
  getInteger,
  getDatetime,
  createSolidDataset,
  saveSolidDatasetAt,
  deleteSolidDataset,
  createThing,
  addStringNoLocale,
  setThing,
  getThingAll,
  getUrlAll
} from '@inrupt/solid-client';
import { 
  Session, 
  login, 
  logout, 
  handleIncomingRedirect,
  getDefaultSession
} from '@inrupt/solid-client-authn-browser';
import type { SolidResource, SolidPermission, SolidConfig } from './types';

// Define common vocabularies manually since vocab-common is problematic
const VCARD = {
  fn: 'http://www.w3.org/2006/vcard/ns#fn',
  size: 'http://www.w3.org/2006/vcard/ns#size',
  type: 'http://www.w3.org/2006/vcard/ns#type',
  rev: 'http://www.w3.org/2006/vcard/ns#rev',
};

const FOAF = {
  name: 'http://xmlns.com/foaf/0.1/name',
};

const LDP = {
  Container: 'http://www.w3.org/ns/ldp#Container',
};

const RDF = {
  type: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
};

const ACP = {
  agent: 'http://www.w3.org/ns/solid/acp#agent',
  mode: 'http://www.w3.org/ns/solid/acp#mode',
};

export class SolidClient {
  private session: Session;
  private config: SolidConfig;

  constructor(config: SolidConfig) {
    this.config = config;
    this.session = getDefaultSession();
  }

  async initialize(): Promise<void> {
    await handleIncomingRedirect({
      url: window.location.href,
      restorePreviousSession: true,
    });
  }

  async login(): Promise<void> {
    await login({
      oidcIssuer: this.config.serverUrl,
      clientId: this.config.clientId,
      redirectUrl: this.config.redirectUrl,
    });
  }

  async logout(): Promise<void> {
    await logout();
  }

  isLoggedIn(): boolean {
    return this.session.info.isLoggedIn;
  }

  getWebId(): string | undefined {
    return this.session.info.webId;
  }

  async listResources(path: string): Promise<SolidResource[]> {
    try {
      const dataset = await getSolidDataset(path, { fetch: this.session.fetch });
      const things = getThingAll(dataset);
      
      return things.map(thing => {
        const url = getUrl(thing, RDF.type);
        const name = getStringNoLocale(thing, VCARD.fn) || 
                    getStringNoLocale(thing, FOAF.name) ||
                    thing.url.split('/').pop() || 'Unknown';
        
        const isContainer = url?.includes(LDP.Container);
        const size = getInteger(thing, VCARD.size);
        const lastModified = getDatetime(thing, VCARD.rev);
        
        return {
          url: thing.url,
          name,
          type: isContainer ? 'folder' : 'file',
          size: size || undefined,
          lastModified: lastModified || undefined,
          contentType: getStringNoLocale(thing, VCARD.type) || undefined,
          permissions: this.extractPermissions(thing),
        };
      });
    } catch (error) {
      console.error('Error listing resources:', error);
      throw error;
    }
  }

  async createFolder(path: string, name: string): Promise<SolidResource> {
    const folderUrl = `${path}${path.endsWith('/') ? '' : '/'}${name}/`;
    const dataset = createSolidDataset();
    const thing = createThing({ url: folderUrl });
    
    const updatedThing = addStringNoLocale(thing, VCARD.fn, name);
    const updatedDataset = setThing(dataset, updatedThing);
    
    await saveSolidDatasetAt(folderUrl, updatedDataset, { fetch: this.session.fetch });
    
    return {
      url: folderUrl,
      name,
      type: 'folder',
      permissions: [],
    };
  }

  async uploadFile(path: string, file: File): Promise<SolidResource> {
    const fileUrl = `${path}${path.endsWith('/') ? '' : '/'}${file.name}`;
    
    const response = await this.session.fetch(fileUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
        'Link': '<http://www.w3.org/ns/ldp#Resource>; rel="type"',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.statusText}`);
    }

    return {
      url: fileUrl,
      name: file.name,
      type: 'file',
      size: file.size,
      contentType: file.type,
      lastModified: new Date(),
      permissions: [],
    };
  }

  async deleteResource(url: string): Promise<void> {
    await deleteSolidDataset(url, { fetch: this.session.fetch });
  }

  async shareResource(resourceUrl: string, agent: string, modes: string[]): Promise<void> {
    // Implementation for sharing resources with specific permissions
    // This would involve creating ACL (Access Control List) resources
    const aclUrl = `${resourceUrl}.acl`;
    
    // Create ACL dataset with permissions
    const aclDataset = createSolidDataset();
    
    // Add permission modes (Read, Write, Control, etc.)
    modes.forEach(() => {
      // Implementation depends on the specific ACL vocabulary used
    });
    
    await saveSolidDatasetAt(aclUrl, aclDataset, { fetch: this.session.fetch });
  }

  async getPermissions(resourceUrl: string): Promise<SolidPermission[]> {
    try {
      const aclUrl = `${resourceUrl}.acl`;
      const dataset = await getSolidDataset(aclUrl, { fetch: this.session.fetch });
      const things = getThingAll(dataset);
      
      return things.map(thing => ({
        agent: getUrl(thing, ACP.agent) || '',
        modes: getUrlAll(thing, ACP.mode).map(mode => mode.split('#').pop() || ''),
        scope: 'resource' as const,
      }));
    } catch (error) {
      console.error('Error getting permissions:', error);
      return [];
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private extractPermissions(_thing: Thing): SolidPermission[] {
    // Extract permissions from a resource thing
    // This is a simplified implementation
    return [];
  }
}

export const createSolidClient = (config: SolidConfig): SolidClient => {
  return new SolidClient(config);
};