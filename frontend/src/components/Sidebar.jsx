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
            return (
              <aside className="bg-white shadow h-full w-64 flex flex-col p-6 border-r border-primary">
                <div className="flex items-center gap-2 mb-8">
                  <img src="/logo192.png" alt="CareSyncVision" className="w-8 h-8" />
                  <span className="text-xl font-bold text-primary">CareSyncVision</span>
                </div>
                <nav className="flex-1">
                  <ul className="space-y-4">
                    {links.map((link) => (
                      <li key={link.label}>
                        <a
                          href={link.href}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-primary/10 text-primary font-semibold transition"
                        >
                          {link.icon}
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </aside>
            );
