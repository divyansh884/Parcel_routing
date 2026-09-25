'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogOut, Package, Settings, UploadCloud } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setRole(sessionStorage.getItem('role'));
  }, [pathname]);

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('role');
    setRole(null);
    router.push('/login');
  };

  if (pathname === '/login') return null;

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <span className="ml-2 font-bold text-xl text-gray-900">ParcelRouter</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link 
                href="/" 
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${pathname === '/' ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
              >
                Route Parcel
              </Link>
              <Link 
                href="/batch" 
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${pathname === '/batch' ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
              >
                Batch Upload
              </Link>
              <Link 
                href="/parcels" 
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${pathname === '/parcels' ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
              >
                All Parcels
              </Link>
              {role === 'ADMIN' && (
                <>
                  <Link 
                    href="/rules" 
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${pathname === '/rules' ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Rule Engine
                  </Link>
                  <Link 
                    href="/users" 
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${pathname === '/users' ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
                  >
                    User Management
                  </Link>
                </>
              )}
              {(role === 'AUDITOR' || role === 'ADMIN') && (
                <Link 
                  href="/audit" 
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${pathname === '/audit' ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
                >
                  Audit Queue
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center">
            {role && (
              <span className="mr-4 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
                {role}
              </span>
            )}
            <button 
              onClick={handleLogout}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
