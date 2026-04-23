import React, { useState } from 'react';
import { Activity, TrendingUp, Shield } from 'lucide-react';
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
    { icon: Activity, title: 'Real-time Monitoring', description: 'Track health metrics in real-time' },
    { icon: TrendingUp, title: 'Analytics', description: 'Deep insights into health trends' },
    { icon: Shield, title: 'Secure', description: 'Enterprise-grade security' },
  ];

  const handleCommandSubmit = (command) => {
    console.log('Command:', command);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-soft border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary-600 to-primary-700 p-2 rounded-lg">
                <img src="/logo.svg" alt="CareSyncVision logo" className="w-6 h-6" style={{ filter: 'brightness(0) invert(1)' }} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">CareSyncVision</h1>
            </div>
            <div className="text-sm text-gray-600">Intelligent Health Monitoring</div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <Sidebar items={sidebarItems} />

        {/* Main Content */}
        <main className="flex-1 p-8">
          {/* Hero Section */}
          <div className="mb-12">
            <Hero />
          </div>

          {/* Command Section */}
          <section className="mb-12">
            <div className="card">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Quick Analysis</h2>
              <CommandInput onSubmit={handleCommandSubmit} />
            </div>
          </section>

          {/* Features Grid */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {features.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div key={idx} className="card hover:shadow-medium transition-shadow">
                    <div className="bg-primary-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* File Preview */}
          <section>
            <div className="card">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">File Upload</h2>
              <FilePreview file={selectedFile} />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
