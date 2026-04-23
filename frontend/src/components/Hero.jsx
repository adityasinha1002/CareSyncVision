import React from 'react';
import { Heart, ArrowRight } from 'lucide-react';

export default function Hero() {
  return (
    <div className="relative bg-[#0f1a00] border border-primary/20 rounded-2xl overflow-hidden p-10 shadow-lg">
      {/* NVIDIA-style gradient accent bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"></div>
      {/* Background glow */}
      <div className="absolute top-0 left-1/4 w-96 h-64 bg-primary rounded-full filter blur-3xl opacity-5 pointer-events-none"></div>
      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(118,185,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(118,185,0,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }}></div>

      <div className="relative z-10 max-w-2xl">
        <div className="flex items-center gap-3 mb-4">
          <Heart className="w-7 h-7 text-primary" />
          <span className="text-primary text-sm font-bold uppercase tracking-widest">AI-Powered Health Monitoring</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-white leading-tight">
          Intelligent Care at<br />
          <span className="text-primary">Your Fingertips</span>
        </h1>

        <p className="text-base text-gray-400 mb-8 leading-relaxed max-w-lg">
          Real-time health analysis, medication tracking, and predictive insights designed for caregivers and patients who demand excellence.
        </p>

        <a
          href="#dashboard"
          className="inline-flex items-center gap-2 btn-primary px-6 py-3 text-sm font-bold uppercase tracking-wider"
        >
          Get Started
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
