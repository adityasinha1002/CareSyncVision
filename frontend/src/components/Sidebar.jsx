import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Heart, Pill } from 'lucide-react';

const iconMap = {
  Dashboard: Home,
  'Health Analysis': Heart,
  Medications: Pill,
};

export default function Sidebar({ items = [] }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="hidden md:flex w-64 flex-col bg-white border-r border-gray-100 shadow-soft min-h-screen">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#9f1211' }}>
            <Heart className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-base tracking-tight">CareSyncVision</span>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {items.map((item) => {
          const Icon = iconMap[item.label] || Home;
          const isActive = item.href && location.pathname === item.href;
          return (
            <button
              key={item.label}
              onClick={() => item.href && navigate(item.href)}
              className={`nav-item w-full text-left ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
