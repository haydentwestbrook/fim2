import React from 'react';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '../ui/Button';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold leading-tight text-gray-900">
            Dashboard
          </h1>
          <div className="absolute right-0 top-0 mt-6 mr-4">
            <Button onClick={() => signOut()} className="bg-red-500 hover:bg-red-700 text-white">
              Sign Out
            </Button>
          </div>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-8 sm:px-0">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}