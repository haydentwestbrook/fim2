import Link from 'next/link';

const Sidebar = () => {
  return (
    <aside className="w-64 bg-gray-800 text-white p-4">
      <nav>
        <ul>
          <li>
            <Link href="/dashboard/admin/users" className="block py-2 px-4 rounded hover:bg-gray-700">
              User Management
            </Link>
          </li>
          <li>
            <Link href="/dashboard/profile" className="block py-2 px-4 rounded hover:bg-gray-700">
              Profile
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;