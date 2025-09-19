import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Button } from '../ui/Button';

const Sidebar = () => {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <aside className="w-64 bg-gray-800 text-white p-4 flex flex-col h-screen">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white">FIM Dashboard</h2>
      </div>
      <nav className="flex-1">
        <ul className="space-y-2">
          <li>
            <Link 
              href="/dashboard" 
              className={`block py-2 px-4 rounded transition-colors ${
                isActive('/dashboard') 
                  ? 'bg-gray-700 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              Dashboard
            </Link>
          </li>
          <li>
            <Link 
              href="/dashboard/admin/users" 
              className={`block py-2 px-4 rounded transition-colors ${
                isActive('/dashboard/admin/users') 
                  ? 'bg-gray-700 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              User Management
            </Link>
          </li>
          <li>
            <Link 
              href="/dashboard/profile" 
              className={`block py-2 px-4 rounded transition-colors ${
                isActive('/dashboard/profile') 
                  ? 'bg-gray-700 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              Profile
            </Link>
          </li>
        </ul>
      </nav>
      <div className="mt-auto pt-4 border-t border-gray-700">
        <Button 
          onClick={() => signOut({ callbackUrl: '/login' })} 
          className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition-colors"
        >
          Sign Out
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;