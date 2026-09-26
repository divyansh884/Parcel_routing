'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogOut, Package, Settings, Users, FileText, CheckSquare, UploadCloud, Menu, X, Box } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const NavLink = ({ href, children, icon: Icon, mobile }: { href: string, children: React.ReactNode, icon?: any, mobile?: boolean }) => {
    const isActive = pathname === href;
    
    if (mobile) {
      return (
        <Link 
          href={href}
          onClick={() => setIsMobileMenuOpen(false)}
          className={`flex items-center px-4 py-3 rounded-lg text-base font-medium transition-colors ${
            isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          {Icon && <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />}
          {children}
        </Link>
      );
    }
    
    return (
      <Link 
        href={href} 
        className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
          isActive ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
        }`}
      >
        {Icon && <Icon className="w-4 h-4 mr-2" />}
        {children}
      </Link>
    );
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <span className="ml-2 font-bold text-xl text-gray-900 tracking-tight hidden sm:block">ParcelRouter</span>
            </Link>
            <div className="hidden lg:ml-8 lg:flex lg:space-x-6">
              <NavLink href="/">Route Parcel</NavLink>
              <NavLink href="/batch">Batch Upload</NavLink>
              <NavLink href="/parcels">All Parcels</NavLink>
              
              {role === 'ADMIN' && (
                <>
                  <NavLink href="/rules" icon={Settings}>Rule Engine</NavLink>
                  <NavLink href="/fields" icon={Box}>Parcel Fields</NavLink>
                  <NavLink href="/users" icon={Users}>Users</NavLink>
                </>
              )}
              
              {(role === 'AUDITOR' || role === 'ADMIN') && (
                <NavLink href="/audit" icon={CheckSquare}>Audit Queue</NavLink>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {role && (
              <span className="hidden sm:inline-flex px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold uppercase tracking-wide">
                {role}
              </span>
            )}
            
            <button 
              onClick={handleLogout}
              className="hidden sm:flex items-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
            
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-gray-200 absolute w-full shadow-lg">
          <div className="px-4 pt-2 pb-4 space-y-1">
            
            {role && (
               <div className="px-4 py-3 border-b border-gray-100 mb-2 sm:hidden flex justify-between items-center">
                 <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Role</span>
                 <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-bold">{role}</span>
               </div>
            )}
            
            <NavLink href="/" mobile>Route Parcel</NavLink>
            <NavLink href="/batch" mobile icon={UploadCloud}>Batch Upload</NavLink>
            <NavLink href="/parcels" mobile icon={Package}>All Parcels</NavLink>
            
            {role === 'ADMIN' && (
              <div className="pt-2 mt-2 border-t border-gray-100">
                <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Administration</p>
                <NavLink href="/rules" mobile icon={Settings}>Rule Engine</NavLink>
                <NavLink href="/fields" mobile icon={Box}>Parcel Fields</NavLink>
                <NavLink href="/users" mobile icon={Users}>User Management</NavLink>
              </div>
            )}
            
            {(role === 'AUDITOR' || role === 'ADMIN') && (
              <div className="pt-2 mt-2 border-t border-gray-100">
                <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Validation</p>
                <NavLink href="/audit" mobile icon={CheckSquare}>Audit Queue</NavLink>
              </div>
            )}
            
            <div className="pt-2 mt-2 border-t border-gray-100">
              <button 
                onClick={handleLogout}
                className="flex w-full items-center px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="mr-3 h-5 w-5 text-red-500" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
