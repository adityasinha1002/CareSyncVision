import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Heart, Pill } from 'lucide-react';

const iconMap = {
  Dashboard: Home,
  'Health Analysis': Heart,
  Medications: Pill,
};

export default function Sidebar({ items }) {
  const location = useLocation();

  return (
    <aside className="hidden md:flex flex-col w-56 bg-[#0d0d0d] border-r border-[#1e1e1e] min-h-screen">
      {/* Brand */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-[#1e1e1e]">
        <Heart className="w-5 h-5 text-primary flex-shrink-0" />
        <span className="text-sm font-extrabold text-white tracking-tight">CareSyncVision</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {items?.map((item) => {
          const Icon = iconMap[item.label] || Home;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary/15 text-primary border border-primary/25'
                  : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[#1e1e1e]">
        <p className="text-xs text-gray-700 uppercase tracking-widest">v1.0.0</p>
      </div>
    </aside>
  );
}

