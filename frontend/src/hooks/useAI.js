import { useState, useCallback } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'https://caresynvision-api-production.up.railway.app/api';

export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const analyze = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_BASE}/analyze`, data);
      setResult(response.data);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Analysis failed';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const predict = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_BASE}/predict`, data);
      setResult(response.data);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Prediction failed';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { analyze, predict, loading, error, result, clearError };
}
