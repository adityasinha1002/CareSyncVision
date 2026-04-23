import { useState, useCallback } from 'react';
import axios from 'axios';
import { useAIStore } from './useStore';

// AI server runs as a completely separate service from the main backend.
// Set VITE_AI_SERVER_URL in your Vercel environment to the deployed AI server URL.
const AI_SERVER_URL = import.meta.env.VITE_AI_SERVER_URL || '';

export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const { aiEnabled } = useAIStore();

  const analyze = useCallback(async (data) => {
    if (!aiEnabled) {
      setError('AI analysis is disabled. Enable it from the dashboard.');
      return null;
    }
    if (!AI_SERVER_URL) {
      setError('AI server URL is not configured.');
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${AI_SERVER_URL}/api/patient/health-data`, data);
      setResult(response.data);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Analysis failed';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [aiEnabled]);

  const predict = useCallback(async (data) => {
    if (!aiEnabled) {
      setError('AI analysis is disabled. Enable it from the dashboard.');
      return null;
    }
    if (!AI_SERVER_URL) {
      setError('AI server URL is not configured.');
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${AI_SERVER_URL}/api/patient/vitals`, data);
      setResult(response.data);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Prediction failed';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [aiEnabled]);

  const clearError = useCallback(() => setError(null), []);

  return { analyze, predict, loading, error, result, clearError, aiEnabled };
}
