import React from 'react';
import { Heart, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Hero() {
  const navigate = useNavigate();

  return (
    <div
      className="relative rounded-2xl overflow-hidden p-12 text-white"
      style={{ background: 'linear-gradient(135deg, #1a0404 0%, #3d0a0a 50%, #7d0f0e 100%)' }}
    >
      {/* Decorative circles */}
      <div
        className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
        style={{ background: '#9f1211', transform: 'translate(30%, -30%)' }}
      />
      <div
        className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10"
        style={{ background: '#9f1211', transform: 'translate(-25%, 25%)' }}
      />

      <div className="relative z-10 max-w-2xl">
        <div className="flex items-center gap-3 mb-4">
          <Heart className="w-7 h-7" />
          <span className="font-semibold text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
            AI-Powered Health Monitoring
          </span>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
          Intelligent Care at<br />Your Fingertips
        </h1>

        <p className="text-base mb-8 leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
          Real-time health analysis, medication tracking, and predictive insights designed
          for caregivers and patients who demand excellence.
        </p>

        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all"
          style={{ background: 'white', color: '#9f1211' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fff1f1'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
        >
          Go to Dashboard
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
