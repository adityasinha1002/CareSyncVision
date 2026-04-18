import React from 'react';
import { Heart, ArrowRight } from 'lucide-react';

export default function Hero() {
  return (
    <div className="relative bg-gradient-to-r from-primary-600 via-primary-500 to-primary-400 rounded-2xl overflow-hidden p-12 text-white shadow-lg">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>

      <div className="relative z-10 max-w-2xl">
        <div className="flex items-center gap-3 mb-4">
          <Heart className="w-8 h-8" />
          <span className="text-primary-100 font-semibold">AI-Powered Health Monitoring</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Intelligent Care at Your Fingertips
        </h1>
        
        <p className="text-lg text-primary-50 mb-8 leading-relaxed">
          Real-time health analysis, medication tracking, and predictive insights designed for caregivers and patients who demand excellence.
        </p>

        <button className="inline-flex items-center gap-2 bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors shadow-soft">
          Get Started
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
