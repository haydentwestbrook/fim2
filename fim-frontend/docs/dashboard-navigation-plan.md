# Dashboard Navigation and Profile Page Plan

This document outlines the plan to add a sidebar navigation to the dashboard and create a new user profile page.

## 1. Navigation Component: Sidebar

A sidebar navigation component will be created and integrated into the `DashboardLayout`. This will provide a consistent navigation experience across all dashboard pages.

### File to be created:
-   `fim-frontend/src/components/dashboard/Sidebar.tsx`

### `Sidebar.tsx` Structure:

```tsx
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { name: 'User Management', href: '/dashboard/admin/users' },
  { name: 'Profile', href: '/dashboard/profile' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col">
      <div className="p-4 font-bold text-lg">FIM Dashboard</div>
      <nav className="mt-4 flex-1">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`block py-2.5 px-4 rounded transition duration-200 ${
              pathname === item.href
                ? 'bg-gray-700 text-white'
                : 'hover:bg-gray-700 hover:text-white'
            }`}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </div>
  );
}
```

## 2. Update DashboardLayout

The `DashboardLayout.tsx` will be modified to include the new `Sidebar` component. The layout will be changed to a flexbox structure to accommodate the sidebar and the main content area.

### File to be modified:
-   `fim-frontend/src/components/dashboard/DashboardLayout.tsx`

### Proposed `DashboardLayout.tsx` Changes:

```tsx
import React from 'react';
import { signOut } from 'next-auth/react';
import { Button } from '../ui/Button';
import Sidebar from './Sidebar'; // Import the new Sidebar component

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
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
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200">
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
```

## 3. New User Profile Page

A new page will be created for the user profile. This page will display user information and provide options to update their profile.

### File to be created:
-   `fim-frontend/src/app/dashboard/profile/page.tsx`

### `page.tsx` (Profile Page) Structure:

```tsx
'use client';

import { useSession } from 'next-auth/react';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { useState } from 'react';

export default function ProfilePage() {
  const { data: session } = useSession();
  const [name, setName] = useState(session?.user?.name || '');
  const [email, setEmail] = useState(session?.user?.email || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle profile update logic here
    console.log('Updating profile with:', { name, email });
  };

  return (
    <DashboardLayout>
      <h2 className="text-2xl font-semibold mb-4">User Profile</h2>
      <Card>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full"
              disabled
            />
          </div>
          <Button type="submit">
            Update Profile
          </Button>
        </form>
      </Card>
    </DashboardLayout>
  );
}
```

## 4. Mermaid Diagram of Flow

```mermaid
graph TD
    A[User navigates to /dashboard] --> B{DashboardLayout};
    B --> C[Sidebar];
    B --> D[Main Content];
    C --> E[Link: User Management];
    C --> F[Link: Profile];
    E --> G[/dashboard/admin/users];
    F --> H[/dashboard/profile];
    D --> I[Dashboard Page Content];
    H --> J[Profile Page Content];