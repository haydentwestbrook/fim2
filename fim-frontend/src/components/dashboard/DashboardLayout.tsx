import React from 'react';
import { signOut } from 'next-auth/react';
import { Button } from '../ui/Button';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-3xl font-bold leading-tight text-gray-900">
              Dashboard
            </h1>
            <Button onClick={() => signOut({ callbackUrl: '/login' })} className="bg-red-500 hover:bg-red-700 text-white">
              Sign Out
            </Button>
          </div>
        </header>
        <main className="flex-1">
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-8 sm:px-0">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}