'use client';

import { useState, useEffect } from 'react';
import { DriveInterface } from '@/components/drive/drive-interface';
import { SolidClient, createSolidClient } from '@/lib/solid/client';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, User } from 'lucide-react';

export default function HomePage() {
  const [solidClient, setSolidClient] = useState<SolidClient | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [webId, setWebId] = useState<string | undefined>();

  useEffect(() => {
    const config = {
      serverUrl: process.env.NEXT_PUBLIC_SOLID_SERVER_URL || 'http://localhost:3001',
      clientId: process.env.NEXT_PUBLIC_SOLID_CLIENT_ID || 'http://localhost:3000',
      redirectUrl: process.env.NEXT_PUBLIC_SOLID_REDIRECT_URL || 'http://localhost:3000',
    };

    const client = createSolidClient(config);
    setSolidClient(client);

    const initializeClient = async () => {
      await client.initialize();
      setIsLoggedIn(client.isLoggedIn());
      setWebId(client.getWebId());
    };

    initializeClient();
  }, []);

  const handleLogin = async () => {
    if (!solidClient) return;
    
    try {
      await solidClient.login();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    if (!solidClient) return;
    
    try {
      await solidClient.logout();
      setIsLoggedIn(false);
      setWebId(undefined);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!solidClient) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Solid Drive</h1>
            <p className="text-gray-600 mb-8">
              A modern file management interface for Solid Pods
            </p>
            
            <Button onClick={handleLogin} className="w-full">
              <LogIn className="h-4 w-4 mr-2" />
              Sign in to your Solid Pod
            </Button>
            
            <div className="mt-6 text-sm text-gray-500">
              <p>Don&apos;t have a Solid Pod?</p>
              <a 
                href="https://solidproject.org/users/get-a-pod" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700"
              >
                Get one here
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header with user info */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {webId ? new URL(webId).hostname : 'Unknown Pod'}
            </span>
          </div>
          
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Drive Interface */}
      <div className="flex-1">
        <DriveInterface 
          solidClient={solidClient} 
          initialPath={webId ? webId.substring(0, webId.lastIndexOf('/profile')) + '/' : '/'} 
        />
      </div>
    </div>
  );
}
