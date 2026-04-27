import { Link, useLocation } from 'react-router-dom';
import { Home, Activity, Heart } from 'lucide-react';

const navLinks = [
  { label: 'Dashboard',    href: '/dashboard',     icon: <Home     className="w-5 h-5" /> },
  { label: 'Health Input', href: '/health-input',  icon: <Activity className="w-5 h-5" /> },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 min-h-screen shadow-sm flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <div className="bg-primary p-2 rounded-lg">
          <Heart className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-bold text-gray-900 tracking-tight">CareSyncVision</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navLinks.map((link) => {
          const active = location.pathname === link.href;
          return (
            <Link
              key={link.label}
              to={link.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-600 hover:bg-primary-50 hover:text-primary'
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer branding */}
      <div className="px-6 py-4 border-t border-gray-100">
        <p className="text-xs text-gray-400">CareSyncVision v1.0</p>
      </div>
    </aside>
  );
}
