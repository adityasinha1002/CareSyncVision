import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Activity, Pill, LogOut, Heart } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Record Vitals', path: '/health-input', icon: Activity },
  { label: 'Medications', path: '/medications', icon: Pill },
];

export default function Sidebar({ onLogout }) {
  const location = useLocation();

  return (
    <aside
      className="hidden md:flex flex-col w-64 min-h-screen py-6 px-4"
      style={{ background: '#ffffff', borderRight: '1px solid #f1f5f9' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 mb-8">
        <div className="p-2 rounded-lg" style={{ background: '#9f1211' }}>
          <Heart className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-bold" style={{ color: '#9f1211' }}>CareSyncVision</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="nav-link"
              style={isActive ? {
                background: '#fff1f1',
                color: '#9f1211',
                fontWeight: 600,
              } : {}}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      {onLogout && (
        <button
          onClick={onLogout}
          className="nav-link mt-4 w-full text-left"
          style={{ color: '#6b7280' }}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Sign Out
        </button>
      )}
    </aside>
  );
}
