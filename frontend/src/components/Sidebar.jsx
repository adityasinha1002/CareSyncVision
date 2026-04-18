import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Heart, Pill } from 'lucide-react';

const iconMap = {
  Dashboard: Home,
  'Health Analysis': Heart,
  Medications: Pill,
};

export default function Sidebar({ items }) {
  return (
    <aside className="hidden md:block w-64 bg-white border-r border-gray-200 shadow-soft">
      <nav className="p-6 space-y-2">
        {items?.map((item, index) => {
          const Icon = iconMap[item.label] || Home;
          return (
            <Link
              key={index}
              to={item.path}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors font-medium"
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-6 border-t border-gray-200 space-y-4">
        <div className="text-sm">
          <p className="text-gray-600 font-medium mb-2">Need Help?</p>
          <p className="text-gray-500 text-xs">Contact support for assistance with your health monitoring setup.</p>
        </div>
      </div>
    </aside>
  );
}
