import React, { useState } from 'react';
import { Heart, Activity, TrendingUp, Shield } from 'lucide-react';
import Hero from '../components/Hero';
import CommandInput from '../components/CommandInput';
import FilePreview from '../components/FilePreview';
import Sidebar from '../components/Sidebar';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState(null);

  const sidebarItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Health Analysis', path: '/health' },
    { label: 'Medications', path: '/medications' },
  ];

  const features = [
    { icon: Activity, title: 'Real-time Monitoring', description: 'Track health metrics in real-time with sub-second latency.' },
    { icon: TrendingUp, title: 'AI Analytics', description: 'Deep insights and predictive health trend analysis.' },
    { icon: Shield, title: 'Secure', description: 'Enterprise-grade encryption and data privacy.' },
  ];

  const handleCommandSubmit = (command) => {
    console.log('Command:', command);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Navigation */}
      <nav className="bg-[#0d0d0d] border-b border-[#1e1e1e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 border border-primary/30 p-2 rounded-lg">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">CareSyncVision</h1>
            </div>
            <div className="text-xs text-gray-600 uppercase tracking-widest">Intelligent Health Monitoring</div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <Sidebar items={sidebarItems} />

        {/* Main Content */}
        <main className="flex-1 p-8">
          {/* Hero Section */}
          <div className="mb-10">
            <Hero />
          </div>

          {/* Command Section */}
          <section className="mb-10">
            <div className="card">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Quick Analysis</h2>
              <CommandInput onSubmit={handleCommandSubmit} />
            </div>
          </section>

          {/* Features Grid */}
          <section className="mb-10">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {features.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div key={idx} className="card hover:border-primary/30 transition-all hover:glow-green-sm">
                    <div className="bg-primary/10 w-11 h-11 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-base font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* File Preview */}
          <section>
            <div className="card">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">File Upload</h2>
              <FilePreview file={selectedFile} />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
